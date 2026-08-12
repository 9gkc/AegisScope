import type { Asset, Finding } from "../../drizzle/schema";
import { reviewConfigText } from "../../client/src/lib/configReview";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeAssetValue, isPublicNetworkAddress } from "./assetValidation";
import { analyzeHeaders, parseAndMatchTarget } from "./headerReview";
import { enforceRateLimit } from "./rateLimit";
import { composeBugBountyMarkdown } from "./reportMarkdown";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const dbMocks = vi.hoisted(() => ({
  createAsset: vi.fn(),
  createFinding: vi.fn(),
  createProgram: vi.fn(),
  dashboardMetrics: vi.fn(),
  getAsset: vi.fn(),
  getFinding: vi.fn(),
  getProgram: vi.fn(),
  listAssets: vi.fn(),
  listFindings: vi.fn(),
  listHeaderReviews: vi.fn(),
  listPrograms: vi.fn(),
  listReportDrafts: vi.fn(),
  saveHeaderReview: vi.fn(),
  saveReportDraft: vi.fn(),
  updateAsset: vi.fn(),
  updateFinding: vi.fn(),
  updateProgram: vi.fn(),
}));

vi.mock("../db/aegis", () => dbMocks);

beforeEach(() => {
  vi.clearAllMocks();
});

function contextFor(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 91 : 44,
      openId: `${role}-test`,
      name: role,
      email: `${role}@example.test`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const verifiedDomainAsset = {
  type: "domain",
  normalizedValue: "example.com",
  status: "active",
  authorizationStatus: "verified",
} as Asset;

describe("asset validation and allowlist boundary", () => {
  it("normalizes public domains and rejects unsafe asset inputs", () => {
    expect(normalizeAssetValue("domain", " Example.COM. ")).toBe("example.com");
    expect(normalizeAssetValue("web_application", "https://Example.com/path")).toBe("https://example.com/path");
    expect(() => normalizeAssetValue("ip_address", "10.0.0.4")).toThrow("Only public IP addresses");
    expect(() => normalizeAssetValue("web_application", "http://localhost/admin")).toThrow("Enter a public HTTP(S) URL");
    expect(() => normalizeAssetValue("web_application", "https://user:pass@example.com")).toThrow("Enter a public HTTP(S) URL");
  });

  it("recognizes public network addresses conservatively", () => {
    expect(isPublicNetworkAddress("8.8.8.8")).toBe(true);
    expect(isPublicNetworkAddress("127.0.0.1")).toBe(false);
    expect(isPublicNetworkAddress("::1")).toBe(false);
  });

  it("requires active verified authorization and an exact host match before a review", () => {
    expect(parseAndMatchTarget(verifiedDomainAsset, "https://example.com/security").hostname).toBe("example.com");
    expect(() => parseAndMatchTarget({ ...verifiedDomainAsset, authorizationStatus: "pending" } as Asset, "https://example.com")).toThrow("requires an active asset with verified authorization");
    expect(() => parseAndMatchTarget(verifiedDomainAsset, "https://other.example")).toThrow("exactly match");
  });
});

describe("defensive review controls", () => {
  it("limits sensitive actions per key without sharing a bucket between users", () => {
    const firstKey = `unit-rate-${Date.now()}-one`;
    const secondKey = `unit-rate-${Date.now()}-two`;
    enforceRateLimit(firstKey, 2, 60_000);
    enforceRateLimit(firstKey, 2, 60_000);
    expect(() => enforceRateLimit(firstKey, 2, 60_000)).toThrow("Request limit reached");
    expect(() => enforceRateLimit(secondKey, 1, 60_000)).not.toThrow();
  });

  it("evaluates headers without treating HSTS as applicable over HTTP", () => {
    const observations = analyzeHeaders({ "content-security-policy": "default-src 'self'", "x-content-type-options": "nosniff" }, false);
    expect(observations.find(item => item.key === "content-security-policy")?.state).toBe("present");
    expect(observations.find(item => item.key === "strict-transport-security")?.state).toBe("not_applicable");
    expect(observations.find(item => item.key === "permissions-policy")?.state).toBe("missing");
  });

  it("reserves verified authorization for the workspace owner", async () => {
    dbMocks.getProgram.mockResolvedValue({ id: 12, status: "active" });
    dbMocks.createAsset.mockResolvedValue({ id: 300 });
    const input = {
      programId: 12,
      type: "domain" as const,
      value: "example.com",
      label: "Production edge",
      authorizationStatus: "verified" as const,
    };

    const userCaller = appRouter.createCaller(contextFor("user"));
    await expect(userCaller.assets.create(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Only the workspace owner can verify an asset authorization.",
    });

    const ownerCaller = appRouter.createCaller(contextFor("admin"));
    await expect(ownerCaller.assets.create(input)).resolves.toEqual({ id: 300 });
    expect(dbMocks.createAsset).toHaveBeenCalledWith(
      { userId: 91, isAdmin: true },
      expect.objectContaining({ normalizedValue: "example.com", authorizationStatus: "verified" }),
    );
  });

  it("does not update a program that is not visible through the caller access scope", async () => {
    dbMocks.getProgram.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(contextFor("user"));

    await expect(caller.programs.update({ id: 999, data: { status: "archived" } })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Program not found.",
    });
    expect(dbMocks.getProgram).toHaveBeenCalledWith({ userId: 44, isAdmin: false }, 999);
    expect(dbMocks.updateProgram).not.toHaveBeenCalled();
  });

  it("rejects a finding when its referenced asset is outside the selected program", async () => {
    dbMocks.getProgram.mockResolvedValue({ id: 12, status: "active" });
    dbMocks.getAsset.mockResolvedValue({ id: 67, programId: 88 });
    const caller = appRouter.createCaller(contextFor("user"));

    await expect(caller.findings.create({
      programId: 12,
      assetId: 67,
      title: "Authorization boundary regression",
      severity: "medium",
      impact: "The record must stay associated with the authorized program only.",
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Select an asset within the selected program." });
    expect(dbMocks.createFinding).not.toHaveBeenCalled();
  });

  it("does not generate reports or header-review history for records outside the caller scope", async () => {
    dbMocks.getFinding.mockResolvedValue(undefined);
    dbMocks.getAsset.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(contextFor("user"));

    await expect(caller.reports.preview({ findingId: 771 })).rejects.toMatchObject({ code: "NOT_FOUND", message: "Finding not found." });
    await expect(caller.headerReview.list({ assetId: 772 })).rejects.toMatchObject({ code: "NOT_FOUND", message: "Asset not found." });
    expect(dbMocks.saveReportDraft).not.toHaveBeenCalled();
    expect(dbMocks.listHeaderReviews).not.toHaveBeenCalled();
  });
});

describe("report and local configuration review", () => {
  it("composes an evidence-oriented Markdown report with safe fallbacks", () => {
    const finding = {
      title: "Stored XSS in profile label",
      severity: "high",
      cvssScore: "8.1",
      status: "in_review",
      impact: "An attacker could affect other users who view a crafted profile.",
      testEnvironment: "Authorized staging environment",
      safePoc: null,
      remediation: "Encode output and add a focused regression test.",
      retestNotes: null,
      evidenceMetadata: [{ label: "Sanitized screenshot", kind: "image", reference: "evidence-01" }],
    } as Finding;
    const report = composeBugBountyMarkdown(finding);

    expect(report).toContain("# Stored XSS in profile label");
    expect(report).toContain("**CVSS:** 8.1");
    expect(report).toContain("Use a redacted, non-destructive narrative only");
    expect(report).toContain("Sanitized screenshot");
  });

  it("finds risky Kubernetes-style configuration patterns locally", () => {
    const observations = reviewConfigText("apiVersion: v1\nprivileged: true\nhostNetwork: true\nallowPrivilegeEscalation: true\n");
    expect(observations.map(item => item.id)).toEqual(expect.arrayContaining(["privileged", "host-network", "privilege-escalation"]));
    expect(observations.find(item => item.id === "privileged")?.line).toBe(2);
  });
});

import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAsset,
  createFinding,
  createProgram,
  dashboardMetrics,
  getAsset,
  getFinding,
  getProgram,
  listAssets,
  listFindings,
  listPrograms,
  listHeaderReviews,
  listReportDrafts,
  saveHeaderReview,
  saveReportDraft,
  updateAsset,
  updateFinding,
  updateProgram,
} from "./db/aegis";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { normalizeAssetValue } from "./security/assetValidation";
import { reviewAuthorizedHeaders } from "./security/headerReview";
import { enforceRateLimit } from "./security/rateLimit";
import { composeBugBountyMarkdown } from "./security/reportMarkdown";

const programInput = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5_000).optional(),
  type: z.enum(["bug_bounty", "pentest", "internal_review"]),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  scopeNotes: z.string().trim().max(8_000).optional(),
});

const assetInput = z.object({
  programId: z.number().int().positive(),
  type: z.enum(["domain", "ip_address", "web_application"]),
  value: z.string().trim().min(3).max(512),
  label: z.string().trim().max(160).optional(),
  authorizationStatus: z.enum(["verified", "pending", "expired"]).default("pending"),
  authorizationEvidence: z.string().trim().max(4_000).optional(),
  notes: z.string().trim().max(4_000).optional(),
});

const findingInput = z.object({
  programId: z.number().int().positive(),
  assetId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(4).max(200),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  cvssScore: z.number().min(0).max(10).nullable().optional(),
  status: z.enum(["open", "in_progress", "resolved", "accepted_risk", "closed"]).default("open"),
  impact: z.string().trim().min(8).max(10_000),
  testEnvironment: z.string().trim().max(6_000).optional(),
  safePoc: z.string().trim().max(12_000).optional(),
  remediation: z.string().trim().max(10_000).optional(),
  retestNotes: z.string().trim().max(6_000).optional(),
  evidenceMetadata: z.array(z.object({ label: z.string().max(120), kind: z.string().max(40), reference: z.string().max(500) })).max(10).optional(),
});

function accessFor(user: { id: number; role: "admin" | "user" }) {
  return { userId: user.id, isAdmin: user.role === "admin" };
}

function writeLimit(userId: number) {
  enforceRateLimit(`write:${userId}`, 45, 60_000);
}

function checkAdminVerification(user: { role: "admin" | "user" }, authorizationStatus: "verified" | "pending" | "expired") {
  if (authorizationStatus === "verified" && user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the workspace owner can verify an asset authorization." });
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  dashboard: router({
    metrics: protectedProcedure.query(({ ctx }) => dashboardMetrics(accessFor(ctx.user))),
  }),
  programs: router({
    list: protectedProcedure.query(({ ctx }) => listPrograms(accessFor(ctx.user))),
    create: protectedProcedure.input(programInput).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      return createProgram(accessFor(ctx.user), input);
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: programInput.partial() })).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      const current = await getProgram(accessFor(ctx.user), input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Program not found." });
      return updateProgram(accessFor(ctx.user), input.id, input.data);
    }),
  }),
  assets: router({
    list: protectedProcedure.query(({ ctx }) => listAssets(accessFor(ctx.user))),
    create: protectedProcedure.input(assetInput).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      const access = accessFor(ctx.user);
      const program = await getProgram(access, input.programId);
      if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Choose one of your active programs first." });
      checkAdminVerification(ctx.user, input.authorizationStatus);
      const normalizedValue = normalizeAssetValue(input.type, input.value);
      return createAsset(access, { ...input, normalizedValue, status: "active" });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: assetInput.omit({ programId: true }).partial().extend({ status: z.enum(["active", "paused", "retired"]).optional() }) })).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      const access = accessFor(ctx.user);
      const current = await getAsset(access, input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
      if (input.data.authorizationStatus) checkAdminVerification(ctx.user, input.data.authorizationStatus);
      const normalizedValue = input.data.value && input.data.type ? normalizeAssetValue(input.data.type, input.data.value) : undefined;
      return updateAsset(access, input.id, { ...input.data, normalizedValue });
    }),
  }),
  findings: router({
    list: protectedProcedure.query(({ ctx }) => listFindings(accessFor(ctx.user))),
    create: protectedProcedure.input(findingInput).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      const access = accessFor(ctx.user);
      const program = await getProgram(access, input.programId);
      if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Program not found." });
      if (input.assetId) {
        const asset = await getAsset(access, input.assetId);
        if (!asset || asset.programId !== input.programId) throw new TRPCError({ code: "BAD_REQUEST", message: "Select an asset within the selected program." });
      }
      return createFinding(access, { ...input, cvssScore: input.cvssScore?.toFixed(1) ?? null });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: findingInput.omit({ programId: true }).partial() })).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      const current = await getFinding(accessFor(ctx.user), input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found." });
      return updateFinding(accessFor(ctx.user), input.id, { ...input.data, cvssScore: input.data.cvssScore?.toFixed(1) });
    }),
  }),
  reports: router({
    list: protectedProcedure.query(({ ctx }) => listReportDrafts(accessFor(ctx.user))),
    preview: protectedProcedure.input(z.object({ findingId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      enforceRateLimit(`report:${ctx.user.id}`, 12, 60_000);
      const finding = await getFinding(accessFor(ctx.user), input.findingId);
      if (!finding) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found." });
      return { markdown: composeBugBountyMarkdown(finding) };
    }),
    save: protectedProcedure.input(z.object({ findingId: z.number().int().positive(), title: z.string().trim().min(4).max(220) })).mutation(async ({ ctx, input }) => {
      writeLimit(ctx.user.id);
      const finding = await getFinding(accessFor(ctx.user), input.findingId);
      if (!finding) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found." });
      return saveReportDraft(accessFor(ctx.user), { findingId: finding.id, title: input.title, markdown: composeBugBountyMarkdown(finding) });
    }),
  }),
  headerReview: router({
    list: protectedProcedure.input(z.object({ assetId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = accessFor(ctx.user);
      const asset = await getAsset(access, input.assetId);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
      return listHeaderReviews(access, asset.id);
    }),
    run: protectedProcedure.input(z.object({ assetId: z.number().int().positive(), targetUrl: z.string().trim().min(8).max(512) })).mutation(async ({ ctx, input }) => {
      enforceRateLimit(`header-review:${ctx.user.id}`, 8, 60_000);
      const access = accessFor(ctx.user);
      const asset = await getAsset(access, input.assetId);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found." });
      const review = await reviewAuthorizedHeaders(asset, input.targetUrl);
      await saveHeaderReview(access, { assetId: asset.id, targetUrl: review.targetUrl, score: review.score, observations: review.observations });
      return review;
    }),
  }),
});

export type AppRouter = typeof appRouter;

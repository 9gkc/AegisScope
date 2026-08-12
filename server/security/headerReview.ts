import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { TRPCError } from "@trpc/server";
import type { Asset } from "../../drizzle/schema";
import { isPublicNetworkAddress } from "./assetValidation";

export type HeaderObservation = { key: string; label: string; state: "present" | "missing" | "not_applicable"; detail: string };

function forbidden(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export function parseAndMatchTarget(asset: Asset, rawTarget: string) {
  if (asset.status !== "active" || asset.authorizationStatus !== "verified") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Header review requires an active asset with verified authorization." });
  }

  let target: URL;
  try {
    target = new URL(rawTarget.trim());
  } catch {
    return forbidden("Enter a valid HTTP(S) URL.");
  }

  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.port || target.hash) {
    return forbidden("Only credential-free HTTP(S) URLs on standard ports are allowed.");
  }

  const host = target.hostname.toLowerCase();
  const matches = asset.type === "web_application"
    ? new URL(asset.normalizedValue).origin === target.origin
    : asset.normalizedValue === host;
  if (!matches) return forbidden("The review URL must exactly match the selected authorized asset.");
  return target;
}

async function resolvePublicHost(host: string) {
  if (isIP(host)) {
    if (!isPublicNetworkAddress(host)) throw new Error("The target resolves to a private or reserved network address.");
    return { address: host, family: isIP(host) };
  }
  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some(record => !isPublicNetworkAddress(record.address))) {
    throw new Error("The target hostname does not resolve exclusively to public addresses.");
  }
  return records[0]!;
}

async function requestResponseHeaders(target: URL) {
  const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<{ statusCode: number; headers: Record<string, string> }>((resolve, reject) => {
    const request = transport({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.protocol === "https:" ? 443 : 80,
      method: "HEAD",
      path: `${target.pathname}${target.search}`,
      headers: { "user-agent": "AegisScope/1.0 (authorized header review)", accept: "*/*" },
      lookup: (hostname, _options, callback) => {
        void resolvePublicHost(hostname)
          .then(({ address, family }) => callback(null, address, family))
          .catch(error => callback(error as Error, "", 0));
      },
    }, response => {
      const headers = Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(", ") : value ?? ""]),
      );
      response.resume();
      response.on("end", () => resolve({ statusCode: response.statusCode ?? 0, headers }));
    });
    request.setTimeout(5_000, () => request.destroy(new Error("Header review timed out after five seconds.")));
    request.on("error", reject);
    request.end();
  });
}

export function analyzeHeaders(headers: Record<string, string>, isHttps: boolean): HeaderObservation[] {
  const has = (name: string) => Boolean(headers[name]);
  return [
    { key: "content-security-policy", label: "Content-Security-Policy", state: has("content-security-policy") ? "present" : "missing", detail: has("content-security-policy") ? "A policy is returned." : "No Content-Security-Policy header was observed." },
    { key: "strict-transport-security", label: "Strict-Transport-Security", state: isHttps ? (has("strict-transport-security") ? "present" : "missing") : "not_applicable", detail: isHttps ? (has("strict-transport-security") ? "HSTS is returned over HTTPS." : "No HSTS header was observed over HTTPS.") : "HSTS applies only to HTTPS targets." },
    { key: "x-content-type-options", label: "X-Content-Type-Options", state: headers["x-content-type-options"]?.toLowerCase() === "nosniff" ? "present" : "missing", detail: headers["x-content-type-options"]?.toLowerCase() === "nosniff" ? "nosniff is enabled." : "Set X-Content-Type-Options to nosniff." },
    { key: "frame-protection", label: "Frame protection", state: has("content-security-policy") || has("x-frame-options") ? "present" : "missing", detail: has("content-security-policy") || has("x-frame-options") ? "CSP or X-Frame-Options provides framing control." : "Add frame-ancestors in CSP or X-Frame-Options." },
    { key: "referrer-policy", label: "Referrer-Policy", state: has("referrer-policy") ? "present" : "missing", detail: has("referrer-policy") ? "A referrer policy is returned." : "No Referrer-Policy header was observed." },
    { key: "permissions-policy", label: "Permissions-Policy", state: has("permissions-policy") ? "present" : "missing", detail: has("permissions-policy") ? "A permissions policy is returned." : "No Permissions-Policy header was observed." },
  ];
}

export async function reviewAuthorizedHeaders(asset: Asset, rawTarget: string) {
  const target = parseAndMatchTarget(asset, rawTarget);
  try {
    const response = await requestResponseHeaders(target);
    const observations = analyzeHeaders(response.headers, target.protocol === "https:");
    const applicable = observations.filter(observation => observation.state !== "not_applicable");
    const score = Math.round((applicable.filter(observation => observation.state === "present").length / applicable.length) * 100);
    return { targetUrl: target.toString(), statusCode: response.statusCode, score, observations };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The header review could not be completed.";
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }
}

import { isIP } from "node:net";
import { TRPCError } from "@trpc/server";

export type AssetInputType = "domain" | "ip_address" | "web_application";

const invalidHostnames = new Set(["localhost", "localhost.localdomain"]);

function isPublicIpv4(value: string) {
  const octets = value.split(".").map(Number);
  const [a, b] = octets;
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return false;
  if (a === 203 && b === 0 && octets[2] === 113) return false;
  return true;
}

function isPublicIp(value: string) {
  const version = isIP(value);
  if (version === 4) return isPublicIpv4(value);
  if (version === 6) {
    const normalized = value.toLowerCase();
    return !(
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("::ffff:127.")
    );
  }
  return false;
}

function normalizedDomain(value: string) {
  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (
    domain.length < 3 ||
    domain.length > 253 ||
    invalidHostnames.has(domain) ||
    isIP(domain) ||
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a public fully-qualified domain name." });
  }
  return domain;
}

export function normalizeAssetValue(type: AssetInputType, value: string) {
  if (type === "domain") return normalizedDomain(value);

  if (type === "ip_address") {
    const ip = value.trim();
    if (!isPublicIp(ip)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only public IP addresses can be added." });
    }
    return ip;
  }

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || invalidHostnames.has(url.hostname.toLowerCase())) {
      throw new Error("Invalid URL");
    }
    if (isIP(url.hostname) && !isPublicIp(url.hostname)) throw new Error("Private IP");
    if (!isIP(url.hostname)) normalizedDomain(url.hostname);
    return `${url.protocol}//${url.host}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Enter a public HTTP(S) URL without credentials or a custom port.",
    });
  }
}

export function isPublicNetworkAddress(value: string) {
  return isPublicIp(value);
}


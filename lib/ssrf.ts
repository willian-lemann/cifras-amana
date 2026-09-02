import { lookup } from "node:dns/promises";
import net from "node:net";

// Server-side SSRF guards for user-supplied URLs that we fetch. Two strategies:
//
// - `isAllowedR2Url`: tightest option — only our own R2 storage. Use it when the
//   URL should always be an app-generated asset (e.g. listing photos).
// - `assertSafeRemoteUrl`: for URLs that are legitimately arbitrary external
//   hosts (e.g. a broker's watermark logo). Rejects private/link-local targets,
//   including hostnames that *resolve* to them, so it must be re-run on every
//   redirect hop.

function ipv4IsPrivate(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)
  ) {
    return true; // malformed → treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIp(ip: string): boolean {
  const host = ip.toLowerCase();
  const family = net.isIP(host);
  if (family === 4) return ipv4IsPrivate(host);
  if (family === 6) {
    if (host === "::1" || host === "::") return true; // loopback/unspecified
    if (/^fe[89ab]/.test(host)) return true; // fe80::/10 link-local
    if (/^f[cd]/.test(host)) return true; // fc00::/7 unique local
    const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (mapped) return ipv4IsPrivate(mapped[1]);
    return false;
  }
  return true; // not a valid IP literal → unsafe to trust as a raw address
}

export class BlockedUrlError extends Error {
  constructor(message = "URL não permitida") {
    super(message);
    this.name = "BlockedUrlError";
  }
}

// True only for HTTPS URLs served from our own R2 bucket / public dev host.
export function isAllowedR2Url(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    try {
      if (url.host === new URL(publicUrl).host) return true;
    } catch {
      // Ignore a malformed env value and fall through to the r2.dev check.
    }
  }
  return url.hostname.toLowerCase().endsWith(".r2.dev");
}

// Throws BlockedUrlError if the URL points (directly or via DNS) at a
// private/link-local/loopback address, or uses a non-HTTP protocol.
export async function assertSafeRemoteUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BlockedUrlError();
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new BlockedUrlError();
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new BlockedUrlError();
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new BlockedUrlError();
    return url;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError();
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new BlockedUrlError();
  }
  return url;
}

import { headers } from "next/headers";

export async function getSsrBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const forwardedHost = h.get("x-forwarded-host");
  const host = forwardedHost ?? h.get("host");
  if (!host) {
    throw new Error("Cannot determine host");
  }
  return `${proto}://${host}`;
}

export function isSameOrigin(headers: Headers) {
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) && url.host === host;
  } catch {
    return false;
  }
}

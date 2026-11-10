import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export function submissionClientHash(headers: Headers, secret: string) {
  const trustedHeader = process.env.VERCEL === "1"
    ? "x-vercel-forwarded-for"
    : process.env.SUBMISSION_CLIENT_IP_HEADER;
  const address = trustedHeader ? headers.get(trustedHeader)?.trim() ?? "" : "";
  const key = isIP(address) ? address.toLowerCase() : "shared";
  return createHmac("sha256", secret).update("evangelism-submission:" + key).digest("hex");
}

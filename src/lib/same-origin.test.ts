import { expect, it } from "vitest";
import { isSameOrigin } from "./same-origin";

it("accepts the request host on local and production origins", () => {
  expect(isSameOrigin(new Headers({ origin: "http://127.0.0.1:3020", host: "127.0.0.1:3020" }))).toBe(true);
  expect(isSameOrigin(new Headers({ origin: "https://soulreach-records.vercel.app", host: "soulreach-records.vercel.app" }))).toBe(true);
});

it("rejects missing, malformed and foreign origins", () => {
  for (const origin of ["", "null", "invalid", "https://example.com", "ftp://soulreach-records.vercel.app"]) {
    expect(isSameOrigin(new Headers({ origin, host: "soulreach-records.vercel.app" }))).toBe(false);
  }
});

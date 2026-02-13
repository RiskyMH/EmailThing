import { getSimplifiedIp } from "./ip";
import { describe, expect, test } from "bun:test";

const makeRequest = (ipHeader: string | undefined) =>
    new Request("https://example.com", {
        headers: ipHeader !== undefined ? { "x-forwarded-for": ipHeader } : {},
    });

describe("getSimplifiedIp - IPv4", () => {
    test("returns single IPv4 address", () => {
        const req = makeRequest("203.0.113.42");
        expect(getSimplifiedIp(req)).toBe("203.0.113.42");
    });
    test("trims whitespace for IPv4", () => {
        const req = makeRequest(" 198.51.100.9   ");
        expect(getSimplifiedIp(req)).toBe("198.51.100.9"); // ip.ts trims whitespace
    });
    test("handles multiple x-forwarded-for, returns first", () => {
        const req = makeRequest("198.51.100.99, 8.8.8.8");
        expect(getSimplifiedIp(req)).toBe("198.51.100.99");
    });
});

describe("getSimplifiedIp - IPv6", () => {
    test("returns /64 subnet for canonical IPv6", () => {
        const req = makeRequest("2001:0db8:85a3:08d3:1319:8a2e:0370:7344");
        expect(getSimplifiedIp(req)).toBe("2001:0db8:85a3:08d3::/64");
    });
    test("works with explicit zero IPv6 (matches padding)", () => {
        const req = makeRequest("2001:db8:abcd:0012:0000:0000:0000:0001");
        expect(getSimplifiedIp(req)).toBe("2001:0db8:abcd:0012::/64");
    });
    test("trims whitespace for IPv6", () => {
        const req = makeRequest("  2001:db8:abcd:0012:0:0:0:1  ");
        expect(getSimplifiedIp(req)).toBe("2001:0db8:abcd:0012::/64");
    });
    test("handles multiple IPv6, first wins", () => {
        const req = makeRequest("2001:db8:abcd:0012:0:0:0:1, 2001:db8:0000:0000:0000:0000:0000:abcd");
        expect(getSimplifiedIp(req)).toBe("2001:0db8:abcd:0012::/64");
    });
});

describe("getSimplifiedIp - fallback and edge cases", () => {
    test("returns 'unknown' if header is missing", () => {
        const req = makeRequest(undefined);
        expect(getSimplifiedIp(req)).toBe("unknown");
    });
    test("returns value even if not a valid IP (should never happen if proxy trusted)", () => {
        const req = makeRequest("example.com");
        expect(getSimplifiedIp(req)).toBe("example.com");
    });
    test("handles comma and empty trailing", () => {
        const req = makeRequest("2001:db8::1, ");
        expect(getSimplifiedIp(req)).toBe("2001:0db8:0000:0000::/64");
    });
    test("ipv6 that is ipv4 mapped", () => {
        const req = makeRequest("::ffff:192.0.2.128");
        expect(getSimplifiedIp(req)).toBe("0000:0000:0000:0000::/64");
    });
});

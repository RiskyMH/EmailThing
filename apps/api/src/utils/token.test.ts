import { describe, expect, test } from "bun:test";
import { generateToken, generateSessionToken, generateRefreshToken, verifyTokenChecksum } from "./token";

describe("token generation", () => {
	test("generateToken should return token with correct format", () => {
		const token = generateToken();
		expect(token).toMatch(/^et__[A-Za-z0-9]{30}[A-Za-z0-9]{6}$/);
	});

	test("generateSessionToken should return token with correct format", () => {
		const token = generateSessionToken();
		expect(token).toMatch(/^ets_[A-Za-z0-9]{50}[A-Za-z0-9]{6}$/);
	});

	test("generateRefreshToken should return token with correct format", () => {
		const token = generateRefreshToken();
		expect(token).toMatch(/^etr_[A-Za-z0-9]{50}[A-Za-z0-9]{6}$/);
	});

	test("generated tokens should be unique", () => {
		const token1 = generateToken();
		const token2 = generateToken();
		expect(token1).not.toBe(token2);
	});

	test("generated session tokens should be unique", () => {
		const token1 = generateSessionToken();
		const token2 = generateSessionToken();
		expect(token1).not.toBe(token2);
	});

	test("generated refresh tokens should be unique", () => {
		const token1 = generateRefreshToken();
		const token2 = generateRefreshToken();
		expect(token1).not.toBe(token2);
	});
});

describe("token checksum verification", () => {
	test("should verify valid token checksum", () => {
		const token = generateToken();
		expect(verifyTokenChecksum(token)).toBe(true);
	});

	test("should verify valid session token checksum", () => {
		const token = generateSessionToken();
		expect(verifyTokenChecksum(token)).toBe(true);
	});

	test("should verify valid refresh token checksum", () => {
		const token = generateRefreshToken();
		expect(verifyTokenChecksum(token)).toBe(true);
	});

	test("should verify static example tokens", () => {
		expect(verifyTokenChecksum("et__abcdefghijklmnopqrstuvwxyz12343Tcn6I")).toBe(true);
		expect(verifyTokenChecksum("ets_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX0gg0n0")).toBe(true);
		expect(verifyTokenChecksum("etr_0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL116joh")).toBe(true);
	});

	test("should reject token with invalid checksum", () => {
		const token = generateToken();
		const invalidToken = token.slice(0, -6) + "000000";
		expect(verifyTokenChecksum(invalidToken)).toBe(false);
	});

	test("should reject token with wrong format", () => {
		expect(verifyTokenChecksum("invalid_token")).toBe(false);
		expect(verifyTokenChecksum("et__tooshort")).toBe(false);
		expect(verifyTokenChecksum("")).toBe(false);
	});

	test("should reject token with tampered random part", () => {
		const token = generateToken();
		const parts = token.match(/^(et_)_([A-Za-z0-9]{30})([A-Za-z0-9]{6})$/);
		if (!parts) throw new Error("Token format invalid");
		
		const [, prefix, random, checksum] = parts;
		if (!prefix || !random || !checksum) throw new Error("Token parts invalid");
		
		const tamperedRandom = random.slice(0, -1) + (random[random.length - 1] === "a" ? "b" : "a");
		const tamperedToken = `${prefix}_${tamperedRandom}${checksum}`;
		
		expect(verifyTokenChecksum(tamperedToken)).toBe(false);
	});

	test("should handle tokens with different prefixes", () => {
		const sessionToken = generateSessionToken();
		const refreshToken = generateRefreshToken();
		
		expect(verifyTokenChecksum(sessionToken)).toBe(true);
		expect(verifyTokenChecksum(refreshToken)).toBe(true);
	});
});

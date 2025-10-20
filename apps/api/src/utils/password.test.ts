import { describe, expect, test } from "bun:test";
import { createPasswordHash, verifyPassword } from "./password";

describe("password hashing", () => {
	test("createPasswordHash should return hash with correct format", async () => {
		const password = "testPassword123";
		const hash = await createPasswordHash(password);
		
		expect(hash).toMatch(/^SHA-512:[^:]+:[a-f0-9]{128}$/);
	});

	test("should create unique hashes for same password", async () => {
		const password = "testPassword123";
		const hash1 = await createPasswordHash(password);
		const hash2 = await createPasswordHash(password);
		
		expect(hash1).not.toBe(hash2);
	});

	test("should create different hashes for different passwords", async () => {
		const hash1 = await createPasswordHash("password1");
		const hash2 = await createPasswordHash("password2");
		
		expect(hash1).not.toBe(hash2);
	});
});

describe("password verification", () => {
	test("should verify static example hash", async () => {
		const password = "mySecurePassword123";
		const hash = "SHA-512:staticsalt456:5505dfa6061b782d107fe425d8948adac7254e01189d8dd49a208b362adcdc01af2a95e834652c51995b66e7616ec3cd84e65840e887883cd9de5a6a42328836";
		
		const result = await verifyPassword(password, hash);
		expect(result).toBe(true);
	});

	test("should verify correct password", async () => {
		const password = "correctPassword123";
		const hash = await createPasswordHash(password);
		
		const result = await verifyPassword(password, hash);
		expect(result).toBe(true);
	});

	test("should reject incorrect password", async () => {
		const password = "correctPassword123";
		const hash = await createPasswordHash(password);
		
		const result = await verifyPassword("wrongPassword", hash);
		expect(result).toBe(false);
	});

	test("should reject invalid hash format", async () => {
		const result = await verifyPassword("password", "invalid_hash");
		expect(result).toBe(false);
	});

	test("should reject hash with missing parts", async () => {
		const result1 = await verifyPassword("password", "SHA-512:salt");
		expect(result1).toBe(false);
		
		const result2 = await verifyPassword("password", "SHA-512:");
		expect(result2).toBe(false);
		
		const result3 = await verifyPassword("password", "");
		expect(result3).toBe(false);
	});

	test("should reject hash with wrong algorithm", async () => {
		const result = await verifyPassword("password", "MD5:salt:hash");
		expect(result).toBe(false);
	});

	test("should handle empty password", async () => {
		const hash = await createPasswordHash("");
		const result = await verifyPassword("", hash);
		expect(result).toBe(true);
	});

	test("should handle special characters in password", async () => {
		const password = "p@ssw0rd!#$%^&*()";
		const hash = await createPasswordHash(password);
		const result = await verifyPassword(password, hash);
		expect(result).toBe(true);
	});

	test("should handle very long passwords", async () => {
		const password = "a".repeat(1000);
		const hash = await createPasswordHash(password);
		const result = await verifyPassword(password, hash);
		expect(result).toBe(true);
	});

	test("should upgrade deprecated sha512 algorithm on successful verify", async () => {
		const password = "testPassword";
		const deprecatedHash = "sha512:oldsalt123:85d5aa1b36949383034293e55a4e6e70100e6937fa46103ea797d68adc6a0d963f6c5eca808c98361067814e4656ba58353aa00c5aac5aec4b1707be4711eb79";
		
		const result = await verifyPassword(password, deprecatedHash);
		
		expect(typeof result).toBe("string");
		if (typeof result === "string") {
			expect(result).toMatch(/^SHA-512:[^:]+:[a-f0-9]{128}$/);
		}
	});

	test("should reject wrong password with deprecated algorithm", async () => {
		const password = "testPassword";
		const hash = await createPasswordHash(password);
		
		const deprecatedHash = hash.replace("SHA-512", "sha512");
		const result = await verifyPassword("wrongPassword", deprecatedHash);
		
		expect(result).toBe(false);
	});
});

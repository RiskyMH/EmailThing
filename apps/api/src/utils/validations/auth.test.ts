import { describe, expect, test } from "bun:test";
import { userAuthSchema, emailSchema } from "./auth";

describe("userAuthSchema", () => {
	test("should accept valid username and password", () => {
		const result = userAuthSchema.safeParse({
			username: "testuser123",
			password: "securePassword123",
		});
		expect(result.success).toBe(true);
	});

	test("should reject username shorter than 4 characters", () => {
		const result = userAuthSchema.safeParse({
			username: "abc",
			password: "securePassword123",
		});
		expect(result.success).toBe(false);
	});

	test("should reject username longer than 20 characters", () => {
		const result = userAuthSchema.safeParse({
			username: "a".repeat(21),
			password: "securePassword123",
		});
		expect(result.success).toBe(false);
	});

	test("should reject username with special characters", () => {
		const result = userAuthSchema.safeParse({
			username: "test_user",
			password: "securePassword123",
		});
		expect(result.success).toBe(false);
	});

	test("should accept username with only letters and numbers", () => {
		const result = userAuthSchema.safeParse({
			username: "User123ABC",
			password: "securePassword123",
		});
		expect(result.success).toBe(true);
	});

	test("should reject password shorter than 8 characters", () => {
		const result = userAuthSchema.safeParse({
			username: "testuser",
			password: "short",
		});
		expect(result.success).toBe(false);
	});

	test("should accept password exactly 8 characters", () => {
		const result = userAuthSchema.safeParse({
			username: "testuser",
			password: "password",
		});
		expect(result.success).toBe(true);
	});

	test("should accept long passwords", () => {
		const result = userAuthSchema.safeParse({
			username: "testuser",
			password: "a".repeat(100),
		});
		expect(result.success).toBe(true);
	});
});

describe("emailSchema", () => {
	test("should accept valid email", () => {
		const result = emailSchema.safeParse({
			email: "user123@example.com",
		});
		expect(result.success).toBe(true);
	});

	test("should reject email with special characters in local part", () => {
		const result = emailSchema.safeParse({
			email: "user.name@example.com",
		});
		expect(result.success).toBe(false);
	});

	test("should reject email without @", () => {
		const result = emailSchema.safeParse({
			email: "userexample.com",
		});
		expect(result.success).toBe(false);
	});

	test("should reject email without domain", () => {
		const result = emailSchema.safeParse({
			email: "user@",
		});
		expect(result.success).toBe(false);
	});

	test("should accept email with subdomain", () => {
		const result = emailSchema.safeParse({
			email: "user@mail.example.com",
		});
		expect(result.success).toBe(true);
	});

	test("should reject email with invalid TLD (less than 2 chars)", () => {
		const result = emailSchema.safeParse({
			email: "user@example.c",
		});
		expect(result.success).toBe(false);
	});

	test("should accept email with numbers in all parts", () => {
		const result = emailSchema.safeParse({
			email: "user123@domain123.com",
		});
		expect(result.success).toBe(true);
	});
});

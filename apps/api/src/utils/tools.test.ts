import { describe, expect, test } from "bun:test";
import { todayDate } from "./tools";

describe("todayDate", () => {
	test("should return date in YYYY-MM-DD format", () => {
		const date = todayDate();
		expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test("should return current date", () => {
		const date = todayDate();
		const now = new Date();
		const expected = now.toISOString().slice(0, 10) as `${number}-${number}-${number}`;
		expect(date).toBe(expected);
	});

	test("should return consistent format across multiple calls within same second", () => {
		const date1 = todayDate();
		const date2 = todayDate();
		expect(date1).toBe(date2);
	});
});

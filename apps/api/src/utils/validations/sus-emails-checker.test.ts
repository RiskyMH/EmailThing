import { describe, expect, it } from "bun:test";
import { validateAlias } from "./sus-emails-checker";
import { impersonatingEmails } from "./invalid-emails";
import { createId } from "@paralleldrive/cuid2";

describe("validateAlias", () => {
    it("should flag impersonating emails", () => {
        impersonatingEmails.forEach((emailPart) => {
            expect(validateAlias(emailPart)).toMatchInlineSnapshot(`
              {
                "error": "Email already taken",
              }
            `);
            expect(validateAlias(`${emailPart}official`)).toMatchInlineSnapshot(`
              {
                "error": "Email already taken",
              }
            `);
        });
    });

    it("should flag common words as too generic", () => {
        const commonWords = [
            "go", "lua", "ton", "lit", "moon", "fly", "arc", "git", "ruby", "vim"
        ];
        commonWords.forEach((word) => {
            expect(validateAlias(word) as {error: string}).toContainKey("error")
            expect(validateAlias(`ilove${word}`)).toEqual(undefined)
            expect(validateAlias(`${word}!`)).toEqual(undefined)
        });
    });

    it("should flag brand names", () => {
        const brandNames = [
            "nvidia", "paypal", "netflix", "microsoft", "youtube", "tiktok", "next.js",
        ]
        brandNames.forEach((brand) => {
            expect(validateAlias(`${brand}ly`)).toMatchInlineSnapshot(`
              {
                "error": "Looks too close to existing brand. If this is an error, please contact me (RiskyMH)",
              }
            `)
        });
    });

    it("should be case-insensitive for impersonating emails", () => {
        expect(validateAlias("ADMIN")).toMatchInlineSnapshot(`
          {
            "error": "Email already taken",
          }
        `)
        expect(validateAlias("sUpPort")).toMatchInlineSnapshot(`
          {
            "error": "Email already taken",
          }
        `)
    });

    it("should be case-insensitive for common words", () => {
        expect(validateAlias("ThE")).toMatchInlineSnapshot(`
          {
            "error": "Be more creative! If this is an error or its critical to your brand, please contact me (RiskyMH)",
          }
        `)
        expect(validateAlias("aNd")).toMatchInlineSnapshot(`
          {
            "error": "Be more creative! If this is an error or its critical to your brand, please contact me (RiskyMH)",
          }
        `)
    });

    it("should be case-insensitive for brand names", () => {
        expect(validateAlias("NiVidia")).toMatchInlineSnapshot(`undefined`)
        expect(validateAlias("pAyPaL")).toMatchInlineSnapshot(`
          {
            "error": "Be more creative! If this is an error or its critical to your brand, please contact me (RiskyMH)",
          }
        `)
        expect(validateAlias("bUn")).toMatchInlineSnapshot(`
          {
            "error": "Be more creative! If this is an error or its critical to your brand, please contact me (RiskyMH)",
          }
        `)
    });

    it("should allow random names", () => {
      new Array({size: 100}).forEach(() => {
        expect(validateAlias(createId())).toBe(undefined)
      })
      expect(validateAlias("lolpotato")).toBe(undefined)
    })
});

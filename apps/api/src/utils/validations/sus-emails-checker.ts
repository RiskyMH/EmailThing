import { Database, type Statement } from "bun:sqlite";
import { impersonatingEmails } from "./invalid-emails";
// @ts-expect-error
import dbFile from "./sus-emails-checker.db" with {type: "file"}

if (import.meta.main) Bun.file(dbFile).write("")
const db = new Database(dbFile, { readonly: !import.meta.main, readwrite: import.meta.main });

let impersonatingStmt: Statement | undefined
let wordStmt: Statement | undefined
let brandStmt: Statement | undefined

export function validateAlias(
    emailPart: string
): { error: string } | void {
    const lowerEmailPart = emailPart.toLowerCase();

    // Check impersonating terms
    impersonatingStmt ||= db.prepare("SELECT 1 FROM impersonating WHERE ? LIKE '%' || name || '%' LIMIT 1");
    if (impersonatingStmt.get(lowerEmailPart)) {
        return { error: "Email already taken" };
    }

    // Check if a generic word
    wordStmt ||= db.prepare("SELECT 1 FROM words WHERE word = ? LIMIT 1");
    if (wordStmt.get(lowerEmailPart)) {
        return {
            error: "Be more creative! If this is an error or its critical to your brand, please contact me (RiskyMH)",
        };
    }

    // Check brands
    brandStmt ||= db.prepare(
        `SELECT 1 FROM brands
         WHERE (direct_only = 1 AND brand = ?)
            OR (direct_only = 0 AND ? LIKE '%' || brand || '%')
         LIMIT 1`
    );
    if (brandStmt.get(lowerEmailPart, lowerEmailPart)) {
        return {
            error: "Looks too close to existing brand. If this is an error, please contact me (RiskyMH)",
        };
    }

}

const genericBrandWords = [
    "go",
    "bun",
    "jwt",
    "lua",
    "ton",
    "lit",
    "moon",
    "fly",
    "arc",
    "git",
    "ruby",
    "vim",
    "amp",
    "css",
    "kick",
    "php",
    "hugo",
    "arc",
    "neon",
    "sass",
    "zod",
    "link",
    "x",
    "vk",
    "warp",
    "r",
    "rust",
    "zig",
    "xd",
    "sky",
    "swc",
    "qt",
    "steam",
    "c#",
    "swr",
    "zoom",
    "v0",
    "nx",
    "bolt",
    "json",
    "motion",
    "paper",
];

if (import.meta.main) {
    async function setupDatabaseInternal() {
        impersonatingStmt = undefined;
        wordStmt = undefined;
        brandStmt = undefined;

        // if not, create them
        db.run("DROP TABLE IF EXISTS impersonating")
        db.run("DROP TABLE IF EXISTS words")
        db.run("DROP TABLE IF EXISTS brands")
        db.run(
            "CREATE TABLE IF NOT EXISTS impersonating (name TEXT PRIMARY KEY COLLATE NOCASE)"
        );
        db.run(
            "CREATE TABLE words (word TEXT PRIMARY KEY COLLATE NOCASE)"
        );
        db.run(
            "CREATE TABLE IF NOT EXISTS brands (brand TEXT PRIMARY KEY COLLATE NOCASE, direct_only BOOLEAN)"
        );

        // fetch and insert words 
        {
            const wordsRes = await fetch("https://raw.githubusercontent.com/hermitdave/FrequencyWords/refs/heads/master/content/2018/en/en_50k.txt");
            const wordsText = await wordsRes.text();
            const words = wordsText.split("\n").map(e => e.split(" ").at(0) || e)

            const insertWord = db.transaction((wordsToInsert: string[]) => {
                const query = db.prepare(
                    "INSERT OR IGNORE INTO words (word) VALUES (?)"
                );
                for (const word of wordsToInsert) {
                    query.run((word.split(" ")?.[0] || word).toLowerCase());
                }
            });
            insertWord(words);
        }

        // fetch and insert brands
        {
            const brandsRes = await fetch("https://api.svgl.app/");
            const brandsJson = (await brandsRes.json()) as { title: string }[];
            const svglBrands = brandsJson.map((item) => item.title.toLowerCase());

            const insertBrand = db.transaction(
                (allBrands: string[], allGenericBrandWords: string[]) => {
                    const query = db.prepare(
                        "INSERT OR IGNORE INTO brands (brand, direct_only) VALUES (?, ?)"
                    );
                    for (const brand of allBrands) {
                        query.run(brand, allGenericBrandWords.includes(brand) || brand.length <= 4);
                    }
                }
            );
            insertBrand(svglBrands, genericBrandWords);
        }

        // fetch and insert impersonating emails
        {
            const insertImpersonatingEmail = db.transaction(
                (emailsToInsert: string[]) => {
                    const query = db.prepare(
                        "INSERT OR IGNORE INTO impersonating (name) VALUES (?)"
                    );
                    for (const email of emailsToInsert) {
                        query.run(email);
                    }
                }
            );
            insertImpersonatingEmail(impersonatingEmails);
        }

        db.run("VACUUM")
    }

    console.time("setup");
    await setupDatabaseInternal();
    console.timeEnd("setup");

    while (true) {
        console.info(validateAlias(prompt(">")!) || { success: true });
    }
}

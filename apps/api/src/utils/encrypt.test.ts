import { describe, expect, test } from "bun:test";
import { encryptString, decryptString } from "./encrypt";

const SECRET = "testpassword123";
const SECRET2 = "anotherPassword!";

async function roundTrip(value: string, secret: string) {
  const encrypted = await encryptString(value, secret);
  const decrypted = await decryptString(encrypted, secret);
  return { encrypted, decrypted };
}

describe.concurrent("encryption", () => {
  test("should encrypt and decrypt a simple string", async () => {
    const { encrypted, decrypted } = await roundTrip("Hello, world!", SECRET);
    expect(decrypted).toBe("Hello, world!");
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(20);
  });

  test("different secrets produce different outputs for same plaintext", async () => {
    const encryptedA = await encryptString("hello world", SECRET);
    const encryptedB = await encryptString("hello world", SECRET2);
    expect(encryptedA).not.toBe(encryptedB);
  });

  test("encrypting the same plaintext/secret twice gives different output (random IV)", async () => {
    const plain = "my test string!";
    const ct1 = await encryptString(plain, SECRET);
    const ct2 = await encryptString(plain, SECRET);
    expect(ct1).not.toBe(ct2);
  });

  test("decrypt with wrong secret fails (throws/Error)", async () => {
    const encrypted = await encryptString("a secret", SECRET);
    let failed = false;
    try {
      await decryptString(encrypted, SECRET2);
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  test("decrypt fails with tampered data or malformed input", async () => {
    const encrypted = await encryptString("tampers test", SECRET);
    const parts = encrypted.split(":");
    parts[1] = parts[1]!.slice(0, -1) + (parts[1]!.slice(-1) === 'A' ? 'B' : 'A');
    let errorRaised = false;
    try {
      await decryptString(parts.join(":"), SECRET);
    } catch {
      errorRaised = true;
    }
    expect(errorRaised).toBe(true);
    await expect(decryptString("onlyonepart", SECRET)).rejects.toThrow();
  });

  test("should not handle empty string encryption/decryption", async () => {
    expect(encryptString("", SECRET)).rejects.toThrow("Data and secret must be non-empty strings");

    const hardcoded = "g0uho:60+iQjjRm3t7guL7::wsplISPQE4gSRY0TjlYk+g=="; // encrypted ""
    expect(decryptString(hardcoded, SECRET)).rejects.toThrow("Invalid encrypted data format. Expected salt:iv:ciphertext:authTag");
  });

  test("should handle special characters", async () => {
    const data = "!@#$%^&*()_+-=[]{}|;':,.<>/?Привет 世界 🌎";
    const { decrypted } = await roundTrip(data, SECRET);
    expect(decrypted).toBe(data);
  });

  test("should handle long strings", async () => {
    const data = "x".repeat(10_000);
    const { decrypted } = await roundTrip(data, SECRET);
    expect(decrypted).toBe(data);
  });
});

describe.concurrent("decrypting hardcoded reference ciphertexts", () => {
  const fixtures = [
    {
      name: "fixture 1: 'Hello there!'",
      plaintext: "Hello there!",
      secret: SECRET,
      ciphertext: "dc91h:5FTHm26nE3WaXieL:haUdYUAxmnkgXV93:WD6RfgxkinUhSrz02sSu1g==",
    },
    {
      name: "fixture 2: special characters",
      plaintext: "p@ssw0rd!#$%^&*()Привет",
      secret: SECRET,
      ciphertext: "eydt5:xqE1zisSErggSQ6t:IqaTehlHxLbPHzkL/icLbmEX+iqSqotHcoNCDXU=:kMT2C7rhbw2FyHc8SRW77A==",
    },
    {
      name: "fixture 3: long string",
      plaintext: "a".repeat(100),
      secret: SECRET,
      ciphertext: "jjbtg:Blpm2XsJNCXLDATI:mbNKbXPyedF1P8CfoOe6BYU4JNhpFsAOIMtoZmXaKH73kagWEjlUzY+FY+MN/0zrykkirRjLgYs8ZvGYFM4zJtZ+3vyvWo6UxRJEvZ90PX3wSVoJnPARx1rCA6pRKfz0hTZOfQ==:kHH4f1r7KRehrKAjP+I5Iw==",
    },
  ];

  test.each(fixtures)(`$name should decrypt correctly`, async (fixture) => {
    const out = await decryptString(fixture.ciphertext, fixture.secret);
    expect(out).toBe(fixture.plaintext);
  });

  test.each(fixtures)(`$name should fail with wrong key`, async (fixture) => {
    expect(decryptString(fixture.ciphertext, SECRET2)).rejects.toThrow();
  });
});

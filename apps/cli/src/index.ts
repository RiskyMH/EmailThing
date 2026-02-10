#!/usr/bin/env bun

// Check for --logout flag
if (process.argv.includes("logout")) {
  const { getDB, clearAuth, resetDB } = await import("@/utils/config");
  const db = getDB();
  clearAuth(db);
  resetDB(db);
  console.log("Logged out successfully. Run again to login.");
  db.close();
} 

// Check for --agent flag
else if (
  process.argv.includes("agent") ||
  (process.env.CLAUDECODE || process.env.OPENCODE || process.env.AGENT) === "1"
) {
  await import("./agent");
} else {
  await import("./main");
}

export {}
#!/usr/bin/env bun

// throw nice warning if they are using an old version of Bun that doesn't support some features we use
if (!Bun.semver.satisfies(Bun.version, ">=1.3.9")) {
  console.error(`EmailThing CLI requires Bun v1.3.9 or higher. You are running ${Bun.version}. Please update Bun to continue.`);
  if (process.stdin.isTTY && confirm("Upgrade bun?")) {
    Bun.spawnSync(
      [process.execPath, "upgrade"],
      { stdout: "inherit", stderr: "inherit", stdin: "inherit" }
    );
  }
  process.exit(1);
}

// check for logout option
else if (process.argv.includes("logout")) {
  const { getDB, clearAuth, resetDB } = await import("@/utils/config");
  const db = getDB();
  clearAuth(db);
  resetDB(db);
  console.log("Logged out successfully. Run again to login.");
  db.close();
}

// check for agent mode
else if (
  process.argv.includes("agent") ||
  (process.env.CLAUDECODE || process.env.OPENCODE || process.env.AGENT) === "1"
) {
  await import("./agent");
}

// warn if not running in a TTY and not in agent mode, since the CLI won't work properly
else if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("This application is meant to be run in an interactive terminal.");
  console.log("Use `bunx @emailthing/cli agent` flag to run in agent mode instead.");
  process.exit(1);
}

// otherwise run the normal (interactive) CLI
else {
  await import("./main");
}

export { }

#!/usr/bin/env node
// Pre-dev setup: ensures everything is installed before npm run dev fires up.
// Idempotent — safe to run repeatedly. npm itself skips work that's already done.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "..");
const clientDir = join(rootDir, "src", "client");

const log = (msg) => console.log(`\n🔧 ${msg}\n`);

const run = (cmd, cwd) => {
    execSync(cmd, { cwd, stdio: "inherit" });
};

const needsInstall = (dir) => {
    return !existsSync(join(dir, "node_modules"));
};

// Install root dependencies (server + dev tooling)
if (needsInstall(rootDir)) {
    log("Installing root dependencies...");
    run("npm install", rootDir);
} else {
    log("Root dependencies already installed ✓");
}

// Install client dependencies
if (needsInstall(clientDir)) {
    log("Installing client dependencies...");
    run("npm install", clientDir);
} else {
    log("Client dependencies already installed ✓");
}

log("Setup complete — starting dev servers...");

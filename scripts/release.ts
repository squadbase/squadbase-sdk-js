/**
 * Unified Release Script for Squadbase SDK
 *
 * Usage:
 *   pnpm release:patch:beta -- --otp=XXXXXX   # Beta release (0.0.2 -> 0.0.3-beta.0)
 *   pnpm release:patch -- --otp=XXXXXX        # Stable release (0.0.2 -> 0.0.3)
 *
 * Features:
 *   - Unified versioning: All packages share the same version (from root package.json)
 *   - Atomic release: All packages are published together
 *   - Idempotent: Already published packages are skipped (safe to re-run after failure)
 *   - Auto rollback: On failure, local changes are reverted via git checkout
 *
 * Version Calculation:
 *   - stable -> beta:  0.0.2 -> 0.0.3-beta.0 (bump + beta suffix)
 *   - beta -> beta:    0.0.3-beta.0 -> 0.0.3-beta.1 (increment beta number)
 *   - beta -> stable:  0.0.3-beta.5 -> 0.0.3 (remove beta suffix, no bump)
 *   - stable -> stable: 0.0.2 -> 0.0.3 (bump)
 *
 * Release Flow:
 *   1. Ensure working directory is clean (no uncommitted changes)
 *   2. Calculate new version
 *   3. Update all package.json files
 *   4. Build all packages
 *   5. Publish packages (skip already published)
 *   6. Git commit and tag
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, "..");
const ROOT_PACKAGE_JSON = resolve(ROOT_DIR, "package.json");

// Package definitions with dependency order (leaves first)
const PACKAGES = [
  { name: "@squadbase/server", path: "packages/server" },
  { name: "@squadbase/nextjs", path: "packages/nextjs" },
];

function ensureCleanWorkingDirectory(): void {
  const status = execSync("git status --porcelain", {
    cwd: ROOT_DIR,
    encoding: "utf-8",
  });
  if (status.trim() !== "") {
    console.error("Error: Working directory is not clean.");
    console.error("Please commit or stash your changes before releasing.");
    console.error("\nUncommitted changes:");
    console.error(status);
    process.exit(1);
  }
}

function getModifiedFiles(): string[] {
  return [
    "package.json",
    ...PACKAGES.map((pkg) => `${pkg.path}/package.json`),
  ];
}

function rollbackChanges(): void {
  console.log("\nRolling back changes...");
  for (const file of getModifiedFiles()) {
    try {
      execSync(`git checkout -- ${file}`, { cwd: ROOT_DIR, stdio: "pipe" });
      console.log(`  Restored ${file}`);
    } catch {
      // File might not have been modified yet, ignore
    }
  }
}

function isVersionPublished(packageName: string, version: string): boolean {
  try {
    execSync(`npm view ${packageName}@${version} version`, {
      cwd: ROOT_DIR,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

type VersionType = "patch" | "minor" | "major";

function readVersion(): string {
  const content = readFileSync(ROOT_PACKAGE_JSON, "utf-8");
  return JSON.parse(content).version;
}

function writeVersion(version: string): void {
  const content = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, "utf-8"));
  content.version = version;
  writeFileSync(ROOT_PACKAGE_JSON, JSON.stringify(content, null, 2) + "\n");
}

function bumpVersionString(
  current: string,
  type: VersionType,
  isBeta: boolean
): string {
  // Parse current version: 0.0.2 or 0.0.2-beta.0
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${current}`);
  }

  let [, major, minor, patch, betaNum] = match;
  let majorN = parseInt(major);
  let minorN = parseInt(minor);
  let patchN = parseInt(patch);

  // If current is a beta version
  if (betaNum !== undefined) {
    if (isBeta) {
      // beta -> beta: increment beta number
      return `${majorN}.${minorN}.${patchN}-beta.${parseInt(betaNum) + 1}`;
    } else {
      // beta -> stable: remove beta suffix (no version bump)
      return `${majorN}.${minorN}.${patchN}`;
    }
  }

  // Current is a stable version, bump the appropriate component
  switch (type) {
    case "major":
      majorN++;
      minorN = 0;
      patchN = 0;
      break;
    case "minor":
      minorN++;
      patchN = 0;
      break;
    case "patch":
      patchN++;
      break;
  }

  return isBeta
    ? `${majorN}.${minorN}.${patchN}-beta.0`
    : `${majorN}.${minorN}.${patchN}`;
}

function updatePackageVersions(version: string): void {
  for (const pkg of PACKAGES) {
    const pkgPath = resolve(ROOT_DIR, pkg.path, "package.json");
    const content = JSON.parse(readFileSync(pkgPath, "utf-8"));
    content.version = version;
    writeFileSync(pkgPath, JSON.stringify(content, null, 2) + "\n");
    console.log(`  Updated ${pkg.name} to version ${version}`);
  }
}

function buildPackages(): void {
  console.log("\nBuilding all packages...");
  execSync("pnpm build", { cwd: ROOT_DIR, stdio: "inherit" });
}

function publishAllPackages(
  version: string,
  isBeta: boolean,
  otp?: string
): void {
  const tag = isBeta ? "beta" : "latest";
  const otpFlag = otp ? ` --otp ${otp}` : "";

  console.log(`\nPublishing all packages with tag: ${tag}`);
  for (const pkg of PACKAGES) {
    if (isVersionPublished(pkg.name, version)) {
      console.log(`\nSkipping ${pkg.name}@${version} (already published)`);
      continue;
    }

    console.log(`\nPublishing ${pkg.name}...`);
    execSync(
      `pnpm --filter ${pkg.name} publish --no-git-checks --tag ${tag}${otpFlag}`,
      { cwd: ROOT_DIR, stdio: "inherit" }
    );
    console.log(`Successfully published ${pkg.name}`);
  }
}

function gitCommitAndTag(version: string): void {
  console.log("\nCreating git commit and tag...");

  // Stage all changes
  execSync("git add .", { cwd: ROOT_DIR, stdio: "inherit" });

  // Create commit
  const commitMessage = `chore: release v${version}`;
  execSync(`git commit -m "${commitMessage}"`, {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
  console.log(`  Created commit: ${commitMessage}`);

  // Create tag
  const tagName = `v${version}`;
  execSync(`git tag ${tagName}`, { cwd: ROOT_DIR, stdio: "inherit" });
  console.log(`  Created tag: ${tagName}`);

  console.log("\nDon't forget to push:");
  console.log(`  git push && git push --tags`);
}

function release(type: VersionType, isBeta: boolean, otp?: string): void {
  try {
    const releaseType = isBeta ? "beta" : "latest";
    console.log(`\nStarting ${releaseType} release (${type})...\n`);

    // 0. Ensure working directory is clean
    ensureCleanWorkingDirectory();
    console.log("Working directory is clean.\n");

    // 1. Read current version and calculate new version
    const currentVersion = readVersion();
    const newVersion = bumpVersionString(currentVersion, type, isBeta);
    console.log(`Version: ${currentVersion} -> ${newVersion}\n`);

    // 2. Update root package.json version
    writeVersion(newVersion);
    console.log("Updated root package.json");

    // 3. Update all package.json versions
    console.log("\nUpdating package versions:");
    updatePackageVersions(newVersion);

    // 4. Build all packages
    buildPackages();

    // 5. Publish in dependency order (skip already published)
    publishAllPackages(newVersion, isBeta, otp);

    // 6. Git commit and tag
    gitCommitAndTag(newVersion);

    console.log(`\n✓ Successfully released v${newVersion}!`);
  } catch (error) {
    console.error("\nRelease failed:", error);
    rollbackChanges();
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const type = args[0] as VersionType;
const isBeta = args.includes("--beta");
const otpIndex = args.findIndex((arg) => arg.startsWith("--otp="));
const otp = otpIndex !== -1 ? args[otpIndex].split("=")[1] : undefined;

// Validate
if (!["patch", "minor", "major"].includes(type)) {
  console.error(
    "Usage: pnpm release:<patch|minor|major>[:beta] -- --otp=XXXXXX"
  );
  console.error("  Examples:");
  console.error(
    "    pnpm release:patch:beta -- --otp=123456   # Release beta"
  );
  console.error(
    "    pnpm release:patch -- --otp=123456        # Release stable"
  );
  process.exit(1);
}

release(type, isBeta, otp);

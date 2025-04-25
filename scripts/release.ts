import { execSync } from "child_process";

function validateArgs(versionType: string, packageName: string) {
  if (!versionType || !packageName) {
    console.error(
      "Usage: tsx scripts/release.ts <version-type> <package-name> [--beta]"
    );
    console.error("  version-type: patch, minor, or major");
    console.error("  package-name: e.g. @squadbase/server");
    console.error("  --beta: (optional) release as beta version");
    process.exit(1);
  }

  if (!["patch", "minor", "major"].includes(versionType)) {
    console.error("Version type must be one of: patch, minor, major");
    process.exit(1);
  }
}

function bumpVersion(
  packageName: string,
  versionType: string,
  isBeta: boolean
) {
  console.log("Bumping version...");
  const versionCommand = isBeta ? `prerelease --preid beta` : versionType;
  execSync(
    `pnpm --filter ${packageName} exec -- npm version ${versionCommand} --no-git-tag-version`,
    {
      stdio: "inherit",
    }
  );
}

function buildPackages() {
  console.log("Building packages...");
  execSync("pnpm build", {
    stdio: "inherit",
  });
}

function publishPackage(packageName: string, isBeta: boolean) {
  console.log("Publishing package...");
  const publishTag = isBeta ? "beta" : "latest";
  execSync(
    `pnpm --filter ${packageName} publish --no-git-checks --tag ${publishTag}`,
    {
      stdio: "inherit",
    }
  );
}

function releasePackage(
  versionType: string,
  packageName: string,
  isBeta: boolean
) {
  try {
    console.log(`Starting release process for ${packageName}...`);
    validateArgs(versionType, packageName);

    bumpVersion(packageName, versionType, isBeta);
    buildPackages();
    publishPackage(packageName, isBeta);

    console.log(`Successfully released ${packageName}!`);
  } catch (error) {
    console.error("Release failed:", error);
    process.exit(1);
  }
}

const versionType = process.argv[2];
const packageName = process.argv[3];
const isBeta = process.argv[4] === "--beta";

releasePackage(versionType, packageName, isBeta);

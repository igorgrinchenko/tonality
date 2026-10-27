import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (file) => JSON.parse(await readFile(join(projectRoot, file), "utf8"));
const writeJson = async (file, data, spaces) => writeFile(join(projectRoot, file), `${JSON.stringify(data, null, spaces)}\n`, "utf8");

const packageJson = await readJson("package.json");
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);

if (!match) {
    throw new Error(`Cannot increment non-standard app version: ${packageJson.version}`);
}

const nextVersion = `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
const packageLock = await readJson("package-lock.json");
const appVersion = await readJson("src/app_version.json");

packageJson.version = nextVersion;
packageLock.version = nextVersion;
packageLock.packages[""].version = nextVersion;
appVersion.version = nextVersion;

await Promise.all([writeJson("package.json", packageJson, 2), writeJson("package-lock.json", packageLock, 4), writeJson("src/app_version.json", appVersion, 4)]);
console.log(`App version updated to ${nextVersion}. Add release notes for this version in src/releaseNotes.ts.`);

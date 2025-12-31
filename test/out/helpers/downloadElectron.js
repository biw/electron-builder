"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldElectronVersion = deleteOldElectronVersion;
exports.downloadAllRequiredElectronVersions = downloadAllRequiredElectronVersions;
const ci_info_1 = require("ci-info");
const fs = require("fs/promises");
const path = require("path");
const semver_1 = require("semver");
const testConfig_1 = require("./testConfig");
const executeAppBuilder = require(path.join(__dirname, "../../..", "packages/builder-util")).executeAppBuilder;
async function deleteOldElectronVersion() {
    // on CircleCi no need to clean manually
    if (process.env.CIRCLECI || !ci_info_1.isCI) {
        return;
    }
    const cacheDir = (0, testConfig_1.getElectronCacheDir)();
    let files;
    try {
        files = await fs.readdir(cacheDir);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            return;
        }
        else {
            throw e;
        }
    }
    return await Promise.all(files.map(file => {
        if (file.endsWith(".zip") && !file.includes(testConfig_1.ELECTRON_VERSION)) {
            console.log(`Remove old electron ${file}`);
            return fs.unlink(path.join(cacheDir, file));
        }
        return Promise.resolve(null);
    }));
}
function downloadAllRequiredElectronVersions() {
    const platforms = process.platform === "win32" ? ["win32"] : ["darwin", "linux", "win32"];
    if (process.platform === "darwin") {
        platforms.push("mas");
    }
    const versions = [];
    for (const platform of platforms) {
        const archs = platform === "mas" || platform === "darwin"
            ? ["x64"]
            : platform === "win32"
                ? ["ia32", "x64"]
                : require(`${path.join(__dirname, "../../..")}/packages/builder-util/out/util`).getArchCliNames();
        for (const arch of archs) {
            if ((0, semver_1.gte)(testConfig_1.ELECTRON_VERSION, "19.0.0") && platform === "linux" && arch === "ia32") {
                // Chromium dropped support for ia32 linux binaries in 102.0.4999.0
                // https://www.electronjs.org/docs/latest/breaking-changes#removed-ia32-linux-binaries
                continue;
            }
            versions.push({
                version: testConfig_1.ELECTRON_VERSION,
                arch,
                platform,
            });
        }
    }
    return executeAppBuilder(["download-electron", "--configuration", JSON.stringify(versions)]);
}
if (require.main === module) {
    downloadAllRequiredElectronVersions().catch(error => {
        console.error((error.stack || error).toString());
        process.exitCode = -1;
    });
}
//# sourceMappingURL=downloadElectron.js.map
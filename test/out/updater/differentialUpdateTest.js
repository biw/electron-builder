"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResult = checkResult;
const app_builder_lib_1 = require("app-builder-lib");
const binDownload_1 = require("app-builder-lib/out/binDownload");
const builder_util_1 = require("builder-util");
const electron_updater_1 = require("electron-updater");
const events_1 = require("events");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const temp_file_1 = require("temp-file");
const TestAppAdapter_1 = require("../helpers/TestAppAdapter");
const packTester_1 = require("../helpers/packTester");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
const vitest_mock_commonjs_1 = require("vitest-mock-commonjs");
async function doBuild(expect, outDirs, targets, tmpDir, isWindows, extraConfig) {
    async function buildApp(version, targets, extraConfig, packed) {
        await (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets,
            config: {
                extraMetadata: {
                    version,
                },
                ...extraConfig,
                compression: "normal",
                publish: {
                    provider: "s3",
                    bucket: "develar",
                    path: "test",
                },
            },
        }, {
            signedWin: isWindows,
            packed,
        });
    }
    const build = (version) => buildApp(version, targets, extraConfig, async (context) => {
        // move dist temporarily out of project dir so each downloader can reference it
        const newDir = await tmpDir.getTempDir({ prefix: version });
        await (0, fs_extra_1.move)(context.outDir, newDir);
        outDirs.push(newDir);
    });
    try {
        await build(updaterTestUtil_1.OLD_VERSION_NUMBER);
        await build(updaterTestUtil_1.NEW_VERSION_NUMBER);
    }
    catch (e) {
        await tmpDir.cleanup();
        throw e;
    }
}
test.ifWindows("web installer", { retry: 2 }, async ({ expect }) => {
    const outDirs = [];
    const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
    await doBuild(expect, outDirs, app_builder_lib_1.Platform.WINDOWS.createTarget(["nsis-web"], app_builder_lib_1.Arch.x64), tmpDir, true);
    const oldDir = outDirs[0];
    await (0, fs_extra_1.move)(path.join(oldDir, "nsis-web", `TestApp-${updaterTestUtil_1.OLD_VERSION_NUMBER}-x64.nsis.7z`), path.join(getTestUpdaterCacheDir(oldDir), updaterTestUtil_1.testAppCacheDirName, "package.7z"));
    await testBlockMap(expect, outDirs[0], path.join(outDirs[1], "nsis-web"), electron_updater_1.NsisUpdater, app_builder_lib_1.Platform.WINDOWS, app_builder_lib_1.Arch.x64);
});
test.ifWindows("nsis", async ({ expect }) => {
    const outDirs = [];
    const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
    await doBuild(expect, outDirs, app_builder_lib_1.Platform.WINDOWS.createTarget(["nsis"], app_builder_lib_1.Arch.x64), tmpDir, true);
    const oldDir = outDirs[0];
    // move to new dir so that localhost server can read both blockmaps
    await (0, fs_extra_1.move)(path.join(oldDir, `Test App ßW Setup ${updaterTestUtil_1.OLD_VERSION_NUMBER}.exe`), path.join(getTestUpdaterCacheDir(oldDir), updaterTestUtil_1.testAppCacheDirName, "installer.exe"));
    await (0, fs_extra_1.move)(path.join(oldDir, `Test App ßW Setup ${updaterTestUtil_1.OLD_VERSION_NUMBER}.exe.blockmap`), path.join(outDirs[1], "Test App ßW Setup 1.0.0.exe.blockmap"));
    await testBlockMap(expect, outDirs[0], outDirs[1], electron_updater_1.NsisUpdater, app_builder_lib_1.Platform.WINDOWS, app_builder_lib_1.Arch.x64);
});
async function testLinux(expect, arch) {
    process.env.TEST_UPDATER_ARCH = app_builder_lib_1.Arch[arch];
    const outDirs = [];
    const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
    try {
        await doBuild(expect, outDirs, app_builder_lib_1.Platform.LINUX.createTarget(["appimage"], arch), tmpDir, false);
        process.env.APPIMAGE = path.join(outDirs[0], `Test App ßW-${updaterTestUtil_1.OLD_VERSION_NUMBER}${arch === app_builder_lib_1.Arch.ia32 ? "-i386" : ""}.AppImage`);
        await testBlockMap(expect, outDirs[0], outDirs[1], electron_updater_1.AppImageUpdater, app_builder_lib_1.Platform.LINUX, arch);
    }
    finally {
        await tmpDir.cleanup();
    }
}
test.ifLinux("AppImage", ({ expect }) => testLinux(expect, app_builder_lib_1.Arch.x64));
// Skipped, electron no longer ships ia32 linux binaries
test.ifLinux.skip("AppImage ia32", ({ expect }) => testLinux(expect, app_builder_lib_1.Arch.ia32));
async function testMac(expect, arch) {
    process.env.TEST_UPDATER_ARCH = app_builder_lib_1.Arch[arch];
    const outDirs = [];
    const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
    try {
        await doBuild(expect, outDirs, app_builder_lib_1.Platform.MAC.createTarget(["zip"], arch), tmpDir, false, {
            mac: {
                electronUpdaterCompatibility: ">=2.17.0",
            },
        });
        // move to new dir so that localhost server can read both blockmaps
        const oldDir = outDirs[0];
        const blockmap = `Test App ßW-${updaterTestUtil_1.OLD_VERSION_NUMBER}${(0, builder_util_1.getArchSuffix)(arch)}-mac.zip.blockmap`;
        await (0, fs_extra_1.move)(path.join(oldDir, blockmap), path.join(outDirs[1], blockmap));
        await (0, fs_extra_1.move)(path.join(oldDir, `Test App ßW-${updaterTestUtil_1.OLD_VERSION_NUMBER}${(0, builder_util_1.getArchSuffix)(arch)}-mac.zip`), path.join(getTestUpdaterCacheDir(oldDir), updaterTestUtil_1.testAppCacheDirName, "update.zip"));
        await testBlockMap(expect, outDirs[0], outDirs[1], electron_updater_1.MacUpdater, app_builder_lib_1.Platform.MAC, arch, "Test App ßW");
    }
    finally {
        await tmpDir.cleanup();
    }
}
test.ifMac("Mac Intel", ({ expect }) => testMac(expect, app_builder_lib_1.Arch.x64));
test.ifMac("Mac universal", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => testMac(expect, app_builder_lib_1.Arch.universal));
// only run on arm64 macs, otherwise of course no files can be found to be updated to (due to arch mismatch)
test.ifMac.ifEnv(process.arch === "arm64")("Mac arm64", ({ expect }) => testMac(expect, app_builder_lib_1.Arch.arm64));
async function checkResult(expect, updater) {
    // disable automatic install otherwise mac updater will permanently wait on mocked electron's native updater to receive update (mocked server can't install)
    updater.autoInstallOnAppQuit = false;
    const updateCheckResult = await updater.checkForUpdates();
    const downloadPromise = updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise;
    // noinspection JSIgnoredPromiseFromCall
    expect(downloadPromise).not.toBeNull();
    const files = await downloadPromise;
    const fileInfo = updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo.files[0];
    // delete url because port is random
    expect(fileInfo.url).toBeDefined();
    delete fileInfo.url;
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
    expect(files.map(it => path.basename(it))).toMatchSnapshot();
}
class TestNativeUpdater extends events_1.EventEmitter {
    checkForUpdates() {
        console.log("TestNativeUpdater.checkForUpdates");
        // MacUpdater expects this to emit corresponding update-downloaded event
        this.emit("update-downloaded");
    }
    setFeedURL(updateConfig) {
        console.log("TestNativeUpdater.setFeedURL " + updateConfig.url);
    }
    getFeedURL() {
        console.log("TestNativeUpdater.getFeedURL");
    }
    quitAndInstall() {
        console.log("TestNativeUpdater.quitAndInstall");
    }
}
function getTestUpdaterCacheDir(oldDir) {
    return path.join(oldDir, "updater-cache");
}
async function testBlockMap(expect, oldDir, newDir, updaterClass, platform, arch, productFilename) {
    const appUpdateConfigPath = path.join(`${platform.buildConfigurationKey}${(0, builder_util_1.getArchSuffix)(arch)}${platform === app_builder_lib_1.Platform.MAC ? "" : "-unpacked"}`, platform === app_builder_lib_1.Platform.MAC ? `${productFilename}.app` : "");
    const port = 8000 + updaterClass.name.charCodeAt(0) + Math.floor(Math.random() * 10000);
    const serverBin = await (0, binDownload_1.getBinFromUrl)("ran-0.1.3", "ran-0.1.3.7z", "imfA3LtT6umMM0BuQ29MgO3CJ9uleN5zRBi3sXzcTbMOeYZ6SQeN7eKr3kXZikKnVOIwbH+DDO43wkiR/qTdkg==");
    const httpServerProcess = (0, builder_util_1.doSpawn)(path.join(serverBin, process.platform, "ran"), [`-root=${newDir}`, `-port=${port}`, "-gzip=false", "-listdir=true"]);
    // Mac uses electron's native autoUpdater to serve updates to, we mock here since electron API isn't available within jest runtime
    const mockNativeUpdater = new TestNativeUpdater();
    (0, vitest_mock_commonjs_1.mockForNodeRequire)("electron", {
        autoUpdater: mockNativeUpdater,
    });
    return await new Promise((resolve, reject) => {
        httpServerProcess.on("error", reject);
        const updater = new updaterClass(null, new TestAppAdapter_1.TestAppAdapter(updaterTestUtil_1.OLD_VERSION_NUMBER, getTestUpdaterCacheDir(oldDir)));
        updater._appUpdateConfigPath = path.join(oldDir, updaterClass === electron_updater_1.MacUpdater ? `${appUpdateConfigPath}/Contents/Resources` : `${appUpdateConfigPath}/resources`, "app-update.yml");
        const doTest = async () => {
            (0, updaterTestUtil_1.tuneTestUpdater)(updater, {
                platform: platform.nodeName,
                isUseDifferentialDownload: true,
            });
            const currentUpdaterCacheDirName = (await updater.configOnDisk.value).updaterCacheDirName;
            if (currentUpdaterCacheDirName == null) {
                throw new Error(`currentUpdaterCacheDirName must be not null, appUpdateConfigPath: ${updater._appUpdateConfigPath}`);
            }
            updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
                provider: "generic",
                updaterCacheDirName: currentUpdaterCacheDirName,
                url: `http://127.0.0.1:${port}`,
            });
            await checkResult(expect, updater);
        };
        doTest().then(resolve).catch(reject);
    }).then(v => {
        httpServerProcess.kill();
        return v;
    }, e => {
        httpServerProcess.kill();
        throw e;
    });
}
//# sourceMappingURL=differentialUpdateTest.js.map
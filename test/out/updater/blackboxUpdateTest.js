"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const binDownload_1 = require("app-builder-lib/out/binDownload");
const util_1 = require("builder-util/out/util");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vitest_1 = require("vitest");
const launchAppCrossPlatform_1 = require("../helpers/launchAppCrossPlatform");
const packTester_1 = require("../helpers/packTester");
const testConfig_1 = require("../helpers/testConfig");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
const child_process_1 = require("child_process");
const os_1 = require("os");
const electron_updater_1 = require("electron-updater");
// Linux Tests MUST be run in docker containers for proper ephemeral testing environment (e.g. fresh install + update + relaunch)
// Currently this test logic does not handle uninstalling packages (yet)
(0, vitest_1.describe)("Electron autoupdate (fresh install & update)", () => {
    (0, vitest_1.beforeAll)(() => {
        process.env.AUTO_UPDATER_TEST = "1";
    });
    (0, vitest_1.afterAll)(() => {
        delete process.env.AUTO_UPDATER_TEST;
    });
    // Signing is required for macOS autoupdate
    test.ifMac.ifEnv(process.env.CSC_KEY_PASSWORD)("mac", async (context) => {
        await runTest(context, "mac", "zip");
    });
    test.ifWindows("win", async (context) => {
        await runTest(context, "nsis", "nsis");
    });
    // must be sequential in order for process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER to be respected per-test
    vitest_1.describe.runIf(process.platform === "linux")("linux", { sequential: true }, () => {
        test.ifEnv(process.env.RUN_APP_IMAGE_TEST === "true" && process.arch === "arm64")("AppImage - arm64", async (context) => {
            await runTest(context, "AppImage", "appimage", electron_builder_1.Arch.arm64);
        });
        // only works on x64, so this will fail on arm64 macs due to arch mismatch
        test.ifEnv(process.env.RUN_APP_IMAGE_TEST === "true" && process.arch === "x64")("AppImage - x64", async (context) => {
            await runTest(context, "AppImage", "appimage", electron_builder_1.Arch.x64);
        });
        // package manager tests specific to each distro (and corresponding docker image)
        for (const distro in packageManagerMap) {
            const { pms, target } = packageManagerMap[distro];
            for (const pm of pms) {
                test(`${distro} - (${pm})`, { sequential: true }, async (context) => {
                    if (!determineEnvironment(distro)) {
                        context.skip();
                    }
                    // skip if already set to avoid interfering with other package manager tests
                    if (!(0, util_1.isEmptyOrSpaces)(process.env.PACKAGE_MANAGER_TO_TEST) && process.env.PACKAGE_MANAGER_TO_TEST !== pm) {
                        context.skip();
                    }
                    await runTest(context, target, pm, electron_builder_1.Arch.x64);
                });
            }
        }
    });
});
const determineEnvironment = (target) => {
    return (0, child_process_1.execSync)(`cat /etc/*release | grep "^ID="`).toString().includes(target);
};
const packageManagerMap = {
    fedora: {
        pms: ["zypper", "dnf", "yum", "rpm"],
        target: "rpm",
    },
    debian: {
        pms: ["apt", "dpkg"],
        target: "deb",
    },
    arch: {
        pms: ["pacman"],
        target: "pacman",
    },
};
async function runTest(context, target, packageManager, arch = electron_builder_1.Arch.x64) {
    const { expect } = context;
    const tmpDir = new util_1.TmpDir("auto-update");
    const outDirs = [];
    await doBuild(expect, outDirs, electron_builder_1.Platform.current().createTarget([target], arch), tmpDir, process.platform === "win32");
    const oldAppDir = outDirs[0];
    const newAppDir = outDirs[1];
    const dirPath = oldAppDir.dir;
    // Setup tests by installing the previous version
    const appPath = await handleInitialInstallPerOS({ target, dirPath, arch });
    if (!(0, fs_extra_1.existsSync)(appPath)) {
        throw new Error(`App not found: ${appPath}`);
    }
    let queuedError = null;
    try {
        await runTestWithinServer(async (rootDirectory, updateConfigPath) => {
            // Move app update to the root directory of the server
            await fs_extra_1.default.copy(newAppDir.dir, rootDirectory, { recursive: true, overwrite: true });
            const verifyAppVersion = async (expectedVersion) => await (0, launchAppCrossPlatform_1.launchAndWaitForQuit)({ appPath, timeoutMs: 2 * 60 * 1000, updateConfigPath, expectedVersion, packageManagerToTest: packageManager });
            const result = await verifyAppVersion(updaterTestUtil_1.OLD_VERSION_NUMBER);
            util_1.log.debug(result, "Test App version");
            expect(result.version).toMatch(updaterTestUtil_1.OLD_VERSION_NUMBER);
            // Wait for quitAndInstall to take effect, increase delay if updates are slower
            // (shouldn't be the case for such a small test app, but Windows with Debugger attached is pretty dam slow)
            const delay = 60 * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            expect((await verifyAppVersion(updaterTestUtil_1.NEW_VERSION_NUMBER)).version).toMatch(updaterTestUtil_1.NEW_VERSION_NUMBER);
        });
    }
    catch (error) {
        util_1.log.error({ error: error.message }, "Blackbox Updater Test failed to run");
        queuedError = error;
    }
    finally {
        // windows needs to release file locks, so a delay seems to be needed
        await new Promise(resolve => setTimeout(resolve, 1000));
        await tmpDir.cleanup();
        try {
            await handleCleanupPerOS({ target });
        }
        catch (error) {
            util_1.log.error({ error: error.message }, "Blackbox Updater Test cleanup failed");
            // ignore
        }
    }
    if (queuedError) {
        throw queuedError;
    }
}
async function doBuild(expect, outDirs, targets, tmpDir, isWindows, extraConfig) {
    async function buildApp(version, targets, extraConfig, packed) {
        await (0, packTester_1.assertPack)(expect, "test-app", {
            targets,
            config: {
                productName: "TestApp",
                executableName: "TestApp",
                appId: "com.test.app",
                artifactName: "${productName}.${ext}",
                // asar: false, // not necessarily needed, just easier debugging tbh
                electronLanguages: ["en"],
                extraMetadata: {
                    name: "testapp",
                    version,
                },
                ...extraConfig,
                compression: "store",
                publish: {
                    provider: "s3",
                    bucket: "develar",
                    path: "test",
                },
                files: ["**/*", "../**/node_modules/**", "!path/**"],
                nsis: {
                    artifactName: "${productName} Setup.${ext}",
                    // one click installer required. don't run after install otherwise we lose stdout pipe
                    oneClick: true,
                    runAfterFinish: false,
                },
            },
        }, {
            storeDepsLockfileSnapshot: false,
            signed: true,
            signedWin: isWindows,
            packed,
            projectDirCreated: async (projectDir) => {
                await Promise.all([
                    (0, fs_extra_1.outputFile)(path_1.default.join(projectDir, "package-lock.json"), "{}"),
                    (0, fs_extra_1.outputFile)(path_1.default.join(projectDir, ".npmrc"), "node-linker=hoisted"),
                    (0, packTester_1.modifyPackageJson)(projectDir, data => {
                        data.devDependencies = {
                            electron: testConfig_1.ELECTRON_VERSION,
                        };
                        data.dependencies = {
                            ...data.dependencies,
                            "@electron/remote": "^2.1.2", // for debugging live application with GUI so that app.getVersion is accessible in renderer process
                            "electron-updater": `file:${__dirname}/../../../packages/electron-updater`,
                        };
                        data.pnpm = {
                            overrides: {
                                "builder-util-runtime": `file:${__dirname}/../../../packages/builder-util-runtime`,
                            },
                        };
                    }, true),
                    (0, packTester_1.modifyPackageJson)(projectDir, data => {
                        data.devDependencies = {
                            electron: testConfig_1.ELECTRON_VERSION,
                        };
                        data.dependencies = {
                            ...data.dependencies,
                            "@electron/remote": "^2.1.2", // for debugging live application with GUI so that app.getVersion is accessible in renderer process
                            "electron-updater": `file:${__dirname}/../../../packages/electron-updater`,
                        };
                        data.pnpm = {
                            overrides: {
                                "builder-util-runtime": `file:${__dirname}/../../../packages/builder-util-runtime`,
                            },
                        };
                    }, false),
                ]);
                (0, child_process_1.execSync)("npm install", { cwd: projectDir, stdio: "inherit" });
            },
        });
    }
    const build = (version) => buildApp(version, targets, extraConfig, async (context) => {
        // move dist temporarily out of project dir so each downloader can reference it
        const dir = await tmpDir.getTempDir({ prefix: version });
        await fs_extra_1.default.move(context.outDir, dir);
        const appPath = path_1.default.join(dir, path_1.default.relative(context.outDir, context.getAppPath(electron_builder_1.Platform.current(), (0, util_1.archFromString)(process.arch))));
        outDirs.push({ dir, appPath });
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
async function handleInitialInstallPerOS({ target, dirPath, arch }) {
    let appPath;
    if (target === "AppImage") {
        appPath = path_1.default.join(dirPath, `TestApp.AppImage`);
    }
    else if (target === "deb") {
        electron_updater_1.DebUpdater.installWithCommandRunner("dpkg", path_1.default.join(dirPath, `TestApp.deb`), commandWithArgs => {
            (0, child_process_1.execSync)(commandWithArgs.join(" "), { stdio: "inherit" });
        }, console);
        appPath = path_1.default.join("/opt", "TestApp", "TestApp");
    }
    else if (target === "rpm") {
        electron_updater_1.RpmUpdater.installWithCommandRunner("zypper", path_1.default.join(dirPath, `TestApp.rpm`), commandWithArgs => {
            (0, child_process_1.execSync)(commandWithArgs.join(" "), { stdio: "inherit" });
        }, console);
        appPath = path_1.default.join("/opt", "TestApp", "TestApp");
    }
    else if (target === "pacman") {
        electron_updater_1.PacmanUpdater.installWithCommandRunner(path_1.default.join(dirPath, `TestApp.pacman`), commandWithArgs => {
            (0, child_process_1.execSync)(commandWithArgs.join(" "), { stdio: "inherit" });
        }, console);
        // execSync(`sudo pacman -Syyu --noconfirm`, { stdio: "inherit" })
        // execSync(`sudo pacman -U --noconfirm "${path.join(dirPath, `TestApp.pacman`)}"`, { stdio: "inherit" })
        appPath = path_1.default.join("/opt", "TestApp", "TestApp");
    }
    else if (process.platform === "win32") {
        // access installed app's location
        const localProgramsPath = path_1.default.join(process.env.LOCALAPPDATA || path_1.default.join((0, os_1.homedir)(), "AppData", "Local"), "Programs", "TestApp");
        // this is to clear dev environment when not running on an ephemeral GH runner.
        // Reinstallation will otherwise fail due to "uninstall" message prompt, so we must uninstall first (hence the setTimeout delay)
        const uninstaller = path_1.default.join(localProgramsPath, "Uninstall TestApp.exe");
        if ((0, fs_extra_1.existsSync)(uninstaller)) {
            console.log("Uninstalling", uninstaller);
            (0, child_process_1.execFileSync)(uninstaller, ["/S", "/C", "exit"], { stdio: "inherit" });
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        const installerPath = path_1.default.join(dirPath, "TestApp Setup.exe");
        console.log("Installing windows", installerPath);
        // Don't use /S for silent install as we lose stdout pipe
        (0, child_process_1.execFileSync)(installerPath, ["/S"], { stdio: "inherit" });
        appPath = path_1.default.join(localProgramsPath, "TestApp.exe");
    }
    else if (process.platform === "darwin") {
        appPath = path_1.default.join(dirPath, `mac${(0, util_1.getArchSuffix)(arch)}`, `TestApp.app`, "Contents", "MacOS", "TestApp");
    }
    else {
        throw new Error(`Unsupported Update test target: ${target}`);
    }
    return appPath;
}
async function handleCleanupPerOS({ target }) {
    // TODO: ignore for now, this doesn't block CI, but proper uninstall logic should be implemented
    if (target === "deb") {
        //   execSync("dpkg -r testapp", { stdio: "inherit" });
    }
    else if (target === "rpm") {
        // execSync(`zypper rm -y testapp`, { stdio: "inherit" })
    }
    else if (target === "pacman") {
        (0, child_process_1.execSync)(`pacman -R --noconfirm testapp`, { stdio: "inherit" });
    }
    else if (process.platform === "win32") {
        // access installed app's location
        const localProgramsPath = path_1.default.join(process.env.LOCALAPPDATA || path_1.default.join((0, os_1.homedir)(), "AppData", "Local"), "Programs", "TestApp");
        const uninstaller = path_1.default.join(localProgramsPath, "Uninstall TestApp.exe");
        console.log("Uninstalling", uninstaller);
        (0, child_process_1.execFileSync)(uninstaller, ["/S", "/C", "exit"], { stdio: "inherit" });
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    else if (process.platform === "darwin") {
        // ignore, nothing to uninstall, it's running/updating out of the local `dist` directory
    }
}
async function runTestWithinServer(doTest) {
    const tmpDir = new util_1.TmpDir("blackbox-update-test");
    const root = await tmpDir.createTempDir({ prefix: "server-root" });
    // 65535 is the max port number
    // Math.random() / Math.random() is used to avoid zero
    // Math.floor(((Math.random() / Math.random()) * 1000) % 65535) is used to avoid port number collision
    const port = 8000 + Math.floor(((Math.random() / Math.random()) * 1000) % 65535);
    const serverBin = await (0, binDownload_1.getBinFromUrl)("ran-0.1.3", "ran-0.1.3.7z", "imfA3LtT6umMM0BuQ29MgO3CJ9uleN5zRBi3sXzcTbMOeYZ6SQeN7eKr3kXZikKnVOIwbH+DDO43wkiR/qTdkg==");
    const httpServerProcess = (0, util_1.doSpawn)(path_1.default.join(serverBin, process.platform, "ran"), [`-root=${root}`, `-port=${port}`, "-gzip=false", "-listdir=true"]);
    const updateConfig = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: `http://127.0.0.1:${port}`,
    });
    const cleanup = () => {
        try {
            tmpDir.cleanupSync();
        }
        catch (error) {
            console.error("Failed to cleanup tmpDir", error);
        }
        try {
            httpServerProcess.kill();
        }
        catch (error) {
            console.error("Failed to kill httpServerProcess", error);
        }
    };
    return await new Promise((resolve, reject) => {
        httpServerProcess.on("error", reject);
        doTest(root, updateConfig).then(resolve).catch(reject);
    }).then(v => {
        cleanup();
        return v;
    }, e => {
        cleanup();
        throw e;
    });
}
//# sourceMappingURL=blackboxUpdateTest.js.map
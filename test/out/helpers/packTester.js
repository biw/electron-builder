"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execShell = exports.snapTarget = exports.linuxDirTarget = exports.EXTENDED_TIMEOUT = void 0;
exports.getPackageManagerWithVersion = getPackageManagerWithVersion;
exports.appThrows = appThrows;
exports.appTwoThrows = appTwoThrows;
exports.app = app;
exports.appTwo = appTwo;
exports.assertPack = assertPack;
exports.copyTestAsset = copyTestAsset;
exports.getFixtureDir = getFixtureDir;
exports.getTarExecutable = getTarExecutable;
exports.parseFileList = parseFileList;
exports.packageJson = packageJson;
exports.modifyPackageJson = modifyPackageJson;
exports.platform = platform;
exports.signed = signed;
exports.createMacTargetTest = createMacTargetTest;
exports.checkDirContents = checkDirContents;
exports.removeUnstableProperties = removeUnstableProperties;
exports.verifyAsarFileTree = verifyAsarFileTree;
exports.toSystemIndependentPath = toSystemIndependentPath;
const app_builder_lib_1 = require("app-builder-lib");
const asar_1 = require("app-builder-lib/out/asar/asar");
const targetFactory_1 = require("app-builder-lib/out/targets/targetFactory");
const tools_1 = require("app-builder-lib/out/targets/tools");
const plist_1 = require("app-builder-lib/out/util/plist");
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_builder_1 = require("electron-builder");
const electron_winstaller_1 = require("electron-winstaller");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const js_yaml_1 = require("js-yaml");
const path = require("path");
const path_sort_1 = require("path-sort");
const resedit_1 = require("resedit");
const temp_file_1 = require("temp-file");
const node_module_collector_1 = require("app-builder-lib/out/node-module-collector");
const util_1 = require("util");
const codeSignData_1 = require("./codeSignData");
const fileAssert_1 = require("./fileAssert");
const adm_zip_1 = require("adm-zip");
// @ts-ignore
const sanitize_filename_1 = require("sanitize-filename");
const config_1 = require("app-builder-lib/out/util/config/config");
const yarn_1 = require("app-builder-lib/out/util/yarn");
const testConfig_1 = require("./testConfig");
const packageDependencies_1 = require("app-builder-lib/out/util/packageDependencies");
const child_process_1 = require("child_process");
const packageManager_1 = require("app-builder-lib/out/node-module-collector/packageManager");
const PACKAGE_MANAGER_VERSION_MAP = {
    [node_module_collector_1.PM.NPM]: { cli: "npm", version: "9.8.1" },
    [node_module_collector_1.PM.YARN]: { cli: "yarn", version: "1.22.19" },
    [node_module_collector_1.PM.YARN_BERRY]: { cli: "yarn", version: "3.5.0" },
    [node_module_collector_1.PM.PNPM]: { cli: "pnpm", version: "10.18.0" },
    [node_module_collector_1.PM.BUN]: { cli: "bun", version: "1.3.2" },
};
function getPackageManagerWithVersion(pm, packageManagerAndVersionString) {
    const packageManagerInfo = PACKAGE_MANAGER_VERSION_MAP[pm];
    const prepare = packageManagerAndVersionString == null ? `${packageManagerInfo.cli}@${packageManagerInfo.version}` : packageManagerAndVersionString;
    return {
        cli: packageManagerInfo.cli,
        version: packageManagerInfo.version,
        prepareEntry: prepare,
    };
}
exports.EXTENDED_TIMEOUT = 14 * 60 * 1000;
exports.linuxDirTarget = electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64);
exports.snapTarget = electron_builder_1.Platform.LINUX.createTarget("snap", electron_builder_1.Arch.x64);
function appThrows(expect, packagerOptions, checkOptions = {}, customErrorAssert) {
    return (0, fileAssert_1.assertThat)(expect, assertPack(expect, "test-app-one", packagerOptions, checkOptions)).throws(customErrorAssert);
}
function appTwoThrows(expect, packagerOptions, checkOptions = {}, customErrorAssert) {
    return (0, fileAssert_1.assertThat)(expect, assertPack(expect, "test-app", packagerOptions, checkOptions)).throws(customErrorAssert);
}
function app(expect, packagerOptions, checkOptions = {}) {
    return assertPack(expect, packagerOptions.config != null && packagerOptions.config.protonNodeVersion != null ? "proton" : "test-app-one", packagerOptions, checkOptions);
}
function appTwo(expect, packagerOptions, checkOptions = {}) {
    return assertPack(expect, "test-app", packagerOptions, checkOptions);
}
async function assertPack(expect, fixtureName, packagerOptions, checkOptions = {}) {
    let configuration = packagerOptions.config;
    if (configuration == null) {
        configuration = {};
        packagerOptions.config = configuration;
    }
    if (checkOptions.signed) {
        packagerOptions = signed(packagerOptions);
    }
    if (checkOptions.signedWin) {
        configuration.cscLink = codeSignData_1.WIN_CSC_LINK;
        configuration.cscKeyPassword = "";
    }
    else if (configuration.cscLink == null) {
        packagerOptions = (0, builder_util_1.deepAssign)({}, packagerOptions, { config: { mac: { identity: null } } });
    }
    let projectDir = path.join(__dirname, "..", "..", "fixtures", fixtureName);
    // const isDoNotUseTempDir = platform === "darwin"
    const customTmpDir = process.env.TEST_APP_TMP_DIR;
    const tmpDir = checkOptions.tmpDir || new temp_file_1.TmpDir(`pack-tester: ${fixtureName}`);
    // non-macOS test uses the same dir as macOS test, but we cannot share node_modules (because tests executed in parallel)
    const dir = customTmpDir == null ? await tmpDir.createTempDir({ prefix: "test-project" }) : path.resolve(customTmpDir);
    if (customTmpDir != null) {
        await (0, fs_extra_1.emptyDir)(dir);
        builder_util_1.log.info({ customTmpDir }, "custom temp dir used");
    }
    const state = expect.getState();
    const lockfileFixtureName = `${path.basename(state.testPath, ".ts")}`;
    const lockfilePathPrefix = path.join(__dirname, "..", "..", "fixtures", "lockfiles", lockfileFixtureName);
    const testFixtureLockfile = path.join(lockfilePathPrefix, `${(0, sanitize_filename_1.default)(state.currentTestName)}.txt`);
    await (0, builder_util_1.copyDir)(projectDir, dir, {
        filter: it => {
            const basename = path.basename(it);
            // if custom project dir specified, copy node_modules (i.e. do not ignore it)
            return (packagerOptions.projectDir != null || basename !== "node_modules") && (!basename.startsWith(".") || basename === ".babelrc");
        },
        isUseHardLink: builder_util_1.USE_HARD_LINKS, // TODO: consider use hard links for tests
    });
    projectDir = dir;
    await (0, builder_util_1.executeFinally)((async () => {
        var _a;
        const packageManagerOverride = checkOptions.packageManager;
        await modifyPackageJson(projectDir, data => {
            if (data.packageManager == null || packageManagerOverride) {
                data.packageManager = getPackageManagerWithVersion(packageManagerOverride || node_module_collector_1.PM.NPM).prepareEntry;
            }
        });
        const postNodeModulesInstallHook = checkOptions.projectDirCreated ? await checkOptions.projectDirCreated(projectDir, tmpDir) : null;
        // Check again. Package manager could have been changed in package.json during `projectDirCreated`
        const { pm, corepackConfig: packageManager } = await (0, packageManager_1.detectPackageManager)([projectDir]);
        const tmpCache = await tmpDir.createTempDir({ prefix: "cache-" });
        const tmpHome = await tmpDir.createTempDir({ prefix: "home-" });
        const runtimeEnv = {
            ...process.env,
            // corepack
            // COREPACK_HOME,
            // COREPACK_ENABLE_DOWNLOADS: "1",
            // yarn
            HOME: tmpHome,
            USERPROFILE: tmpHome, // for Windows compatibility
            YARN_CACHE_FOLDER: tmpCache,
            // YARN_DISABLE_TELEMETRY: "1",
            // YARN_ENABLE_TELEMETRY: "false",
            YARN_IGNORE_PATH: "1", // ignore globally installed yarn binaries
            YARN_ENABLE_IMMUTABLE_INSTALLS: "false", // to be sure that --frozen-lockfile is not used
            // YARN_NODE_LINKER: "node-modules", // force to not use pnp (as there's no way to access virtual packages within the paths returned by pnpm)
            npm_config_cache: tmpCache, // prevent npm fallback caching
        };
        const { cli, prepareEntry, version } = getPackageManagerWithVersion(pm, packageManager);
        if (pm === node_module_collector_1.PM.BUN) {
            builder_util_1.log.info({ pm, version: version, projectDir }, "installing dependencies with bun; corepack does not support it currently and it must be installed separately");
        }
        else if (pm === node_module_collector_1.PM.NPM) {
            // npm is already installed as part of Node.js, so we just need to prepare the specific version
            // Skip `corepack enable npm` to avoid race conditions in parallel tests (EEXIST errors)
            builder_util_1.log.info({ pm, version: version, projectDir }, "preparing npm version via corepack");
            try {
                (0, child_process_1.execSync)(`corepack prepare ${prepareEntry} --activate`, { env: runtimeEnv, cwd: projectDir, stdio: "inherit" });
            }
            catch (err) {
                console.warn("⚠️ Corepack prepare npm failed:", err.message);
            }
        }
        else {
            builder_util_1.log.info({ pm, version: version, projectDir }, "activating corepack");
            try {
                (0, child_process_1.execSync)(`corepack enable ${cli}`, { env: runtimeEnv, cwd: projectDir, stdio: "inherit" });
            }
            catch (err) {
                console.warn("⚠️ Corepack enable failed (possibly already enabled):", err.message);
            }
            try {
                (0, child_process_1.execSync)(`corepack prepare ${prepareEntry} --activate`, { env: runtimeEnv, cwd: projectDir, stdio: "inherit" });
            }
            catch (err) {
                console.warn("⚠️ Corepack prepare failed:", err.message);
            }
        }
        const collector = (0, node_module_collector_1.getCollectorByPackageManager)(pm, projectDir, tmpDir);
        const collectorOptions = collector.installOptions;
        const destLockfile = path.join(projectDir, collectorOptions.lockfile);
        const shouldUpdateLockfiles = !!process.env.UPDATE_LOCKFILE_FIXTURES && !!checkOptions.storeDepsLockfileSnapshot;
        // check for lockfile fixture so we can use `--frozen-lockfile`
        if ((await (0, builder_util_1.exists)(testFixtureLockfile)) && !shouldUpdateLockfiles) {
            await (0, fs_extra_1.copyFile)(testFixtureLockfile, destLockfile);
        }
        const appDir = await (0, config_1.computeDefaultAppDirectory)(projectDir, (_a = configuration.directories) === null || _a === void 0 ? void 0 : _a.app);
        await (0, yarn_1.installDependencies)(configuration, {
            projectDir: projectDir,
            appDir: appDir,
            workspaceRoot: null,
        }, {
            frameworkInfo: { version: testConfig_1.ELECTRON_VERSION, useCustomDist: false },
            productionDeps: (0, packageDependencies_1.createLazyProductionDeps)(appDir, null, false),
        }, runtimeEnv);
        if (typeof postNodeModulesInstallHook === "function") {
            await postNodeModulesInstallHook();
        }
        // save lockfile fixture
        if (!(await (0, builder_util_1.exists)(testFixtureLockfile)) && shouldUpdateLockfiles) {
            const fixtureDir = path.dirname(testFixtureLockfile);
            if (!(await (0, builder_util_1.exists)(fixtureDir))) {
                await (0, fs_extra_1.mkdir)(fixtureDir);
            }
            await (0, fs_extra_1.copyFile)(destLockfile, testFixtureLockfile);
        }
        if (packagerOptions.projectDir != null) {
            packagerOptions.projectDir = path.resolve(projectDir, packagerOptions.projectDir);
        }
        const { packager, outDir } = await packAndCheck(expect, {
            projectDir,
            ...packagerOptions,
        }, checkOptions, runtimeEnv);
        if (checkOptions.packed != null) {
            const getAppPath = function (platform, arch) {
                return path.join(outDir, `${platform.buildConfigurationKey}${(0, electron_builder_1.getArchSuffix)(arch !== null && arch !== void 0 ? arch : electron_builder_1.Arch.x64)}${platform === electron_builder_1.Platform.MAC ? "" : "-unpacked"}`);
            };
            const getContent = (platform, arch) => {
                return path.join(getAppPath(platform, arch), platform === electron_builder_1.Platform.MAC ? `${packager.appInfo.productFilename}.app/Contents` : "");
            };
            const getResources = (platform, arch) => {
                return path.join(getContent(platform, arch), platform === electron_builder_1.Platform.MAC ? "Resources" : "resources");
            };
            await checkOptions.packed({
                projectDir,
                outDir,
                getAppPath,
                getResources,
                getContent,
                packager,
                tmpDir,
            });
        }
    })(), () => (tmpDir === checkOptions.tmpDir ? null : tmpDir.cleanup()));
}
const fileCopier = new builder_util_1.FileCopier();
function copyTestAsset(name, destination) {
    return fileCopier.copy(path.join(getFixtureDir(), name), destination, undefined);
}
function getFixtureDir() {
    return path.join(__dirname, "..", "..", "fixtures");
}
/**
 * Determines the priority of a file based on its extension for sorting.
 * Lower numbers have higher priority in the sort order.
 */
function getFileTypePriority(file) {
    const ordering = [
        // Primary executables and installers
        ".dmg",
        ".exe",
        ".msi",
        ".pkg",
        ".deb",
        ".rpm",
        ".AppImage",
        ".appx",
        ".snap",
        ".flatpak",
        // Archive formats
        ".zip",
        ".7z",
        ".tar.gz",
        ".tar.xz",
        ".tar.bz2",
        // Package formats
        ".nupkg",
        ".asar",
        // Metadata and auxiliary files
        ".blockmap",
        ".yml",
        ".yaml",
    ];
    const index = ordering.findIndex(ext => file.endsWith(ext));
    // If found, return the index (0-based), otherwise return highest value for "other files"
    return index === -1 ? ordering.length : index;
}
/**
 * Sorts artifacts in a deterministic order for consistent test snapshots.
 * Sort order:
 * 1. Primary: File type (by extension priority)
 * 2. Secondary: Architecture (ia32 < x64 < armv7l < arm64 < universal)
 * 3. Tertiary: Filename (alphabetical)
 * 4. Quaternary: Presence of updateInfo (with updateInfo < without updateInfo)
 * 5. Quinary: Safe artifact name (alphabetical)
 */
function sortArtifacts(a, b) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // Primary sort: by file extension type
    const fileA = (_a = a.file) !== null && _a !== void 0 ? _a : "";
    const fileB = (_b = b.file) !== null && _b !== void 0 ? _b : "";
    const typePriorityA = getFileTypePriority(fileA);
    const typePriorityB = getFileTypePriority(fileB);
    if (typePriorityA !== typePriorityB) {
        return typePriorityA - typePriorityB;
    }
    // Secondary sort: by architecture
    const archSortKey = ((_d = (_c = a.arch) === null || _c === void 0 ? void 0 : _c.valueOf()) !== null && _d !== void 0 ? _d : 0) - ((_f = (_e = b.arch) === null || _e === void 0 ? void 0 : _e.valueOf()) !== null && _f !== void 0 ? _f : 0);
    if (archSortKey !== 0) {
        return archSortKey;
    }
    // Tertiary sort: by filename
    const baseNameA = path.basename(fileA);
    const baseNameB = path.basename(fileB);
    const fileNameCompare = baseNameA.localeCompare(baseNameB, "en");
    if (fileNameCompare !== 0) {
        return fileNameCompare;
    }
    // Quaternary sort: by presence of updateInfo (with updateInfo comes first)
    const hasUpdateInfoA = a.updateInfo ? 0 : 1;
    const hasUpdateInfoB = b.updateInfo ? 0 : 1;
    if (hasUpdateInfoA !== hasUpdateInfoB) {
        return hasUpdateInfoA - hasUpdateInfoB;
    }
    // Quinary sort: by safeArtifactName (final tiebreaker)
    const safeNameA = (_g = a.safeArtifactName) !== null && _g !== void 0 ? _g : "";
    const safeNameB = (_h = b.safeArtifactName) !== null && _h !== void 0 ? _h : "";
    return safeNameA.localeCompare(safeNameB, "en");
}
async function packAndCheck(expect, packagerOptions, checkOptions, runtimeEnv) {
    const cancellationToken = new builder_util_runtime_1.CancellationToken();
    const packager = new electron_builder_1.Packager(packagerOptions, cancellationToken);
    packager.runtimeEnvironmentVariables = runtimeEnv;
    const publishManager = new app_builder_lib_1.PublishManager(packager, { publish: "publish" in checkOptions ? checkOptions.publish : "never" });
    const artifacts = new Map();
    packager.onArtifactCreated(event => {
        if (event.file == null) {
            return;
        }
        (0, fileAssert_1.assertThat)(expect, event.file).isAbsolute();
        (0, builder_util_1.addValue)(artifacts, event.packager.platform, event);
    });
    const { outDir, platformToTargets } = await packager.build();
    await publishManager.awaitTasks();
    if (packagerOptions.platformPackagerFactory != null) {
        return { packager, outDir };
    }
    const objectToCompare = {};
    for (const platform of packagerOptions.targets.keys()) {
        objectToCompare[platform.buildConfigurationKey] = await Promise.all((artifacts.get(platform) || []).sort(sortArtifacts).map(async (it) => {
            const result = { ...it };
            const file = result.file;
            if (file != null) {
                if (file.endsWith(".yml")) {
                    result.fileContent = removeUnstableProperties((0, js_yaml_1.load)(await fs.readFile(file, "utf-8")));
                }
                result.file = path.basename(file);
            }
            const updateInfo = result.updateInfo;
            if (updateInfo != null) {
                result.updateInfo = removeUnstableProperties(updateInfo);
            }
            if (updateInfo == null) {
                delete result.updateInfo;
            }
            // reduce snapshot - avoid noise
            if (result.safeArtifactName == null) {
                delete result.safeArtifactName;
            }
            if (result.arch == null) {
                delete result.arch;
            }
            else {
                result.arch = electron_builder_1.Arch[result.arch];
            }
            if (result.fileContent) {
                if (Buffer.isBuffer(result.fileContent)) {
                    delete result.fileContent;
                }
                else if (Array.isArray(result.fileContent.files)) {
                    result.fileContent.files = result.fileContent.files.sort((a, b) => a.url.localeCompare(b.url, "en"));
                }
            }
            delete result.isWriteUpdateInfo;
            delete result.packager;
            delete result.target;
            delete result.publishConfig;
            return result;
        }));
    }
    expect(objectToCompare).toMatchSnapshot();
    c: for (const [platform, archToType] of packagerOptions.targets) {
        for (const [arch, targets] of (0, targetFactory_1.computeArchToTargetNamesMap)(archToType, { platformSpecificBuildOptions: packagerOptions[platform.buildConfigurationKey] || {}, defaultTarget: [] }, platform)) {
            if (targets.length === 1 && targets[0] === electron_builder_1.DIR_TARGET) {
                continue c;
            }
            const nameToTarget = platformToTargets.get(platform);
            if (platform === electron_builder_1.Platform.MAC) {
                const subDir = nameToTarget.has("mas-dev") ? "mas-dev" : nameToTarget.has("mas") ? "mas" : "mac";
                const packedAppDir = path.join(outDir, `${subDir}${(0, electron_builder_1.getArchSuffix)(arch)}`, `${packager.appInfo.productFilename}.app`);
                await checkMacResult(expect, packager, packagerOptions, checkOptions, packedAppDir);
            }
            else if (platform === electron_builder_1.Platform.LINUX) {
                await checkLinuxResult(expect, outDir, packager, arch, nameToTarget);
            }
            else if (platform === electron_builder_1.Platform.WINDOWS) {
                await checkWindowsResult(expect, packager, checkOptions, artifacts.get(platform), nameToTarget);
            }
        }
    }
    return { packager, outDir };
}
async function checkLinuxResult(expect, outDir, packager, arch, nameToTarget) {
    if (!nameToTarget.has("deb")) {
        return;
    }
    const appInfo = packager.appInfo;
    const autoFindPackagePath = await fs.readdir(outDir).then(files => files.find(file => file.endsWith(".deb")));
    const defaultPackageFile = `${outDir}/${appInfo.name}_${appInfo.version}_${arch === electron_builder_1.Arch.ia32 ? "i386" : arch === electron_builder_1.Arch.x64 ? "amd64" : "armv7l"}.deb`;
    const packagePath = autoFindPackagePath != null ? path.join(outDir, autoFindPackagePath) : defaultPackageFile;
    expect(await getContents(packagePath)).toMatchSnapshot();
    if (arch === electron_builder_1.Arch.ia32) {
        expect(await getContents(`${outDir}/${appInfo.name}_${appInfo.version}_i386.deb`)).toMatchSnapshot();
    }
    const control = parseDebControl((await (0, exports.execShell)(`ar p '${packagePath}' control.tar.xz | ${await getTarExecutable()} -Jx --to-stdout ./control`, {
        maxBuffer: 10 * 1024 * 1024,
    })).stdout);
    delete control.Version;
    delete control.Size;
    const description = control.Description;
    delete control.Description;
    expect(control).toMatchSnapshot();
    // strange difference on linux and mac (no leading space on Linux)
    expect(description.trim()).toMatchSnapshot();
}
function parseDebControl(info) {
    const regexp = /([\w]+): *(.+\n)([^:\n]+\n)?/g;
    let match;
    const metadata = {};
    info = info.substring(info.indexOf("Package:"));
    while ((match = regexp.exec(info)) !== null) {
        let value = match[2];
        if (match[3] != null) {
            value += match[3];
        }
        if (value[value.length - 1] === "\n") {
            value = value.substring(0, value.length - 1);
        }
        metadata[match[1]] = value;
    }
    return metadata;
}
async function checkMacResult(expect, packager, packagerOptions, checkOptions, packedAppDir) {
    const appInfo = packager.appInfo;
    const plistPath = path.join(packedAppDir, "Contents", "Info.plist");
    const info = await (0, plist_1.parsePlistFile)(plistPath);
    const buildNumber = process.env.TRAVIS_BUILD_NUMBER || process.env.CIRCLE_BUILD_NUM;
    expect(info).toMatchObject({
        CFBundleVersion: info.CFBundleVersion === "50" ? "50" : `${appInfo.version}${buildNumber ? "." + buildNumber : ""}`,
    });
    // checked manually, remove to avoid mismatch on CI server (where TRAVIS_BUILD_NUMBER is defined and different on each test run)
    delete info.CFBundleVersion;
    delete info.BuildMachineOSBuild;
    delete info.NSHumanReadableCopyright;
    delete info.DTXcode;
    delete info.DTXcodeBuild;
    delete info.DTSDKBuild;
    delete info.DTSDKName;
    delete info.DTCompiler;
    delete info.ElectronTeamID;
    delete info.NSMainNibFile;
    delete info.NSCameraUsageDescription;
    delete info.NSMicrophoneUsageDescription;
    delete info.NSRequiresAquaSystemAppearance;
    delete info.NSQuitAlwaysKeepsWindows;
    if (info.NSAppTransportSecurity != null) {
        delete info.NSAppTransportSecurity.NSAllowsArbitraryLoads;
    }
    // test value
    if (info.LSMinimumSystemVersion !== "10.12.0") {
        delete info.LSMinimumSystemVersion;
    }
    const { ElectronAsarIntegrity: checksumData, ...snapshot } = info;
    if (checksumData != null) {
        for (const name of Object.keys(checksumData)) {
            ;
            checksumData[name] = { algorithm: "SHA256", hash: "hash" };
        }
        snapshot.ElectronAsarIntegrity = checksumData;
    }
    expect(snapshot).toMatchSnapshot();
    if (checkOptions.checkMacApp != null) {
        await checkOptions.checkMacApp(packedAppDir, snapshot);
    }
    if (packagerOptions.config != null && packagerOptions.config.cscLink != null) {
        const result = await (0, builder_util_1.exec)("codesign", ["--verify", packedAppDir]);
        expect(result).not.toMatch(/is not signed at all/);
    }
}
async function checkWindowsResult(expect, packager, checkOptions, artifacts, nameToTarget) {
    function checkSquirrelResult() {
        const appInfo = packager.appInfo;
        const { zip } = checkResult(expect, artifacts, "-full.nupkg");
        if (checkOptions == null) {
            const expectedSpec = zip.readAsText("TestApp.nuspec").replace(/\r\n/g, "\n");
            // console.log(expectedSpec)
            expect(expectedSpec).toEqual(`<?xml version="1.0"?>
<package xmlns="http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd">
  <metadata>
    <id>TestApp</id>
    <version>${(0, electron_winstaller_1.convertVersion)(appInfo.version)}</version>
    <title>${appInfo.productName}</title>
    <authors>Foo Bar</authors>
    <owners>Foo Bar</owners>
    <iconUrl>https://raw.githubusercontent.com/szwacz/electron-boilerplate/master/resources/windows/icon.ico</iconUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>Test Application (test quite “ #378)</description>
    <copyright>Copyright © ${new Date().getFullYear()} Foo Bar</copyright>
    <projectUrl>http://foo.example.com</projectUrl>
  </metadata>
</package>`);
        }
    }
    async function checkZipResult() {
        const { packageFile, zip, allFiles } = checkResult(expect, artifacts, ".zip");
        const executable = allFiles.filter(it => it.endsWith(".exe"))[0];
        zip.extractEntryTo(executable, path.dirname(packageFile), true, true);
        const buffer = await fs.readFile(path.join(path.dirname(packageFile), executable));
        const resource = resedit_1.NtExecutableResource.from(resedit_1.NtExecutable.from(buffer));
        const integrityBuffer = resource.entries.find(entry => entry.type === "INTEGRITY");
        const asarIntegrity = new Uint8Array(integrityBuffer.bin);
        const decoder = new TextDecoder("utf-8");
        const checksumData = decoder.decode(asarIntegrity);
        const checksums = JSON.parse(checksumData).map((data) => ({ ...data, alg: "SHA256", value: "hash" }));
        expect(checksums).toMatchSnapshot();
    }
    const hasTarget = (target) => {
        const targets = nameToTarget.get(target);
        return targets != null;
    };
    if (hasTarget("squirrel")) {
        return checkSquirrelResult();
    }
    else if (hasTarget("zip") && !(checkOptions.signed || checkOptions.signedWin)) {
        return checkZipResult();
    }
}
const checkResult = (expect, artifacts, extension) => {
    const packageFile = artifacts.find(it => it.file.endsWith(extension)).file;
    const zip = new adm_zip_1.default(packageFile);
    const zipEntries = zip.getEntries();
    const allFiles = [];
    // https://github.com/thejoshwolfe/yauzl/blob/master/index.js#L900
    const cp437 = "\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
    const decodeBuffer = (buffer, isUtf8) => {
        if (isUtf8) {
            return buffer.toString("utf8");
        }
        else {
            let result = "";
            for (let i = 0; i < buffer.length; i++) {
                result += cp437[buffer[i]];
            }
            return result;
        }
    };
    zipEntries.forEach(function (zipEntry) {
        const isUtf8 = (zipEntry.header.flags & 0x800) !== 0;
        const name = decodeBuffer(zipEntry.rawEntryName, isUtf8);
        allFiles.push(name);
    });
    // we test app-update.yml separately, don't want to complicate general assert (yes, it is not good that we write app-update.yml for squirrel.windows if we build nsis and squirrel.windows in parallel, but as squirrel.windows is deprecated, it is ok)
    const files = (0, path_sort_1.default)(allFiles
        .map(it => toSystemIndependentPath(it))
        .filter(it => (!it.startsWith("lib/net45/locales/") || it === "lib/net45/locales/en-US.pak") && !it.endsWith(".psmdcp") && !it.endsWith("app-update.yml") && !it.includes("/inspector/")));
    expect(files).toMatchSnapshot();
    return { packageFile, zip, allFiles };
};
exports.execShell = (0, util_1.promisify)(require("child_process").exec);
async function getTarExecutable() {
    return process.platform === "darwin" ? path.join(await (0, tools_1.getLinuxToolsPath)(), "bin", "gtar") : "tar";
}
async function getContents(packageFile) {
    const result = await (0, exports.execShell)(`ar p '${packageFile}' data.tar.xz | ${await getTarExecutable()} -tJ`, {
        maxBuffer: 10 * 1024 * 1024,
        env: {
            ...process.env,
        },
    });
    const contents = parseFileList(result.stdout, true);
    return (0, path_sort_1.default)(contents.filter(it => !(it.includes(`/locales/`) || it.includes(`/libgcrypt`) || it.includes("/inspector/"))));
}
function parseFileList(data, fromDpkg) {
    return data
        .split("\n")
        .map(it => (it.length === 0 ? null : fromDpkg ? it.substring(it.indexOf(".") + 1) : it.startsWith("./") ? it.substring(2) : it === "." ? null : it))
        .filter(it => it != null && it.length > 0);
}
function packageJson(task, isApp = false) {
    return (projectDir) => modifyPackageJson(projectDir, task, isApp);
}
async function modifyPackageJson(projectDir, task, isApp = false) {
    const file = isApp ? path.join(projectDir, "app", "package.json") : path.join(projectDir, "package.json");
    const data = await fs.readFile(file, "utf-8").then(it => JSON.parse(it));
    task(data);
    // because copied as hard link
    await fs.unlink(file);
    await fs.writeFile(path.join(projectDir, ".yarnrc.yml"), "nodeLinker: node-modules");
    return await (0, fs_extra_1.writeJson)(file, data, { spaces: 2 });
}
function platform(platform) {
    return {
        targets: platform.createTarget(),
    };
}
function signed(packagerOptions) {
    if (process.env.CSC_KEY_PASSWORD == null) {
        builder_util_1.log.warn({ reason: "CSC_KEY_PASSWORD is not defined" }, "macOS code signing is not tested");
    }
    else {
        if (packagerOptions.config == null) {
            ;
            packagerOptions.config = {};
        }
        ;
        packagerOptions.config.cscLink = codeSignData_1.CSC_LINK;
    }
    return packagerOptions;
}
function createMacTargetTest(expect, target, config, isSigned = true) {
    return app(expect, {
        targets: electron_builder_1.Platform.MAC.createTarget(target, electron_builder_1.Arch.x64),
        config: {
            extraMetadata: {
                repository: "foo/bar",
            },
            mac: {
                target,
            },
            publish: null,
            ...config,
        },
    }, {
        signed: isSigned,
        packed: async (context) => {
            if (!target.includes("tar.gz")) {
                return;
            }
            const tempDir = await context.tmpDir.createTempDir({ prefix: "mac-target-test" });
            await (0, builder_util_1.exec)("tar", ["xf", path.join(context.outDir, "Test App ßW-1.1.0-mac.tar.gz")], { cwd: tempDir });
            await (0, fileAssert_1.assertThat)(expect, path.join(tempDir, "Test App ßW.app")).isDirectory();
        },
    });
}
async function checkDirContents(expect, dir) {
    expect((await (0, builder_util_1.walk)(dir, file => !path.basename(file).startsWith("."))).map(it => toSystemIndependentPath(it.substring(dir.length + 1)))).toMatchSnapshot();
}
function removeUnstableProperties(data) {
    return JSON.parse(JSON.stringify(data, (name, value) => {
        if (name.includes("size") || name.includes("Size") || name.startsWith("sha") || name === "releaseDate") {
            // to ensure that some property exists
            return `@${name}`;
        }
        // Keep existing test coverage
        if (value.integrity) {
            delete value.integrity;
        }
        return value;
    }));
}
async function verifyAsarFileTree(expect, resourceDir) {
    const fs = await (0, asar_1.readAsar)(path.join(resourceDir, "app.asar"));
    const stableHeader = JSON.parse(JSON.stringify(fs.header, (name, value) => {
        // Keep existing test coverage
        if (value.integrity) {
            delete value.integrity;
        }
        return value;
    }));
    expect(stableHeader).toMatchSnapshot();
}
function toSystemIndependentPath(s) {
    return path.sep === "/" ? s : s.replace(/\\/g, "/");
}
//# sourceMappingURL=packTester.js.map
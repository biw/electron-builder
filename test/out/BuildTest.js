"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const config_1 = require("app-builder-lib/out/util/config/config");
const electron_builder_1 = require("electron-builder");
const builder_1 = require("electron-builder/out/builder");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
const verifySmartUnpack_1 = require("./helpers/verifySmartUnpack");
const packageManager_1 = require("app-builder-lib/src/node-module-collector/packageManager");
test.ifLinux("cli", ({ expect }) => {
    // because these methods are internal
    const { configureBuildCommand, normalizeOptions } = require("electron-builder/out/builder");
    const yargs = (0, builder_1.createYargs)();
    configureBuildCommand(yargs);
    function parse(input) {
        const options = normalizeOptions(yargs.parse(input));
        (0, app_builder_lib_1.checkBuildRequestOptions)(options);
        return options;
    }
    expect(parse("-owl --x64 --ia32"));
    expect(parse("-mwl --x64 --ia32"));
    expect(parse("--dir")).toMatchObject({ targets: electron_builder_1.Platform.current().createTarget(electron_builder_1.DIR_TARGET) });
    expect(parse("--mac --dir")).toMatchSnapshot();
    expect(parse("--x64 --dir")).toMatchObject({ targets: electron_builder_1.Platform.current().createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64) });
    expect(parse("--ia32 --x64")).toMatchObject({ targets: electron_builder_1.Platform.current().createTarget(null, electron_builder_1.Arch.x64, electron_builder_1.Arch.ia32) });
    expect(parse("--linux")).toMatchSnapshot();
    expect(parse("--win")).toMatchSnapshot();
    expect(parse("-owl")).toMatchSnapshot();
    expect(parse("-l tar.gz:ia32")).toMatchSnapshot();
    expect(parse("-l tar.gz:x64")).toMatchSnapshot();
    expect(parse("-l tar.gz")).toMatchSnapshot();
    expect(parse("-w tar.gz:x64")).toMatchSnapshot();
    expect(parse("-p always -w --x64")).toMatchSnapshot();
    expect(parse("--prepackaged someDir -w --x64")).toMatchSnapshot();
    expect(parse("--project someDir -w --x64")).toMatchSnapshot();
    expect(parse("-c.compress=store -c.asar -c ./config.json")).toMatchObject({
        config: {
            asar: true,
            compress: "store",
            extends: "./config.json",
        },
    });
});
test("merge configurations", ({ expect }) => {
    const result = (0, config_1.doMergeConfigs)([
        {
            files: [
                {
                    from: "dist/renderer",
                },
                {
                    from: "dist/renderer-dll",
                },
            ],
        },
        {
            files: [
                {
                    from: ".",
                    filter: ["package.json"],
                },
                {
                    from: "dist/main",
                },
            ],
        },
        {
            files: ["**/*", "!webpack", "!.*", "!config/jsdoc.json", "!package.*"],
        },
        {
            files: [
                {
                    from: ".",
                    filter: ["!docs"],
                },
            ],
        },
        {
            files: ["!private"],
        },
    ]);
    // console.log("data: " + JSON.stringify(result, null, 2))
    expect(result).toMatchObject({
        directories: {
            output: "dist",
            buildResources: "build",
        },
        files: [
            {
                filter: ["package.json", "**/*", "!webpack", "!.*", "!config/jsdoc.json", "!package.*", "!docs", "!private"],
            },
            {
                from: "dist/main",
            },
            {
                from: "dist/renderer",
            },
            {
                from: "dist/renderer-dll",
            },
        ],
    });
});
test("build in the app package.json", ({ expect }) => (0, packTester_1.appTwoThrows)(expect, { targets: packTester_1.linuxDirTarget }, {
    projectDirCreated: it => (0, packTester_1.modifyPackageJson)(it, data => {
        data.build = {
            productName: "bar",
        };
    }, true),
}));
test("relative index", ({ expect }) => (0, packTester_1.appTwo)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.main = "./index.js";
    }, true),
}));
it.ifDevOrLinuxCi("electron version from electron-prebuilt dependency", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            delete data.build.electronVersion;
            data.devDependencies = {};
        });
        return () => (0, fs_extra_1.outputJson)(path.join(projectDir, "node_modules", "electron-prebuilt", "package.json"), {
            version: testConfig_1.ELECTRON_VERSION,
        });
    },
}));
test.ifDevOrLinuxCi("electron version from electron dependency", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            delete data.build.electronVersion;
            data.devDependencies = {};
        });
        return () => (0, fs_extra_1.outputJson)(path.join(projectDir, "node_modules", "electron", "package.json"), {
            version: testConfig_1.ELECTRON_VERSION,
        });
    },
}));
test.ifDevOrLinuxCi("electron version from build", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.devDependencies = {};
        data.build.electronVersion = testConfig_1.ELECTRON_VERSION;
    }),
}));
test("www as default dir", ({ expect }) => (0, packTester_1.appTwo)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
}, {
    projectDirCreated: projectDir => fs_1.promises.rename(path.join(projectDir, "app"), path.join(projectDir, "www")),
}));
test.ifLinuxOrDevMac("hooks as functions", ({ expect }) => {
    let artifactBuildStartedCalled = 0;
    let artifactBuildCompletedCalled = 0;
    let beforePackCalled = 0;
    let afterPackCalled = 0;
    let afterExtractCalled = 0;
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], "zip", "x64"),
        config: {
            artifactBuildStarted: () => {
                artifactBuildStartedCalled++;
            },
            artifactBuildCompleted: () => {
                artifactBuildCompletedCalled++;
            },
            beforePack: () => {
                beforePackCalled++;
                return Promise.resolve();
            },
            afterExtract: () => {
                afterExtractCalled++;
                return Promise.resolve();
            },
            afterPack: () => {
                afterPackCalled++;
                return Promise.resolve();
            },
        },
    }, {
        packed: async () => {
            expect(artifactBuildStartedCalled).toEqual(2);
            expect(artifactBuildCompletedCalled).toEqual(3); // 2 artifacts + blockmap
            expect(beforePackCalled).toEqual(2);
            expect(afterExtractCalled).toEqual(2);
            expect(afterPackCalled).toEqual(2);
            expect(afterPackCalled).toEqual(2);
            return Promise.resolve();
        },
    });
});
test.ifLinuxOrDevMac("hooks as file - cjs", async ({ expect }) => {
    const hookScript = path.join((0, packTester_1.getFixtureDir)(), "build-hook.cjs");
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], "zip", "x64"),
        config: {
            artifactBuildStarted: hookScript,
            artifactBuildCompleted: hookScript,
            beforePack: hookScript,
            afterExtract: hookScript,
            afterPack: hookScript,
        },
    });
});
test.ifLinuxOrDevMac("hooks as file - mjs exported functions", async ({ expect }) => {
    const hookScript = path.join((0, packTester_1.getFixtureDir)(), "build-hook.mjs");
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], "zip", "x64"),
        config: {
            artifactBuildStarted: hookScript,
            artifactBuildCompleted: hookScript,
            beforePack: hookScript,
            afterExtract: hookScript,
            afterPack: hookScript,
        },
    });
});
test.ifWindows("afterSign", ({ expect }) => {
    let called = 0;
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.WINDOWS], electron_builder_1.DIR_TARGET),
        config: {
            afterSign: () => {
                called++;
                return Promise.resolve();
            },
        },
    }, {
        packed: async () => {
            // afterSign is only called when an app is actually signed and ignored otherwise.
            expect(called).toEqual(1);
            return Promise.resolve();
        },
    });
});
test.ifLinuxOrDevMac("beforeBuild", ({ expect }) => {
    let called = 0;
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], electron_builder_1.DIR_TARGET),
        config: {
            npmRebuild: true,
            beforeBuild: async () => {
                called++;
                return Promise.resolve();
            },
        },
    }, {
        packed: async () => {
            expect(called).toEqual(2);
            return Promise.resolve();
        },
    });
});
// https://github.com/electron-userland/electron-builder/issues/1738
test.ifDevOrLinuxCi("win smart unpack", ({ expect }) => {
    // test onNodeModuleFile hook
    const nodeModuleFiles = [];
    let p = "";
    return (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
        config: {
            npmRebuild: true,
            onNodeModuleFile: file => {
                const name = (0, packTester_1.toSystemIndependentPath)(path.relative(p, file));
                if (!name.startsWith(".") && !name.endsWith(".dll") && name.includes(".")) {
                    nodeModuleFiles.push(name);
                }
            },
            win: {
                signAndEditExecutable: false, // setting `true` will fail on arm64 macs, even within docker container since rcedit doesn't work within wine on arm64
            },
        },
    }, {
        projectDirCreated: async (projectDir) => {
            p = projectDir;
            return (0, packTester_1.modifyPackageJson)(projectDir, it => {
                it.dependencies = {
                    debug: "3.1.0",
                    "edge-cs": "1.2.1",
                    "@electron-builder/test-smart-unpack": "1.0.0",
                    "@electron-builder/test-smart-unpack-empty": "1.0.0",
                };
            });
        },
        packed: async (context) => {
            await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(electron_builder_1.Platform.WINDOWS));
            expect(nodeModuleFiles).toMatchSnapshot();
        },
    });
});
test("smart unpack local module with dll file", ({ expect }) => {
    return (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
        config: {
            files: [
                "!foo",
                "!**/NuGet", // for some reason, NuGet only shows up on CI builds, but no Windows VMs or local linux/mac machines
            ],
        },
    }, {
        storeDepsLockfileSnapshot: false,
        packageManager: packageManager_1.PM.NPM,
        projectDirCreated: async (projectDir, tmpDir) => {
            const tmpPath = await tmpDir.getTempDir();
            const localPath = path.join(tmpPath, "foo");
            await (0, fs_extra_1.outputFile)(path.join(localPath, "package.json"), `{"name":"foo","version":"9.0.0","main":"index.js","license":"MIT"}`);
            await (0, fs_extra_1.outputFile)(path.join(localPath, "test.dll"), `test`);
            await (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    debug: "3.1.0",
                    "edge-cs": "1.2.1",
                    foo: `file:${localPath}`,
                };
            });
        },
        packed: async (context) => {
            await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(electron_builder_1.Platform.WINDOWS));
        },
    });
});
// https://github.com/electron-userland/electron-builder/issues/1738
test.ifNotWindows("posix smart unpack", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        // https://github.com/electron-userland/electron-builder/issues/3273
        // tslint:disable-next-line:no-invalid-template-strings
        copyright: "Copyright © 2018 ${author}",
        npmRebuild: true,
        onNodeModuleFile: filePath => {
            // Force include this directory in the package
            return filePath.includes("node_modules/three/examples");
        },
        files: [
            // test ignore pattern for node_modules defined as file set filter
            {
                filter: ["!node_modules/napi-build-utils/napi-build-utils-1.0.0.tgz", "!node_modules/node-abi/*", "!node_modules/**/eslint-format.js"],
            },
        ],
    },
}, {
    projectDirCreated: projectDir => {
        process.env.npm_config_user_agent = "npm";
        return (0, packTester_1.packageJson)(it => {
            it.dependencies = {
                debug: "4.1.1",
                "edge-cs": "1.2.1",
                keytar: "7.9.0",
                three: "0.160.0",
            };
        })(projectDir);
    },
    packed: async (context) => {
        expect(context.packager.appInfo.copyright).toBe("Copyright © 2018 Foo Bar");
        await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(electron_builder_1.Platform.LINUX), async (asarFs) => {
            return expect(await asarFs.readFile(`node_modules${path.sep}three${path.sep}examples${path.sep}fonts${path.sep}README.md`)).toMatchSnapshot();
        });
    },
}));
//# sourceMappingURL=BuildTest.js.map
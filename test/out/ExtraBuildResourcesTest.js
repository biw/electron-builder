"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs = require("fs");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
const winHelper_1 = require("./helpers/winHelper");
const unzipper = require("unzipper");
const temp_file_1 = require("temp-file");
const promises_1 = require("fs/promises");
function createBuildResourcesTest(expect, packagerOptions) {
    return (0, packTester_1.app)(expect, {
        ...packagerOptions,
        config: {
            publish: null,
            directories: {
                buildResources: "custom",
                // tslint:disable:no-invalid-template-strings
                output: "customDist/${channel}",
                // https://github.com/electron-userland/electron-builder/issues/601
                app: ".",
            },
            win: {
                signAndEditExecutable: false,
            },
            nsis: {
                differentialPackage: false,
            },
        },
    }, {
        packed: async (context) => {
            await (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "customDist", "latest")).isDirectory();
        },
        projectDirCreated: projectDir => Promise.resolve(fs.renameSync(path.join(projectDir, "build"), path.join(projectDir, "custom"))),
    });
}
test.ifNotWindows("custom buildResources and output dirs: mac", ({ expect }) => createBuildResourcesTest(expect, { mac: ["dir"] }));
test.ifNotCiMac("custom buildResources and output dirs: win", ({ expect }) => createBuildResourcesTest(expect, { win: ["nsis"] }));
test.ifNotWindows("custom buildResources and output dirs: linux", ({ expect }) => createBuildResourcesTest(expect, { linux: ["appimage"] }));
test.ifLinuxOrDevMac("prepackaged", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    packed: async (context) => {
        await (0, electron_builder_1.build)({
            prepackaged: path.join(context.outDir, "linux-unpacked"),
            projectDir: context.projectDir,
            linux: [],
            config: {
                // test target
                linux: {
                    target: {
                        target: "deb",
                        arch: "ia32",
                    },
                },
                compression: "store",
            },
        });
        await (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "dist", "TestApp_1.1.0_i386.deb")).isFile();
    },
}));
test.ifLinuxOrDevMac("retrieve latest electron version", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.devDependencies = {
            ...data.devDependencies,
            electron: "latest",
        };
        delete data.build.electronVersion;
    }),
}));
test.ifLinuxOrDevMac("retrieve latest electron-nightly version", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.devDependencies = {
            ...data.devDependencies,
            "electron-nightly": "latest",
        };
        delete data.build.electronVersion;
    }),
}));
test.ifNotWindows("override targets in the config", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    packed: async (context) => {
        await (0, electron_builder_1.build)({
            projectDir: context.projectDir,
            linux: ["deb"],
            config: {
                publish: null,
                // https://github.com/electron-userland/electron-builder/issues/1355
                linux: {
                    target: ["AppImage", "deb", "rpm", "pacman"],
                },
                compression: "store",
            },
        });
    },
}));
// test https://github.com/electron-userland/electron-builder/issues/1182 also
test.ifDevOrWinCi("override targets in the config - only arch", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(null, electron_builder_1.Arch.ia32),
    config: {
        extraMetadata: {
            version: "1.0.0-beta.1",
        },
        // https://github.com/electron-userland/electron-builder/issues/1348
        win: {
            // tslint:disable:no-invalid-template-strings
            artifactName: "${channel}-${name}.exe",
            target: ["nsis"],
        },
        publish: {
            provider: "generic",
            url: "https://develar.s3.amazonaws.com/test",
        },
    },
}, {
    packed: context => {
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "dist", "win-unpacked")).doesNotExist(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "dist", "latest.yml")).doesNotExist(),
            (0, winHelper_1.expectUpdateMetadata)(expect, context, electron_builder_1.Arch.ia32),
        ]);
    },
}));
// test on all CI to check path separators
test("do not exclude build entirely (respect files)", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-build-sub", { targets: packTester_1.linuxDirTarget }));
test.ifNotWindows("electronDist as path to local folder with electron builds zipped ", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        electronDist: (0, testConfig_1.getElectronCacheDir)(),
    },
}));
test.ifNotWindows("electronDist as callback function for path to local folder with electron builds zipped ", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        electronDist: _context => {
            return Promise.resolve((0, testConfig_1.getElectronCacheDir)());
        },
    },
}));
test.ifLinux("electronDist as standard path to node_modules electron", ({ expect }) => {
    return (0, packTester_1.app)(expect, {
        targets: packTester_1.linuxDirTarget,
        config: {
            electronDist: "node_modules/electron/dist",
        },
    }, {
        projectDirCreated: async (projectDir) => {
            await (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.devDependencies = {
                    ...data.devDependencies,
                    electron: testConfig_1.ELECTRON_VERSION,
                };
                delete data.build.electronVersion;
            });
        },
        packed: async (context) => {
            const contents = await (0, promises_1.readdir)(context.getAppPath(electron_builder_1.Platform.LINUX, electron_builder_1.Arch.x64));
            expect(contents).toMatchSnapshot();
        },
    });
});
test.ifNotWindows("electronDist as callback function for path to locally unzipped", ({ expect }) => {
    const tmpDir = new temp_file_1.TmpDir();
    return (0, packTester_1.app)(expect, {
        targets: packTester_1.linuxDirTarget,
        config: {
            electronDist: async (context) => {
                const { platformName, arch, version } = context;
                const fileName = `electron-v${version}-${platformName}-${arch}.zip`;
                const electronUrl = `https://github.com/electron/electron/releases/download/v${version}/${fileName}`;
                const tempDir = await tmpDir.getTempDir();
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir);
                }
                const electronPath = path.join(tempDir, "electron-dist");
                const directory = await unzipper.Open.url(require("request"), electronUrl);
                await directory.extract({ path: electronPath, concurrency: 5, forceStream: true });
                return electronPath;
            },
        },
    }, {
        packed: async (context) => {
            const contents = await (0, promises_1.readdir)(context.getAppPath(electron_builder_1.Platform.LINUX, electron_builder_1.Arch.x64));
            expect(contents).toMatchSnapshot();
            await tmpDir.cleanup();
        },
    });
});
const overridePublishChannel = {
    channel: "beta",
};
test.ifDevOrLinuxCi("overriding the publish channel", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        publish: overridePublishChannel,
    },
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.devDependencies = {};
        data.build.publish = [
            {
                provider: "s3",
                bucket: "my-s3-bucket",
            },
        ];
    }),
    packed: async (context) => {
        expect(context.packager.config.publish).toMatchSnapshot();
        return Promise.resolve();
    },
}));
//# sourceMappingURL=ExtraBuildResourcesTest.js.map
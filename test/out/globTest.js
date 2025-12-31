"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const asar_1 = require("app-builder-lib/out/asar/asar");
const packageManager_1 = require("app-builder-lib/out/node-module-collector/packageManager");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
const verifySmartUnpack_1 = require("./helpers/verifySmartUnpack");
async function createFiles(appDir) {
    await Promise.all([
        (0, fs_extra_1.outputFile)(path.join(appDir, "assets", "file1"), "data"),
        (0, fs_extra_1.outputFile)(path.join(appDir, "assets", "file2"), "data"),
        (0, fs_extra_1.outputFile)(path.join(appDir, "assets", "subdir", "file3"), "data"),
        (0, fs_extra_1.outputFile)(path.join(appDir, "b2", "file"), "data"),
        (0, fs_extra_1.outputFile)(path.join(appDir, "do-not-unpack-dir", "file.json"), "{}").then(() => fs.writeFile(path.join(appDir, "do-not-unpack-dir", "must-be-not-unpacked"), "{}")),
    ]);
    const dir = path.join(appDir, "do-not-unpack-dir", "dir-2", "dir-3", "dir-3");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "file-in-asar"), "{}");
    await fs.symlink(path.join(appDir, "assets", "file1"), path.join(appDir, "assets", "subdir", "file-symlink1")); // "reverse" symlink up one directory
    await fs.symlink(path.join(appDir, "assets", "file2"), path.join(appDir, "assets", "file-symlink2")); // same dir symlink
    await fs.symlink(path.join(appDir, "assets", "subdir", "file3"), path.join(appDir, "file-symlink3")); // symlink down
}
test.ifNotWindows.ifDevOrLinuxCi("unpackDir one", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asarUnpack: ["assets", "b2", "do-not-unpack-dir/file.json"],
    },
}, {
    projectDirCreated: createFiles,
    packed: context => assertDirs(expect, context),
}));
async function assertDirs(expect, context) {
    const resourceDir = context.getResources(app_builder_lib_1.Platform.LINUX);
    await Promise.all([
        (0, fileAssert_1.assertThat)(expect, path.join(resourceDir, "app.asar.unpacked", "assets")).isDirectory(),
        (0, fileAssert_1.assertThat)(expect, path.join(resourceDir, "app.asar.unpacked", "b2")).isDirectory(),
        (0, fileAssert_1.assertThat)(expect, path.join(resourceDir, "app.asar.unpacked", "do-not-unpack-dir", "file.json")).isFile(),
        (0, fileAssert_1.assertThat)(expect, path.join(resourceDir, "app.asar.unpacked", "do-not-unpack-dir", "must-be-not-unpacked")).doesNotExist(),
        (0, fileAssert_1.assertThat)(expect, path.join(resourceDir, "app.asar.unpacked", "do-not-unpack-dir", "dir-2")).doesNotExist(),
    ]);
    await (0, packTester_1.verifyAsarFileTree)(expect, resourceDir);
}
test.ifNotWindows.ifDevOrLinuxCi("unpackDir", ({ expect }) => {
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets: packTester_1.linuxDirTarget,
        config: {
            asarUnpack: ["assets", "b2", "do-not-unpack-dir/file.json"],
        },
    }, {
        projectDirCreated: projectDir => createFiles(path.join(projectDir, "app")),
        packed: context => assertDirs(expect, context),
    });
});
test.ifDevOrLinuxCi("asarUnpack and files ignore", ({ expect }) => {
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets: packTester_1.linuxDirTarget,
        config: {
            asarUnpack: ["!**/ffprobe-static/bin/darwin/x64/ffprobe"],
        },
    }, {
        projectDirCreated: projectDir => (0, fs_extra_1.outputFile)(path.join(projectDir, "test/ffprobe-static/bin/darwin/x64/ffprobe"), "data"),
        packed: async (context) => {
            const resourceDir = context.getResources(app_builder_lib_1.Platform.LINUX);
            await Promise.all([(0, fileAssert_1.assertThat)(expect, path.join(resourceDir, "app.asar.unpacked", "test/ffprobe-static/bin/darwin/x64/ffprobe")).doesNotExist()]);
            await (0, packTester_1.verifyAsarFileTree)(expect, resourceDir);
        },
    });
});
test.ifNotWindows("link", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => {
        return fs.symlink(path.join(projectDir, "index.js"), path.join(projectDir, "foo.js"));
    },
    packed: async (context) => {
        const resources = context.getResources(app_builder_lib_1.Platform.LINUX);
        expect((await (0, asar_1.readAsar)(path.join(resources, "app.asar"))).getFile("foo.js", false)).toMatchSnapshot();
        await (0, packTester_1.verifyAsarFileTree)(expect, resources);
    },
}));
test.skip("outside link", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: async (projectDir, tmpDir) => {
        const tempDir = await tmpDir.getTempDir();
        await (0, fs_extra_1.outputFile)(path.join(tempDir, "foo"), "data");
        await fs.symlink(tempDir, path.join(projectDir, "o-dir"));
    },
}, error => {
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("outside the package to a system or unsafe path");
}));
test.ifNotWindows("symlinks everywhere with static framework", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-symlink-framework", {
    targets: packTester_1.linuxDirTarget,
    config: {
        files: ["!hello-world"],
    },
}, {
    packageManager: packageManager_1.PM.NPM,
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.dependencies = {
                debug: "4.1.1",
                ...data.dependencies,
            };
        });
        await fs.symlink(path.join(projectDir, "index.js"), path.join(projectDir, "foo.js"));
    },
    packed: async (context) => {
        const resources = context.getResources(app_builder_lib_1.Platform.LINUX);
        expect((await (0, asar_1.readAsar)(path.join(resources, "app.asar"))).getFile("foo.js", false)).toMatchSnapshot();
        await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, resources);
    },
}));
// https://github.com/electron-userland/electron-builder/issues/611
test.ifDevOrLinuxCi("failed peer dep", ({ expect }) => {
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: packTester_1.linuxDirTarget,
    }, {
        packageManager: packageManager_1.PM.YARN,
        projectDirCreated: async (projectDir) => {
            return Promise.all([
                (0, packTester_1.modifyPackageJson)(projectDir, data => {
                    //noinspection SpellCheckingInspection
                    data.dependencies = {
                        debug: "4.1.1",
                        "rc-datepicker": "4.0.0",
                        react: "15.2.1",
                        "react-dom": "15.2.1",
                    };
                }),
            ]);
        },
        packed: context => {
            return (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(app_builder_lib_1.Platform.LINUX));
        },
    });
});
test.ifDevOrLinuxCi("ignore node_modules", ({ expect }) => {
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: packTester_1.linuxDirTarget,
        config: {
            asar: false,
            files: ["!node_modules/**/*"],
        },
    }, {
        packageManager: packageManager_1.PM.NPM,
        projectDirCreated: async (projectDir) => {
            return (0, packTester_1.modifyPackageJson)(projectDir, data => {
                //noinspection SpellCheckingInspection
                data.dependencies = {
                    "ci-info": "2.0.0",
                    // this contains string-width-cjs 4.2.3
                    "@isaacs/cliui": "8.0.2",
                };
            });
        },
        packed: context => {
            return (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app", "node_modules")).doesNotExist();
        },
    });
});
test.ifDevOrLinuxCi("asarUnpack node_modules", ({ expect }) => {
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: packTester_1.linuxDirTarget,
        config: {
            asarUnpack: "node_modules",
        },
    }, {
        packageManager: packageManager_1.PM.NPM,
        projectDirCreated: async (projectDir) => {
            return (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "ci-info": "2.0.0",
                };
            });
        },
        packed: async (context) => {
            const nodeModulesNode = (await (0, asar_1.readAsar)(path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar"))).getNode("node_modules");
            expect((0, packTester_1.removeUnstableProperties)(nodeModulesNode)).toMatchSnapshot();
            await (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar.unpacked/node_modules/ci-info")).isDirectory();
        },
    });
});
//# sourceMappingURL=globTest.js.map
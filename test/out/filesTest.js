"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const path = require("path");
const stat_mode_1 = require("stat-mode");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
test.ifDevOrLinuxCi("expand not defined env", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        // tslint:disable:no-invalid-template-strings
        files: ["${env.FOO_NOT_DEFINED}"],
    },
}));
process.env.__NOT_BAR__ = "!**/bar";
test.ifDevOrLinuxCi("files", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        // tslint:disable:no-invalid-template-strings
        files: ["**/*", "!ignoreMe${/*}", "${env.__NOT_BAR__}", "dist/electron/**/*"],
    },
}, {
    projectDirCreated: projectDir => Promise.all([
        (0, fs_extra_1.outputFile)(path.join(projectDir, "ignoreMe", "foo"), "data"),
        (0, fs_extra_1.outputFile)(path.join(projectDir, "ignoreEmptyDir", "bar"), "data"),
        (0, fs_extra_1.outputFile)(path.join(projectDir, "test.h"), "test that"),
        (0, fs_extra_1.outputFile)(path.join(projectDir, "dist/electron/foo.js"), "data"),
    ]),
    packed: context => {
        const resources = path.join(context.getResources(electron_builder_1.Platform.LINUX), "app");
        return (0, packTester_1.checkDirContents)(expect, resources);
    },
}));
test.ifDevOrLinuxCi("files.from asar", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: true,
        files: [
            {
                from: ".",
                to: ".",
                filter: ["package.json"],
            },
            {
                from: "app/node",
                to: "app/node",
            },
        ],
    },
}, {
    projectDirCreated: projectDir => Promise.all([
        fs.mkdir(path.join(projectDir, "app/node"), { recursive: true }).then(() => fs.rename(path.join(projectDir, "index.js"), path.join(projectDir, "app/node/index.js"))),
        (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.main = "app/node/index.js";
        }),
    ]),
}));
test.ifNotWindows("map resources", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        extraResources: [
            {
                from: "foo/old",
                to: "foo/new",
            },
            {
                from: "license.txt",
                to: ".",
            },
        ],
    },
}, {
    projectDirCreated: projectDir => Promise.all([(0, fs_extra_1.outputFile)(path.join(projectDir, "foo", "old"), "data"), (0, fs_extra_1.outputFile)(path.join(projectDir, "license.txt"), "data")]),
    packed: context => {
        const resources = context.getResources(electron_builder_1.Platform.LINUX);
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(resources, "app", "foo", "old")).doesNotExist(),
            (0, fileAssert_1.assertThat)(expect, path.join(resources, "foo", "new")).isFile(),
            (0, fileAssert_1.assertThat)(expect, path.join(resources, "license.txt")).isFile(),
        ]);
    },
}));
async function doExtraResourcesTest(expect, platform) {
    const osName = platform.buildConfigurationKey;
    await (0, packTester_1.assertPack)(expect, "test-app-one", {
        // to check NuGet package
        targets: platform.createTarget(platform === electron_builder_1.Platform.WINDOWS ? "squirrel" : electron_builder_1.DIR_TARGET),
        config: {
            extraResources: ["foo", "bar/hello.txt", "./dir-relative/f.txt", "bar/${arch}.txt", "${os}/${arch}.txt"],
            [osName]: {
                extraResources: ["platformSpecificR"],
                extraFiles: ["platformSpecificF"],
            },
        },
    }, {
        projectDirCreated: async (projectDir) => {
            return Promise.all([
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, "foo/nameWithoutDot"), "nameWithoutDot"),
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, "bar/hello.txt"), "data"),
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, "dir-relative/f.txt"), "data"),
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, `bar/${process.arch}.txt`), "data"),
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, `${osName}/${process.arch}.txt`), "data"),
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, "platformSpecificR"), "platformSpecificR"),
                (0, fs_extra_1.outputFile)(path.resolve(projectDir, "ignoreMe.txt"), "ignoreMe"),
            ]);
        },
        packed: async (context) => {
            const resourcesDir = context.getResources(platform, (0, builder_util_1.archFromString)(process.arch));
            return Promise.all([
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "foo")).isDirectory(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "foo", "nameWithoutDot")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "bar", "hello.txt")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "dir-relative", "f.txt")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "bar", `${process.arch}.txt`)).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, osName, `${process.arch}.txt`)).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "platformSpecificR")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.resolve(resourcesDir, "ignoreMe.txt")).doesNotExist(),
            ]);
        },
    });
}
test.ifDevOrLinuxCi("extraResources on Linux", ({ expect }) => doExtraResourcesTest(expect, electron_builder_1.Platform.LINUX));
// Squirrel.Windows is not supported on macOS anymore (32-bit)
// Skipped due to bug in rimraf on Windows: `at fixWinEPERM (../node_modules/.pnpm/fs-extra@8.1.0/node_modules/fs-extra/lib/remove/rimraf.js:117:5)`
test.ifLinux("extraResources on Windows", ({ expect }) => doExtraResourcesTest(expect, electron_builder_1.Platform.WINDOWS));
test.ifMac("extraResources on macOS", ({ expect }) => doExtraResourcesTest(expect, electron_builder_1.Platform.MAC));
test.ifNotWindows.ifNotCiWin("extraResources - two-package", ({ expect }) => {
    const platform = electron_builder_1.Platform.LINUX;
    const osName = platform.buildConfigurationKey;
    //noinspection SpellCheckingInspection
    return (0, packTester_1.assertPack)(expect, "test-app", {
        // to check NuGet package
        targets: platform.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            asar: true,
            extraResources: ["foo", "bar/hello.txt", "bar/${arch}.txt", "${os}/${arch}.txt", "executable*"],
            [osName]: {
                extraResources: ["platformSpecificR"],
                extraFiles: ["platformSpecificF"],
            },
        },
    }, {
        projectDirCreated: projectDir => {
            return Promise.all([
                (0, fs_extra_1.outputFile)(path.join(projectDir, "foo/nameWithoutDot"), "nameWithoutDot"),
                (0, fs_extra_1.outputFile)(path.join(projectDir, "bar/hello.txt"), "data", { mode: 0o400 }),
                (0, fs_extra_1.outputFile)(path.join(projectDir, `bar/${process.arch}.txt`), "data"),
                (0, fs_extra_1.outputFile)(path.join(projectDir, `${osName}/${process.arch}.txt`), "data"),
                (0, fs_extra_1.outputFile)(path.join(projectDir, "platformSpecificR"), "platformSpecificR"),
                (0, fs_extra_1.outputFile)(path.join(projectDir, "ignoreMe.txt"), "ignoreMe"),
                (0, fs_extra_1.outputFile)(path.join(projectDir, "executable"), "executable", { mode: 0o755 }),
                (0, fs_extra_1.outputFile)(path.join(projectDir, "executableOnlyOwner"), "executable", { mode: 0o740 }),
            ]);
        },
        packed: async (context) => {
            const resourcesDir = context.getResources(platform, (0, builder_util_1.archFromString)(process.arch));
            const appDir = path.join(resourcesDir, "app");
            await Promise.all([
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, "foo")).isDirectory(),
                (0, fileAssert_1.assertThat)(expect, path.join(appDir, "foo")).doesNotExist(),
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, "foo", "nameWithoutDot")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.join(appDir, "foo", "nameWithoutDot")).doesNotExist(),
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, "bar", "hello.txt")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, "bar", `${process.arch}.txt`)).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.join(appDir, "bar", `${process.arch}.txt`)).doesNotExist(),
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, osName, `${process.arch}.txt`)).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, "platformSpecificR")).isFile(),
                (0, fileAssert_1.assertThat)(expect, path.join(resourcesDir, "ignoreMe.txt")).doesNotExist(),
                allCan(path.join(resourcesDir, "executable"), true),
                allCan(path.join(resourcesDir, "executableOnlyOwner"), true),
                allCan(path.join(resourcesDir, "bar", "hello.txt"), false),
            ]);
            expect(await fs.readFile(path.join(resourcesDir, "bar", "hello.txt"), "utf-8")).toEqual("data");
        },
    });
});
// https://github.com/electron-userland/electron-builder/pull/998
// copyDir walks to a symlink referencing a file that has not yet been copied by postponing the linking step until after the full walk is complete
test.ifNotWindows("postpone symlink", async ({ expect }) => {
    const tmpDir = new builder_util_1.TmpDir("files-test");
    const source = await tmpDir.getTempDir();
    const aSourceFile = path.join(source, "z", "Z");
    const bSourceFileLink = path.join(source, "B");
    await (0, fs_extra_1.outputFile)(aSourceFile, "test");
    await fs.symlink(aSourceFile, bSourceFileLink);
    const dest = await tmpDir.getTempDir();
    await (0, builder_util_1.copyDir)(source, dest);
    await tmpDir.cleanup();
});
async function allCan(file, execute) {
    const mode = new stat_mode_1.Mode(await fs.stat(file));
    function checkExecute(value) {
        if (value.execute !== execute) {
            throw new Error(`${file} is ${execute ? "not " : ""}executable`);
        }
    }
    function checkRead(value) {
        if (!value.read) {
            throw new Error(`${file} is not readable`);
        }
    }
    checkExecute(mode.owner);
    checkExecute(mode.group);
    checkExecute(mode.others);
    checkRead(mode.owner);
    checkRead(mode.group);
    checkRead(mode.others);
}
//# sourceMappingURL=filesTest.js.map
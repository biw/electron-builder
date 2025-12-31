"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
const packageManager_1 = require("app-builder-lib/out/node-module-collector/packageManager");
const currentProcessTarget = electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET, (0, electron_builder_1.archFromString)(process.arch));
test.ifDevOrLinuxCi("ignore build resources", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
    },
}, {
    projectDirCreated: projectDir => {
        return (0, fs_extra_1.outputFile)(path.join(projectDir, "one/build/foo.txt"), "data");
    },
    packed: context => {
        return (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "one", "build", "foo.txt")).isFile();
    },
}));
test.ifDevOrLinuxCi("2 ignore", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        files: [
            "**/*",
            "!{app,build,electron,mobile,theme,uploads,util,dist,dist-app/aot,dist-app/app.bundle.js,dist-app/dependencies/shim.min.js,dist-app/dependencies/classList.min.js,dist-app/dependencies/web-animations.min.js,main.js,main-aot.js,favicon.ico,index.html,index-aot.html,index-cordova.html,index-aot.js,index-electron.js,index.bundle.js,systemjs.config.js,systemjs-angular-loader.js,package-lock.json}",
            "!*config*.json",
            "!**/*.{ts,scss,map,md,csv,wrapped}",
            "!**/*.{hprof,orig,pyc,pyo,rbc}",
            "!**/._*",
            "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,__pycache__,thumbs.db,.gitignore,.gitattributes,.flowconfig,.yarn-metadata.json,.idea,appveyor.yml,.travis.yml,circle.yml,npm-debug.log,.nyc_output,yarn.lock,.yarn-integrity}",
        ],
    },
}, {
    projectDirCreated: projectDir => {
        return (0, fs_extra_1.outputFile)(path.join(projectDir, "electron/foo.txt"), "data");
    },
    packed: context => {
        return (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "electron", "foo.txt")).doesNotExist();
    },
}));
test.ifDevOrLinuxCi("ignore known ignored files", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
    },
}, {
    projectDirCreated: projectDir => Promise.all([
        (0, fs_extra_1.outputFile)(path.join(projectDir, ".svn", "foo"), "data"),
        (0, fs_extra_1.outputFile)(path.join(projectDir, ".git", "foo"), "data"),
        (0, fs_extra_1.outputFile)(path.join(projectDir, "node_modules", ".bin", "f.txt"), "data"),
        (0, fs_extra_1.outputFile)(path.join(projectDir, "node_modules", ".bin2", "f.txt"), "data"),
    ]),
    packed: context => (0, packTester_1.checkDirContents)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX), "app")),
}));
// skip on macOS because we want test only / and \
test.ifNotCiMac.sequential("ignore node_modules dev dep", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        files: ["**/*", "**/submodule-1-test/node_modules/**"],
    },
}, {
    packageManager: packageManager_1.PM.NPM,
    projectDirCreated: async (projectDir) => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.devDependencies = {
                    semver: "6.3.1",
                    ...data.devDependencies,
                };
            }),
        ]);
    },
    packed: context => {
        return Promise.all([(0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "node_modules", "semver")).doesNotExist()]);
    },
}));
test.ifDevOrLinuxCi.sequential("copied sub node_modules of the rootDir/node_modules", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: currentProcessTarget,
    config: {
        asar: false,
        files: ["**/*", "**/submodule-1-test/node_modules/**"],
    },
}, {
    packageManager: packageManager_1.PM.NPM,
    projectDirCreated: async (projectDir) => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "electron-updater": "6.3.9",
                    semver: "6.3.1",
                    ...data.dependencies,
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "submodule-1-test", "node_modules", "package.json"), "{}"),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "others", "node_modules", "package.json"), "{}"),
        ]);
    },
    packed: context => {
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "node_modules", "electron-updater", "node_modules")).isDirectory(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "node_modules")).doesNotExist(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-1-test", "node_modules")).isDirectory(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-1-test", "node_modules", "package.json")).isFile(),
        ]);
    },
}));
test.ifDevOrLinuxCi("Don't copy sub node_modules of the other dir instead of rootDir", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: currentProcessTarget,
    config: {
        asar: false,
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    ...data.dependencies,
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "others", "node_modules", "package.json"), "{}"),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "others", "test1", "package.json"), "{}"),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "others", "submodule-2-test", "node_modules", "package.json"), "{}"),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "others", "submodule-2-test", "test2", "package.json"), "{}"),
        ]);
    },
    packed: context => {
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "node_modules")).doesNotExist(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "test1")).isDirectory(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "test1", "package.json")).isFile(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "submodule-2-test", "node_modules")).doesNotExist(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "submodule-2-test", "test2")).isDirectory(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "others", "submodule-2-test", "test2", "package.json")).isFile(),
        ]);
    },
}));
test.ifDevOrLinuxCi("copied select submodule node_modules", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: currentProcessTarget,
    config: {
        asar: false,
        // should use **/ instead of */,
        // we use the related path to match, so the relative path is submodule-1-test/node_modules
        // */ will not match submodule-1-test/node_modules
        files: ["**/*", "**/submodule-1-test/node_modules/**"],
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    ...data.dependencies,
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "submodule-1-test", "node_modules", "package.json"), "{}"),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "submodule-2-test", "node_modules", "package.json"), "{}"),
        ]);
    },
    packed: context => {
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-1-test", "node_modules")).isDirectory(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-1-test", "node_modules", "package.json")).isFile(),
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-2-test", "node_modules")).doesNotExist(),
        ]);
    },
}));
test.ifDevOrLinuxCi("cannot copied select submodule node_modules by */", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: currentProcessTarget,
    config: {
        asar: false,
        files: ["**/*", "*/submodule-1-test/node_modules/**"],
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    ...data.dependencies,
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "submodule-1-test", "node_modules", "package.json"), "{}"),
        ]);
    },
    packed: context => {
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-1-test", "node_modules")).doesNotExist(),
        ]);
    },
}));
test.ifDevOrLinuxCi("cannot copied select submodule node_modules by **/submodule-1-test/node_modules", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: currentProcessTarget,
    config: {
        asar: false,
        files: ["**/*", "**/submodule-1-test/node_modules"],
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    ...data.dependencies,
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "submodule-1-test", "node_modules", "package.json"), "{}"),
        ]);
    },
    packed: context => {
        return Promise.all([
            (0, fileAssert_1.assertThat)(expect, path.join(context.getResources(electron_builder_1.Platform.LINUX, (0, electron_builder_1.archFromString)(process.arch)), "app", "submodule-1-test", "node_modules")).doesNotExist(),
        ]);
    },
}));
//# sourceMappingURL=ignoreTest.js.map
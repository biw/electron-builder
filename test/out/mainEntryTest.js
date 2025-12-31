"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs = require("fs/promises");
const path = require("path");
const packTester_1 = require("./helpers/packTester");
const packagerOptions = {
    targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], electron_builder_1.DIR_TARGET),
};
test.ifLinuxOrDevMac("invalid main in the app package.json", ({ expect }) => (0, packTester_1.appTwoThrows)(expect, packagerOptions, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.main = "main.js";
    }, true),
}));
test.ifLinuxOrDevMac("invalid main in the app package.json (no asar)", ({ expect }) => (0, packTester_1.appTwoThrows)(expect, packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.main = "main.js";
            }, true),
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.build.asar = false;
            }),
        ]);
    },
}));
test.ifLinuxOrDevMac("invalid main in the app package.json (custom asar)", ({ expect }) => (0, packTester_1.appTwoThrows)(expect, packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.main = "path/app.asar/main.js";
            }, true),
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.build.asar = false;
            }),
        ]);
    },
}));
test.ifLinuxOrDevMac("main in the app package.json (no asar)", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app", packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            fs.rename(path.join(projectDir, "app", "index.js"), path.join(projectDir, "app", "main.js")),
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.main = "main.js";
            }, true),
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.build.asar = false;
            }),
        ]);
    },
}));
test.ifLinuxOrDevMac("main in the app package.json (custom asar)", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app", packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.main = "path/app.asar/index.js";
            }, true),
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.build.asar = false;
            }),
        ]);
    },
}));
//# sourceMappingURL=mainEntryTest.js.map
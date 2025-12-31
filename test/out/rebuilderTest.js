"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const node_module_collector_1 = require("app-builder-lib/out/node-module-collector");
const util_1 = require("builder-util/src/util");
const path_1 = require("path");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
const verifySmartUnpack_1 = require("./helpers/verifySmartUnpack");
const packageConfig = (data) => {
    data.name = "@packageManagers/test-app-yarn-workspace";
    data.version = "1.0.0";
    data.dependencies = {
        ...data.debpendencies,
        debug: "4.4.3",
        "better-sqlite3-multiple-ciphers": "12.2.0",
    };
    data.devDependencies = {
        electron: testConfig_1.ELECTRON_VERSION,
    };
    data.optionalDependencies = {};
    return data;
};
const extraFile = "./node_modules/better-sqlite3-multiple-ciphers/build/Release/better_sqlite3.node";
const config = {
    npmRebuild: true,
    asarUnpack: ["**/better_sqlite3.node"],
};
test("yarn workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
    config,
}, {
    packageManager: node_module_collector_1.PM.YARN,
    storeDepsLockfileSnapshot: true,
    packed: async (context) => {
        await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(app_builder_lib_1.Platform.LINUX));
        expect(await (0, util_1.exists)(path_1.default.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar.unpacked", extraFile))).toBeTruthy();
    },
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(path_1.default.join(projectDir, "packages", "test-app"), data => packageConfig(data));
    },
}));
// yarn berry workspace
test("yarn berry workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
    config,
}, {
    packageManager: node_module_collector_1.PM.YARN_BERRY,
    storeDepsLockfileSnapshot: true,
    packed: async (context) => {
        await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(app_builder_lib_1.Platform.LINUX));
        expect(await (0, util_1.exists)(path_1.default.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar.unpacked", extraFile))).toBeTruthy();
    },
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(path_1.default.join(projectDir, "packages", "test-app"), data => packageConfig(data));
    },
}));
//# sourceMappingURL=rebuilderTest.js.map
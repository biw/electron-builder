"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("./helpers/packTester");
const checkOptions = {
    projectDirCreated: async (projectDir) => {
        const src = process.env.PROTON_NATIVE_TEST_NODE_MODULES;
        if (src != null) {
            await (0, builder_util_1.copyDir)(src, projectDir + "/node_modules");
        }
    },
};
test.ifMac("mac", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget(),
    config: {
        framework: "proton",
    },
}, checkOptions));
test.ifLinuxOrDevMac("linux", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("appimage"),
    config: {
        framework: "proton",
    },
}, checkOptions));
test.ifDevOrWinCi("win", { retry: 2 }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis"),
    config: {
        framework: "proton",
    },
}, checkOptions));
test.ifDevOrWinCi("win ia32", { retry: 2 }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis", electron_builder_1.Arch.ia32),
    config: {
        framework: "proton",
    },
}, checkOptions));
//# sourceMappingURL=protonTest.js.map
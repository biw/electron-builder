"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const packTester_1 = require("../helpers/packTester");
// very slow
test("snap full", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "se-wo-template",
        },
        productName: "Snap Electron App (full build)",
        snap: {
            useTemplateApp: false,
        },
        electronFuses: {
            runAsNode: true,
            enableCookieEncryption: true,
            enableNodeOptionsEnvironmentVariable: true,
            enableNodeCliInspectArguments: true,
            enableEmbeddedAsarIntegrityValidation: true,
            onlyLoadAppFromAsar: true,
            loadBrowserProcessSpecificV8Snapshot: true,
            grantFileProtocolExtraPrivileges: undefined, // unsupported on current electron version in our tests
        },
    },
}));
// very slow
test("snap full (armhf)", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: app_builder_lib_1.Platform.LINUX.createTarget("snap", app_builder_lib_1.Arch.armv7l),
    config: {
        extraMetadata: {
            name: "se-wo-template",
        },
        productName: "Snap Electron App (full build)",
        snap: {
            useTemplateApp: false,
        },
    },
}));
//# sourceMappingURL=snapHeavyTest.js.map
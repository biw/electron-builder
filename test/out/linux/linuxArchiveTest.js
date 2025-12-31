"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
test.ifNotWindows.ifDevOrLinuxCi("tar", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget(["tar.xz", "tar.lz", "tar.bz2"]),
    config: {
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
//# sourceMappingURL=linuxArchiveTest.js.map
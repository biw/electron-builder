"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
// "apk" is very slow, don't test for now
test.ifDevOrLinuxCi("targets", { timeout: 10 * 60 * 1000 }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget(["sh", "freebsd", "pacman", "zip", "7z"]),
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
// https://github.com/electron-userland/electron-builder/issues/460
// for some reasons in parallel to fmp we cannot use tar
test.ifDevOrLinuxCi("rpm and tar.gz", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget(["rpm", "tar.gz"]),
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
//# sourceMappingURL=fpmTest.js.map
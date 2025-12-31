"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
// tests are heavy, to distribute tests across CircleCI machines evenly, these tests were moved from oneClickInstallerTest
test.ifNotCiMac("web installer", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.x64, electron_builder_1.Arch.arm64),
    config: {
        publish: {
            provider: "s3",
            bucket: "develar",
            path: "test",
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
test.ifNotCiMac("web installer (default github)", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.ia32, electron_builder_1.Arch.x64, electron_builder_1.Arch.arm64),
    config: {
        publish: {
            provider: "github",
            // test form without owner
            repo: "foo/bar",
        },
    },
}));
test.ifNotCiMac("web installer, safe name on github", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.x64),
    config: {
        productName: "WorkFlowy",
        publish: {
            provider: "github",
            repo: "foo/bar",
        },
        nsisWeb: {
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}.${ext}",
        },
    },
}));
//# sourceMappingURL=webInstallerTest.js.map
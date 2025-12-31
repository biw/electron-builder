"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const path = require("path");
const packTester_1 = require("../helpers/packTester");
// build in parallel - https://github.com/electron-userland/electron-builder/issues/1340#issuecomment-286061789
test.ifNotCiMac("portable", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["portable", "nsis"]),
    config: {
        publish: null,
        nsis: {
            differentialPackage: false,
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
test.ifDevOrWinCi("portable zip", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("portable"),
    config: {
        publish: null,
        portable: {
            useZip: true,
            unpackDirName: "0ujssxh0cECutqzMgbtXSGnjorm",
        },
        compression: "normal",
    },
}));
test.ifNotCi("portable zip several archs", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("portable", electron_builder_1.Arch.ia32, electron_builder_1.Arch.x64),
    config: {
        publish: null,
        portable: {
            useZip: true,
            unpackDirName: false,
        },
        compression: "store",
    },
}));
test.ifNotCiMac("portable - artifactName and request execution level", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["portable"]),
    config: {
        nsis: {
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}Installer.${version}.${ext}",
            installerIcon: "foo test space.ico",
        },
        portable: {
            unpackDirName: true,
            requestExecutionLevel: "admin",
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}Portable.${version}.${ext}",
        },
    },
}, {
    projectDirCreated: projectDir => {
        return (0, packTester_1.copyTestAsset)("headerIcon.ico", path.join(projectDir, "build", "foo test space.ico"));
    },
}));
test.ifDevOrWinCi("portable - splashImage", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["portable"]),
    config: {
        publish: null,
        portable: {
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}Portable.${version}.${ext}",
            splashImage: path.resolve((0, packTester_1.getFixtureDir)(), "installerHeader.bmp"),
        },
    },
}));
//# sourceMappingURL=portableTest.js.map
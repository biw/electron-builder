"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const path = require("path");
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
describe("squirrel.windows", { sequential: true }, () => {
    test.ifNotCiMac("Squirrel.Windows", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(["squirrel"]),
        config: {
            win: {
                compression: "normal",
            },
            executableName: "test with spaces",
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
    }, { signedWin: true }));
    test.ifNotCiMac("artifactName", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(["squirrel", "zip"]),
        config: {
            win: {
                // tslint:disable:no-invalid-template-strings
                artifactName: "Test ${name} foo.${ext}",
            },
        },
    }));
    // very slow
    test.skip("delta and msi", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel", electron_builder_1.Arch.ia32),
        config: {
            squirrelWindows: {
                remoteReleases: "https://github.com/develar/__test-app-releases",
                msi: true,
            },
        },
    }));
    test("squirrel window arm64 msi", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel", electron_builder_1.Arch.arm64),
        config: {
            squirrelWindows: {
                msi: true,
            },
        },
    }, { signedWin: true }));
    test("squirrel window x64 msi", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel", electron_builder_1.Arch.x64),
        config: {
            squirrelWindows: {
                msi: true,
            },
        },
    }, { signedWin: true }));
    test("squirrel window ia32 msi", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel", electron_builder_1.Arch.ia32),
        config: {
            squirrelWindows: {
                msi: true,
            },
        },
    }, { signedWin: true }));
    test("detect install-spinner", ({ expect }) => {
        let platformPackager = null;
        let loadingGifPath = null;
        return (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel"),
            platformPackagerFactory: (packager, platform) => (platformPackager = new CheckingPackager_1.CheckingWinPackager(packager)),
        }, {
            projectDirCreated: it => {
                loadingGifPath = path.join(it, "build", "install-spinner.gif");
                return (0, packTester_1.copyTestAsset)("install-spinner.gif", loadingGifPath);
            },
            packed: async () => {
                expect(platformPackager.effectiveDistOptions.loadingGif).toEqual(loadingGifPath);
            },
        });
    });
});
//# sourceMappingURL=squirrelWindowsTest.js.map
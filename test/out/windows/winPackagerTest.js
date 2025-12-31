"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs = require("fs/promises");
const path = require("path");
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
test("beta version", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.x64, electron_builder_1.Arch.arm64),
    config: {
        extraMetadata: {
            version: "3.0.0-beta.2",
        },
        nsis: {
            buildUniversalInstaller: false,
        },
    },
}, {
    signedWin: true,
}), { retry: 3 });
test("win zip", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["zip"], electron_builder_1.Arch.x64, electron_builder_1.Arch.arm64),
    config: {
        extraResources: [
            { from: "build", to: "./", filter: "*.asar" },
            { from: "build/subdir", to: "./subdir", filter: "*.asar" },
        ],
        electronLanguages: "en",
        downloadAlternateFFmpeg: true,
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
}, {
    signed: false,
    projectDirCreated: async (projectDir) => {
        await fs.mkdir(path.join(projectDir, "build", "subdir"));
        await fs.copyFile(path.join(projectDir, "build", "extraAsar.asar"), path.join(projectDir, "build", "subdir", "extraAsar2.asar"));
    },
}));
test("zip artifactName", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["zip"], electron_builder_1.Arch.x64),
    config: {
        //tslint:disable-next-line:no-invalid-template-strings
        artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
    },
}, {
    signedWin: true,
}));
test("icon < 256", ({ expect }) => (0, packTester_1.appThrows)(expect, (0, packTester_1.platform)(electron_builder_1.Platform.WINDOWS), {
    projectDirCreated: projectDir => fs.rename(path.join(projectDir, "build", "incorrect.ico"), path.join(projectDir, "build", "icon.ico")),
}));
test("icon not an image", ({ expect }) => (0, packTester_1.appThrows)(expect, (0, packTester_1.platform)(electron_builder_1.Platform.WINDOWS), {
    projectDirCreated: async (projectDir) => {
        const file = path.join(projectDir, "build", "icon.ico");
        // because we use hardlinks
        await fs.unlink(file);
        await fs.writeFile(file, "foo");
    },
}));
test.ifMac("custom icon", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel", electron_builder_1.Arch.x64),
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingWinPackager(packager)),
        config: {
            win: {
                icon: "customIcon",
            },
        },
    }, {
        projectDirCreated: projectDir => fs.rename(path.join(projectDir, "build", "icon.ico"), path.join(projectDir, "customIcon.ico")),
        packed: async (context) => {
            expect(await platformPackager.getIconPath()).toEqual(path.join(context.projectDir, "customIcon.ico"));
        },
    });
});
test("win icon from icns", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
        config: {
            mac: {
                icon: "icons/icon.icns",
            },
        },
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingWinPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([fs.unlink(path.join(projectDir, "build", "icon.ico")), fs.rm(path.join(projectDir, "build", "icons"), { recursive: true, force: true })]),
        packed: async () => {
            const file = await platformPackager.getIconPath();
            expect(file).toBeDefined();
        },
    });
});
//# sourceMappingURL=winPackagerTest.js.map
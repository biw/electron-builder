"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const winHelper_1 = require("../helpers/winHelper");
const nsisTarget = electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.x64);
function pickSnapshotDefines(defines) {
    return {
        APP_32_NAME: defines.APP_32_NAME,
        APP_64_NAME: defines.APP_64_NAME,
        APP_ARM64_NAME: defines.APP_ARM64_NAME,
        APP_FILENAME: defines.APP_FILENAME,
        APP_ID: defines.APP_ID,
        APP_PACKAGE_NAME: defines.APP_PACKAGE_NAME,
        APP_PRODUCT_FILENAME: defines.APP_PRODUCT_FILENAME,
        COMPANY_NAME: defines.COMPANY_NAME,
        ONE_CLICK: defines.ONE_CLICK,
        PRODUCT_FILENAME: defines.PRODUCT_FILENAME,
        PRODUCT_NAME: defines.PRODUCT_NAME,
        SHORTCUT_NAME: defines.SHORTCUT_NAME,
        UNINSTALL_DISPLAY_NAME: defines.UNINSTALL_DISPLAY_NAME,
    };
}
test("one-click", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.x64),
    config: {
        win: {
            signtoolOptions: {
                publisherName: "Foo, Inc",
            },
        },
        publish: {
            provider: "generic",
            // tslint:disable:no-invalid-template-strings
            url: "https://develar.s3.amazonaws.com/test/${os}/${arch}",
        },
        nsis: {
            deleteAppDataOnUninstall: true,
            packElevateHelper: false,
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
}, {
    signedWin: true,
    packed: async (context) => {
        await (0, winHelper_1.checkHelpers)(expect, context.getResources(electron_builder_1.Platform.WINDOWS, electron_builder_1.Arch.x64), false);
        await (0, winHelper_1.doTest)(expect, context.outDir, true, "TestApp Setup", "TestApp", null, false);
        await (0, winHelper_1.expectUpdateMetadata)(expect, context, electron_builder_1.Arch.x64, true);
    },
}));
test("custom guid", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        appId: "boo",
        productName: "boo Hub",
        publish: null,
        nsis: {
            guid: "Foo Technologies\\Bar",
        },
    },
}));
test("multi language license", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis", electron_builder_1.Arch.x64),
    config: {
        publish: null,
        nsis: {
            uninstallDisplayName: "Hi!!!",
            createDesktopShortcut: false,
        },
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, fs_extra_1.writeFile)(path.join(projectDir, "build", "license_en.txt"), "Hi"),
            (0, fs_extra_1.writeFile)(path.join(projectDir, "build", "license_ru.txt"), "Привет"),
            (0, fs_extra_1.writeFile)(path.join(projectDir, "build", "license_ko.txt"), "Привет"),
            (0, fs_extra_1.writeFile)(path.join(projectDir, "build", "license_fi.txt"), "Привет"),
        ]);
    },
}));
test("html license", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis", electron_builder_1.Arch.x64),
    config: {
        publish: null,
        nsis: {
            uninstallDisplayName: "Hi!!!",
            createDesktopShortcut: false,
        },
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, fs_extra_1.writeFile)(path.join(projectDir, "build", "license.html"), '<html><body><p>Hi <a href="https://google.com" target="_blank">google</a></p></body></html>'),
        ]);
    },
}));
test.ifDevOrWinCi("createDesktopShortcut always", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis", electron_builder_1.Arch.x64),
    config: {
        publish: null,
        nsis: {
            createDesktopShortcut: "always",
        },
    },
}));
test.ifDevOrLinuxCi("perMachine, no run after finish", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        // wine creates incorrect file names and registry entries for unicode, so, we use ASCII
        productName: "TestApp",
        fileAssociations: [
            {
                ext: "foo",
                name: "Test Foo",
            },
        ],
        nsis: {
            perMachine: true,
            runAfterFinish: false,
        },
        publish: {
            provider: "generic",
            // tslint:disable:no-invalid-template-strings
            url: "https://develar.s3.amazonaws.com/test/${os}/${arch}",
        },
        win: {
            electronUpdaterCompatibility: ">=2.16",
        },
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.copyTestAsset)("headerIcon.ico", path.join(projectDir, "build", "foo test space.ico")),
            (0, packTester_1.copyTestAsset)("license.txt", path.join(projectDir, "build", "license.txt")),
        ]);
    },
    packed: async (context) => {
        await (0, winHelper_1.expectUpdateMetadata)(expect, context);
        await (0, winHelper_1.checkHelpers)(expect, context.getResources(electron_builder_1.Platform.WINDOWS, electron_builder_1.Arch.ia32), true);
        await (0, winHelper_1.doTest)(expect, context.outDir, false);
    },
}));
test.skip("installerHeaderIcon", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => {
    let headerIconPath = null;
    return (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: nsisTarget,
        effectiveOptionComputed: async (it) => {
            const defines = it[0];
            expect(defines.HEADER_ICO).toEqual(headerIconPath);
            return Promise.resolve(false);
        },
    }, {
        projectDirCreated: projectDir => {
            headerIconPath = path.join(projectDir, "build", "installerHeaderIcon.ico");
            return Promise.all([(0, packTester_1.copyTestAsset)("headerIcon.ico", headerIconPath), (0, packTester_1.copyTestAsset)("headerIcon.ico", path.join(projectDir, "build", "uninstallerIcon.ico"))]);
        },
    });
});
test.ifDevOrLinuxCi("custom include", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, { targets: nsisTarget }, {
    projectDirCreated: projectDir => (0, packTester_1.copyTestAsset)("installer.nsh", path.join(projectDir, "build", "installer.nsh")),
    packed: context => Promise.all([
        (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "build", "customHeader")).isFile(),
        (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "build", "customInit")).isFile(),
        (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "build", "customInstall")).isFile(),
    ]),
}));
test.skip("big file pack", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: nsisTarget,
    config: {
        extraResources: ["**/*.mov"],
        nsis: {
            differentialPackage: false,
        },
    },
}, {
    projectDirCreated: async (projectDir) => {
        await (0, fs_extra_1.copyFile)("/Volumes/Pegasus/15.02.18.m4v", path.join(projectDir, "foo/bar/video.mov"));
    },
}));
test.ifDevOrLinuxCi("custom script", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, { targets: nsisTarget }, {
    projectDirCreated: projectDir => (0, packTester_1.copyTestAsset)("installer.nsi", path.join(projectDir, "build", "installer.nsi")),
    packed: context => (0, fileAssert_1.assertThat)(expect, path.join(context.projectDir, "build", "customInstallerScript")).isFile(),
}));
test("menuCategory", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        extraMetadata: {
            name: "test-menu-category",
            productName: "Test Menu Category",
        },
        publish: null,
        nsis: {
            oneClick: false,
            menuCategory: true,
            artifactName: "${productName} CustomName ${version}.${ext}",
        },
    },
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.name = "test-menu-category";
    }),
    packed: context => {
        return (0, winHelper_1.doTest)(expect, context.outDir, false, "Test Menu Category", "test-menu-category", "Foo Bar");
    },
}));
test("string menuCategory", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        extraMetadata: {
            name: "test-menu-category",
            productName: "Test Menu Category '",
        },
        publish: null,
        nsis: {
            oneClick: false,
            runAfterFinish: false,
            menuCategory: "Foo/Bar",
            // tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName} CustomName ${version}.${ext}",
        },
    },
}, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.name = "test-menu-category";
    }),
    packed: async (context) => {
        await (0, winHelper_1.doTest)(expect, context.outDir, false, "Test Menu Category", "test-menu-category", "Foo Bar");
    },
}));
test.ifDevOrLinuxCi("file associations per user", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        publish: null,
        fileAssociations: [
            {
                ext: "foo",
                name: "Test Foo",
            },
        ],
    },
}));
test.ifWindows.skip("custom exec name", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: nsisTarget,
    config: {
        productName: "foo",
        win: {
            executableName: "Boo",
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
    effectiveOptionComputed: async (it) => {
        expect(pickSnapshotDefines(it[0])).toMatchSnapshot();
        return Promise.resolve(false);
    },
}));
test.ifWindows.skip("top-level custom exec name", { timeout: packTester_1.EXTENDED_TIMEOUT }, ({ expect }) => (0, packTester_1.app)(expect, {
    targets: nsisTarget,
    config: {
        publish: null,
        productName: "foo",
        executableName: "Boo",
    },
    effectiveOptionComputed: async (it) => {
        expect(pickSnapshotDefines(it[0])).toMatchSnapshot();
        return Promise.resolve(false);
    },
}));
//# sourceMappingURL=oneClickInstallerTest.js.map
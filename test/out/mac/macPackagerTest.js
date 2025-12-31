"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const electron_builder_1 = require("electron-builder");
const fs = require("fs/promises");
const path = require("path");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const verifySmartUnpack_1 = require("../helpers/verifySmartUnpack");
test.ifMac("two-package", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app", {
    targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.MAC], null, "all"),
    config: {
        extraMetadata: {
            repository: "foo/bar",
        },
        downloadAlternateFFmpeg: true,
        mac: {
            electronUpdaterCompatibility: ">=2.16",
            electronLanguages: ["bn", "en"],
            timestamp: undefined,
            notarize: false,
        },
        dmg: {
            title: "Foo1",
        },
        //tslint:disable-next-line:no-invalid-template-strings
        artifactName: "${name}-${version}-${os}-${arch}.${ext}",
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
    signed: true,
    checkMacApp: async (appDir) => {
        const resources = await fs.readdir(path.join(appDir, "Contents", "Resources"));
        expect(resources.filter(it => !it.startsWith(".")).sort()).toMatchSnapshot();
        const electronFrameworkResources = await fs.readdir(path.join(appDir, "Contents", "Frameworks", "Electron Framework.framework", "Resources"));
        expect(electronFrameworkResources.filter(it => !it.startsWith(".")).sort()).toMatchSnapshot();
    },
}));
test.ifMac("one-package", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget(undefined, electron_builder_1.Arch.x64),
    config: {
        appId: "bar",
        publish: {
            provider: "generic",
            //tslint:disable-next-line:no-invalid-template-strings
            url: "https://develar.s3.amazonaws.com/test/${os}/${arch}",
        },
        downloadAlternateFFmpeg: false,
        dmg: {
            title: "Bar2",
        },
        mac: {
            // test appId per platform
            appId: "foo",
            extendInfo: {
                LSUIElement: true,
                CFBundleDocumentTypes: [
                    {
                        CFBundleTypeName: "Folders",
                        CFBundleTypeRole: "Editor",
                        LSItemContentTypes: ["public.folder"],
                    },
                ],
            },
            minimumSystemVersion: "10.12.0",
            fileAssociations: [
                {
                    ext: "foo",
                    name: "Foo",
                    role: "Viewer",
                },
                {
                    ext: "boo",
                    name: "Boo",
                    role: "Shell",
                    rank: "Owner",
                    isPackage: true,
                },
                {
                    ext: "bar",
                    name: "Bar",
                    role: "Shell",
                    rank: "Default",
                    // If I specify `fileAssociations.icon` as `build/foo.icns` will it know to use `build/foo.ico` for Windows?
                    icon: "someFoo.ico",
                },
            ],
        },
    },
}, {
    signed: false,
    projectDirCreated: projectDir => Promise.all([
        (0, builder_util_1.copyOrLinkFile)(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "build", "foo.icns")),
        (0, builder_util_1.copyOrLinkFile)(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "build", "someFoo.icns")),
    ]),
    checkMacApp: async (appDir, info) => {
        await (0, fileAssert_1.assertThat)(expect, path.join(appDir, "Contents", "Resources", "foo.icns")).isFile();
        await (0, fileAssert_1.assertThat)(expect, path.join(appDir, "Contents", "Resources", "someFoo.icns")).isFile();
    },
}));
test.ifMac("yarn two package.json w/ native module", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-two-native-modules", {
    targets: electron_builder_1.Platform.MAC.createTarget("zip", electron_builder_1.Arch.universal),
    config: {
        npmRebuild: true,
        nativeRebuilder: "sequential",
        files: ["!**/*.stamp", "!**/*.Makefile"],
    },
}, {
    signed: false,
    packed: async (context) => await (0, verifySmartUnpack_1.verifySmartUnpack)(expect, context.getResources(electron_builder_1.Platform.MAC, electron_builder_1.Arch.universal)),
}));
test.ifMac("electronDist", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
    config: {
        electronDist: "foo",
    },
}, {}, error => expect(error.message).toContain("Please provide a valid path to the Electron zip file, cache directory, or electron build directory.")));
test.ifWinCi("Build macOS on Windows is not supported", ({ expect }) => (0, packTester_1.appThrows)(expect, (0, packTester_1.platform)(electron_builder_1.Platform.MAC)));
test("multiple asar resources", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("zip", electron_builder_1.Arch.x64),
    config: {
        extraResources: [
            { from: "build", to: "./", filter: "*.asar" },
            { from: "build/subdir", to: "./subdir", filter: "*.asar" },
        ],
        electronLanguages: "en",
    },
}, {
    signed: true,
    projectDirCreated: async (projectDir) => {
        await fs.mkdir(path.join(projectDir, "build", "subdir"));
        await fs.copyFile(path.join(projectDir, "build", "extraAsar.asar"), path.join(projectDir, "build", "subdir", "extraAsar2.asar"));
    },
    checkMacApp: async (appDir, info) => {
        await (0, packTester_1.checkDirContents)(expect, path.join(appDir, "Contents", "Resources"));
    },
}));
//# sourceMappingURL=macPackagerTest.js.map
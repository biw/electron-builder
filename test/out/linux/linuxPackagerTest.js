"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const path = require("path");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const testConfig_1 = require("../helpers/testConfig");
const appImageTarget = electron_builder_1.Platform.LINUX.createTarget("appimage", electron_builder_1.Arch.x64);
// test update info file name
const testPublishConfig = {
    provider: "generic",
    url: "https://example.com/download",
};
test.ifNotWindows("AppImage", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        directories: {
            // tslint:disable:no-invalid-template-strings
            output: "dist/${os}",
        },
        downloadAlternateFFmpeg: true,
        publish: testPublishConfig,
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
test.ifNotWindows.ifNotCiMac("AppImage arm, max compression", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("Appimage", electron_builder_1.Arch.armv7l),
    config: {
        publish: testPublishConfig,
        compression: "maximum",
    },
}));
test.ifNotWindows.ifNotCiMac("AppImage - deprecated systemIntegration", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: appImageTarget,
    config: {
        appImage: {
            systemIntegration: "doNotAsk",
        },
    },
}));
test.ifNotWindows.ifNotCiMac("text license and file associations", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        extraResources: {
            from: "build/icons",
        },
        fileAssociations: [
            {
                ext: "my-app",
                name: "Test Foo",
                mimeType: "application/x-example",
            },
        ],
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            // copy full text to test presentation
            (0, packTester_1.copyTestAsset)("license_en.txt", path.join(projectDir, "build", "license.txt")),
        ]);
    },
}));
test.ifNotWindows.ifNotCiMac("html license", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
}, {
    projectDirCreated: projectDir => {
        return (0, fs_extra_1.outputFile)(path.join(projectDir, "build", "license.html"), `
        <html lang="en">
        <body>
          <a href="https://example.com">Test link</a>
        </body>
        </html>`);
    },
}));
test.ifNotWindows.ifNotCiMac("AppImage - default icon, custom executable and custom desktop", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        linux: {
            executableName: "Foo",
            // Example Spec: https://specifications.freedesktop.org/desktop-entry-spec/latest/example.html
            desktop: {
                entry: {
                    "X-Foo": "bar",
                    Terminal: "true",
                },
                desktopActions: {
                    Gallery: {
                        Exec: "fooview --gallery",
                        Name: "Browse Gallery",
                    },
                    Create: {
                        Exec: "fooview --create-new",
                        Name: "Create a new Foo!",
                        Icon: "fooview-new",
                    },
                    EmptyEntry: {},
                    NullEntry: null,
                },
            },
        },
        appImage: {
            // tslint:disable-next-line:no-invalid-template-strings
            artifactName: "boo-${productName}",
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
        const content = it.desktop;
        expect(content
            .split("\n")
            .filter(it => !it.includes("X-AppImage-BuildId") && !it.includes("X-AppImage-Version"))
            .join("\n")).toMatchSnapshot();
        return false;
    },
}, {
    projectDirCreated: it => fs.rm(path.join(it, "build"), { recursive: true, force: true }),
    packed: async (context) => {
        const projectDir = context.getContent(electron_builder_1.Platform.LINUX);
        await (0, fileAssert_1.assertThat)(expect, path.join(projectDir, "Foo")).isFile();
    },
}));
test.ifNotWindows("icons from ICNS (mac)", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        publish: null,
        mac: {
            icon: "resources/time.icns",
        },
        // test https://github.com/electron-userland/electron-builder/issues/3510
        linux: {
            artifactName: "app-${version}-${arch}.${ext}",
        },
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs
            .mkdir(path.join(projectDir, "resources"), { recursive: true })
            .then(() => fs.rename(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "resources", "time.icns")));
        await fs.rm(path.join(projectDir, "build"), { recursive: true, force: true });
    },
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await (0, fileAssert_1.assertThat)(expect, projectDir).isDirectory();
    },
}));
test.ifNotWindows("icons from ICNS if nothing specified", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        publish: null,
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs.rm(path.join(projectDir, "build", "icons"), { recursive: true, force: true });
    },
}));
test.ifNotWindows("icons from dir and one icon with suffix", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        publish: null,
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs.copyFile(path.join(projectDir, "build", "icons", "16x16.png"), path.join(projectDir, "build", "icons", "16x16-dev.png"));
    },
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await (0, fileAssert_1.assertThat)(expect, projectDir).isDirectory();
    },
}));
test.ifNotWindows("icons dir with images without size in the filename", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        publish: null,
        win: {
            // doesn't matter, but just to be sure that presence of this configuration doesn't lead to errors
            icon: "icons/icon.ico",
        },
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs.rename(path.join(projectDir, "build", "icons", "256x256.png"), path.join(projectDir, "build", "icon.png"));
        await fs.rm(path.join(projectDir, "build", "icons"), { recursive: true, force: true });
        await fs.rename(path.join(projectDir, "build"), path.join(projectDir, "icons"));
    },
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await (0, fileAssert_1.assertThat)(expect, projectDir).isDirectory();
    },
}));
// test prepacked asar also https://github.com/electron-userland/electron-builder/issues/1102
test.ifNotWindows("icons from ICNS", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: appImageTarget,
    config: {
        publish: null,
    },
}, {
    projectDirCreated: it => fs.rm(path.join(it, "build", "icons"), { recursive: true, force: true }),
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await fs.rm(path.join(projectDir, "inspector"), { recursive: true, force: true });
        await (0, electron_builder_1.build)({
            targets: appImageTarget,
            projectDir,
            publish: "never",
            config: {
                electronVersion: testConfig_1.ELECTRON_VERSION,
                compression: "store",
                npmRebuild: false,
            },
        });
        await (0, fileAssert_1.assertThat)(expect, path.join(projectDir, "dist")).isDirectory();
    },
}));
test.ifNotWindows("no-author-email", ({ expect }) => (0, packTester_1.appThrows)(expect, { targets: electron_builder_1.Platform.LINUX.createTarget("deb", electron_builder_1.Arch.x64) }, {
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
        data.author = "Foo";
    }),
}));
test.ifNotWindows("forbid desktop.Exec", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: appImageTarget,
    config: {
        linux: {
            desktop: {
                entry: {
                    Exec: "foo",
                },
            },
        },
    },
}));
//# sourceMappingURL=linuxPackagerTest.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs = require("fs/promises");
const packTester_1 = require("../helpers/packTester");
const defaultDebTarget = electron_builder_1.Platform.LINUX.createTarget("deb", electron_builder_1.Arch.x64);
test.ifNotWindows("deb", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: defaultDebTarget,
}));
test.ifNotWindows("arm", ({ expect }) => (0, packTester_1.app)(expect, { targets: electron_builder_1.Platform.LINUX.createTarget("deb", electron_builder_1.Arch.armv7l, electron_builder_1.Arch.arm64) }));
test.ifNotWindows("custom depends", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: defaultDebTarget,
    config: {
        linux: {
            executableName: "Boo",
        },
        deb: {
            depends: ["foo"],
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
test.ifNotWindows("top-level exec name", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: defaultDebTarget,
    config: {
        productName: "foo",
        executableName: "Boo",
    },
}));
test.ifNotWindows("no quotes for safe exec name", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: defaultDebTarget,
    config: {
        productName: "foo",
        linux: {
            executableName: "Boo",
        },
    },
    effectiveOptionComputed: async (it) => {
        const content = await fs.readFile(it[1], "utf8");
        expect(content).toMatchSnapshot();
        return false;
    },
}));
test.ifNotWindows("executable path in postinst script", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: defaultDebTarget,
    config: {
        productName: "foo",
        linux: {
            executableName: "Boo",
        },
    },
}, {
    packed: async (context) => {
        const postinst = (await (0, packTester_1.execShell)(`ar p '${context.outDir}/TestApp_1.1.0_amd64.deb' control.tar.xz | ${await (0, packTester_1.getTarExecutable)()} -Jx --to-stdout ./postinst`, {
            maxBuffer: 10 * 1024 * 1024,
        })).stdout;
        expect(postinst.trim()).toMatchSnapshot();
    },
}));
test.ifNotWindows("deb file associations", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: defaultDebTarget,
    config: {
        fileAssociations: [
            {
                ext: "my-app",
                name: "Test Foo",
                mimeType: "application/x-example",
            },
        ],
    },
}, {
    packed: async (context) => {
        const mime = (await (0, packTester_1.execShell)(`ar p '${context.outDir}/TestApp_1.1.0_amd64.deb' data.tar.xz | ${await (0, packTester_1.getTarExecutable)()} -Jx --to-stdout './usr/share/mime/packages/testapp.xml'`, {
            maxBuffer: 10 * 1024 * 1024,
        })).stdout;
        expect(mime.trim()).toMatchSnapshot();
    },
}));
//# sourceMappingURL=debTest.js.map
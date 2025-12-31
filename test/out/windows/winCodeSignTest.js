"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const js_yaml_1 = require("js-yaml");
const path = require("path");
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
test("parseDn", ({ expect }) => {
    expect((0, builder_util_runtime_1.parseDn)("CN=7digital Limited, O=7digital Limited, L=London, C=GB")).toMatchSnapshot();
    expect((0, js_yaml_1.load)("publisherName:\n  - 7digital Limited")).toMatchObject({ publisherName: ["7digital Limited"] });
});
const windowsDirTarget = electron_builder_1.Platform.WINDOWS.createTarget(["dir"]);
test("sign nested asar unpacked executables", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        publish: "never",
        asarUnpack: ["assets"],
    },
}, {
    signedWin: true,
    projectDirCreated: async (projectDir) => {
        await (0, fs_extra_1.outputFile)(path.join(projectDir, "assets", "nested", "nested", "file.exe"), "invalid PE file");
    },
}, error => {
    if (process.platform === "win32") {
        expect(error.message).toContain("This file format cannot be signed because it is not recognized.");
    }
    else {
        expect(error.message).toContain("Unrecognized file type");
    }
}));
function testCustomSign(expect, sign) {
    return (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
        platformPackagerFactory: (packager, platform) => new CheckingPackager_1.CheckingWinPackager(packager),
        config: {
            win: {
                signtoolOptions: {
                    certificatePassword: "pass",
                    certificateFile: "secretFile",
                    sign,
                    signingHashAlgorithms: ["sha256"],
                },
                // to be sure that sign code will be executed
                forceCodeSigning: true,
            },
        },
    });
}
test("certificateFile/password - sign as async/await", ({ expect }) => testCustomSign(expect, async () => {
    return Promise.resolve();
}));
test("certificateFile/password - sign as Promise", ({ expect }) => testCustomSign(expect, () => Promise.resolve()));
test("certificateFile/password - sign as function", async ({ expect }) => testCustomSign(expect, (await Promise.resolve().then(() => require("../helpers/customWindowsSign"))).default));
test("certificateFile/password - sign as path", ({ expect }) => testCustomSign(expect, path.join(__dirname, "../helpers/customWindowsSign.mjs")));
test("custom sign if no code sign info", ({ expect }) => {
    let called = false;
    return (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
        platformPackagerFactory: (packager, platform) => new CheckingPackager_1.CheckingWinPackager(packager),
        config: {
            win: {
                // to be sure that sign code will be executed
                forceCodeSigning: true,
                signtoolOptions: {
                    sign: async () => {
                        called = true;
                    },
                },
            },
        },
    }, {
        packed: async () => {
            expect(called).toBe(true);
        },
    });
});
test("forceCodeSigning", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: windowsDirTarget,
    config: {
        forceCodeSigning: true,
    },
}));
test("electronDist", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: windowsDirTarget,
    config: {
        electronDist: "foo",
    },
}, {}, error => expect(error.message).toContain("Please provide a valid path to the Electron zip file, cache directory, or electron build directory.")));
test("azure signing without credentials", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: windowsDirTarget,
    config: {
        forceCodeSigning: true,
        win: {
            azureSignOptions: {
                publisherName: "test",
                endpoint: "https://weu.codesigning.azure.net/",
                certificateProfileName: "profilenamehere",
                codeSigningAccountName: "codesigningnamehere",
            },
        },
    },
}, {}, error => expect(error.message).toContain("Unable to find valid azure env field AZURE_TENANT_ID for signing.")));
test.ifNotWindows("win code sign using pwsh", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
}, {
    signedWin: true,
}));
//# sourceMappingURL=winCodeSignTest.js.map
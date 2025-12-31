"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fast_xml_parser_1 = require("fast-xml-parser");
const fs = require("fs");
const packTester_1 = require("../helpers/packTester");
const parser = new fast_xml_parser_1.XMLParser({
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: true,
});
test.ifDevOrWinCi("msiWrapped requires nsis", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget("msiWrapped"),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "Test MSI",
        win: {
            target: ["msiWrapped"],
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
}, {}, error => {
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("No nsis target found! Please specify an nsis target");
}));
test.ifDevOrWinCi("msiWrapped allows capitalized nsis target", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["msiWrapped", "NSIS"]),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "Test MSI",
        win: {
            target: ["msiWrapped", "NSIS"],
        },
    },
}, {}));
test.ifDevOrWinCi("msiWrapped includes packaged exe", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["msiWrapped", "nsis"]),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "MSIWrappingEXE",
        win: {
            target: ["msiWrapped", "nsis"],
        },
        msiProjectCreated: async (path) => {
            const msiContents = await fs.promises.readFile(path, "utf8");
            const contents = parser.parse(msiContents);
            expect(contents["Wix"]["Product"]["Binary"]["@_SourceFile"]).toMatch(/^.*\.(exe|EXE)/);
            expect(contents["Wix"]["Product"]["InstallExecuteSequence"]).toBeTruthy();
        },
    },
}));
test.ifDevOrWinCi("msiWrapped impersonate no if not provided", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["msiWrapped", "nsis"]),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "MSIWrappingEXE",
        win: {
            target: ["msiWrapped", "nsis"],
        },
        msiProjectCreated: async (path) => {
            const msiContents = await fs.promises.readFile(path, "utf8");
            const contents = parser.parse(msiContents);
            expect(contents["Wix"]["Product"]["CustomAction"]["@_Impersonate"]).toEqual("no");
        },
    },
}));
test.ifDevOrWinCi("msiWrapped impersonate yes if true", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["msiWrapped", "nsis"]),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "MSIWrappingEXE",
        win: {
            target: ["msiWrapped", "nsis"],
        },
        msiWrapped: {
            impersonate: true,
        },
        msiProjectCreated: async (path) => {
            const msiContents = await fs.promises.readFile(path, "utf8");
            const contents = parser.parse(msiContents);
            expect(contents["Wix"]["Product"]["CustomAction"]["@_Impersonate"]).toEqual("yes");
        },
    },
}));
test.ifDevOrWinCi("msiWrapped wrappedInstallerArgs provided", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["msiWrapped", "nsis"]),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "MSIWrappingEXE",
        win: {
            target: ["msiWrapped", "nsis"],
        },
        msiWrapped: {
            wrappedInstallerArgs: "/currentuser /S /wut",
        },
        msiProjectCreated: async (path) => {
            const msiContents = await fs.promises.readFile(path, "utf8");
            const contents = parser.parse(msiContents);
            expect(contents["Wix"]["Product"]["CustomAction"]["@_ExeCommand"]).toEqual("/currentuser /S /wut");
        },
    },
}));
//# sourceMappingURL=msiWrappedTest.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asar_1 = require("app-builder-lib/out/asar/asar");
const electron_builder_1 = require("electron-builder");
const builder_1 = require("electron-builder/out/builder");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
function createExtraMetadataTest(expect, asar) {
    return (0, packTester_1.app)(expect, {
        targets: packTester_1.linuxDirTarget,
        config: (0, builder_1.coerceTypes)({
            asar,
            linux: {
                executableName: "new-name",
            },
            extraMetadata: {
                version: "1.0.0-beta.19",
                foo: {
                    bar: 12,
                    updated: "true",
                    disabled: "false",
                },
                rootKey: "false",
                rootKeyT: "true",
                rootKeyN: "null",
            },
        }),
    }, {
        projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.scripts = {};
            data.foo = {
                bar: 42,
                existingProp: 22,
            };
        }),
        packed: async (context) => {
            await (0, fileAssert_1.assertThat)(expect, path.join(context.getContent(electron_builder_1.Platform.LINUX), "new-name")).isFile();
            if (asar) {
                expect(await (0, asar_1.readAsarJson)(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app.asar"), "package.json")).toMatchSnapshot();
            }
            else {
                expect(await (0, fs_extra_1.readJson)(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "package.json"))).toMatchSnapshot();
            }
        },
    });
}
test("extra metadata", ({ expect }) => createExtraMetadataTest(expect, true));
test("extra metadata (no asar)", ({ expect }) => createExtraMetadataTest(expect, false));
test("cli", ({ expect }) => {
    // because these methods are internal
    const { configureBuildCommand, normalizeOptions } = require("electron-builder/out/builder");
    const yargs = require("yargs")
        .strict()
        .fail((message, error) => {
        throw error || new Error(message);
    });
    configureBuildCommand(yargs);
    function parse(input) {
        return normalizeOptions(yargs.parse(input.split(" ")));
    }
    function parseExtraMetadata(input) {
        const result = parse(input);
        delete result.targets;
        return result;
    }
    expect(parseExtraMetadata("--c.extraMetadata.foo=bar")).toMatchSnapshot();
    expect(parseExtraMetadata("--c.extraMetadata.dev.login-url")).toMatchSnapshot();
});
//# sourceMappingURL=extraMetadataTest.js.map
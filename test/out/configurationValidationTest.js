"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("app-builder-lib/out/util/config/config");
const builder_util_1 = require("builder-util");
const electron_builder_1 = require("electron-builder");
const builder_1 = require("electron-builder/out/builder");
const packTester_1 = require("./helpers/packTester");
test.ifDevOrLinuxCi("validation", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        foo: 123,
        mac: {
            foo: 12123,
        },
    },
}, undefined, error => error.message.includes("configuration has an unknown property 'foo'")));
test.ifDevOrLinuxCi("appId as object", ({ expect }) => (0, packTester_1.appThrows)(expect, {
    targets: packTester_1.linuxDirTarget,
    config: {
        appId: {},
    },
}));
// https://github.com/electron-userland/electron-builder/issues/1302
test.ifDevOrLinuxCi("extraFiles", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("appimage", builder_util_1.Arch.x64),
    config: {
        linux: {
            target: "zip:ia32",
        },
        extraFiles: [
            "lib/*.jar",
            "lib/Proguard/**/*",
            {
                from: "lib/",
                to: ".",
                filter: ["*.dll"],
            },
            {
                from: "lib/",
                to: ".",
                filter: ["*.exe"],
            },
            "BLClient/BLClient.json",
            {
                from: "include/",
                to: ".",
            },
        ],
    },
}));
test.ifDevOrLinuxCi("files", ({ expect }) => {
    return (0, config_1.validateConfiguration)({
        appId: "com.example.myapp",
        files: [{ from: "dist/app", to: "app", filter: "*.js" }],
        win: {
            target: "NSIS",
            icon: "build/icon.ico",
        },
    }, new builder_util_1.DebugLogger());
});
test.ifDevOrLinuxCi("null string as null", async ({ expect }) => {
    const yargs = (0, builder_1.configureBuildCommand)((0, builder_1.createYargs)());
    const options = (0, builder_1.normalizeOptions)(yargs.parse(["-c.mac.identity=null", "--config.mac.hardenedRuntime=false"]));
    const config = options.config;
    await (0, config_1.validateConfiguration)(config, new builder_util_1.DebugLogger());
    expect(config.mac.identity).toBeNull();
    expect(config.mac.hardenedRuntime).toBe(false);
});
//# sourceMappingURL=configurationValidationTest.js.map
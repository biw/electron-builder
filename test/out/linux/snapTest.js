"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
test.ifDevOrLinuxCi("snap", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
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
test.ifDevOrLinuxCi("arm", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("snap", electron_builder_1.Arch.armv7l),
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
    },
}));
test.ifDevOrLinuxCi("default stagePackages", async ({ expect }) => {
    for (const p of [["default"], ["default", "custom"], ["custom", "default"], ["foo1", "default", "foo2"]]) {
        await (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: packTester_1.snapTarget,
            config: {
                extraMetadata: {
                    name: "sep",
                },
                productName: "Sep",
                snap: {
                    stagePackages: p,
                    plugs: p,
                    confinement: "classic",
                    // otherwise "parts" will be removed
                    useTemplateApp: false,
                },
            },
            effectiveOptionComputed: async ({ snap, args }) => {
                delete snap.parts.app.source;
                expect(snap).toMatchSnapshot();
                expect(args).not.toContain("--exclude");
                return true;
            },
        });
    }
});
test.ifDevOrLinuxCi("classic confinement", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "cl-co-app",
        },
        productName: "Snap Electron App (classic confinement)",
        snap: {
            confinement: "classic",
        },
    },
}));
test.ifDevOrLinuxCi("buildPackages", async ({ expect }) => {
    await (0, packTester_1.assertPack)(expect, "test-app-one", {
        targets: packTester_1.snapTarget,
        config: {
            extraMetadata: {
                name: "sep",
            },
            productName: "Sep",
            snap: {
                buildPackages: ["foo1", "default", "foo2"],
                // otherwise "parts" will be removed
                useTemplateApp: false,
            },
        },
        effectiveOptionComputed: async ({ snap }) => {
            delete snap.parts.app.source;
            expect(snap).toMatchSnapshot();
            return true;
        },
    });
});
test.ifDevOrLinuxCi("plugs option", async ({ expect }) => {
    for (const p of [
        [
            {
                "browser-sandbox": {
                    interface: "browser-support",
                    "allow-sandbox": true,
                },
            },
            "another-simple-plug-name",
        ],
        {
            "browser-sandbox": {
                interface: "browser-support",
                "allow-sandbox": true,
            },
            "another-simple-plug-name": null,
        },
    ]) {
        await (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: packTester_1.snapTarget,
            config: {
                snap: {
                    plugs: p,
                    // otherwise "parts" will be removed
                    useTemplateApp: false,
                },
            },
            effectiveOptionComputed: async ({ snap, args }) => {
                delete snap.parts.app.source;
                expect(snap).toMatchSnapshot();
                expect(args).not.toContain("--exclude");
                return true;
            },
        });
    }
});
test.ifDevOrLinuxCi("slots option", async ({ expect }) => {
    for (const slots of [
        ["foo", "bar"],
        [
            {
                mpris: {
                    interface: "mpris",
                    name: "chromium",
                },
            },
            "another-simple-slot-name",
        ],
    ]) {
        await (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: packTester_1.snapTarget,
            config: {
                extraMetadata: {
                    name: "sep",
                },
                productName: "Sep",
                snap: {
                    slots,
                },
            },
            effectiveOptionComputed: async ({ snap, args }) => {
                expect(snap).toMatchSnapshot();
                return true;
            },
        });
    }
});
test.ifDevOrLinuxCi("custom env", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            environment: {
                FOO: "bar",
            },
        },
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        return true;
    },
}));
test.ifDevOrLinuxCi("custom after, no desktop", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            after: ["bar"],
        },
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        return true;
    },
}));
test.ifDevOrLinuxCi("no desktop plugs", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            plugs: ["foo", "bar"],
        },
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        expect(args).toContain("--exclude");
        return true;
    },
}));
test.ifDevOrLinuxCi("auto start", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            autoStart: true,
        },
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        expect(snap.apps.sep.autostart).toEqual("sep.desktop");
        return true;
    },
}));
test.ifDevOrLinuxCi("default compression", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        return true;
    },
}));
test.ifDevOrLinuxCi("compression option", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            useTemplateApp: false,
            compression: "xz",
        },
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        expect(snap.compression).toBe("xz");
        expect(args).toEqual(expect.arrayContaining(["--compression", "xz"]));
        return true;
    },
}));
test.ifDevOrLinuxCi("default base", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        productName: "Sep",
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        expect(snap.base).toBe("core20");
        return true;
    },
}));
test.ifDevOrLinuxCi("base option", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        productName: "Sep",
        snap: {
            base: "core22",
        },
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        expect(snap.base).toBe("core22");
        return true;
    },
}));
test.ifDevOrLinuxCi("use template app", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.snapTarget,
    config: {
        snap: {
            useTemplateApp: true,
            compression: "xz",
        },
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        expect(snap.parts).toBeUndefined();
        expect(snap.compression).toBeUndefined();
        expect(snap.contact).toBeUndefined();
        expect(snap.donation).toBeUndefined();
        expect(snap.issues).toBeUndefined();
        expect(snap.parts).toBeUndefined();
        expect(snap["source-code"]).toBeUndefined();
        expect(snap.website).toBeUndefined();
        expect(args).toEqual(expect.arrayContaining(["--exclude", "chrome-sandbox", "--compression", "xz"]));
        return true;
    },
}));
//# sourceMappingURL=snapTest.js.map
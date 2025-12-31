"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const electron_builder_1 = require("electron-builder");
const fs = require("fs/promises");
const path = require("path");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const dmgUtil_1 = require("dmg-builder/out/dmgUtil");
const dmgTarget = electron_builder_1.Platform.MAC.createTarget("dmg", builder_util_1.Arch.x64);
const defaultTarget = electron_builder_1.Platform.MAC.createTarget(undefined, builder_util_1.Arch.x64);
describe("dmg", { concurrent: true }, () => {
    test.ifMac("dmg", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: dmgTarget,
        config: {
            productName: "Default-Dmg",
            publish: null,
        },
    }));
    test.ifMac("no build directory", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: dmgTarget,
        config: {
            // dmg can mount only one volume name, so, to test in parallel, we set different product name
            productName: "NoBuildDirectory",
            publish: null,
            dmg: {
                title: "Foo",
            },
        },
        effectiveOptionComputed: async (it) => {
            if (!("volumePath" in it)) {
                return false;
            }
            const volumePath = it.volumePath;
            await (0, fileAssert_1.assertThat)(expect, path.join(volumePath, ".background.tiff")).isFile();
            await (0, fileAssert_1.assertThat)(expect, path.join(volumePath, "Applications")).isSymbolicLink();
            expect(it.specification.contents.map((c) => ({
                ...c,
                path: path.extname(c.path) === ".app" ? path.basename(c.path) : c.path,
            }))).toMatchSnapshot();
            return false;
        },
    }, {
        projectDirCreated: projectDir => fs.rm(path.join(projectDir, "build"), { recursive: true, force: true }),
    }));
    test.ifMac("background color", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: dmgTarget,
        config: {
            // dmg can mount only one volume name, so, to test in parallel, we set different product name
            productName: "BackgroundColor",
            publish: null,
            dmg: {
                backgroundColor: "orange",
                // speed-up test
                writeUpdateInfo: false,
                title: "Bar",
            },
        },
        effectiveOptionComputed: async (it) => {
            if (!("volumePath" in it)) {
                return false;
            }
            delete it.specification.icon;
            expect(it.specification).toMatchSnapshot();
            return Promise.resolve(false);
        },
    }));
    test.ifMac("custom background - new way", ({ expect }) => {
        const customBackground = "customBackground.png";
        return (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: defaultTarget,
            config: {
                productName: "CustomBackground",
                publish: null,
                mac: {
                    icon: "customIcon",
                },
                dmg: {
                    background: customBackground,
                    icon: "foo.icns",
                    // speed-up test
                    writeUpdateInfo: false,
                    title: "Custom Background",
                },
            },
            effectiveOptionComputed: async (it) => {
                expect(it.specification.background).toMatch(new RegExp(`.+${customBackground}$`));
                expect(it.specification.icon).toEqual("foo.icns");
                const packager = it.packager;
                expect(await packager.getIconPath()).toEqual(path.join(packager.projectDir, "build", "customIcon.icns"));
                if (!("volumePath" in it)) {
                    return false;
                }
                await (0, fileAssert_1.assertThat)(expect, path.join(it.volumePath, ".VolumeIcon.icns")).isFile();
                return Promise.resolve(true);
            },
        }, {
            projectDirCreated: projectDir => Promise.all([
                (0, builder_util_1.copyFile)(path.join((0, dmgUtil_1.getDmgTemplatePath)(), "background.tiff"), path.join(projectDir, customBackground)),
                // copy, but not rename to test that default icon is not used
                (0, builder_util_1.copyFile)(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "build", "customIcon.icns")),
                (0, builder_util_1.copyFile)(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "foo.icns")),
            ]),
        });
    });
    test.ifMac("retina background as 2 png", ({ expect }) => {
        return (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: defaultTarget,
            config: {
                productName: "RetinaBackground",
                publish: null,
                dmg: {
                    title: "Retina Background",
                },
            },
            effectiveOptionComputed: async (it) => {
                expect(it.specification.background).toMatch(/\.tiff$/);
                return Promise.resolve(true);
            },
        }, {
            projectDirCreated: async (projectDir) => {
                const resourceDir = path.join(projectDir, "build");
                await (0, builder_util_1.copyFile)(path.join((0, dmgUtil_1.getDmgTemplatePath)(), "background.tiff"), path.join(resourceDir, "background.tiff"));
                async function extractPng(index, suffix) {
                    await (0, builder_util_1.exec)("tiffutil", ["-extract", index.toString(), path.join((0, dmgUtil_1.getDmgTemplatePath)(), "background.tiff")], {
                        cwd: projectDir,
                    });
                    await (0, builder_util_1.exec)("sips", ["-s", "format", "png", "out.tiff", "--out", `background${suffix}.png`], {
                        cwd: projectDir,
                    });
                }
                await extractPng(0, "");
                await extractPng(1, "@2x");
                await fs.unlink(path.join(resourceDir, "background.tiff"));
            },
        });
    });
    test.ifMac.skip("no Applications link", ({ expect }) => {
        return (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: defaultTarget,
            config: {
                publish: null,
                productName: "No-ApplicationsLink",
                dmg: {
                    title: "No Applications Link",
                    contents: [
                        {
                            x: 110,
                            y: 150,
                        },
                        {
                            x: 410,
                            y: 440,
                            type: "link",
                            path: "/Applications/TextEdit.app",
                        },
                    ],
                },
            },
            effectiveOptionComputed: async (it) => {
                if (!("volumePath" in it)) {
                    return false;
                }
                const volumePath = it.volumePath;
                await Promise.all([
                    (0, fileAssert_1.assertThat)(expect, path.join(volumePath, ".background.tiff")).isFile(),
                    (0, fileAssert_1.assertThat)(expect, path.join(volumePath, "Applications")).doesNotExist(),
                    (0, fileAssert_1.assertThat)(expect, path.join(volumePath, "TextEdit.app")).isSymbolicLink(),
                    (0, fileAssert_1.assertThat)(expect, path.join(volumePath, "TextEdit.app")).isDirectory(),
                ]);
                expect(it.specification.contents).toMatchSnapshot();
                return false;
            },
        });
    });
    test.ifMac("unset dmg icon", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: dmgTarget,
        config: {
            publish: null,
            // dmg can mount only one volume name, so, to test in parallel, we set different product name
            productName: "No_Volume_Icon",
            dmg: {
                icon: null,
            },
        },
    }, {
        packed: context => {
            return (0, dmgUtil_1.attachAndExecute)(path.join(context.outDir, "No_Volume_Icon-1.1.0.dmg"), false, () => {
                return Promise.all([
                    (0, fileAssert_1.assertThat)(expect, path.join("/Volumes/No_Volume_Icon 1.1.0/.background.tiff")).isFile(),
                    (0, fileAssert_1.assertThat)(expect, path.join("/Volumes/No_Volume_Icon 1.1.0/.VolumeIcon.icns")).doesNotExist(),
                ]);
            });
        },
    }));
    // test also "only dmg"
    test.ifMac("no background", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: dmgTarget,
        config: {
            publish: null,
            // dmg can mount only one volume name, so, to test in parallel, we set different product name
            productName: "No-Background",
            dmg: {
                background: null,
                title: "Foo",
            },
        },
    }, {
        packed: context => {
            return (0, dmgUtil_1.attachAndExecute)(path.join(context.outDir, "No-Background-1.1.0.dmg"), false, () => {
                return (0, fileAssert_1.assertThat)(expect, path.join("/Volumes/No-Background 1.1.0/.background.tiff")).doesNotExist();
            });
        },
    }));
    // test also darkModeSupport
    test.ifMac("bundleShortVersion", ({ expect }) => (0, packTester_1.app)(expect, {
        targets: dmgTarget,
        config: {
            publish: null,
            // dmg can mount only one volume name, so, to test in parallel, we set different product name
            productName: "Bundle-ShortVersion",
            mac: {
                bundleShortVersion: "2017.1-alpha5",
                darkModeSupport: true,
            },
            dmg: {
                title: "bundleShortVersion",
            },
        },
    }));
    test.ifMac("disable dmg icon (light), bundleVersion", ({ expect }) => {
        return (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: defaultTarget,
            config: {
                publish: null,
                productName: "Disable-Icon",
                dmg: {
                    icon: null,
                    title: "Disable Icon",
                },
                mac: {
                    bundleVersion: "50",
                },
            },
            effectiveOptionComputed: async (it) => {
                expect(it.specification.icon).toBeNull();
                expect(it.packager.appInfo.buildVersion).toEqual("50");
                expect(await it.packager.getIconPath()).not.toBeNull();
                return Promise.resolve(true);
            },
        });
    });
    const packagerOptions = (uniqueKey) => ({
        targets: dmgTarget,
        config: {
            publish: null,
            productName: "Foo-" + uniqueKey,
            dmg: {
                title: "Foo " + uniqueKey,
            },
        },
    });
    test.ifMac("multi language license", ({ expect }) => (0, packTester_1.app)(expect, packagerOptions(1), {
        projectDirCreated: projectDir => {
            return Promise.all([
                // writeFile(path.join(projectDir, "build", "license_en.txt"), "Hi"),
                fs.writeFile(path.join(projectDir, "build", "license_de.txt"), "Hallo"),
                fs.writeFile(path.join(projectDir, "build", "license_ja.txt"), "こんにちは"),
            ]);
        },
    }));
    test.ifMac("license ja", ({ expect }) => (0, packTester_1.app)(expect, packagerOptions(2), {
        projectDirCreated: projectDir => {
            return fs.writeFile(path.join(projectDir, "build", "license_ja.txt"), "こんにちは".repeat(12));
        },
    }));
    test.ifMac("license en", ({ expect }) => (0, packTester_1.app)(expect, packagerOptions(3), {
        projectDirCreated: projectDir => {
            return (0, packTester_1.copyTestAsset)("license_en.txt", path.join(projectDir, "build", "license_en.txt"));
        },
    }));
    test.ifMac("license rtf", ({ expect }) => (0, packTester_1.app)(expect, packagerOptions(4), {
        projectDirCreated: projectDir => {
            return (0, packTester_1.copyTestAsset)("license_de.rtf", path.join(projectDir, "build", "license_de.rtf"));
        },
    }));
    test.ifMac("license buttons config", ({ expect }) => (0, packTester_1.app)(expect, {
        ...packagerOptions(5),
        effectiveOptionComputed: async (it) => {
            if ("licenseData" in it) {
                // Clean `file` path from the data because the path is dynamic at runtime
                it.licenseData.body.forEach((license) => {
                    delete license.file;
                });
                expect(it.licenseData).toMatchSnapshot();
            }
            return Promise.resolve(false);
        },
    }, {
        projectDirCreated: projectDir => Promise.all([
            (0, packTester_1.copyTestAsset)("license_en.txt", path.join(projectDir, "build", "license_en.txt")),
            (0, packTester_1.copyTestAsset)("license_fr.txt", path.join(projectDir, "build", "license_fr.txt")),
            (0, packTester_1.copyTestAsset)("license_ja.txt", path.join(projectDir, "build", "license_ja.txt")),
            (0, packTester_1.copyTestAsset)("license_ko.txt", path.join(projectDir, "build", "license_ko.txt")),
            (0, packTester_1.copyTestAsset)("licenseButtons_en.yml", path.join(projectDir, "build", "licenseButtons_en.yml")),
            (0, packTester_1.copyTestAsset)("licenseButtons_fr.json", path.join(projectDir, "build", "licenseButtons_fr.json")),
            (0, packTester_1.copyTestAsset)("licenseButtons_ja.json", path.join(projectDir, "build", "licenseButtons_ja.json")),
            (0, packTester_1.copyTestAsset)("licenseButtons_ko.json", path.join(projectDir, "build", "licenseButtons_ko.json")),
        ]),
    }));
});
//# sourceMappingURL=dmgTest.js.map
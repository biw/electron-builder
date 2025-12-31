"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plist_1 = require("app-builder-lib/out/util/plist");
const electron_builder_1 = require("electron-builder");
const fs = require("fs/promises");
const path = require("path");
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
async function assertIcon(expect, platformPackager) {
    const file = await platformPackager.getIconPath();
    expect(file).toBeDefined();
    const result = await platformPackager.resolveIcon([file], [], "set");
    result.forEach(it => {
        it.file = path.basename(it.file);
    });
    expect(result).toMatchSnapshot();
}
const targets = electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64);
const iconComposerFixture = path.join(__dirname, "..", "..", "fixtures", "macos-icon-composer-assets", "electron.icon");
test.ifMac("icon composer generate asset catalog", ({ expect }) => {
    return (0, packTester_1.app)(expect, {
        targets,
        config: {
            mac: {
                icon: "icon.icon",
            },
        },
    }, {
        projectDirCreated: async (projectDir) => {
            await Promise.all([fs.unlink(path.join(projectDir, "build", "icon.icns")), fs.unlink(path.join(projectDir, "build", "icon.ico"))]);
            await fs.cp(iconComposerFixture, path.join(projectDir, "build", "icon.icon"), {
                recursive: true,
            });
        },
        packed: async (context) => {
            const resourcesDir = context.getResources(electron_builder_1.Platform.MAC, electron_builder_1.Arch.x64);
            const contentsDir = context.getContent(electron_builder_1.Platform.MAC, electron_builder_1.Arch.x64);
            const infoPlistPath = path.join(contentsDir, "Info.plist");
            const info = await (0, plist_1.parsePlistFile)(infoPlistPath);
            expect(info.CFBundleIconName).toBe("Icon");
            expect(info.CFBundleIconFile).toBe("icon.icns");
            const assetCatalogPath = path.join(resourcesDir, "Assets.car");
            const writtenCatalog = await fs.readFile(assetCatalogPath);
            expect(writtenCatalog.length).toBeGreaterThan(0);
        },
    });
});
test.ifMac("icon set", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets,
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([fs.unlink(path.join(projectDir, "build", "icon.icns")), fs.unlink(path.join(projectDir, "build", "icon.ico"))]),
        packed: () => assertIcon(expect, platformPackager),
    });
});
test.ifMac("custom icon set", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets,
        config: {
            mac: {
                icon: "customIconSet",
            },
        },
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs.unlink(path.join(projectDir, "build", "icon.icns")),
            fs.unlink(path.join(projectDir, "build", "icon.ico")),
            fs.rename(path.join(projectDir, "build", "icons"), path.join(projectDir, "customIconSet")),
        ]),
        packed: () => assertIcon(expect, platformPackager),
    });
});
test.ifMac("custom icon set with only 512 and 128", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets,
        config: {
            mac: {
                icon: "..",
            },
        },
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs.unlink(path.join(projectDir, "build", "icon.icns")),
            fs.unlink(path.join(projectDir, "build", "icon.ico")),
            fs.copyFile(path.join(projectDir, "build", "icons", "512x512.png"), path.join(projectDir, "512x512.png")),
            fs.copyFile(path.join(projectDir, "build", "icons", "128x128.png"), path.join(projectDir, "128x128.png")),
        ]),
        packed: () => assertIcon(expect, platformPackager),
    });
});
test.ifMac("png icon", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets,
        config: {
            mac: {
                icon: "icons/512x512.png",
            },
        },
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([fs.unlink(path.join(projectDir, "build", "icon.icns")), fs.unlink(path.join(projectDir, "build", "icon.ico"))]),
        packed: () => assertIcon(expect, platformPackager),
    });
});
test.ifMac("default png icon", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets,
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs.unlink(path.join(projectDir, "build", "icon.icns")),
            fs.unlink(path.join(projectDir, "build", "icon.ico")),
            fs
                .copyFile(path.join(projectDir, "build", "icons", "512x512.png"), path.join(projectDir, "build", "icon.png"))
                .then(() => fs.rm(path.join(projectDir, "build", "icons"), { recursive: true, force: true })),
        ]),
        packed: () => assertIcon(expect, platformPackager),
    });
});
test.ifMac("png icon small", ({ expect }) => {
    let platformPackager = null;
    return (0, packTester_1.app)(expect, {
        targets,
        config: {
            mac: {
                icon: "icons/128x128.png",
            },
        },
        platformPackagerFactory: packager => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
    }, {
        projectDirCreated: projectDir => Promise.all([fs.unlink(path.join(projectDir, "build", "icon.icns")), fs.unlink(path.join(projectDir, "build", "icon.ico"))]),
        packed: async () => {
            try {
                await platformPackager.getIconPath();
            }
            catch (e) {
                if (!e.message.includes("must be at least 512x512")) {
                    throw e;
                }
                return;
            }
            throw new Error("error expected");
        },
    });
});
//# sourceMappingURL=macIconTest.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const path = require("path");
const path_sort_1 = require("path-sort");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
test.ifMac("invalid target", ({ expect }) => expect((0, packTester_1.createMacTargetTest)(expect, ["ttt"])).rejects.toThrow());
test.ifNotWindows("only zip", ({ expect }) => (0, packTester_1.createMacTargetTest)(expect, ["zip"], undefined, false /* no need to test sign */));
test.ifNotWindows("tar.gz", ({ expect }) => (0, packTester_1.createMacTargetTest)(expect, ["tar.gz"]));
// test.ifNotWindows("tar.xz", createTargetTest(["tar.xz"], ["Test App ßW-1.1.0-mac.tar.xz"]))
const it = process.env.CSC_KEY_PASSWORD == null ? test.skip : test.ifMac;
it("pkg", ({ expect }) => (0, packTester_1.createMacTargetTest)(expect, ["pkg"]));
test.ifMac("empty installLocation", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.x64),
    config: {
        pkg: {
            installLocation: "",
        },
    },
}, {
    signed: false,
    projectDirCreated: projectDir => {
        return Promise.all([(0, packTester_1.copyTestAsset)("license.txt", path.join(projectDir, "build", "license.txt"))]);
    },
}));
test.ifMac("extraDistFiles", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("zip", builder_util_1.Arch.x64),
    config: {
        mac: {
            extraDistFiles: "extra.txt",
        },
    },
}, {
    signed: false,
    projectDirCreated: projectDir => {
        return Promise.all([(0, fs_extra_1.outputFile)(path.join(projectDir, "extra.txt"), "test")]);
    },
}));
test.ifMac("pkg extended configuration", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.x64),
    config: {
        pkg: {
            isRelocatable: false,
            isVersionChecked: false,
            hasStrictIdentifier: false,
            overwriteAction: "update",
        },
    },
}, {
    signed: false,
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0.pkg");
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await (0, builder_util_1.exec)("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const packageInfoFile = path.join(unpackedDir, "org.electron-builder.testApp.pkg", "PackageInfo");
        const info = (0, builder_util_runtime_1.parseXml)(await fs.readFile(packageInfoFile, "utf8"));
        const relocateElement = info.elementOrNull("relocate");
        if (relocateElement != null) {
            expect(relocateElement.elements).toBeNull();
        }
        const upgradeBundleElement = info.elementOrNull("upgrade-bundle");
        if (upgradeBundleElement != null) {
            expect(upgradeBundleElement.elements).toBeNull();
        }
        const updateBundleElement = info.elementOrNull("update-bundle");
        if (updateBundleElement != null) {
            expect(updateBundleElement.elements).toHaveLength(1);
        }
        const strictIdentifierElement = info.elementOrNull("strict-identifier");
        if (strictIdentifierElement != null) {
            expect(strictIdentifierElement.elements).toBeNull();
        }
    },
}));
test.ifMac("pkg scripts", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.x64),
}, {
    signed: false,
    projectDirCreated: async (projectDir) => {
        await fs.symlink(path.join((0, packTester_1.getFixtureDir)(), "pkg-scripts"), path.join(projectDir, "build", "pkg-scripts"));
    },
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0.pkg");
        console.log("CALL");
        const fileList = (0, path_sort_1.default)((0, packTester_1.parseFileList)(await (0, builder_util_1.exec)("pkgutil", ["--payload-files", pkgPath]), false));
        expect(fileList).toMatchSnapshot();
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await (0, builder_util_1.exec)("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const info = (0, builder_util_runtime_1.parseXml)(await fs.readFile(path.join(unpackedDir, "Distribution"), "utf8"));
        for (const element of info.getElements("pkg-ref")) {
            element.removeAttribute("installKBytes");
            element.removeAttribute("updateKBytes");
            const bundleVersion = element.elementOrNull("bundle-version");
            if (bundleVersion != null) {
                bundleVersion.element("bundle").removeAttribute("CFBundleVersion");
            }
        }
        // delete info.product.version
        info.element("product").removeAttribute("version");
        expect(info).toMatchSnapshot();
        const scriptDir = path.join(unpackedDir, "org.electron-builder.testApp.pkg", "Scripts");
        await (0, fileAssert_1.assertThat)(expect, path.join(scriptDir, "postinstall")).isFile();
        await (0, fileAssert_1.assertThat)(expect, path.join(scriptDir, "preinstall")).isFile();
    },
}));
test.ifMac("pkg hostArchitectures for arm64", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.arm64),
}, {
    signed: false,
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0-arm64.pkg");
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await (0, builder_util_1.exec)("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const distributionXml = await fs.readFile(path.join(unpackedDir, "Distribution"), "utf8");
        expect(distributionXml).toContain('hostArchitectures="arm64"');
    },
}));
test.ifMac("pkg hostArchitectures for x64", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.x64),
}, {
    signed: false,
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0.pkg");
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await (0, builder_util_1.exec)("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const distributionXml = await fs.readFile(path.join(unpackedDir, "Distribution"), "utf8");
        expect(distributionXml).toContain('hostArchitectures="x86_64"');
    },
}));
test.ifMac("pkg minimumSystemVersion adds volume-check", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.arm64),
    config: {
        mac: {
            minimumSystemVersion: "12.0",
        },
    },
}, {
    signed: false,
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0-arm64.pkg");
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await (0, builder_util_1.exec)("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const distributionXml = await fs.readFile(path.join(unpackedDir, "Distribution"), "utf8");
        expect(distributionXml).toContain("<volume-check>");
        expect(distributionXml).toContain('<os-version min="12.0"');
    },
}));
test.ifMac("pkg extra packages", async ({ expect }) => {
    const extraPackages = path.join("build", "extra-packages");
    return (0, packTester_1.app)(expect, {
        targets: electron_builder_1.Platform.MAC.createTarget("pkg", builder_util_1.Arch.x64),
        config: {
            pkg: {
                extraPkgsDir: extraPackages,
            },
        },
    }, {
        signed: false,
        projectDirCreated: async (projectDir) => {
            const extraPackagesDir = path.join(projectDir, extraPackages);
            await fs.mkdir(extraPackagesDir);
            await fs.writeFile(path.join(extraPackagesDir, "noop.pkg"), "data");
        },
    });
});
//# sourceMappingURL=macArchiveTest.js.map
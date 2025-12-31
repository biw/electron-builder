"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectUpdateMetadata = expectUpdateMetadata;
exports.checkHelpers = checkHelpers;
exports.doTest = doTest;
const asar_1 = require("app-builder-lib/out/asar/asar");
const builder_util_1 = require("builder-util");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const js_yaml_1 = require("js-yaml");
const path = require("path");
const fileAssert_1 = require("./fileAssert");
const wine_1 = require("./wine");
async function expectUpdateMetadata(expect, context, arch = electron_builder_1.Arch.ia32, requireCodeSign = false) {
    const data = (0, js_yaml_1.load)(await fs.readFile(path.join(context.getResources(electron_builder_1.Platform.WINDOWS, arch), "app-update.yml"), "utf-8"));
    if (requireCodeSign) {
        expect(data.publisherName).toEqual(["Foo, Inc"]);
        delete data.publisherName;
    }
    expect(data).toMatchSnapshot();
}
async function checkHelpers(expect, resourceDir, isPackElevateHelper) {
    const elevateHelperExecutable = path.join(resourceDir, "elevate.exe");
    if (isPackElevateHelper) {
        await (0, fileAssert_1.assertThat)(expect, elevateHelperExecutable).isFile();
    }
    else {
        await (0, fileAssert_1.assertThat)(expect, elevateHelperExecutable).doesNotExist();
    }
}
async function doTest(expect, outDir, perUser, productFilename = "TestApp Setup", name = "TestApp", menuCategory = null, packElevateHelper = true) {
    if (process.env.DO_WINE !== "true") {
        return Promise.resolve();
    }
    const wine = new wine_1.WineManager();
    await wine.prepare();
    const driveC = path.join(wine.wineDir, "drive_c");
    const driveCWindows = path.join(wine.wineDir, "drive_c", "windows");
    const perUserTempDir = path.join(wine.userDir, "Temp");
    const walkFilter = (it) => {
        return it !== driveCWindows && it !== perUserTempDir;
    };
    function listFiles() {
        return (0, builder_util_1.walk)(driveC, null, { consume: walkFilter });
    }
    let fsBefore = await listFiles();
    await wine.exec(path.join(outDir, `${productFilename} Setup 1.1.0.exe`), "/S");
    let instDir = perUser ? path.join(wine.userDir, "Local Settings", "Application Data", "Programs") : path.join(driveC, "Program Files");
    if (menuCategory != null) {
        instDir = path.join(instDir, menuCategory);
    }
    const appAsar = path.join(instDir, name, "resources", "app.asar");
    expect(await (0, asar_1.readAsarJson)(appAsar, "package.json")).toMatchObject({
        name,
    });
    if (!perUser) {
        let startMenuDir = path.join(driveC, "users", "Public", "Start Menu", "Programs");
        if (menuCategory != null) {
            startMenuDir = path.join(startMenuDir, menuCategory);
        }
        await (0, fileAssert_1.assertThat)(expect, path.join(startMenuDir, `${productFilename}.lnk`)).isFile();
    }
    if (packElevateHelper) {
        await (0, fileAssert_1.assertThat)(expect, path.join(instDir, name, "resources", "elevate.exe")).isFile();
    }
    else {
        await (0, fileAssert_1.assertThat)(expect, path.join(instDir, name, "resources", "elevate.exe")).doesNotExist();
    }
    let fsAfter = await listFiles();
    let fsChanges = (0, wine_1.diff)(fsBefore, fsAfter, driveC);
    expect(fsChanges.added).toMatchSnapshot();
    expect(fsChanges.deleted).toEqual([]);
    // run installer again to test uninstall
    const appDataFile = path.join(wine.userDir, "Application Data", name, "doNotDeleteMe");
    await (0, fs_extra_1.outputFile)(appDataFile, "app data must be not removed");
    fsBefore = await listFiles();
    await wine.exec(path.join(outDir, `${productFilename} Setup 1.1.0.exe`), "/S");
    fsAfter = await listFiles();
    fsChanges = (0, wine_1.diff)(fsBefore, fsAfter, driveC);
    expect(fsChanges.added).toEqual([]);
    expect(fsChanges.deleted).toEqual([]);
    await (0, fileAssert_1.assertThat)(expect, appDataFile).isFile();
    await wine.exec(path.join(outDir, `${productFilename} Setup 1.1.0.exe`), "/S", "--delete-app-data");
    await (0, fileAssert_1.assertThat)(expect, appDataFile).doesNotExist();
}
//# sourceMappingURL=winHelper.js.map
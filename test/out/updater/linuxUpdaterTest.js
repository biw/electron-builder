"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_updater_1 = require("electron-updater");
const fileAssert_1 = require("../helpers/fileAssert");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
const child_process_1 = require("child_process");
const runTest = async (expect, updaterClass, expectedExtension) => {
    const testAppAdapter = await (0, updaterTestUtil_1.createTestAppAdapter)("1.0.1");
    const updater = new updaterClass(null, testAppAdapter);
    (0, updaterTestUtil_1.tuneTestUpdater)(updater, { platform: "linux" });
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "mmaietta",
        repo: "electron-builder-test",
    });
    const updateCheckResult = await (0, updaterTestUtil_1.validateDownload)(expect, updater);
    const files = await (updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise);
    expect(files.length).toEqual(1);
    const installer = files[0];
    expect(installer.endsWith(`.${expectedExtension}`)).toBeTruthy();
    await (0, fileAssert_1.assertThat)(expect, installer).isFile();
    const didUpdate = updater.install(true, false);
    expect(didUpdate).toBeTruthy();
};
const determineEnvironment = (target) => {
    return (0, child_process_1.execSync)(`cat /etc/*release | grep "^ID="`).toString().includes(target);
};
const packageManagerMap = {
    fedora: {
        pms: ["zypper", "dnf", "yum", "rpm"],
        updater: electron_updater_1.RpmUpdater,
        extension: "rpm",
    },
    debian: {
        pms: ["apt", "dpkg"],
        updater: electron_updater_1.DebUpdater,
        extension: "deb",
    },
    arch: {
        pms: ["pacman"],
        updater: electron_updater_1.PacmanUpdater,
        extension: "pacman",
    },
};
for (const distro in packageManagerMap) {
    const { pms, updater: Updater, extension } = packageManagerMap[distro];
    for (const pm of pms) {
        test.ifEnv(determineEnvironment(distro))(`test ${distro} download and install (${pm})`, async ({ expect }) => {
            process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER = pm;
            await runTest(expect, Updater, extension);
        });
    }
}
// test.ifLinux("test AppImage download", async ({ expect }) => {
//   await runTest(expect, AppImageUpdater, "AppImage")
// })
//# sourceMappingURL=linuxUpdaterTest.js.map
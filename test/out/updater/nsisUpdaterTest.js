"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_publish_1 = require("electron-publish");
const fs_extra_1 = require("fs-extra");
const os_1 = require("os");
const path = require("path");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
const config = { retry: 3 };
test("downgrade (disallowed, beta)", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.5.2-beta.4");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    });
    const actualEvents = [];
    const expectedEvents = ["checking-for-update", "update-not-available"];
    for (const eventName of expectedEvents) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
    // noinspection JSIgnoredPromiseFromCall
    expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise).toBeUndefined();
    expect(actualEvents).toEqual(expectedEvents);
});
test("github allowPrerelease=true", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.1");
    updater.allowPrerelease = true;
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "mmaietta",
        repo: "electron-builder-test-prerelease",
    });
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
});
test("github allowPrerelease=false", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.1");
    updater.allowPrerelease = false;
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "mmaietta",
        repo: "electron-builder-test-prerelease",
    });
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
});
test("github blockmap files - should get blockmap files", config, async ({ expect }) => {
    var _a;
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.0");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    });
    await updater.checkForUpdates();
    const provider = (_a = updater === null || updater === void 0 ? void 0 : updater.updateInfoAndProvider) === null || _a === void 0 ? void 0 : _a.provider;
    if (provider) {
        const oldVersion = "1.1.9-2+ed8ccd";
        const newVersion = "1.1.9-3+be4a1f";
        const baseUrlString = `https://github.com/artifacts/master/raw/electron%20Setup%20${newVersion}.exe`;
        const baseUrl = new URL(baseUrlString);
        const blockMapUrls = await provider.getBlockMapFiles(baseUrl, oldVersion, newVersion);
        const oldBlockMapUrl = blockMapUrls[0];
        const newBlockMapUrl = blockMapUrls[1];
        expect(oldBlockMapUrl.href).toBe("https://github.com/artifacts/master/raw/electron%20Setup%201.1.9-2+ed8ccd.exe.blockmap");
        expect(newBlockMapUrl.href).toBe("https://github.com/artifacts/master/raw/electron%20Setup%201.1.9-3+be4a1f.exe.blockmap");
    }
});
test("file url generic", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test.ifEnv(process.env.KEYGEN_TOKEN)("file url keygen", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.addAuthHeader(`Bearer ${process.env.KEYGEN_TOKEN}`);
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "keygen",
        product: process.env.KEYGEN_PRODUCT || "43981278-96e7-47de-b8c2-98d59987206b",
        account: process.env.KEYGEN_ACCOUNT || "cdecda36-3ef0-483e-ad88-97e7970f3149",
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test.ifEnv(process.env.BITBUCKET_TOKEN)("file url bitbucket", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    const options = {
        provider: "bitbucket",
        owner: "mike-m",
        slug: "electron-builder-test",
    };
    updater.addAuthHeader(electron_publish_1.BitbucketPublisher.convertAppPassword(options.owner, process.env.BITBUCKET_TOKEN));
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)(options);
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("file url gitlab", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    const options = {
        provider: "gitlab",
        projectId: 71361100,
    };
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)(options);
    updater.signals.updateDownloaded(info => {
        expect(info.downloadedFile).not.toBeNull();
        delete info.downloadedFile;
        expect(info).toMatchSnapshot();
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("gitlab checkForUpdates", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "gitlab",
        projectId: 71361100,
    });
    const actualEvents = [];
    const expectedEvents = ["checking-for-update", "update-available"];
    for (const eventName of expectedEvents) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
    expect(actualEvents).toEqual(expectedEvents);
});
test("gitlab - manual download", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "gitlab",
        projectId: 71361100,
    });
    updater.autoDownload = false;
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
    // noinspection JSIgnoredPromiseFromCall
    expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise).toBeNull();
    expect(actualEvents).toMatchSnapshot();
    await (0, fileAssert_1.assertThat)(expect, path.join((await updater.downloadUpdate())[0])).isFile();
});
test("gitlab blockmap files - should get blockmap files from project_upload", config, async ({ expect }) => {
    var _a;
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.0");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "gitlab",
        projectId: 71361100,
        uploadTarget: "project_upload",
    });
    await updater.checkForUpdates();
    const provider = (_a = updater === null || updater === void 0 ? void 0 : updater.updateInfoAndProvider) === null || _a === void 0 ? void 0 : _a.provider;
    if (provider) {
        const baseUrl = new URL("https://gitlab.com/gitlab-electron-updater-test_Setup_1.1.0.exe");
        const blockMapUrls = await provider.getBlockMapFiles(baseUrl, "1.0.0", "1.1.0");
        expect(blockMapUrls).toHaveLength(2);
        const oldBlockMapUrl = blockMapUrls[0];
        const newBlockMapUrl = blockMapUrls[1];
        expect(oldBlockMapUrl).toBeInstanceOf(URL);
        expect(newBlockMapUrl).toBeInstanceOf(URL);
        expect(oldBlockMapUrl.href).toContain("gitlab-electron-updater-test_Setup_1.0.0.exe.blockmap");
        expect(newBlockMapUrl.href).toContain("gitlab-electron-updater-test_Setup_1.1.0.exe.blockmap");
    }
});
test("gitlab blockmap files - should get blockmap files from generic_package", config, async ({ expect }) => {
    var _a;
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.0");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "gitlab",
        projectId: 71361100,
        uploadTarget: "generic_package",
    });
    await updater.checkForUpdates();
    const provider = (_a = updater === null || updater === void 0 ? void 0 : updater.updateInfoAndProvider) === null || _a === void 0 ? void 0 : _a.provider;
    if (provider) {
        const baseUrl = new URL("https://gitlab.com/gitlab-electron-updater-test_Setup_1.1.0.exe");
        const blockMapUrls = await provider.getBlockMapFiles(baseUrl, "1.0.0", "1.1.0");
        expect(blockMapUrls).toHaveLength(2);
        const oldBlockMapUrl = blockMapUrls[0];
        const newBlockMapUrl = blockMapUrls[1];
        expect(oldBlockMapUrl).toBeInstanceOf(URL);
        expect(newBlockMapUrl).toBeInstanceOf(URL);
        expect(oldBlockMapUrl.href).toBe("https://gitlab.com/gitlab-electron-updater-test_Setup_1.0.0.exe.blockmap");
        expect(newBlockMapUrl.href).toBe("https://gitlab.com/gitlab-electron-updater-test_Setup_1.1.0.exe.blockmap");
    }
});
test.skip("DigitalOcean Spaces", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "spaces",
        name: "electron-builder-test",
        path: "light-updater-test",
        region: "nyc3",
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test.ifNotCiWin.skip("sha512 mismatch error event", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
        channel: "beta",
    });
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
    await (0, fileAssert_1.assertThat)(expect, updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise).throws();
    expect(actualEvents).toMatchSnapshot();
});
test("file url generic - manual download", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    updater.autoDownload = false;
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    const updateCheckResult = await updater.checkForUpdates();
    expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
    // noinspection JSIgnoredPromiseFromCall
    expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise).toBeNull();
    expect(actualEvents).toMatchSnapshot();
    await (0, fileAssert_1.assertThat)(expect, path.join((await updater.downloadUpdate())[0])).isFile();
});
// https://github.com/electron-userland/electron-builder/issues/1045
test("checkForUpdates several times", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    for (let i = 0; i < 10; i++) {
        //noinspection JSIgnoredPromiseFromCall
        void updater.checkForUpdates();
    }
    async function checkForUpdates() {
        const updateCheckResult = await updater.checkForUpdates();
        expect((0, packTester_1.removeUnstableProperties)(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo)).toMatchSnapshot();
        await checkDownloadPromise(expect, updateCheckResult);
    }
    await checkForUpdates();
    // we must not download the same file again
    await checkForUpdates();
    expect(actualEvents).toMatchSnapshot();
});
async function checkDownloadPromise(expect, updateCheckResult) {
    return await (0, fileAssert_1.assertThat)(expect, path.join((await (updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise))[0])).isFile();
}
test("file url github", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    const options = {
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    };
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)(options);
    updater.signals.updateDownloaded(info => {
        expect(info.downloadedFile).not.toBeNull();
        delete info.downloadedFile;
        expect(info).toMatchSnapshot();
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("file url github pre-release and fullChangelog", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.5.0-beta.1");
    const options = {
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    };
    updater.fullChangelog = true;
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)(options);
    updater.signals.updateDownloaded(info => {
        expect(info.downloadedFile).not.toBeNull();
        delete info.downloadedFile;
        expect(info).toMatchSnapshot();
    });
    const updateCheckResult = await (0, updaterTestUtil_1.validateDownload)(expect, updater);
    expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo).toMatchSnapshot();
});
test.ifEnv(process.env.GH_TOKEN || process.env.GITHUB_TOKEN)("file url github private", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release_private",
        private: true,
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("test error", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    await (0, fileAssert_1.assertThat)(expect, updater.checkForUpdates()).throws();
    expect(actualEvents).toMatchSnapshot();
});
test.skip("test download progress", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    });
    updater.autoDownload = false;
    const progressEvents = [];
    updater.signals.progress(it => progressEvents.push(it));
    await updater.checkForUpdates();
    await updater.downloadUpdate();
    expect(progressEvents.length).toBeGreaterThanOrEqual(1);
    const lastEvent = progressEvents.pop();
    expect(lastEvent.percent).toBe(100);
    expect(lastEvent.bytesPerSecond).toBeGreaterThan(1);
    expect(lastEvent.transferred).toBe(lastEvent.total);
});
test("valid signature", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["Vladimir Krivosheev"],
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("valid signature - multiple publisher DNs", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["Foo Bar", "CN=Vladimir Krivosheev, O=Vladimir Krivosheev, L=Grunwald, S=Bayern, C=DE", "Bar Foo"],
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("valid signature using DN", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["CN=Vladimir Krivosheev, O=Vladimir Krivosheev, L=Grunwald, S=Bayern, C=DE"],
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test.ifWindows("invalid signature", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["Foo Bar"],
    });
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    await (0, fileAssert_1.assertThat)(expect, updater.checkForUpdates().then((it) => it === null || it === void 0 ? void 0 : it.downloadPromise)).throws();
    expect(actualEvents).toMatchSnapshot();
});
test.ifWindows("test custom signature verifier", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.2");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["CN=Vladimir Krivosheev, O=Vladimir Krivosheev, L=Grunwald, S=Bayern, C=DE"],
    });
    updater.verifyUpdateCodeSignature = (publisherName, path) => {
        return Promise.resolve(null);
    };
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test.ifWindows("test custom signature verifier - signing error message", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.2");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["CN=Vladimir Krivosheev, O=Vladimir Krivosheev, L=Grunwald, S=Bayern, C=DE"],
    });
    updater.verifyUpdateCodeSignature = (publisherName, path) => {
        return Promise.resolve("signature verification failed");
    };
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    await (0, fileAssert_1.assertThat)(expect, updater.checkForUpdates().then((it) => it === null || it === void 0 ? void 0 : it.downloadPromise)).throws();
    expect(actualEvents).toMatchSnapshot();
});
// disable for now
test("90 staging percentage", config, async ({ expect }) => {
    const userIdFile = path.join((0, os_1.tmpdir)(), "electron-updater-test", "userData", ".updaterId");
    await (0, fs_extra_1.outputFile)(userIdFile, "1wa70172-80f8-5cc4-8131-28f5e0edd2a1");
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "s3",
        channel: "staging-percentage",
        bucket: "develar",
        path: "test",
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test("1 staging percentage", config, async ({ expect }) => {
    const userIdFile = path.join((0, os_1.tmpdir)(), "electron-updater-test", "userData", ".updaterId");
    await (0, fs_extra_1.outputFile)(userIdFile, "12a70172-80f8-5cc4-8131-28f5e0edd2a1");
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("0.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "s3",
        channel: "staging-percentage-small",
        bucket: "develar",
        path: "test",
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater, false);
});
test("cancel download with progress", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/full-test",
    });
    const progressEvents = [];
    updater.signals.progress(it => progressEvents.push(it));
    let cancelled = false;
    updater.signals.updateCancelled(() => (cancelled = true));
    const checkResult = await updater.checkForUpdates();
    checkResult === null || checkResult === void 0 ? void 0 : checkResult.cancellationToken.cancel();
    if (progressEvents.length > 0) {
        const lastEvent = progressEvents[progressEvents.length - 1];
        expect(lastEvent.percent).not.toBe(100);
        expect(lastEvent.bytesPerSecond).toBeGreaterThan(1);
        expect(lastEvent.transferred).not.toBe(lastEvent.total);
    }
    const downloadPromise = checkResult === null || checkResult === void 0 ? void 0 : checkResult.downloadPromise;
    await (0, fileAssert_1.assertThat)(expect, downloadPromise).throws();
    expect(cancelled).toBe(true);
});
test("test download and install", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)();
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
});
test.ifWindows.skip("test downloaded installer", config, async ({ expect }) => {
    const updater = await (0, updaterTestUtil_1.createNsisUpdater)("1.0.1");
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)({
        provider: "github",
        owner: "mmaietta",
        repo: "electron-builder-test",
    });
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    await (0, updaterTestUtil_1.validateDownload)(expect, updater);
    // expect(actualEvents).toMatchObject(["checking-for-update", "update-available", "update-downloaded"])
    updater.quitAndInstall(true, false);
    expect(actualEvents).toMatchObject(["checking-for-update", "update-available", "update-downloaded", "before-quit-for-update"]);
});
//# sourceMappingURL=nsisUpdaterTest.js.map
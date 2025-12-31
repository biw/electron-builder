"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAppCacheDirName = exports.NEW_VERSION_NUMBER = exports.OLD_VERSION_NUMBER = exports.httpExecutor = exports.TestNodeHttpExecutor = void 0;
exports.createTestAppAdapter = createTestAppAdapter;
exports.createNsisUpdater = createNsisUpdater;
exports.writeUpdateConfig = writeUpdateConfig;
exports.validateDownload = validateDownload;
exports.tuneTestUpdater = tuneTestUpdater;
exports.trackEvents = trackEvents;
const builder_util_1 = require("builder-util");
const electron_updater_1 = require("electron-updater");
const AppUpdater_1 = require("electron-updater/out/AppUpdater");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const fileAssert_1 = require("./fileAssert");
const TestAppAdapter_1 = require("./TestAppAdapter");
const tmpDir = new builder_util_1.TmpDir("updater-test-util");
async function createTestAppAdapter(version = "0.0.1") {
    return new TestAppAdapter_1.TestAppAdapter(version, await tmpDir.getTempDir());
}
async function createNsisUpdater(version = "0.0.1") {
    const testAppAdapter = await createTestAppAdapter(version);
    const result = new electron_updater_1.NsisUpdater(null, testAppAdapter);
    tuneTestUpdater(result);
    return result;
}
// to reduce difference in test mode, setFeedURL is not used to set (NsisUpdater also read configOnDisk to load original publisherName)
async function writeUpdateConfig(data) {
    const updateConfigPath = path.join(await tmpDir.getTempDir({ prefix: "test-update-config" }), "app-update.yml");
    await (0, fs_extra_1.outputFile)(updateConfigPath, (0, builder_util_1.serializeToYaml)(data));
    return updateConfigPath;
}
async function validateDownload(expect, updater, expectDownloadPromise = true) {
    const actualEvents = trackEvents(updater);
    const updateCheckResult = await updater.checkForUpdates();
    const assets = (updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo).assets;
    if (assets != null) {
        for (const asset of assets) {
            delete asset.download_count;
        }
    }
    expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.updateInfo).toMatchSnapshot();
    if (expectDownloadPromise) {
        // noinspection JSIgnoredPromiseFromCall
        expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise).toBeDefined();
        const downloadResult = await (updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise);
        if (updater instanceof electron_updater_1.MacUpdater) {
            expect(downloadResult).toEqual([]);
        }
        else {
            await (0, fileAssert_1.assertThat)(expect, path.join(downloadResult[0])).isFile();
        }
    }
    else {
        // noinspection JSIgnoredPromiseFromCall
        expect(updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise).toBeUndefined();
    }
    expect(actualEvents).toMatchSnapshot();
    return updateCheckResult;
}
class TestNodeHttpExecutor extends builder_util_1.NodeHttpExecutor {
    async download(url, destination, options) {
        const obj = new URL(url);
        const buffer = await this.downloadToBuffer(obj, options);
        await (0, fs_extra_1.writeFile)(destination, buffer);
        return buffer.toString();
    }
}
exports.TestNodeHttpExecutor = TestNodeHttpExecutor;
exports.httpExecutor = new TestNodeHttpExecutor();
function tuneTestUpdater(updater, options) {
    ;
    updater.httpExecutor = exports.httpExecutor;
    updater._testOnlyOptions = {
        platform: "win32",
        ...options,
    };
    updater.logger = new AppUpdater_1.NoOpLogger();
}
function trackEvents(updater) {
    const actualEvents = [];
    for (const eventName of ["checking-for-update", "update-available", "update-downloaded", "error"]) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    return actualEvents;
}
exports.OLD_VERSION_NUMBER = "1.0.0";
exports.NEW_VERSION_NUMBER = "1.0.1";
exports.testAppCacheDirName = "testapp-updater";
//# sourceMappingURL=updaterTestUtil.js.map
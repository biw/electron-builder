"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_runtime_1 = require("builder-util-runtime");
const MacUpdater_1 = require("electron-updater/out/MacUpdater");
const events_1 = require("events");
const fileAssert_1 = require("../helpers/fileAssert");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
const vitest_mock_commonjs_1 = require("vitest-mock-commonjs");
class TestNativeUpdater extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.updateUrl = null;
    }
    // noinspection JSMethodCanBeStatic
    checkForUpdates() {
        console.log("TestNativeUpdater.checkForUpdates");
        this.download().catch(error => {
            this.emit("error", error);
        });
    }
    async download() {
        const data = JSON.parse((await updaterTestUtil_1.httpExecutor.request((0, builder_util_runtime_1.configureRequestOptionsFromUrl)(this.updateUrl, {}))));
        await updaterTestUtil_1.httpExecutor.request((0, builder_util_runtime_1.configureRequestOptionsFromUrl)(data.url, {}));
    }
    // noinspection JSMethodCanBeStatic
    setFeedURL(updateUrl) {
        // console.log("TestNativeUpdater.setFeedURL " + updateUrl)
        this.updateUrl = updateUrl.url;
    }
}
test.ifMac("mac updates", async ({ expect }) => {
    const mockNativeUpdater = new TestNativeUpdater();
    (0, vitest_mock_commonjs_1.mockForNodeRequire)("electron", {
        autoUpdater: mockNativeUpdater,
    });
    const updater = new MacUpdater_1.MacUpdater(undefined, await (0, updaterTestUtil_1.createTestAppAdapter)());
    const options = {
        provider: "github",
        owner: "develar",
        repo: "onshape-desktop-shell",
    };
    updater.updateConfigPath = await (0, updaterTestUtil_1.writeUpdateConfig)(options);
    updater.on("download-progress", () => {
        // console.log(JSON.stringify(data))
    });
    (0, updaterTestUtil_1.tuneTestUpdater)(updater);
    updater._testOnlyOptions.platform = process.platform;
    const actualEvents = (0, updaterTestUtil_1.trackEvents)(updater);
    const updateCheckResult = await updater.checkForUpdates();
    // todo when will be updated to use files
    // expect(removeUnstableProperties(updateCheckResult?.updateInfo.files)).toMatchSnapshot()
    const files = await (updateCheckResult === null || updateCheckResult === void 0 ? void 0 : updateCheckResult.downloadPromise);
    expect(files.length).toEqual(1);
    await (0, fileAssert_1.assertThat)(expect, files[0]).isFile();
    expect(actualEvents).toMatchSnapshot();
});
//# sourceMappingURL=macUpdaterTest.js.map
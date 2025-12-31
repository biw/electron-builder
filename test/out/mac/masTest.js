"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const path = require("path");
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
describe.runIf(process.platform === "darwin" && process.env.CSC_KEY_PASSWORD != null)("mas", () => {
    test("mas", ({ expect }) => (0, packTester_1.createMacTargetTest)(expect, ["mas"]));
    test.ifNotCi("dev", ({ expect }) => (0, packTester_1.createMacTargetTest)(expect, ["mas-dev"]));
    test.ifNotCi("mas and 7z", ({ expect }) => (0, packTester_1.createMacTargetTest)(expect, ["mas", "7z"]));
    const entitlement = (fileName) => path.join("build", fileName);
    const entitlementsConfig = {
        entitlements: entitlement("entitlements.mac.plist"),
        entitlementsInherit: entitlement("entitlements.mac.inherit.plist"),
        entitlementsLoginHelper: entitlement("entitlements.mac.login.plist"),
    };
    const targets = electron_builder_1.Platform.MAC.createTarget(undefined, electron_builder_1.Arch.x64);
    test.skip("custom mas", ({ expect }) => {
        let platformPackager = null;
        return (0, packTester_1.assertPack)(expect, "test-app-one", (0, packTester_1.signed)({
            targets,
            platformPackagerFactory: (packager, platform) => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
            config: {
                mac: {
                    target: ["mas"],
                },
                mas: entitlementsConfig,
            },
        }), {
            checkMacApp(appDir, info) {
                var _a, _b, _c, _d;
                const appEntitlements = (filePath) => { var _a, _b; return (_b = (_a = platformPackager.effectiveSignOptions) === null || _a === void 0 ? void 0 : _a.optionsForFile) === null || _b === void 0 ? void 0 : _b.call(_a, filePath); };
                expect((_a = appEntitlements(appDir)) === null || _a === void 0 ? void 0 : _a.entitlements).toBe(entitlementsConfig.entitlements);
                expect((_b = appEntitlements("Library/LoginItems")) === null || _b === void 0 ? void 0 : _b.entitlements).toBe(entitlementsConfig.entitlementsLoginHelper);
                expect((_c = appEntitlements("anything")) === null || _c === void 0 ? void 0 : _c.entitlements).toBe(entitlementsConfig.entitlementsInherit);
                expect((_d = appEntitlements(appDir)) === null || _d === void 0 ? void 0 : _d.hardenedRuntime).toBe(false);
                return Promise.resolve();
            },
        });
    });
    test("entitlements in the package.json", ({ expect }) => {
        let platformPackager = null;
        return (0, packTester_1.assertPack)(expect, "test-app-one", (0, packTester_1.signed)({
            targets,
            platformPackagerFactory: (packager, platform) => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
            config: {
                mac: entitlementsConfig,
            },
        }), {
            checkMacApp(appDir, info) {
                var _a, _b, _c, _d;
                const appEntitlements = (filePath) => { var _a, _b; return (_b = (_a = platformPackager.effectiveSignOptions) === null || _a === void 0 ? void 0 : _a.optionsForFile) === null || _b === void 0 ? void 0 : _b.call(_a, filePath); };
                expect((_a = appEntitlements(appDir)) === null || _a === void 0 ? void 0 : _a.entitlements).toBe(entitlementsConfig.entitlements);
                expect((_b = appEntitlements("Library/LoginItems")) === null || _b === void 0 ? void 0 : _b.entitlements).toBe(entitlementsConfig.entitlementsLoginHelper);
                expect((_c = appEntitlements("anything")) === null || _c === void 0 ? void 0 : _c.entitlements).toBe(entitlementsConfig.entitlementsInherit);
                expect((_d = appEntitlements(appDir)) === null || _d === void 0 ? void 0 : _d.hardenedRuntime).toBe(true);
                return Promise.resolve();
            },
        });
    });
    test("entitlements template", ({ expect }) => {
        let platformPackager = null;
        return (0, packTester_1.assertPack)(expect, "test-app-one", (0, packTester_1.signed)({
            targets,
            platformPackagerFactory: (packager, platform) => (platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)),
        }), {
            checkMacApp(appDir, info) {
                var _a, _b, _c;
                const appEntitlements = (filePath) => { var _a, _b; return (_b = (_a = platformPackager.effectiveSignOptions) === null || _a === void 0 ? void 0 : _a.optionsForFile) === null || _b === void 0 ? void 0 : _b.call(_a, filePath); };
                expect((_a = appEntitlements(appDir)) === null || _a === void 0 ? void 0 : _a.entitlements).toBe(entitlementsConfig.entitlements);
                expect((_b = appEntitlements("Library/LoginItems")) === null || _b === void 0 ? void 0 : _b.entitlements).toBe(entitlementsConfig.entitlements);
                expect((_c = appEntitlements("anything")) === null || _c === void 0 ? void 0 : _c.entitlements).toBe(entitlementsConfig.entitlements);
                return Promise.resolve();
            },
        });
    });
});
//# sourceMappingURL=masTest.js.map
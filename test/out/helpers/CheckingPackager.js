"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingMacPackager = exports.CheckingWinPackager = void 0;
const app_builder_lib_1 = require("app-builder-lib");
const path = require("path");
class CheckingWinPackager extends app_builder_lib_1.WinPackager {
    constructor(info) {
        super(info);
    }
    //noinspection JSUnusedLocalSymbols
    async pack(outDir, arch, targets, taskManager) {
        // skip pack
        const helperClass = (await Promise.resolve().then(() => require("electron-builder-squirrel-windows"))).default;
        const newClass = new helperClass(this, outDir);
        const setupFile = this.expandArtifactNamePattern(newClass.options, "exe", arch, "${productName} Setup ${version}.${ext}");
        const installerOutDir = path.join(outDir, `squirrel-windows${(0, app_builder_lib_1.getArchSuffix)(arch)}`);
        this.effectiveDistOptions = await newClass.computeEffectiveDistOptions(installerOutDir, outDir, setupFile);
        await this.signIf(this.computeAppOutDir(outDir, arch));
    }
    //noinspection JSUnusedLocalSymbols
    packageInDistributableFormat(appOutDir, arch, targets, taskManager) {
        // skip
    }
}
exports.CheckingWinPackager = CheckingWinPackager;
class CheckingMacPackager extends app_builder_lib_1.MacPackager {
    constructor(info) {
        super(info);
        this.effectiveSignOptions = null;
    }
    async pack(outDir, arch, targets, taskManager) {
        for (const target of targets) {
            // do not use instanceof to avoid dmg require
            if (target.name === "dmg") {
                this.effectiveDistOptions = await target.computeDmgOptions("stub");
                break;
            }
        }
        // http://madole.xyz/babel-plugin-transform-async-to-module-method-gotcha/
        return await app_builder_lib_1.MacPackager.prototype.pack.call(this, outDir, arch, targets, taskManager);
    }
    //noinspection JSUnusedLocalSymbols
    async doPack(_options) {
        // skip
    }
    //noinspection JSUnusedGlobalSymbols
    async doSign(opts) {
        this.effectiveSignOptions = opts;
        return Promise.resolve();
    }
    //noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    async doFlat(appPath, outFile, identity, keychain) {
        // skip
    }
    //noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    packageInDistributableFormat(appOutDir, arch, targets, taskManager) {
        // skip
    }
    async writeUpdateInfo(appOutDir, outDir) {
        // ignored
    }
}
exports.CheckingMacPackager = CheckingMacPackager;
//# sourceMappingURL=CheckingPackager.js.map
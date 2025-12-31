"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELECTRON_VERSION = void 0;
exports.getElectronCacheDir = getElectronCacheDir;
const os = require("os");
const path = require("path");
exports.ELECTRON_VERSION = "35.7.5";
function getElectronCacheDir() {
    if (process.platform === "win32") {
        return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Cache", "electron");
    }
    else if (process.platform === "darwin") {
        return path.join(os.homedir(), "Library", "Caches", "electron");
    }
    else {
        return path.join(os.homedir(), ".cache", "electron");
    }
}
//# sourceMappingURL=testConfig.js.map
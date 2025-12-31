"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WineManager = void 0;
exports.diff = diff;
const builder_util_1 = require("builder-util");
const fs_extra_1 = require("fs-extra");
const fs = require("fs/promises");
const os_1 = require("os");
const path = require("path");
const path_sort_1 = require("path-sort");
class WineManager {
    constructor() {
        this.wineDir = null;
        this.winePreparePromise = null;
        this.userDir = null;
    }
    async prepare() {
        if (this.env != null) {
            return;
        }
        this.wineDir = path.join((0, os_1.homedir)(), "wine-test");
        const env = process.env;
        const user = env.SUDO_USER || env.LOGNAME || env.USER || env.LNAME || env.USERNAME || (env.HOME === "/root" ? "root" : null);
        if (user == null) {
            throw new Error(`Cannot determinate user name: ${(0, builder_util_1.safeStringifyJson)(env)}`);
        }
        this.userDir = path.join(this.wineDir, "drive_c", "users", user);
        this.winePreparePromise = this.prepareWine(this.wineDir);
        this.env = await this.winePreparePromise;
    }
    exec(...args) {
        return (0, builder_util_1.exec)("wine", args, { env: this.env });
    }
    async prepareWine(wineDir) {
        await (0, fs_extra_1.emptyDir)(wineDir);
        //noinspection SpellCheckingInspection
        const env = {
            ...process.env,
            WINEDLLOVERRIDES: "winemenubuilder.exe=d",
            WINEPREFIX: wineDir,
        };
        await (0, builder_util_1.exec)("wineboot", ["--init"], { env });
        // regedit often doesn't modify correctly
        let systemReg = await fs.readFile(path.join(wineDir, "system.reg"), "utf8");
        systemReg = systemReg.replace('"CSDVersion"="Service Pack 3"', '"CSDVersion"=" "');
        systemReg = systemReg.replace('"CurrentBuildNumber"="2600"', '"CurrentBuildNumber"="10240"');
        systemReg = systemReg.replace('"CurrentVersion"="5.1"', '"CurrentVersion"="10.0"');
        systemReg = systemReg.replace('"ProductName"="Microsoft Windows XP"', '"ProductName"="Microsoft Windows 10"');
        // noinspection SpellCheckingInspection
        systemReg = systemReg.replace('"CSDVersion"=dword:00000300', '"CSDVersion"=dword:00000000');
        await fs.writeFile(path.join(wineDir, "system.reg"), systemReg);
        // remove links to host OS
        const userDir = this.userDir;
        const desktopDir = path.join(userDir, "Desktop");
        await Promise.all([
            (0, builder_util_1.unlinkIfExists)(desktopDir),
            (0, builder_util_1.unlinkIfExists)(path.join(userDir, "My Documents")),
            (0, builder_util_1.unlinkIfExists)(path.join(userDir, "My Music")),
            (0, builder_util_1.unlinkIfExists)(path.join(userDir, "My Pictures")),
            (0, builder_util_1.unlinkIfExists)(path.join(userDir, "My Videos")),
        ]);
        await fs.mkdir(desktopDir, { recursive: true });
        return env;
    }
}
exports.WineManager = WineManager;
var ChangeType;
(function (ChangeType) {
    ChangeType[ChangeType["ADDED"] = 0] = "ADDED";
    ChangeType[ChangeType["REMOVED"] = 1] = "REMOVED";
    ChangeType[ChangeType["NO_CHANGE"] = 2] = "NO_CHANGE";
})(ChangeType || (ChangeType = {}));
function diff(oldList, newList, rootDir) {
    const delta = {
        added: [],
        deleted: [],
    };
    const deltaMap = new Map();
    // const objHolder = new Set(oldList)
    for (const item of oldList) {
        deltaMap.set(item, ChangeType.REMOVED);
    }
    for (const item of newList) {
        // objHolder.add(item)
        const d = deltaMap.get(item);
        if (d === ChangeType.REMOVED) {
            deltaMap.set(item, ChangeType.NO_CHANGE);
        }
        else {
            deltaMap.set(item, ChangeType.ADDED);
        }
    }
    for (const [item, changeType] of deltaMap.entries()) {
        if (changeType === ChangeType.REMOVED) {
            delta.deleted.push(item.substring(rootDir.length + 1));
        }
        else if (changeType === ChangeType.ADDED) {
            delta.added.push(item.substring(rootDir.length + 1));
        }
    }
    delta.added = (0, path_sort_1.default)(delta.added);
    delta.deleted = (0, path_sort_1.default)(delta.deleted);
    return delta;
}
//# sourceMappingURL=wine.js.map
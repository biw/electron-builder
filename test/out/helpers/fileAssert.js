"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertThat = assertThat;
const builder_util_1 = require("builder-util");
const fs = require("fs/promises");
const path = require("path");
// http://joel-costigliola.github.io/assertj/
function assertThat(expect, actual) {
    return new Assertions(expect, actual);
}
const appVersion = require(path.join(__dirname, "../../../packages/app-builder-lib/package.json")).version;
class Assertions {
    constructor(expect, actual) {
        this.expect = expect;
        this.actual = actual;
    }
    containsAll(expected) {
        this.expect(this.actual.slice().sort()).toEqual(Array.from(expected).slice().sort());
    }
    isAbsolute() {
        if (!path.isAbsolute(this.actual)) {
            throw new Error(`Path ${this.actual} is not absolute`);
        }
    }
    async isFile() {
        const info = await (0, builder_util_1.statOrNull)(this.actual);
        if (info == null) {
            throw new Error(`Path ${this.actual} doesn't exist`);
        }
        if (!info.isFile()) {
            throw new Error(`Path ${this.actual} is not a file`);
        }
    }
    async isSymbolicLink() {
        const info = await fs.lstat(this.actual);
        if (!info.isSymbolicLink()) {
            throw new Error(`Path ${this.actual} is not a symlink`);
        }
    }
    async isDirectory() {
        const file = this.actual;
        const info = await (0, builder_util_1.statOrNull)(file);
        if (info == null) {
            throw new Error(`Path ${file} doesn't exist`);
        }
        if (!info.isDirectory()) {
            throw new Error(`Path ${file} is not a directory`);
        }
    }
    async doesNotExist() {
        if (await (0, builder_util_1.exists)(this.actual)) {
            throw new Error(`Path ${this.actual} must not exist`);
        }
    }
    async throws(customErrorAssert) {
        let actualError = null;
        let result;
        try {
            result = await this.actual;
        }
        catch (e) {
            actualError = e;
        }
        let m;
        if (actualError == null) {
            m = result;
        }
        else {
            m = actualError.code || actualError.message;
            if (m.includes("HttpError: ") && m.indexOf("\n") > 0) {
                m = m.substring(0, m.indexOf("\n"));
            }
            if (m.startsWith("Cannot find specified resource")) {
                m = m.substring(0, m.indexOf(","));
            }
            m = m.replace(appVersion, "<appVersion>");
            m = m.replace(/\((C:)?([\/\\])[^(]+([\/\\])([^(\/\\]+)\)/g, `(<path>/$4)`);
            m = m.replace(/"(C:)?([\/\\])[^"]+([\/\\])([^"\/\\]+)"/g, `"<path>/$4"`);
            m = m.replace(/'(C:)?([\/\\])[^']+([\/\\])([^'\/\\]+)'/g, `'<path>/$4'`);
        }
        try {
            if (customErrorAssert == null) {
                this.expect(m).toMatchSnapshot();
            }
            else {
                customErrorAssert(actualError);
            }
        }
        catch (matchError) {
            throw new Error(matchError + " " + (actualError === null || actualError === void 0 ? void 0 : actualError.message));
        }
    }
}
//# sourceMappingURL=fileAssert.js.map
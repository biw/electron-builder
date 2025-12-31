"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUnstableProperties = removeUnstableProperties;
exports.verifySmartUnpack = verifySmartUnpack;
const asar_1 = require("app-builder-lib/out/asar/asar");
const builder_util_1 = require("builder-util");
const fs_1 = require("fs");
const path = require("path");
const packTester_1 = require("./packTester");
function removeUnstableProperties(data) {
    return JSON.parse(JSON.stringify(data, (name, value) => {
        if (name === "offset") {
            return undefined;
        }
        if (value.size != null) {
            // size differs on various OS and subdependencies aren't pinned, so this will randomly fail when subdependency resolution versions change
            value.size = "<size>";
        }
        // Keep existing test coverage
        if (value.integrity) {
            delete value.integrity;
        }
        return value;
    }));
}
async function verifySmartUnpack(expect, resourceDir, additionalVerifications) {
    const asarFs = await (0, asar_1.readAsar)(path.join(resourceDir, "app.asar"));
    expect(await asarFs.readJson(`node_modules${path.sep}debug${path.sep}package.json`)).toMatchObject({
        name: "debug",
    });
    // For verifying additional files within the Asar Filesystem
    await (additionalVerifications === null || additionalVerifications === void 0 ? void 0 : additionalVerifications(asarFs));
    expect(removeUnstableProperties(asarFs.header)).toMatchSnapshot();
    const files = (await (0, builder_util_1.walk)(resourceDir, file => !path.basename(file).startsWith(".") && !file.endsWith(`resources${path.sep}inspector`))).map(it => {
        const name = (0, packTester_1.toSystemIndependentPath)(it.substring(resourceDir.length + 1));
        if (it.endsWith("package.json")) {
            return { name, content: (0, fs_1.readFileSync)(it, "utf-8") };
        }
        return name;
    });
    expect(files).toMatchSnapshot();
}
//# sourceMappingURL=verifySmartUnpack.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const macCodeSign_1 = require("app-builder-lib/out/codeSign/macCodeSign");
const builder_util_1 = require("builder-util");
const codeSignData_1 = require("../helpers/codeSignData");
const vitest_1 = require("vitest");
const tmpDir = new builder_util_1.TmpDir("mac-code-sign-test");
test.ifMac("create keychain", async ({ expect }) => {
    const result = await (0, macCodeSign_1.createKeychain)({ tmpDir, cscLink: codeSignData_1.CSC_LINK, cscKeyPassword: process.env.CSC_KEY_PASSWORD, currentDir: process.cwd() });
    expect(result.keychainFile).not.toEqual("");
});
(0, vitest_1.afterEach)(() => tmpDir.cleanup());
test.ifMac("create keychain with installers", async ({ expect }) => {
    const result = await (0, macCodeSign_1.createKeychain)({ tmpDir, cscLink: codeSignData_1.CSC_LINK, cscKeyPassword: process.env.CSC_KEY_PASSWORD, currentDir: process.cwd() });
    expect(result.keychainFile).not.toEqual("");
});
test.ifDevOrLinuxCi("remove password from log", async ({ expect }) => {
    expect((0, builder_util_1.removePassword)("seq -P foo -B")).toMatchSnapshot();
    expect((0, builder_util_1.removePassword)("pass:foo")).toMatchSnapshot();
    // noinspection SpellCheckingInspection
    expect((0, builder_util_1.removePassword)("/usr/bin/productbuild -P wefwef")).toMatchSnapshot();
    expect((0, builder_util_1.removePassword)(" /p foo")).toMatchSnapshot();
    expect((0, builder_util_1.removePassword)('ConvertTo-SecureString -String "test"')).toMatchSnapshot();
    expect((0, builder_util_1.removePassword)('(Get-PfxData "C:\\Users\\develar\\AppData\\Local\\Temp\\electron-builder-yBY8D2\\0-1.p12" -Password (ConvertTo-SecureString -String "test" -Force -AsPlainText)).EndEntityCertificates.Subject')).toMatchSnapshot();
});
//# sourceMappingURL=macCodeSignTest.js.map
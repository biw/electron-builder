"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("electron-updater/out/util");
const url_1 = require("url");
test("newUrlFromBase", ({ expect }) => {
    const fileUrl = new url_1.URL("https://AWS_S3_HOST/bucket-yashraj/electron%20Setup%2011.0.3.exe");
    const newBlockMapUrl = (0, util_1.newUrlFromBase)(`${fileUrl.pathname}.blockmap`, fileUrl);
    expect(newBlockMapUrl.href).toBe("https://aws_s3_host/bucket-yashraj/electron%20Setup%2011.0.3.exe.blockmap");
});
test("add no cache", ({ expect }) => {
    const baseUrl = new url_1.URL("https://gitlab.com/artifacts/master/raw/dist?job=build_electron_win");
    const newBlockMapUrl = (0, util_1.newUrlFromBase)("latest.yml", baseUrl, true);
    expect(newBlockMapUrl.href).toBe("https://gitlab.com/artifacts/master/raw/latest.yml?job=build_electron_win");
});
//# sourceMappingURL=urlUtilTest.js.map
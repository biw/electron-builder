"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(expect, configuration) {
    const info = configuration.cscInfo;
    expect(info.file).toEqual("secretFile");
    expect(info.password).toEqual("pass");
}
//# sourceMappingURL=customWindowsSign.js.map
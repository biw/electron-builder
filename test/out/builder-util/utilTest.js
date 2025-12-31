"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const vitest_1 = require("vitest");
const testValue = "secretValue";
const testQuoted = "secret with spaces";
const keys = ["--accessKey", "--secretKey", "-P", "-p", "-pass", "-String", "/p", "pass:"];
keys.forEach(key => {
    (0, vitest_1.describe)(`removePassword: ${key}`, () => {
        (0, vitest_1.it)("handles unquoted value (snapshot)", ({ expect }) => {
            const input = `${key} ${testValue}`;
            const output = (0, builder_util_1.removePassword)(input);
            expect(output).toMatchSnapshot();
        });
        (0, vitest_1.it)("handles double-quoted value (snapshot)", ({ expect }) => {
            const input = `${key} "${testQuoted}"`;
            const output = (0, builder_util_1.removePassword)(input);
            expect(output).toMatchSnapshot();
        });
        (0, vitest_1.it)("handles single-quoted value (snapshot)", ({ expect }) => {
            const input = `${key} '${testQuoted}'`;
            const output = (0, builder_util_1.removePassword)(input);
            expect(output).toMatchSnapshot();
        });
        if (key === "/p") {
            (0, vitest_1.it)("handles Mac host path without hashing (snapshot)", ({ expect }) => {
                const macPath = "\\\\Mac\\Host\\Users\\user";
                const input = `${key} ${macPath}`;
                const output = (0, builder_util_1.removePassword)(input);
                expect(output).toMatchSnapshot();
            });
        }
    });
});
(0, vitest_1.describe)("removePassword: /b … /c block", () => {
    (0, vitest_1.it)("handles /b … /c block (snapshot)", ({ expect }) => {
        const secret = "blockSecret";
        const input = `/b ${secret} /c`;
        const output = (0, builder_util_1.removePassword)(input);
        expect(output).toMatchSnapshot();
    });
});
(0, vitest_1.describe)("removePassword: multiple keys in one string", () => {
    (0, vitest_1.it)("handles two keys unquoted (snapshot)", ({ expect }) => {
        const input = `--accessKey key1 --secretKey key2`;
        const output = (0, builder_util_1.removePassword)(input);
        expect(output).toMatchSnapshot();
    });
    (0, vitest_1.it)("handles mixed quoted and unquoted keys (snapshot)", ({ expect }) => {
        const input = `-p 'quoted secret' -pass unquoted`;
        const output = (0, builder_util_1.removePassword)(input);
        expect(output).toMatchSnapshot();
    });
    (0, vitest_1.it)("handles several keys and /b … /c block (snapshot)", ({ expect }) => {
        const input = `pass: val1 --accessKey "val two" /b blockpass /c`;
        const output = (0, builder_util_1.removePassword)(input);
        expect(output).toMatchSnapshot();
    });
});
//# sourceMappingURL=utilTest.js.map
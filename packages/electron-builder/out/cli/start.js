"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const builder_util_1 = require("builder-util");
/** @internal */
function start() {
    builder_util_1.log.warn("The 'electron-builder start' command is deprecated and will be removed in a future version.\n\n" +
        "This command was designed for use with electron-webpack, which is no longer actively maintained.\n\n" +
        "Recommended alternatives:\n" +
        "  - Vite:          https://electron-vite.org/\n" +
        "  - electron-forge: https://www.electronforge.io/\n" +
        "  - Custom:        Run your dev server and 'electron .' separately\n");
    // Still try to run electron-webpack if available (for backward compatibility)
    try {
        const electronWebpackPath = require.resolve("electron-webpack/dev-runner", {
            paths: [process.cwd()],
        });
        require(electronWebpackPath);
        return Promise.resolve();
    }
    catch (error) {
        builder_util_1.log.error({ error: error.message }, "electron-webpack is not installed or could not be resolved. " + "Please install it in your project or use one of the recommended alternatives above.");
        return Promise.reject(new Error("electron-webpack not found. See the warning above for alternatives."));
    }
}
//# sourceMappingURL=start.js.map
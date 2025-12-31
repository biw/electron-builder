"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchAndWaitForQuit = launchAndWaitForQuit;
exports.startXvfb = startXvfb;
const builder_util_1 = require("builder-util");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
async function launchAndWaitForQuit({ appPath, timeoutMs = 20000, env = {}, expectedVersion, updateConfigPath, packageManagerToTest, }) {
    let child;
    const versionRegex = /APP_VERSION:\s*([0-9]+\.[0-9]+\.[0-9]+)/;
    function spawnApp(command, args = [], detached = true, localEnv = env) {
        return (0, child_process_1.spawn)(command, args, {
            detached,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
            env: {
                ...process.env,
                AUTO_UPDATER_TEST: "1",
                AUTO_UPDATER_TEST_CONFIG_PATH: updateConfigPath,
                ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER: packageManagerToTest,
                ...localEnv,
            },
        });
    }
    const platform = os_1.default.platform();
    switch (platform) {
        case "darwin": {
            const binary = path_1.default.join(appPath, "Contents", "MacOS", path_1.default.basename(appPath, ".app"));
            child = spawnApp(binary);
            break;
        }
        case "win32": {
            child = spawnApp(appPath);
            break;
        }
        case "linux": {
            const { display } = startXvfb();
            await new Promise(resolve => setTimeout(resolve, 500)); // Give Xvfb time to init
            if (appPath.endsWith(".AppImage")) {
                (0, fs_1.chmodSync)(appPath, 0o755);
                const spawnEnv = {
                    ...env,
                    DISPLAY: display,
                    APPIMAGE_EXTRACT_AND_RUN: "1",
                };
                child = (0, child_process_1.spawn)(appPath, ["--no-sandbox"], {
                    detached: true,
                    shell: false,
                    stdio: ["ignore", "pipe", "pipe"],
                    env: {
                        ...process.env,
                        AUTO_UPDATER_TEST: "1",
                        AUTO_UPDATER_TEST_CONFIG_PATH: updateConfigPath,
                        ...spawnEnv,
                    },
                });
            }
            else {
                child = spawnApp(appPath, ["--no-sandbox"], true, { DISPLAY: display });
            }
            break;
        }
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
    return new Promise((resolve, reject) => {
        var _a, _b;
        let version;
        let resolved = false;
        const stdoutChunks = [];
        const stderrChunks = [];
        function resolveResult(code) {
            resolve({
                version,
                exitCode: code,
                stdout: stdoutChunks.join(""),
                stderr: stderrChunks.join(""),
            });
        }
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", data => {
            const line = data.toString();
            console.log(line);
            stdoutChunks.push(line);
            const match = line.match(versionRegex);
            if (match) {
                version = match[1].trim();
                console.log(`Found Version in console logs: ${version}`);
                if (expectedVersion && version !== expectedVersion) {
                    reject(new Error(`Expected version ${expectedVersion}, got ${version}`));
                }
                else {
                    resolved = true;
                    resolveResult(0);
                }
            }
        });
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on("data", data => {
            const line = data.toString();
            stderrChunks.push(line);
            console.error(`[stderr] ${line}`);
        });
        child.on("error", err => {
            if (!resolved) {
                resolved = true;
                reject(err);
            }
        });
        child.on("exit", code => {
            if (!resolved) {
                resolved = true;
                resolveResult(code);
            }
        });
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                child.kill();
                reject(new Error(`Timeout after ${timeoutMs}ms\nSTDOUT:\n${stdoutChunks.join("")}\nSTDERR:\n${stderrChunks.join("")}`));
            }
        }, timeoutMs);
    });
}
// ⬇️ Launch Xvfb and validate it starts
function startXvfb() {
    var _a;
    const display = `:${Math.ceil(Math.random() * 100)}`;
    const proc = (0, child_process_1.spawn)("Xvfb", [display, "-screen", "0", "1920x1080x24"], {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
    });
    let errorOutput = "";
    (_a = proc.stderr) === null || _a === void 0 ? void 0 : _a.on("data", data => {
        errorOutput += data.toString();
    });
    setTimeout(() => {
        if (!proc.pid || isNaN(proc.pid)) {
            throw new Error(`Xvfb failed to start on ${display}: ${errorOutput}`);
        }
    }, 1000);
    proc.unref();
    const stop = () => {
        console.log(`Stopping Xvfb.${(0, builder_util_1.isEmptyOrSpaces)(errorOutput) ? "" : ` Error output: ${errorOutput}`}`);
        if (typeof proc.pid === "number" && !isNaN(proc.pid)) {
            try {
                process.kill(-proc.pid, "SIGTERM");
            }
            catch (e) {
                console.warn("Failed to stop Xvfb:", e);
            }
        }
    };
    ["SIGINT", "SIGTERM", "uncaughtException", "unhandledRejection"].forEach(sig => {
        process.once(sig, () => {
            try {
                stop();
            }
            catch (e) {
                console.warn("Failed to stop Xvfb:", e);
            }
        });
    });
    console.log("Xvfb started on display", display);
    return {
        display,
        stop,
    };
}
//# sourceMappingURL=launchAppCrossPlatform.js.map
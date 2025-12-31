"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleExistsInProject = exports.resolveFromProject = void 0;
exports.resolveModule = resolveModule;
exports.resolveFunction = resolveFunction;
const log_1 = require("builder-util/out/log");
const debug_1 = require("debug");
const path = require("path");
const requireMaybe = require("../../helpers/dynamic-import");
const projectModuleResolver_1 = require("./projectModuleResolver");
async function resolveModule(type, name) {
    var _a;
    try {
        return requireMaybe.dynamicImportMaybe(name);
    }
    catch (error) {
        log_1.log.error({ moduleName: name, message: (_a = error.message) !== null && _a !== void 0 ? _a : error.stack }, "Unable to dynamically `import` or `require`");
        throw error;
    }
}
async function resolveFunction(type, executor, name, projectDir) {
    if (executor == null || typeof executor !== "string") {
        // is already function or explicitly ignored by user
        return executor;
    }
    let p = executor;
    if (p.startsWith(".")) {
        p = path.resolve(projectDir || process.cwd(), p);
    }
    try {
        // First try project context resolution (for pnpm compatibility)
        if (projectDir && !path.isAbsolute(p)) {
            const resolved = (0, projectModuleResolver_1.resolveFromProject)({
                projectDir,
                moduleSpecifier: p,
                optional: true,
            });
            if (resolved !== null) {
                p = resolved;
            }
        }
        // Fallback to standard resolution
        if (!path.isAbsolute(p)) {
            p = require.resolve(p);
        }
    }
    catch (e) {
        (0, debug_1.default)(e);
        p = path.resolve(projectDir || process.cwd(), p);
    }
    const m = await resolveModule(type, p);
    const namedExport = m[name];
    if (namedExport == null) {
        return m.default || m;
    }
    else {
        return namedExport;
    }
}
// Re-export for convenience
var projectModuleResolver_2 = require("./projectModuleResolver");
Object.defineProperty(exports, "resolveFromProject", { enumerable: true, get: function () { return projectModuleResolver_2.resolveFromProject; } });
Object.defineProperty(exports, "moduleExistsInProject", { enumerable: true, get: function () { return projectModuleResolver_2.moduleExistsInProject; } });
//# sourceMappingURL=resolve.js.map
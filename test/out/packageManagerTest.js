"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const node_module_collector_1 = require("app-builder-lib/src/node-module-collector");
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
const yarnVersion = (0, packTester_1.getPackageManagerWithVersion)(node_module_collector_1.PM.YARN).prepareEntry;
const yarnBerryVersion = (0, packTester_1.getPackageManagerWithVersion)(node_module_collector_1.PM.YARN_BERRY).prepareEntry;
const packageConfig = (data, version) => {
    data.packageManager = version;
    data.name = "hello-world";
    data.version = "1.0.0";
    data.dependencies = {
        ...data.debpendencies,
        debug: "4.4.3",
    };
    data.devDependencies = {
        electron: testConfig_1.ELECTRON_VERSION,
    };
    data.optionalDependencies = {};
    return data;
};
test("yarn", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.packageManager = yarnVersion;
        }, false);
        await (0, packTester_1.modifyPackageJson)(projectDir, data => packageConfig(data, yarnVersion), true);
        await (0, fs_extra_1.writeFile)(path.join(projectDir, "yarn.lock"), "");
        await (0, fs_extra_1.writeFile)(path.join(projectDir, "app", "yarn.lock"), "");
        await (0, fs_extra_1.copyFile)(path.join((0, packTester_1.getFixtureDir)(), ".pnp.cjs"), path.join(projectDir, ".pnp.cjs"));
        await (0, fs_extra_1.rm)(path.join(projectDir, ".yarnrc.yml"));
        (0, child_process_1.execSync)("yarn install", { cwd: projectDir, stdio: "inherit" });
        (0, child_process_1.execSync)("yarn install", { cwd: path.join(projectDir, "app"), stdio: "inherit" });
    },
}));
test("yarn berry", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.packageManager = yarnBerryVersion;
        }, false);
        await (0, packTester_1.modifyPackageJson)(projectDir, data => packageConfig(data, yarnBerryVersion), true);
        await (0, fs_extra_1.writeFile)(path.join(projectDir, "yarn.lock"), "");
        await (0, fs_extra_1.writeFile)(path.join(projectDir, "app", "yarn.lock"), "");
        await (0, fs_extra_1.copyFile)(path.join((0, packTester_1.getFixtureDir)(), ".pnp.cjs"), path.join(projectDir, ".pnp.cjs"));
    },
}));
// yarn workspace
test("yarn workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.packageManager = yarnVersion;
        });
        await (0, packTester_1.modifyPackageJson)(path.join(projectDir, "packages", "test-app"), data => packageConfig(data, yarnVersion));
    },
}));
test("yarn berry workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.packageManager = yarnBerryVersion;
        });
        await (0, packTester_1.modifyPackageJson)(path.join(projectDir, "packages", "test-app"), data => packageConfig(data, yarnBerryVersion));
    },
}));
// yarn multi-package workspace
test("yarn multi-package workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.packageManager = yarnVersion;
        });
        await (0, packTester_1.modifyPackageJson)(path.join(projectDir, "packages", "test-app"), data => packageConfig(data, yarnVersion));
    },
}));
// yarn berry multi-package workspace
test("yarn berry multi-package workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.packageManager = yarnBerryVersion;
        });
        await (0, packTester_1.modifyPackageJson)(path.join(projectDir, "packages", "test-app"), data => packageConfig(data, yarnBerryVersion));
    },
}));
// yarn berry PnP workspace (Plug'n'Play mode - no node_modules)
test("yarn berry pnp workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-pnp-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    projectDirCreated: async (projectDir) => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        await Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.packageManager = yarnBerryVersion;
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                };
                data.devDependencies = {
                    electron: testConfig_1.ELECTRON_VERSION,
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                };
            }),
        ]);
    },
}));
// Test for pnpm package manager
const pnpmVersion = "pnpm@10.18.0+sha512.e804f889f1cecc40d572db084eec3e4881739f8dec69c0ff10d2d1beff9a4e309383ba27b5b750059d7f4c149535b6cd0d2cb1ed3aeb739239a4284a68f40cfa";
test("pnpm", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => packageConfig(data, pnpmVersion), false),
}));
// pnpm workspace test (strict mode - default behavior)
test("pnpm workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-pnpm-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: async (projectDir) => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        await Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.packageManager = pnpmVersion;
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                };
                data.devDependencies = {
                    electron: testConfig_1.ELECTRON_VERSION,
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                };
            }),
        ]);
    },
}));
// pnpm workspace with conflicting versions
test("pnpm workspace - conflicting versions", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-pnpm-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: async (projectDir) => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        await Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.packageManager = pnpmVersion;
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                };
                data.devDependencies = {
                    electron: testConfig_1.ELECTRON_VERSION,
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                    // conflicting version should be properly handled
                    "is-bigint": "1.0.4",
                };
            }),
        ]);
    },
}));
// Test for npm package manager
test("npm", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
    projectDirCreated: projectDir => (0, packTester_1.modifyPackageJson)(projectDir, data => packageConfig(data, "npm@9.8.1"), false),
}));
// TODO: Fix bun workspace with isolated linker - the dependency collector reads the workspace root's
// package.json instead of the app's package.json, causing wrong dependencies to be collected.
// See: https://github.com/electron-userland/electron-builder/issues/XXXX
test.skip("bun workspace --linker=isolated", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-bun-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    packageManager: node_module_collector_1.PM.BUN,
    projectDirCreated: projectDir => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        return Promise.all([
            // root pkgs should not be included
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "is-plain-obj": "3.0.0",
                };
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                    process: "^0.11.10",
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "bunfig.toml"), '[install]\nlinker = "isolated"\n'),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
}));
// TODO: Fix bun workspace with isolated linker - same issue as above
test.skip("bun workspace --linker=isolated - multiple conflicting versions", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-bun-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    packageManager: node_module_collector_1.PM.BUN,
    projectDirCreated: projectDir => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        return Promise.all([
            // root pkgs should not be included
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "is-plain-obj": "3.0.0",
                };
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                    process: "^0.11.10",
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                    // should include this in a nested node_modules directory
                    "is-bigint": "1.0.4",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "bunfig.toml"), '[install]\nlinker = "isolated"\n'),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
}));
test("bun workspace --linker=hoisted", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-bun-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    packageManager: node_module_collector_1.PM.BUN,
    projectDirCreated: projectDir => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        return Promise.all([
            // root pkgs should not be included
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "is-plain-obj": "3.0.0",
                };
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                    process: "^0.11.10",
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "bunfig.toml"), '[install]\nlinker = "hoisted"\n'),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
}));
test("bun workspace --linker=hoisted - multiple conflicting versions", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-bun-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    packageManager: node_module_collector_1.PM.BUN,
    projectDirCreated: projectDir => {
        const appPkg = path.join(projectDir, "packages", "app");
        const libPkg = path.join(projectDir, "packages", "lib");
        return Promise.all([
            // root pkgs should not be included
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "is-plain-obj": "3.0.0",
                };
            }),
            (0, packTester_1.modifyPackageJson)(appPkg, data => {
                data.dependencies = {
                    lib: "workspace:*",
                    "is-bigint": "1.1.0",
                    process: "^0.11.10",
                };
            }),
            (0, packTester_1.modifyPackageJson)(libPkg, data => {
                data.dependencies = {
                    "left-pad": "1.3.0",
                    // should include this in a nested node_modules directory, since it's a conflicting package version
                    "is-bigint": "1.0.4",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, "bunfig.toml"), '[install]\nlinker = "hoisted"\n'),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(app_builder_lib_1.Platform.LINUX)),
}));
// Test for local file:// protocol
Object.values(node_module_collector_1.PM)
    .filter(pm => pm !== node_module_collector_1.PM.BUN) // bun is not supported for file: protocol
    .forEach(pm => {
    test(`local file:// protocol with ${pm} for project outside workspace`, ({ expect }) => {
        return (0, packTester_1.assertPack)(expect, "test-app-one", {
            targets: packTester_1.linuxDirTarget,
            config: {
                files: ["**/*"],
                asarUnpack: ["**/node_modules/foo/**/*"],
            },
        }, {
            storeDepsLockfileSnapshot: false,
            packageManager: pm,
            projectDirCreated: async (projectDir, tmpDir) => {
                const tempDir = await tmpDir.getTempDir();
                const localPath = path.join(tempDir, "foo");
                await (0, fs_extra_1.outputFile)(path.join(localPath, "package.json"), `{"name":"foo","version":"9.0.0","main":"index.js","license":"MIT","dependencies":{"ms":"2.0.0"}}`);
                await (0, fs_extra_1.outputFile)(path.join(localPath, "index.js"), `module.exports = require("ms")`);
                const pmCommand = (0, packTester_1.getPackageManagerWithVersion)(pm).cli;
                (0, child_process_1.execSync)(`${pmCommand} install`, { cwd: localPath, stdio: "inherit", env: { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: "false" } });
                await (0, packTester_1.modifyPackageJson)(projectDir, data => {
                    data.dependencies = {
                        foo: `file:${localPath}`,
                    };
                });
                //`localPath` is dynamic and changes for every which causes `--frozen-lockfile` and `npm ci` to fail
                (0, child_process_1.execSync)(`${pmCommand} install`, { cwd: projectDir, stdio: "inherit", env: { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: "false" } });
            },
            packed: async (context) => {
                const resources = context.getResources(app_builder_lib_1.Platform.LINUX);
                await (0, fileAssert_1.assertThat)(expect, path.join(resources, "app.asar.unpacked", "node_modules", "foo", "package.json")).isFile();
            },
        });
    });
});
//# sourceMappingURL=packageManagerTest.js.map
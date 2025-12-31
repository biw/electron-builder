"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_module_collector_1 = require("app-builder-lib/out/node-module-collector");
const util_1 = require("builder-util/out/util");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
const child_process_1 = require("child_process");
test("yarn workspace", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("conflict versions", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-workspace-version-conflict", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("yarn several workspaces", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("yarn several workspaces and asarUnpack", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
    config: {
        asarUnpack: ["**/node_modules/ms/**/*"],
    },
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test.ifLinux("yarn two package.json w/ native mac-only module (optional dep)", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-two-native-modules", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("yarn two package.json", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.dependencies = {
                "electron-updater": "6",
                express: "4",
                "patch-package": "^8.0.0",
            };
            data.devDependencies = {
                electron: "23.2.0",
                "del-cli": "6",
                "electron-builder": "26",
                "fs-extra": "11",
            };
            data.build.directories = {
                app: "app",
            };
        });
        (0, fs_extra_1.mkdirSync)(path.join(projectDir, "app"));
        (0, fs_extra_1.copySync)(path.join(projectDir, "index.html"), path.join(projectDir, "app", "index.html"));
        (0, fs_extra_1.copySync)(path.join(projectDir, "index.js"), path.join(projectDir, "app", "index.js"));
        // delete package.json devDependencies
        const packageJson = (0, fs_extra_1.readJsonSync)(path.join(projectDir, "package.json"));
        delete packageJson.devDependencies;
        delete packageJson.build;
        delete packageJson.scripts;
        (0, fs_extra_1.writeJsonSync)(path.join(projectDir, "app", "package.json"), packageJson);
        (0, child_process_1.execSync)("yarn install", { cwd: projectDir });
        (0, child_process_1.execSync)("yarn install", { cwd: path.join(projectDir, "app") });
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("yarn two package.json without node_modules", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.dependencies = {
                "electron-updater": "6",
                express: "4",
                "patch-package": "^8.0.0",
            };
            data.devDependencies = {
                electron: "23.2.0",
                "del-cli": "6",
                "electron-builder": "26",
                "fs-extra": "11",
            };
            data.build.directories = {
                app: "app",
            };
        });
        // install dependencies in project dir
        await (0, util_1.spawn)("yarn", ["install"], {
            cwd: projectDir,
        });
        (0, fs_extra_1.mkdirSync)(path.join(projectDir, "app"));
        (0, fs_extra_1.rmSync)(path.join(projectDir, "app", "node_modules"), { recursive: true, force: true });
        (0, fs_extra_1.copySync)(path.join(projectDir, "index.html"), path.join(projectDir, "app", "index.html"));
        (0, fs_extra_1.copySync)(path.join(projectDir, "index.js"), path.join(projectDir, "app", "index.js"));
        // delete package.json devDependencies
        const packageJson = (0, fs_extra_1.readJsonSync)(path.join(projectDir, "package.json"));
        delete packageJson.devDependencies;
        delete packageJson.build;
        delete packageJson.scripts;
        (0, fs_extra_1.writeJsonSync)(path.join(projectDir, "app", "package.json"), packageJson);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test.ifWindows("should throw when attempting to package a system file", async ({ expect }) => {
    const invalidPath = "C:\\Windows\\System32\\drivers\\etc\\hosts";
    return (0, packTester_1.appTwoThrows)(expect, {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("dir", electron_builder_1.Arch.x64),
        projectDir: "app",
        config: {
            electronVersion: testConfig_1.ELECTRON_VERSION,
            files: ["index.js", "package.json", invalidPath],
        },
    }, {
        storeDepsLockfileSnapshot: true,
        packageManager: node_module_collector_1.PM.YARN,
    }, error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("outside the package to a system or unsafe path");
    });
});
test.ifNotWindows("should throw when attempting to package a symlink to a system file", async ({ expect }) => {
    const invalidPath = "/etc/passwd";
    const buildConfig = {
        targets: electron_builder_1.Platform.current().createTarget("dir", electron_builder_1.Arch.x64),
        projectDir: "app",
        config: {
            asar: true,
            electronVersion: testConfig_1.ELECTRON_VERSION,
        },
    };
    await (0, packTester_1.appTwoThrows)(expect, buildConfig, {
        packageManager: node_module_collector_1.PM.YARN,
        projectDirCreated: async (projectDir) => {
            await (0, fs_extra_1.symlink)(invalidPath, path.join(projectDir, "app", "badlink"));
        },
    }, error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("outside the package to a system or unsafe path");
    });
});
test("yarn workspace for scope name", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: async (projectDir) => {
        const subAppDir = path.join(projectDir, "packages", "test-app");
        return (0, packTester_1.modifyPackageJson)(subAppDir, data => {
            data.name = "@scope/xxx-app";
            data.dependencies = {
                "is-odd": "3.0.1",
            };
        });
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
// https://github.com/electron-userland/electron-builder/issues/8493
test("pnpm es5-ext without hoisted config", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "es5-ext": "0.10.53",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("pnpm optional dependencies", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "electron-clear-data": "^1.0.5",
                };
                data.optionalDependencies = {
                    debug: "3.1.0",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test.ifLinux("pnpm optional dependency not installable on linux", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "electron-clear-data": "^1.0.5",
                };
                data.optionalDependencies = {
                    "node-mac-permissions": "2.3.0",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("yarn electron-clear-data", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "electron-clear-data": "^1.0.5",
                };
                data.optionalDependencies = {
                    debug: "3.1.0",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.WINDOWS)),
}));
test("npm electron-clear-data", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.NPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "electron-clear-data": "^1.0.5",
                };
                data.optionalDependencies = {
                    debug: "3.1.0",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.WINDOWS)),
}));
// https://github.com/electron-userland/electron-builder/issues/8842
test("yarn some module add by manual instead of install", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64),
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: async (projectDir) => {
        await (0, fs_extra_1.outputFile)(path.join(projectDir, "node_modules", "foo", "package.json"), `{"name":"foo","version":"9.0.0","main":"index.js","license":"MIT"}`);
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.dependencies = {
                debug: "3.1.0",
            };
        });
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.WINDOWS)),
}));
//https://github.com/electron-userland/electron-builder/issues/8857
test("yarn max stack", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "npm-run-all": "^4.1.5",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("pnpm max stack", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "npm-run-all": "^4.1.5",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
//github.com/electron-userland/electron-builder/issues/8842
test("yarn ms", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: async (projectDir) => {
        await (0, packTester_1.modifyPackageJson)(projectDir, data => {
            data.dependencies = {
                "@sentry/electron": "5.11.0",
                "electron-clear-data": "^1.0.5",
            };
            data.devDependencies = {
                electron: "34.0.2",
            };
        });
        (0, child_process_1.execSync)("yarn install", { cwd: projectDir });
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
//github.com/electron-userland/electron-builder/issues/8426
test("yarn parse-asn1", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.YARN,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    "parse-asn1": "5.1.7",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
//github.com/electron-userland/electron-builder/issues/8431
test("npm tar", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.NPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    tar: "7.4.3",
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
//github.com/electron-userland/electron-builder/issues/8881
test("pnpm node-linker=hoisted", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    dayjs: "1.11.13",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, ".npmrc"), "node-linker=hoisted"),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("pnpm shamefully-hoist=true", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    dayjs: "1.11.13",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, ".npmrc"), "shamefully-hoist=true"),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("pnpm public-hoist-pattern=*", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-hoisted", {
    targets: packTester_1.linuxDirTarget,
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(projectDir, data => {
                data.dependencies = {
                    dayjs: "1.11.13",
                };
            }),
            (0, fs_extra_1.outputFile)(path.join(projectDir, ".npmrc"), "public-hoist-pattern=*"),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
test("pnpm workspace with native module", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app",
    config: {
        files: [
            "!node_modules/better-sqlite3/**",
            {
                from: "node_modules/better-sqlite3/build/Release",
                to: "./",
                filter: ["*.node"],
            },
        ],
    },
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    projectDirCreated: projectDir => {
        return Promise.all([
            (0, packTester_1.modifyPackageJson)(path.join(projectDir, "packages", "test-app"), data => {
                data.dependencies = {
                    "better-sqlite3": "^11.10.0",
                    debug: "4.4.3",
                };
                data.devDependencies = {
                    electron: testConfig_1.ELECTRON_VERSION,
                };
            }),
        ]);
    },
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
// Test pnpm workspace with workspace:* dependencies (link: protocol)
// This specifically tests that packages using "workspace:*" protocol are correctly
// resolved and bundled. The "lib" package is a workspace dependency of "app".
test("pnpm workspace with workspace protocol dependencies", ({ expect }) => (0, packTester_1.assertPack)(expect, "test-app-pnpm-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/app",
}, {
    storeDepsLockfileSnapshot: true,
    packageManager: node_module_collector_1.PM.PNPM,
    packed: context => (0, packTester_1.verifyAsarFileTree)(expect, context.getResources(electron_builder_1.Platform.LINUX)),
}));
//# sourceMappingURL=HoistedNodeModuleTest.js.map
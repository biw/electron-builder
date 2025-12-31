"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const builder_util_1 = require("builder-util");
const packTester_1 = require("./helpers/packTester");
const options = { timeout: 20 * 60 * 1000 };
const winTargets = app_builder_lib_1.Platform.WINDOWS.createTarget([app_builder_lib_1.DIR_TARGET, "nsis"], app_builder_lib_1.Arch.x64, app_builder_lib_1.Arch.arm64);
const macTargets = app_builder_lib_1.Platform.MAC.createTarget([app_builder_lib_1.DIR_TARGET, "zip", "dmg", "mas"], app_builder_lib_1.Arch.arm64, app_builder_lib_1.Arch.x64);
const linuxTargets = app_builder_lib_1.Platform.LINUX.createTarget([app_builder_lib_1.DIR_TARGET, "AppImage"], app_builder_lib_1.Arch.x64, app_builder_lib_1.Arch.armv7l);
const config = {
    productName: "Test Concurrent",
    appId: "test-concurrent",
    artifactName: "${productName}-${version}-${arch}.${ext}",
    compression: "store",
};
const projectDirCreated = async (projectDir, tmpDir) => {
    const buildConfig = (data, isApp) => {
        (0, builder_util_1.deepAssign)(data, {
            name: "concurrent", // needs to be lowercase for fpm targets (can't use default fixture TestApp)
            version: "1.1.0",
            ...(!isApp ? { build: config } : {}), // build config is only allowed in "dev" (root) package.json in two-package.json setups
        });
    };
    await (0, packTester_1.modifyPackageJson)(projectDir, (data) => buildConfig(data, true), true);
    await (0, packTester_1.modifyPackageJson)(projectDir, (data) => buildConfig(data, false), false);
};
test.ifLinux("win/linux concurrent", options, ({ expect }) => {
    const targets = new Map([...winTargets, ...linuxTargets]);
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets,
        config: {
            concurrency: {
                jobs: Object.keys(targets).length,
            },
            ...config,
        },
    }, {
        projectDirCreated,
    });
});
test.ifMac("mac/win/linux concurrent", options, ({ expect }) => {
    const targets = new Map([...winTargets, ...macTargets, ...linuxTargets]);
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets,
        config: {
            concurrency: {
                jobs: Object.keys(targets).length,
            },
            ...config,
        },
    }, {
        projectDirCreated,
    });
});
test.ifMac("mac concurrent", options, ({ expect }) => {
    const targets = macTargets;
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets,
        config: {
            concurrency: {
                jobs: Object.keys(targets).length,
            },
            ...config,
        },
    }, {
        projectDirCreated,
    });
});
test.ifNotMac("win concurrent", options, ({ expect }) => {
    const targets = winTargets;
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets,
        config: {
            concurrency: {
                jobs: Object.keys(targets).length,
            },
            ...config,
        },
    }, {
        projectDirCreated,
    });
});
test.ifNotWindows("linux concurrent", options, ({ expect }) => {
    const targets = app_builder_lib_1.Platform.LINUX.createTarget([app_builder_lib_1.DIR_TARGET, "rpm", "AppImage"], app_builder_lib_1.Arch.x64, app_builder_lib_1.Arch.armv7l);
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets,
        config: {
            concurrency: {
                jobs: Object.keys(targets).length,
            },
            ...config,
        },
    }, {
        projectDirCreated,
    });
});
test.ifWindows("win concurrent - all targets", options, ({ expect }) => {
    const targetList = [app_builder_lib_1.DIR_TARGET, `appx`, `nsis`, `portable`, `squirrel`, `7z`, `zip`, `tar.xz`, `tar.gz`, `tar.bz2`];
    const targets = app_builder_lib_1.Platform.WINDOWS.createTarget(targetList, app_builder_lib_1.Arch.x64, app_builder_lib_1.Arch.arm64);
    return (0, packTester_1.assertPack)(expect, "test-app", {
        targets,
        config: {
            concurrency: {
                jobs: Object.keys(targets).length,
            },
            win: { target: targetList },
            ...config,
        },
    }, {
        projectDirCreated,
    });
});
//# sourceMappingURL=concurrentBuildsTest.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path = require("path");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
function spacesPublisher(publishAutoUpdate = true) {
    return {
        provider: "spaces",
        name: "mySpaceName",
        region: "nyc3",
        publishAutoUpdate,
    };
}
function githubPublisher(repo) {
    return {
        provider: "github",
        repo,
    };
}
function genericPublisher(url) {
    return {
        provider: "generic",
        url,
    };
}
function keygenPublisher() {
    return {
        provider: "keygen",
        product: "43981278-96e7-47de-b8c2-98d59987206b",
        account: "cdecda36-3ef0-483e-ad88-97e7970f3149",
    };
}
test.ifNotWindows.ifDevOrLinuxCi("generic, github and spaces", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("zip", electron_builder_1.Arch.x64),
    config: {
        generateUpdatesFilesForAllChannels: true,
        mac: {
            electronUpdaterCompatibility: ">=2.16",
        },
        publish: [genericPublisher("https://example.com/downloads"), githubPublisher("foo/foo"), spacesPublisher()],
    },
}));
test.ifNotWindows.ifDevOrLinuxCi("github and spaces (publishAutoUpdate)", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("AppImage"),
    config: {
        mac: {
            electronUpdaterCompatibility: ">=2.16",
        },
        publish: [githubPublisher("foo/foo"), spacesPublisher(false)],
    },
}));
test.ifMac("mac artifactName ", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.MAC.createTarget("zip", electron_builder_1.Arch.x64),
    config: {
        // tslint:disable-next-line:no-invalid-template-strings
        artifactName: "${productName}_${version}_${os}.${ext}",
        mac: {
            electronUpdaterCompatibility: ">=2.16",
        },
        publish: [spacesPublisher(), keygenPublisher()],
    },
}, {
    publish: undefined,
}));
// otherwise test "os macro" always failed for pull requests
process.env.PUBLISH_FOR_PULL_REQUEST = "true";
test.ifNotWindows("os macro", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], "zip"),
    config: {
        publish: {
            provider: "s3",
            bucket: "my bucket",
            // tslint:disable-next-line:no-invalid-template-strings
            path: "${channel}/${os}",
        },
    },
}, {
    publish: "always",
    projectDirCreated: async (projectDir) => {
        process.env.__TEST_S3_PUBLISHER__ = path.join(projectDir, "dist/s3");
    },
    packed: async (context) => {
        const dir = path.join(context.projectDir, "dist/s3");
        await (0, fileAssert_1.assertThat)(expect, dir).isDirectory();
        await (0, packTester_1.checkDirContents)(expect, dir);
    },
}));
// disable on ifNotCi for now - slow on CircleCI
// error should be ignored because publish: never
// https://github.com/electron-userland/electron-builder/issues/2670
test.ifNotCi("dotted s3 bucket", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX], "zip"),
    config: {
        publish: {
            provider: "s3",
            bucket: "bucket.dotted.name",
        },
    },
}, {
    publish: "never",
}));
// https://github.com/electron-userland/electron-builder/issues/3261
test.ifNotWindows("custom provider", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: (0, electron_builder_1.createTargets)([electron_builder_1.Platform.LINUX], "deb"),
    config: {
        publish: {
            provider: "custom",
            boo: "foo",
        },
    },
}, {
    publish: "never",
    projectDirCreated: projectDir => (0, fs_extra_1.outputFile)(path.join(projectDir, "build/electron-publisher-custom.js"), `class Publisher {
    async upload(task) {
    }
  }

  module.exports = Publisher`),
}));
//# sourceMappingURL=PublishManagerTest.js.map
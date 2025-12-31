"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const PublishManager_1 = require("app-builder-lib/out/publish/PublishManager");
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_builder_1 = require("electron-builder");
const electron_publish_1 = require("electron-publish");
const path = require("path");
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function versionNumber() {
    return `${getRandomInt(0, 99)}.${getRandomInt(0, 99)}.${getRandomInt(0, 99)}`;
}
//noinspection SpellCheckingInspection
const token = Buffer.from("Y2Y5NDdhZDJhYzJlMzg1OGNiNzQzYzcwOWZhNGI0OTk2NWQ4ZDg3Yg==", "base64").toString();
const iconPath = path.join(__dirname, "..", "fixtures", "test-app", "build", "icon.icns");
const icoPath = path.join(__dirname, "..", "fixtures", "test-app", "build", "icon.ico");
const publishContext = {
    cancellationToken: new builder_util_runtime_1.CancellationToken(),
    progress: null,
};
test("GitHub unauthorized", async ({ expect }) => {
    try {
        await new electron_publish_1.GitHubPublisher(publishContext, { provider: "github", owner: "actperepo", repo: "ecb2", token: "incorrect token" }, versionNumber())._release.value;
    }
    catch (e) {
        expect(e.message).toMatch(/(Bad credentials|Unauthorized|API rate limit exceeded)/);
        return;
    }
    throw new Error("must be error");
});
function isApiRateError(e) {
    if (e.name === "HttpError") {
        const description = e.description;
        return description.message != null && description.message.includes("API rate limit exceeded");
    }
    else {
        return false;
    }
}
function testAndIgnoreApiRate(name, testFunction) {
    test.skip(name, async ({ expect }) => {
        try {
            await testFunction(expect);
        }
        catch (e) {
            if (isApiRateError(e)) {
                console.warn(e.description.message);
            }
            else {
                throw e;
            }
        }
    });
}
testAndIgnoreApiRate("GitHub upload", async () => {
    const publisher = new electron_publish_1.GitHubPublisher(publishContext, { provider: "github", owner: "actperepo", repo: "ecb2", token }, versionNumber());
    try {
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
        // test overwrite
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    }
    finally {
        await publisher.deleteRelease();
    }
});
test.ifEnv(process.env.AWS_ACCESS_KEY_ID != null && process.env.AWS_SECRET_ACCESS_KEY != null)("S3 upload", async () => {
    const publisher = await (0, PublishManager_1.createPublisher)(publishContext, "0.0.1", { provider: "s3", bucket: "electron-builder-test" }, {}, {});
    await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    // test overwrite
    await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
});
test.ifEnv(process.env.DO_KEY_ID != null && process.env.DO_SECRET_KEY != null)("DO upload", async () => {
    const configuration = {
        provider: "spaces",
        name: "electron-builder-test",
        region: "nyc3",
    };
    const publisher = await (0, PublishManager_1.createPublisher)(publishContext, "0.0.1", configuration, {}, {});
    await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    // test overwrite
    await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
});
testAndIgnoreApiRate("prerelease", async (expect) => {
    const publisher = new electron_publish_1.GitHubPublisher(publishContext, { provider: "github", owner: "actperepo", repo: "ecb2", token, releaseType: "prerelease" }, versionNumber());
    try {
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
        const r = await publisher.getRelease();
        expect(r).toMatchObject({
            prerelease: true,
            draft: false,
        });
    }
    finally {
        await publisher.deleteRelease();
    }
});
testAndIgnoreApiRate("GitHub upload org", async () => {
    //noinspection SpellCheckingInspection
    const publisher = new electron_publish_1.GitHubPublisher(publishContext, { provider: "github", owner: "builder-gh-test", repo: "darpa", token }, versionNumber());
    try {
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    }
    finally {
        await publisher.deleteRelease();
    }
});
test.ifEnv(process.env.KEYGEN_TOKEN)("Keygen upload", async () => {
    const publisher = new electron_publish_1.KeygenPublisher(publishContext, {
        provider: "keygen",
        // electron-builder-test
        product: process.env.KEYGEN_PRODUCT || "43981278-96e7-47de-b8c2-98d59987206b",
        account: process.env.KEYGEN_ACCOUNT || "cdecda36-3ef0-483e-ad88-97e7970f3149",
        platform: app_builder_lib_1.Platform.MAC.name,
    }, versionNumber());
    const [releaseId] = await Promise.all([
        publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 }),
        // test parallel artifact uploads for the same release
        publisher.upload({ file: icoPath, arch: builder_util_1.Arch.x64 }),
    ]);
    await publisher.deleteRelease(releaseId);
});
test.ifEnv(process.env.BITBUCKET_TOKEN)("Bitbucket upload", async () => {
    const timeout = 0;
    const config = {
        provider: "bitbucket",
        owner: "mike-m",
        slug: "electron-builder-test",
        timeout,
    };
    const publisher = new electron_publish_1.BitbucketPublisher(publishContext, config);
    const filename = await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64, timeout });
    await publisher.deleteRelease(filename);
    const uploadTasks = await (0, electron_builder_1.publishArtifactsWithOptions)([{ file: icoPath, arch: null }], undefined, undefined, [config]);
    for (const task of uploadTasks) {
        await publisher.deleteRelease(task.file);
    }
});
test.ifEnv(process.env.BITBUCKET_TOKEN)("Bitbucket upload", async ({ expect }) => {
    const timeout = 100;
    const publisher = new electron_publish_1.BitbucketPublisher(publishContext, {
        provider: "bitbucket",
        owner: "mike-m",
        slug: "electron-builder-test",
        timeout,
    });
    expect(await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64, timeout })).toThrowError("Request timed out");
});
//# sourceMappingURL=ArtifactPublisherTest.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_publish_1 = require("electron-publish");
const vitest_1 = require("vitest");
const GitlabTestFixtures_1 = require("./GitlabTestFixtures");
const GitlabTestHelper_1 = require("./GitlabTestHelper");
/**
 * GitLab Publisher Integration Tests
 *
 * Streamlined integration tests for GitlabPublisher core functionality.
 *
 * Prerequisites:
 * - GITLAB_TOKEN environment variable with valid GitLab personal access token
 * - GITLAB_TEST_PROJECT_ID for test project (default: 72170733)
 *
 * Coverage:
 * - Authentication validation
 * - Upload methods: project_upload and generic_package
 * - Release creation and asset linking
 *
 * Features:
 * - Automatic cleanup via afterAll hook
 * - Minimal API calls for CI efficiency
 */
function isAuthError(error) {
    var _a;
    const errorMessage = (error === null || error === void 0 ? void 0 : error.message) || ((_a = error === null || error === void 0 ? void 0 : error.description) === null || _a === void 0 ? void 0 : _a.message) || String(error);
    return GitlabTestFixtures_1.GitlabTestFixtures.ERROR_PATTERNS.auth.test(errorMessage);
}
/**
 * Cleans up test releases, preserving [v1.0.0, v1.1.0] baseline releases
 */
async function cleanupExistingReleases() {
    const token = process.env.GITLAB_TOKEN;
    if (!token) {
        // No GitLab token available for cleanup
        return;
    }
    try {
        const helper = new GitlabTestHelper_1.GitlabTestHelper();
        const releases = await helper.getAllReleases();
        // Keep [v1.0.0, v1.1.0] baseline releases
        const protectedReleases = ["v1.0.0", "1.0.0", "v1.1.0", "1.1.0"];
        const releasesToDelete = releases.filter((release) => !protectedReleases.includes(release.tag_name));
        if (releasesToDelete.length === 0) {
            // No releases to cleanup
            return;
        }
        // Delete releases, tags, and assets
        const cleanupPromises = releasesToDelete.map(async (release) => {
            try {
                const versionId = release.tag_name;
                await helper.deleteUploadedAssets(versionId);
                await helper.deleteReleaseAndTag(versionId);
                // Cleaned up release: ${versionId}
            }
            catch (_e) {
                // Failed to cleanup release ${release.tag_name}
            }
        });
        await Promise.allSettled(cleanupPromises);
        // Cleanup completed. Deleted ${releasesToDelete.length} releases.
    }
    catch (_e) {
        // Failed to perform cleanup
    }
}
vitest_1.describe.sequential("GitLab Publisher - Integration Tests", () => {
    let publishContext;
    let gitlabHelper;
    let testId;
    (0, vitest_1.beforeEach)(() => {
        testId = Date.now().toString();
        publishContext = {
            cancellationToken: new builder_util_runtime_1.CancellationToken(),
            progress: null,
        };
        gitlabHelper = new GitlabTestHelper_1.GitlabTestHelper();
    });
    (0, vitest_1.afterAll)(async () => {
        await cleanupExistingReleases();
    }, 120000);
    // Helper to create a publisher with unique version
    function createPublisher(options = {}) {
        const uniqueVersion = `${GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.randomVersion()}.${testId}`;
        return new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
            ...options,
            token: undefined, // Use environment token
        }), uniqueVersion);
    }
    vitest_1.describe.sequential("Authentication", () => {
        (0, vitest_1.test)("should reject invalid token", async () => {
            const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                token: GitlabTestFixtures_1.GitlabTestFixtures.TOKENS.invalid,
            }), `${GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.randomVersion()}.${testId}`);
            try {
                await publisher.upload({ file: GitlabTestFixtures_1.GitlabTestFixtures.ICON_PATH, arch: builder_util_1.Arch.x64 });
                throw new Error("Expected authentication error");
            }
            catch (error) {
                (0, vitest_1.expect)(isAuthError(error), `Error: ${error.message}`).toBe(true);
            }
        }, 15000);
    });
    vitest_1.describe.sequential("File Upload", () => {
        vitest_1.test.skipIf(!process.env.GITLAB_TOKEN)("should upload via project_upload, create release and link assets", async () => {
            var _a;
            const publisher = createPublisher();
            await publisher.upload({ file: GitlabTestFixtures_1.GitlabTestFixtures.ICON_PATH, arch: builder_util_1.Arch.x64 });
            const tag = publisher.tag;
            const release = await gitlabHelper.getRelease(tag);
            (0, vitest_1.expect)(release).toBeTruthy();
            (0, vitest_1.expect)(GitlabTestFixtures_1.GitlabTestFixtures.validateReleaseStructure(release)).toBe(true);
            const assets = release === null || release === void 0 ? void 0 : release.assets;
            (0, vitest_1.expect)((_a = assets === null || assets === void 0 ? void 0 : assets.links) === null || _a === void 0 ? void 0 : _a.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(GitlabTestFixtures_1.GitlabTestFixtures.validateAssetLinkStructure(assets === null || assets === void 0 ? void 0 : assets.links[0], "project_upload")).toBe(true);
        }, 60000);
        vitest_1.test.skipIf(!process.env.GITLAB_TOKEN)("should upload via generic_package, create release and link assets", async () => {
            var _a;
            const publisher = createPublisher({ uploadTarget: "generic_package" });
            await publisher.upload({ file: GitlabTestFixtures_1.GitlabTestFixtures.ICON_PATH, arch: builder_util_1.Arch.x64 });
            const tag = publisher.tag;
            const release = await gitlabHelper.getRelease(tag);
            (0, vitest_1.expect)(release).toBeTruthy();
            (0, vitest_1.expect)(GitlabTestFixtures_1.GitlabTestFixtures.validateReleaseStructure(release)).toBe(true);
            const assets = release === null || release === void 0 ? void 0 : release.assets;
            (0, vitest_1.expect)((_a = assets === null || assets === void 0 ? void 0 : assets.links) === null || _a === void 0 ? void 0 : _a.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(GitlabTestFixtures_1.GitlabTestFixtures.validateAssetLinkStructure(assets === null || assets === void 0 ? void 0 : assets.links[0], "generic_package")).toBe(true);
        }, 60000);
    });
});
//# sourceMappingURL=GitlabPublisher.integration.test.js.map
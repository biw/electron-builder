"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabTestHelper = void 0;
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
/**
 * Helper class for GitLab test operations
 *
 * Provides methods for interacting with GitLab API during testing,
 * including release management and cleanup operations.
 */
class GitlabTestHelper {
    constructor({ 
    // gitlab repo for this project is `https://gitlab.com/daihere1993/gitlab-electron-updater-test-2`
    projectId = "72170733", host = "gitlab.com", } = {}) {
        this.token = process.env.GITLAB_TOKEN || "";
        this.host = host;
        this.projectId = String(projectId);
    }
    /**
     * Make authenticated request to GitLab API
     */
    async gitlabRequest(path, data, method = "GET") {
        const requestOptions = {
            hostname: this.host,
            path: `/api/v4${path}`,
            method: method,
            headers: {
                "Private-Token": this.token,
                accept: "application/json",
            },
        };
        try {
            const response = await builder_util_1.httpExecutor.request(requestOptions, undefined, data);
            return response ? JSON.parse(response) : null;
        }
        catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
                return null;
            }
            throw e;
        }
    }
    /**
     * Get release information by tag name
     */
    async getRelease(releaseId) {
        try {
            return await this.gitlabRequest(`/projects/${encodeURIComponent(this.projectId)}/releases/${releaseId}`);
        }
        catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
                return null;
            }
            throw e;
        }
    }
    /**
     * Delete GitLab release by tag name
     */
    async deleteRelease(releaseId) {
        const release = await this.getRelease(releaseId);
        if (release == null) {
            builder_util_1.log.warn({ releaseId, reason: "doesn't exist" }, "cannot delete release");
            return;
        }
        try {
            await this.gitlabRequest(`/projects/${encodeURIComponent(this.projectId)}/releases/${releaseId}`, null, "DELETE");
        }
        catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
                builder_util_1.log.warn({ releaseId, reason: "doesn't exist" }, "cannot delete release");
                return;
            }
            throw e;
        }
    }
    /**
     * Delete GitLab release and corresponding git tag
     */
    async deleteReleaseAndTag(releaseId) {
        const release = await this.getRelease(releaseId);
        if (release == null) {
            builder_util_1.log.warn({ releaseId, reason: "doesn't exist" }, "cannot delete release");
            return;
        }
        try {
            // First delete the release
            await this.deleteRelease(releaseId);
            builder_util_1.log.debug({ releaseId }, "Deleted GitLab release");
        }
        catch (e) {
            builder_util_1.log.warn({ releaseId, error: e.message }, "Failed to delete GitLab release");
        }
        try {
            // Then delete the git tag
            await this.gitlabRequest(`/projects/${encodeURIComponent(this.projectId)}/repository/tags/${encodeURIComponent(releaseId)}`, null, "DELETE");
            builder_util_1.log.debug({ releaseId }, "Deleted GitLab tag");
        }
        catch (e) {
            if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) {
                builder_util_1.log.warn({ releaseId, reason: "doesn't exist" }, "cannot delete git tag");
                return;
            }
            builder_util_1.log.warn({ releaseId, error: e.message }, "Failed to delete GitLab tag");
        }
    }
    /**
     * Delete uploaded assets (generic packages only)
     *
     * Note: Project uploads are automatically deleted by GitLab when the release is deleted.
     */
    async deleteUploadedAssets(releaseId) {
        try {
            // Only need to delete generic packages - project uploads are auto-deleted with releases
            await this.deleteGenericPackages(releaseId);
        }
        catch (e) {
            builder_util_1.log.warn({ releaseId, error: e.message }, "Failed to cleanup uploaded assets");
        }
    }
    /**
     * Delete generic packages matching version from Package Registry
     */
    async deleteGenericPackages(version) {
        try {
            // Get all packages for the "releases" package name
            const packages = await this.gitlabRequest(`/projects/${encodeURIComponent(this.projectId)}/packages?package_name=releases`);
            if (!packages || packages.length === 0) {
                return;
            }
            // Find packages that match our version
            const matchingPackages = packages.filter(pkg => pkg.name === "releases" && pkg.version === version);
            // Delete matching packages
            const deletePromises = matchingPackages.map(async (pkg) => {
                try {
                    await this.gitlabRequest(`/projects/${encodeURIComponent(this.projectId)}/packages/${pkg.id}`, null, "DELETE");
                    builder_util_1.log.debug({ packageId: pkg.id, version: pkg.version }, "Deleted GitLab generic package");
                }
                catch (e) {
                    builder_util_1.log.warn({ packageId: pkg.id, version: pkg.version, error: e.message }, "Failed to delete GitLab generic package");
                }
            });
            await Promise.allSettled(deletePromises);
        }
        catch (e) {
            builder_util_1.log.warn({ version, error: e.message }, "Failed to cleanup generic packages");
        }
    }
    /**
     * Get all releases from GitLab project
     */
    async getAllReleases() {
        try {
            const releases = await this.gitlabRequest(`/projects/${encodeURIComponent(this.projectId)}/releases`);
            return releases || [];
        }
        catch (e) {
            throw new Error(`Failed to get all releases: ${e.message}`);
        }
    }
}
exports.GitlabTestHelper = GitlabTestHelper;
//# sourceMappingURL=GitlabTestHelper.js.map
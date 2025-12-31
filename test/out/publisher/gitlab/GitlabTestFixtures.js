"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabTestFixtures = void 0;
const path = require("path");
class GitlabTestFixtures {
    // Helper methods
    static generateRandomVersion() {
        const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        return `${randomInt(0, 99)}.${randomInt(0, 99)}.${randomInt(0, 99)}`;
    }
    static createOptions(overrides = {}) {
        return { ...GitlabTestFixtures.DEFAULT_OPTIONS, ...overrides };
    }
    static createTestFiles() {
        return [
            { name: "icon.icns", path: GitlabTestFixtures.ICON_PATH },
            { name: "icon.ico", path: GitlabTestFixtures.ICO_PATH },
        ];
    }
    // Environment setup helpers
    static setupTestEnvironment() {
        const original = {
            GITLAB_TOKEN: process.env.GITLAB_TOKEN,
            CI_PROJECT_ID: process.env.CI_PROJECT_ID,
            CI_PROJECT_PATH: process.env.CI_PROJECT_PATH,
        };
        return {
            original,
            restore: () => {
                Object.entries(original).forEach(([key, value]) => {
                    if (value !== undefined) {
                        process.env[key] = value;
                    }
                    else {
                        delete process.env[key];
                    }
                });
            },
        };
    }
    // Assertion helpers for test validation
    static validateReleaseStructure(release) {
        var _a;
        const r = release;
        return typeof (r === null || r === void 0 ? void 0 : r.tag_name) === "string" && typeof (r === null || r === void 0 ? void 0 : r.name) === "string" && Array.isArray((_a = r === null || r === void 0 ? void 0 : r.assets) === null || _a === void 0 ? void 0 : _a.links);
    }
    static validateAssetLinkStructure(link, assetType) {
        const l = link;
        // GitLab upload URL pattern: https://gitlab.com/-/project/{projectId}/uploads/{hash}/{filename}
        const gitlabUploadUrlPattern = /^https:\/\/gitlab\.com\/-\/project\/\d+\/uploads\/[a-f0-9]{32}\/.+$/;
        // GitLab generic package URL pattern: https://gitlab.com/api/v4/projects/{projectId}/packages/generic/{packageName}/{packageVersion}/{filename}
        const gitlabGenericPackageUrlPattern = /^https:\/\/gitlab\.com\/api\/v4\/projects\/\d+\/packages\/generic\/.+\/.+\/.+$/;
        const isValidUrl = (url) => {
            if (assetType === "project_upload") {
                return gitlabUploadUrlPattern.test(url);
            }
            else if (assetType === "generic_package") {
                return gitlabGenericPackageUrlPattern.test(url);
            }
            return false;
        };
        return ((typeof (l === null || l === void 0 ? void 0 : l.id) === "string" || typeof (l === null || l === void 0 ? void 0 : l.id) === "number") &&
            typeof (l === null || l === void 0 ? void 0 : l.name) === "string" &&
            typeof (l === null || l === void 0 ? void 0 : l.url) === "string" &&
            isValidUrl(l === null || l === void 0 ? void 0 : l.url) &&
            typeof (l === null || l === void 0 ? void 0 : l.direct_asset_url) === "string" &&
            isValidUrl(l === null || l === void 0 ? void 0 : l.direct_asset_url) &&
            typeof (l === null || l === void 0 ? void 0 : l.link_type) === "string");
    }
}
exports.GitlabTestFixtures = GitlabTestFixtures;
// Test file paths
GitlabTestFixtures.ICON_PATH = path.join(__dirname, "..", "..", "..", "fixtures", "test-app", "build", "icon.icns");
GitlabTestFixtures.ICO_PATH = path.join(__dirname, "..", "..", "..", "fixtures", "test-app", "build", "icon.ico");
// Test versions
GitlabTestFixtures.VERSIONS = {
    valid: "1.0.0",
    validWithBuild: "1.0.0-beta.1",
    invalidWithV: "v1.0.0",
    randomVersion: () => GitlabTestFixtures.generateRandomVersion(),
};
// Project configurations
GitlabTestFixtures.PROJECTS = {
    valid: "72170733",
    nonExistent: "99999999",
    stringFormat: "namespace/project-name",
    numericFormat: 12345678,
};
// Host configurations
GitlabTestFixtures.HOSTS = {
    gitlab: "gitlab.com",
    custom: "gitlab.example.com",
    enterprise: "git.company.com",
};
// Token configurations
GitlabTestFixtures.TOKENS = {
    test: "__test__",
    invalid: "invalid-token",
    malformed: "glpat-invalid!@#$%",
};
// Error patterns for assertions
GitlabTestFixtures.ERROR_PATTERNS = {
    auth: /(Unauthorized|401|invalid token|Bad credentials|403|Forbidden)/i,
    notFound: /(404|not found|doesn't exist)/i,
    rateLimit: /rate limit exceeded/i,
    missingToken: /GitLab Personal Access Token is not set/i,
    missingProject: /GitLab project ID or path is not specified/i,
    invalidVersion: /Version must not start with "v"/i,
};
// Default configurations
GitlabTestFixtures.DEFAULT_OPTIONS = {
    provider: "gitlab",
    projectId: GitlabTestFixtures.PROJECTS.valid,
    host: GitlabTestFixtures.HOSTS.gitlab,
    token: GitlabTestFixtures.TOKENS.test,
};
GitlabTestFixtures.DEFAULT_PUBLISH_OPTIONS = {
    publish: "always",
};
//# sourceMappingURL=GitlabTestFixtures.js.map
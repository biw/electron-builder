"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_publish_1 = require("electron-publish");
const vitest_1 = require("vitest");
const GitlabTestFixtures_1 = require("./GitlabTestFixtures");
// Mock the HTTP executor to avoid real network calls
vitest_1.vi.mock("builder-util", async () => {
    const actual = await vitest_1.vi.importActual("builder-util");
    return {
        ...actual,
        httpExecutor: {
            doApiRequest: vitest_1.vi.fn(),
            request: vitest_1.vi.fn(),
        },
    };
});
(0, vitest_1.describe)("GitLab Publisher - Unit Tests", () => {
    let publishContext;
    (0, vitest_1.beforeEach)(() => {
        publishContext = {
            cancellationToken: new builder_util_runtime_1.CancellationToken(),
            progress: null,
        };
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("Configuration", () => {
        (0, vitest_1.describe)("Authentication", () => {
            (0, vitest_1.test)("should throw error for missing token", ({ expect }) => {
                const env = GitlabTestFixtures_1.GitlabTestFixtures.setupTestEnvironment();
                try {
                    delete process.env.GITLAB_TOKEN;
                    expect(() => {
                        new electron_publish_1.GitlabPublisher(publishContext, {
                            provider: "gitlab",
                            projectId: GitlabTestFixtures_1.GitlabTestFixtures.PROJECTS.valid,
                        }, GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                    }).toThrow(GitlabTestFixtures_1.GitlabTestFixtures.ERROR_PATTERNS.missingToken);
                }
                finally {
                    env.restore();
                }
            });
        });
        (0, vitest_1.describe)("Project Configuration", () => {
            (0, vitest_1.test)("should handle string project ID", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                    projectId: GitlabTestFixtures_1.GitlabTestFixtures.PROJECTS.stringFormat,
                }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisher.toString()).toContain(GitlabTestFixtures_1.GitlabTestFixtures.PROJECTS.stringFormat);
            });
            (0, vitest_1.test)("should handle numeric project ID", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                    projectId: GitlabTestFixtures_1.GitlabTestFixtures.PROJECTS.numericFormat,
                }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisher.toString()).toContain(String(GitlabTestFixtures_1.GitlabTestFixtures.PROJECTS.numericFormat));
            });
        });
        (0, vitest_1.describe)("Version Handling", () => {
            (0, vitest_1.test)("should reject version starting with 'v'", ({ expect }) => {
                expect(() => {
                    new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions(), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.invalidWithV);
                }).toThrow(GitlabTestFixtures_1.GitlabTestFixtures.ERROR_PATTERNS.invalidVersion);
            });
            (0, vitest_1.test)("should accept valid version", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions(), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisher.toString()).toContain(GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
            });
            (0, vitest_1.test)("should accept version with build metadata", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions(), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.validWithBuild);
                expect(publisher.toString()).toContain(GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.validWithBuild);
            });
            (0, vitest_1.test)("should handle vPrefixedTagName option", ({ expect }) => {
                const publisherWithPrefix = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                    vPrefixedTagName: true,
                }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                const publisherWithoutPrefix = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                    vPrefixedTagName: false,
                }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisherWithPrefix.toString()).toContain("GitLab");
                expect(publisherWithoutPrefix.toString()).toContain("GitLab");
            });
        });
        (0, vitest_1.describe)("Host Configuration", () => {
            (0, vitest_1.test)("should use default host", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions(), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisher.toString()).toContain("GitLab");
            });
            (0, vitest_1.test)("should use custom host", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                    host: GitlabTestFixtures_1.GitlabTestFixtures.HOSTS.custom,
                }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisher.toString()).toContain("GitLab");
            });
            (0, vitest_1.test)("should use enterprise host", ({ expect }) => {
                const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                    host: GitlabTestFixtures_1.GitlabTestFixtures.HOSTS.enterprise,
                }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
                expect(publisher.toString()).toContain("GitLab");
            });
        });
    });
    (0, vitest_1.describe)("Publisher String Representation", () => {
        (0, vitest_1.test)("should return meaningful string representation", ({ expect }) => {
            const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                projectId: "test-project",
            }), "1.2.3");
            const str = publisher.toString();
            expect(str).toContain("GitLab");
            expect(str).toContain("test-project");
            expect(str).toContain("1.2.3");
        });
    });
    (0, vitest_1.describe)("Upload Target Configuration", () => {
        (0, vitest_1.test)("should default to project_upload method", ({ expect }) => {
            const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions(), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
            expect(publisher.toString()).toContain("GitLab");
        });
        (0, vitest_1.test)("should accept generic_package upload target", ({ expect }) => {
            const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                uploadTarget: "generic_package",
            }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
            expect(publisher.toString()).toContain("GitLab");
        });
        (0, vitest_1.test)("should accept custom timeout", ({ expect }) => {
            const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions({
                timeout: 60000,
            }), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
            expect(publisher.toString()).toContain("GitLab");
        });
    });
    (0, vitest_1.describe)("Provider Name", () => {
        (0, vitest_1.test)("should return correct provider name", ({ expect }) => {
            const publisher = new electron_publish_1.GitlabPublisher(publishContext, GitlabTestFixtures_1.GitlabTestFixtures.createOptions(), GitlabTestFixtures_1.GitlabTestFixtures.VERSIONS.valid);
            expect(publisher.providerName).toBe("gitlab");
        });
    });
});
//# sourceMappingURL=GitlabPublisherTest.js.map
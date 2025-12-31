"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const httpExecutor_1 = require("builder-util-runtime/src/httpExecutor");
(0, vitest_1.describe)("HttpExecutor.prepareRedirectUrlOptions", () => {
    (0, vitest_1.describe)("basic functionality", () => {
        (0, vitest_1.test)("should configure new options from redirect URL", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                port: "443",
                path: "/repos/owner/repo/releases/latest",
                headers: {
                    "User-Agent": "test-agent",
                },
            };
            const redirectUrl = "https://api.github.com/repos/owner/repo/releases/12345";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.protocol).toBe("https:");
            (0, vitest_1.expect)(result.hostname).toBe("api.github.com");
            (0, vitest_1.expect)(result.path).toBe("/repos/owner/repo/releases/12345");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a["User-Agent"]).toBe("test-agent");
        });
        (0, vitest_1.test)("should handle relative redirect URLs", () => {
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                port: "443",
                path: "/repos/owner/repo/releases/latest",
            };
            const redirectUrl = "/repos/owner/repo/releases/12345";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.protocol).toBe("https:");
            (0, vitest_1.expect)(result.hostname).toBe("api.github.com");
            (0, vitest_1.expect)(result.path).toBe("/repos/owner/repo/releases/12345");
        });
        (0, vitest_1.test)("should handle absolute redirect URLs with different domains", () => {
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/latest",
            };
            const redirectUrl = "https://objects.githubusercontent.com/github-production-release-asset-12345/asset.zip";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.protocol).toBe("https:");
            (0, vitest_1.expect)(result.hostname).toBe("objects.githubusercontent.com");
            (0, vitest_1.expect)(result.path).toBe("/github-production-release-asset-12345/asset.zip");
        });
    });
    (0, vitest_1.describe)("authorization header handling", () => {
        (0, vitest_1.test)("should preserve authorization header for same-origin redirects", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/latest",
                headers: {
                    authorization: "Bearer token123",
                },
            };
            const redirectUrl = "https://api.github.com/repos/owner/repo/releases/12345";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
        });
        (0, vitest_1.test)("should strip authorization header for cross-origin redirects", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/latest",
                headers: {
                    authorization: "Bearer token123",
                },
            };
            const redirectUrl = "https://objects.githubusercontent.com/asset.zip";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
        });
        (0, vitest_1.test)("should preserve other headers when stripping authorization", () => {
            var _a, _b, _c;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/latest",
                headers: {
                    authorization: "Bearer token123",
                    "User-Agent": "test-agent",
                    Accept: "application/json",
                },
            };
            const redirectUrl = "https://objects.githubusercontent.com/asset.zip";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            (0, vitest_1.expect)((_b = result.headers) === null || _b === void 0 ? void 0 : _b["User-Agent"]).toBe("test-agent");
            (0, vitest_1.expect)((_c = result.headers) === null || _c === void 0 ? void 0 : _c["Accept"]).toBe("application/json");
        });
        (0, vitest_1.test)("should handle missing authorization header gracefully", () => {
            var _a, _b;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/latest",
                headers: {
                    "User-Agent": "test-agent",
                },
            };
            const redirectUrl = "https://objects.githubusercontent.com/asset.zip";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a["User-Agent"]).toBe("test-agent");
            (0, vitest_1.expect)((_b = result.headers) === null || _b === void 0 ? void 0 : _b.authorization).toBeUndefined();
        });
        (0, vitest_1.test)("should handle missing headers gracefully", () => {
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/latest",
            };
            const redirectUrl = "https://objects.githubusercontent.com/asset.zip";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("objects.githubusercontent.com");
        });
    });
    (0, vitest_1.describe)("cross-origin detection", () => {
        (0, vitest_1.describe)("hostname comparison", () => {
            (0, vitest_1.test)("should treat same hostname as same-origin", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "api.github.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://api.github.com/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should treat different hostname as cross-origin", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "api.github.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://objects.githubusercontent.com/asset.zip";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            });
            (0, vitest_1.test)("should perform case-insensitive hostname comparison", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "API.GitHub.COM",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://api.github.com/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should treat case-different hostnames as same-origin", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "api.github.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://API.GITHUB.COM/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
        });
        (0, vitest_1.describe)("protocol comparison", () => {
            (0, vitest_1.test)("should treat same protocol as same-origin (with same hostname)", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should treat different protocol as cross-origin", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "http://example.com/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            });
            (0, vitest_1.test)("should allow HTTP->HTTPS upgrade on standard ports", () => {
                var _a;
                const originalOptions = {
                    protocol: "http:",
                    hostname: "example.com",
                    port: "80",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com:443/secure/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should allow HTTP->HTTPS upgrade with implicit standard ports", () => {
                var _a;
                const originalOptions = {
                    protocol: "http:",
                    hostname: "example.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com/secure/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should not allow HTTPS->HTTP downgrade", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "http://example.com/insecure/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            });
        });
        (0, vitest_1.describe)("port comparison", () => {
            (0, vitest_1.test)("should treat same explicit ports as same-origin", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    port: "8443",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com:8443/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should treat different ports as cross-origin", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    port: "8443",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com:9443/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            });
            (0, vitest_1.test)("should treat implicit default ports as equivalent to explicit", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    port: "443",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should treat implicit default port as equivalent to explicit (HTTP)", () => {
                var _a;
                const originalOptions = {
                    protocol: "http:",
                    hostname: "example.com",
                    port: "80",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "http://example.com/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should treat explicit port as equivalent to implicit default", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com:443/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
            });
            (0, vitest_1.test)("should handle non-standard ports correctly", () => {
                var _a;
                const originalOptions = {
                    protocol: "https:",
                    hostname: "example.com",
                    port: "8080",
                    headers: { authorization: "Bearer token123" },
                };
                const redirectUrl = "https://example.com:443/different/path";
                const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
                (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            });
        });
    });
    (0, vitest_1.describe)("real-world scenarios", () => {
        (0, vitest_1.test)("should handle GitHub API to GitHub assets redirect", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/assets/12345",
                headers: { authorization: "token ghp_123456789" },
            };
            const redirectUrl = "https://objects.githubusercontent.com/github-production-release-asset-12345/asset.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("objects.githubusercontent.com");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            (0, vitest_1.expect)(result.path).toContain("github-production-release-asset-12345");
        });
        (0, vitest_1.test)("should handle GitHub API to release-assets.githubusercontent.com redirect", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/repos/owner/repo/releases/assets/12345",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://release-assets.githubusercontent.com/asset.zip";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("release-assets.githubusercontent.com");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
        });
        (0, vitest_1.test)("should handle Azure Blob Storage redirect", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "releases.myapp.com",
                path: "/download/v1.0.0/app.zip",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://myappstorage.blob.core.windows.net/releases/v1.0.0/app.zip?sv=2020-08-04&ss=b";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("myappstorage.blob.core.windows.net");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
            (0, vitest_1.expect)(result.path).toContain("releases/v1.0.0/app.zip");
        });
        (0, vitest_1.test)("should handle AWS S3 redirect", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.myapp.com",
                path: "/releases/latest/download",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://mybucket.s3.amazonaws.com/releases/v1.0.0/app.zip?AWSAccessKeyId=AKIA123";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("mybucket.s3.amazonaws.com");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
        });
        (0, vitest_1.test)("should preserve authorization for same-service redirects", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.github.com",
                path: "/user",
                headers: { authorization: "token ghp_123456789" },
            };
            const redirectUrl = "https://api.github.com/user/12345";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("api.github.com");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("token ghp_123456789");
        });
    });
    (0, vitest_1.describe)("edge cases", () => {
        (0, vitest_1.test)("should handle URLs with query parameters", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.example.com",
                path: "/endpoint?param=value",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://cdn.example.com/asset.zip?token=abc&expires=123";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("cdn.example.com");
            (0, vitest_1.expect)(result.path).toBe("/asset.zip?token=abc&expires=123");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBeUndefined();
        });
        (0, vitest_1.test)("should handle URLs with fragments", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "api.example.com",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://api.example.com/endpoint#section";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("api.example.com");
            (0, vitest_1.expect)(result.path).toBe("/endpoint");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
        });
        (0, vitest_1.test)("should handle URLs with userinfo (should be ignored in comparison)", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "example.com",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://user:pass@example.com/secure/path";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("example.com");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
        });
        (0, vitest_1.test)("should handle IPv6 addresses", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "[::1]",
                port: "8443",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://[::1]:8443/different/path";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("[::1]");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
        });
        (0, vitest_1.test)("should handle empty path", () => {
            var _a;
            const originalOptions = {
                protocol: "https:",
                hostname: "example.com",
                headers: { authorization: "Bearer token123" },
            };
            const redirectUrl = "https://example.com";
            const result = httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions);
            (0, vitest_1.expect)(result.hostname).toBe("example.com");
            (0, vitest_1.expect)(result.path).toBe("/");
            (0, vitest_1.expect)((_a = result.headers) === null || _a === void 0 ? void 0 : _a.authorization).toBe("Bearer token123");
        });
    });
});
// @ts-ignore
(0, vitest_1.describe)("HttpExecutor.isCrossOriginRedirect", () => {
    const testCases = [
        {
            name: "should be false for same hostname, protocol, and port",
            url1: "https://example.com/path",
            url2: "https://example.com/other",
            expected: false,
        },
        {
            name: "should be true for different hostname",
            url1: "https://example.com/path",
            url2: "https://api.example.com/path",
            expected: true,
        },
        {
            name: "should be true for different protocol",
            url1: "https://example.com/path",
            url2: "http://example.com/path",
            expected: true,
        },
        {
            name: "should be true for different port",
            url1: "https://example.com:8080/path",
            url2: "https://example.com:9090/path",
            expected: true,
        },
        {
            name: "should be false for implicit vs explicit default port",
            url1: "https://example.com/path",
            url2: "https://example.com:443/path",
            expected: false,
        },
        {
            name: "should be false for case-insensitive hostname",
            url1: "https://EXAMPLE.com/path",
            url2: "https://example.com/path",
            expected: false,
        },
        {
            name: "SPECIAL CASE: should be false for http -> https upgrade with default ports",
            url1: "http://example.com/path",
            url2: "https://example.com/path",
            expected: false,
        },
        {
            name: "SPECIAL CASE: should be false for http -> https upgrade with explicit default ports",
            url1: "http://example.com:80/path",
            url2: "https://example.com:443/path",
            expected: false,
        },
        {
            name: "SPECIAL CASE: should be true for http -> https upgrade with non-default ports",
            url1: "http://example.com:8080/path",
            url2: "https://example.com:8443/path",
            expected: true,
        },
    ];
    for (const tc of testCases) {
        (0, vitest_1.test)(tc.name, () => {
            const url1 = new URL(tc.url1);
            const url2 = new URL(tc.url2);
            // @ts-ignore
            const result = httpExecutor_1.HttpExecutor.isCrossOriginRedirect(url1, url2);
            (0, vitest_1.expect)(result).toBe(tc.expected);
        });
    }
});
(0, vitest_1.describe)("HttpExecutor error handling", () => {
    (0, vitest_1.test)("should throw an error if hostname is missing and authorization header is present", () => {
        const originalOptions = {
            protocol: "https:",
            path: "/some/path",
            headers: {
                authorization: "Bearer token123",
            },
        };
        const redirectUrl = "https://example.com/redirect";
        (0, vitest_1.expect)(() => httpExecutor_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, originalOptions)).toThrow("Missing hostname in request options");
    });
});
//# sourceMappingURL=httpExecutorTest.js.map
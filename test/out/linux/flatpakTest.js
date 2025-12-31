"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
test.ifDevOrLinuxCi("flatpak", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("flatpak"),
    config: {
        electronFuses: {
            runAsNode: true,
            enableCookieEncryption: true,
            enableNodeOptionsEnvironmentVariable: true,
            enableNodeCliInspectArguments: true,
            enableEmbeddedAsarIntegrityValidation: true,
            onlyLoadAppFromAsar: true,
            loadBrowserProcessSpecificV8Snapshot: true,
            grantFileProtocolExtraPrivileges: undefined, // unsupported on current electron version in our tests
        },
    },
}));
test.ifDevOrLinuxCi("enable Wayland flags", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("flatpak"),
    config: {
        flatpak: {
            useWaylandFlags: true,
        },
    },
}));
test.ifDevOrLinuxCi("custom finishArgs", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("flatpak"),
    config: {
        flatpak: {
            finishArgs: [
                // Wayland
                "--socket=wayland",
                "--share=ipc",
                // Open GL
                "--device=dri",
                // Audio output
                "--socket=pulseaudio",
                // Allow communication with network
                "--share=network",
                // System notifications with libnotify
                "--talk-name=org.freedesktop.Notifications",
            ],
        },
    },
}));
test.ifDevOrLinuxCi("custom runtime and base app version", ({ expect }) => (0, packTester_1.app)(expect, {
    targets: electron_builder_1.Platform.LINUX.createTarget("flatpak"),
    config: {
        flatpak: {
            runtimeVersion: "19.08",
            baseVersion: "19.08",
        },
    },
}));
//# sourceMappingURL=flatpakTest.js.map
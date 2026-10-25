import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
});

describe("stored application preferences", () => {
    it("starts signed out with dark appearance and English when this browser has no preferences", async () => {
        const { initialState } = await import("../../src/redux/initialState");

        expect(initialState.user).toMatchObject({ theme: "dark", language: "en", email: "", tokenExpTime: 0, isVerified: false, presets: [] });
        expect(initialState.isSignedIn).toBe(false);
        expect(localStorage.getItem("language")).toBe("en");
    });

    it.each(["en", "de", "ua"])("preserves an explicitly selected light appearance and %s language", async (language) => {
        localStorage.setItem("theme", "light");
        localStorage.setItem("language", language);
        localStorage.setItem("userEmail", "musician@example.com");
        localStorage.setItem("tokenExpTime", "2000000000000");
        const { initialState } = await import("../../src/redux/initialState");

        expect(initialState.user).toMatchObject({ theme: "light", language, email: "musician@example.com", tokenExpTime: 2000000000000 });
        expect(initialState.isSignedIn).toBe(false);
        expect(localStorage.getItem("language")).toBe(language);
    });

    it("replaces unsupported preferences with safe defaults and ignores malformed token timestamps", async () => {
        localStorage.setItem("theme", "sepia");
        localStorage.setItem("language", "fr");
        localStorage.setItem("tokenExpTime", "not-a-date");
        const { initialState } = await import("../../src/redux/initialState");

        expect(initialState.user).toMatchObject({ theme: "dark", language: "en", tokenExpTime: 0 });
        expect(localStorage.getItem("language")).toBe("en");
        expect(initialState.isSignedIn).toBe(false);
    });
});

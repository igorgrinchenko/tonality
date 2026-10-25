import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { sendVerificationEmail } from "./firebaseEmailVerification";

const { sendEmailVerificationMock } = vi.hoisted(() => ({ sendEmailVerificationMock: vi.fn() }));

vi.mock("firebase/auth", () => ({ sendEmailVerification: sendEmailVerificationMock }));

const firebaseUser = { uid: "verification-user", email: "musician@example.com" } as User;

beforeEach(() => {
    sendEmailVerificationMock.mockReset();
    sendEmailVerificationMock.mockResolvedValue(undefined);
    vi.stubEnv("BASE_URL", "/");
});

afterEach(() => vi.unstubAllEnvs());

describe("verification email delivery", () => {
    it("uses the application's confirmation return URL with the standard Firebase action handler", async () => {
        await expect(sendVerificationEmail(firebaseUser)).resolves.toBeUndefined();

        expect(sendEmailVerificationMock).toHaveBeenCalledOnce();
        expect(sendEmailVerificationMock).toHaveBeenCalledWith(firebaseUser, {
            url: `${window.location.origin}/?verified=1`,
            handleCodeInApp: false,
        });
    });

    it("keeps the confirmation return URL inside a deployment subdirectory", async () => {
        vi.stubEnv("BASE_URL", "/music/practice/");

        await sendVerificationEmail(firebaseUser);

        expect(sendEmailVerificationMock).toHaveBeenCalledWith(firebaseUser, {
            url: `${window.location.origin}/music/practice/?verified=1`,
            handleCodeInApp: false,
        });
    });

    it.each(["auth/unauthorized-continue-uri", "auth/invalid-continue-uri"])("falls back to the Firebase link when the app return URL is rejected with %s", async (code) => {
        sendEmailVerificationMock.mockRejectedValueOnce({ code });

        await expect(sendVerificationEmail(firebaseUser)).resolves.toBeUndefined();

        expect(sendEmailVerificationMock).toHaveBeenCalledTimes(2);
        expect(sendEmailVerificationMock).toHaveBeenNthCalledWith(2, firebaseUser);
    });

    it.each([
        { name: "rate limits", error: Object.assign(new Error("Too many requests"), { code: "auth/too-many-requests" }) },
        { name: "network errors", error: new Error("Network unavailable") },
        { name: "unexpected error values", error: "Unexpected delivery failure" },
    ])("propagates $name without sending a duplicate email", async ({ error }) => {
        sendEmailVerificationMock.mockRejectedValueOnce(error);

        await expect(sendVerificationEmail(firebaseUser)).rejects.toBe(error);

        expect(sendEmailVerificationMock).toHaveBeenCalledOnce();
    });

    it("propagates a failed fallback instead of retrying again", async () => {
        const deliveryError = new Error("Fallback delivery failed");
        sendEmailVerificationMock.mockRejectedValueOnce({ code: "auth/unauthorized-continue-uri" }).mockRejectedValueOnce(deliveryError);

        await expect(sendVerificationEmail(firebaseUser)).rejects.toBe(deliveryError);

        expect(sendEmailVerificationMock).toHaveBeenCalledTimes(2);
    });
});

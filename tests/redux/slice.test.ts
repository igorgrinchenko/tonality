import { describe, expect, it, vi } from "vitest";
import reducer, { resetError, resetSuccess, setIsSignedIn, setPreferences, setTokenExpTime } from "../../src/redux/slice";
import { deletePresets, getUserData, logOut, setPresets, setUserData, signIn, signUp } from "../../src/redux/thunks";
import { AuthCredentials, Presets, UserSettings, UserState } from "../../src/redux/interfaces";
import getTranslations from "../../src/translations/getTranslations";

vi.mock("../../src/firebase", () => ({ auth: {}, firestore: {} }));
vi.mock("firebase/auth", () => ({ signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(), sendEmailVerification: vi.fn() }));
vi.mock("firebase/firestore", () => ({ doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn() }));

const credentials: AuthCredentials = { email: "musician@example.com", password: "quiet-melody", language: "en" };
const uid = "verified-user-id";
const preset: Presets = { uid, presetId: 0, presetName: "Morning practice", presetValue: "C", audioPath: "/C.mp3" };
const settings: UserSettings = { theme: "light", language: "de", isVerified: true, presets: [preset] };
const initial = () => reducer(undefined, { type: "test/init" });

describe("user state transitions", () => {
    it("clears stale feedback when an authentication request starts", () => {
        const previous: UserState = { ...initial(), isError: true, errorMessage: "Old failure", isSuccess: true, successMessage: "Old success" };
        const state = reducer(previous, signIn.pending("request", credentials));

        expect(state).toMatchObject({ isLoading: true, isError: false, errorMessage: "", isSuccess: false, successMessage: "" });
        expect(previous.errorMessage).toBe("Old failure");
    });

    it("does not grant protected access to an unverified account", () => {
        const pending = reducer(initial(), signIn.pending("request", credentials));
        const state = reducer(pending, signIn.fulfilled({ email: credentials.email, requiresEmailVerification: true }, "request", credentials));

        expect(state).toMatchObject({ isLoading: false, isSignedIn: false });
        expect(state.user.email).toBe(credentials.email);
    });

    it("completes verified sign-in after the user settings have loaded", () => {
        let state = reducer(initial(), signIn.pending("request", credentials));
        state = reducer(state, signIn.fulfilled({ email: credentials.email, requiresEmailVerification: false }, "request", credentials));
        expect(state.isLoading).toBe(true);
        expect(state.isSignedIn).toBe(false);

        state = reducer(state, getUserData.fulfilled(settings, "settings-request", { uid }));
        expect(state).toMatchObject({ isLoading: false, isSignedIn: true, user: { ...settings, email: credentials.email } });
    });

    it.each([true, false])("reports registration without signing the user in when verification email sent=%s", (verificationEmailSent) => {
        const previous = reducer(initial(), setPreferences({ language: "ua" }));
        const state = reducer(previous, signUp.fulfilled({ email: credentials.email, verificationEmailSent }, "request", credentials));
        const lang = getTranslations("ua");

        expect(state).toMatchObject({ isLoading: false, isSignedIn: false, isSignedUp: true, isSuccess: true });
        expect(state.successMessage).toBe(verificationEmailSent ? lang.VERIFICATION_EMAIL_SENT : lang.PROFILE_CREATED);
        expect(state.user.email).toBe(credentials.email);
    });

    it.each([
        ["auth/invalid-credential", "AUTH_INVALID_CREDENTIALS"],
        ["auth/user-not-found", "AUTH_INVALID_CREDENTIALS"],
        ["auth/wrong-password", "AUTH_INVALID_CREDENTIALS"],
        ["auth/email-already-in-use", "AUTH_EMAIL_IN_USE"],
        ["auth/weak-password", "AUTH_WEAK_PASSWORD"],
        ["auth/invalid-email", "AUTH_INVALID_EMAIL"],
        ["auth/too-many-requests", "REQUEST_LIMITED"],
        ["auth/network-request-failed", "NETWORK_ERROR"],
        ["unavailable", "NETWORK_ERROR"],
    ] as const)("presents a localized explanation for %s", (code, translationKey) => {
        const previous = reducer(initial(), setPreferences({ language: "de" }));
        const error = Object.assign(new Error("Technical SDK details"), { code });
        const state = reducer(previous, signIn.rejected(error, "request", credentials));

        expect(state).toMatchObject({ isLoading: false, isError: true, isSignedIn: false });
        expect(state.errorMessage).toBe(getTranslations("de")[translationKey]);
    });

    it("retains useful unknown error messages and provides a fallback if no message exists", () => {
        const failed = reducer(initial(), getUserData.rejected(new Error("Access denied"), "request", { uid }));
        expect(failed.errorMessage).toBe("Access denied");

        const withoutMessage = reducer(initial(), { type: signIn.rejected.type, error: {}, meta: { requestId: "request", arg: credentials } });
        expect(withoutMessage.errorMessage).toBe(getTranslations("en").UNKNOWN_ERROR);
    });

    it("updates only the preferences requested without changing the account or saved music", () => {
        let state = reducer(initial(), getUserData.fulfilled(settings, "request", { uid }));
        state = reducer(state, setTokenExpTime(2000000000000));
        const updated = reducer(state, setPreferences({ language: "ua" }));

        expect(updated.user).toMatchObject({ theme: "light", language: "ua", tokenExpTime: 2000000000000, isVerified: true, presets: [preset] });
        expect(updated.isSignedIn).toBe(true);
        expect(state.user.language).toBe("de");
    });

    it("dismisses error and success feedback independently", () => {
        const previous = { ...initial(), isError: true, errorMessage: "Failure", isSuccess: true, successMessage: "Saved" };
        const errorDismissed = reducer(previous, resetError());
        expect(errorDismissed).toMatchObject({ isError: false, errorMessage: "", isSuccess: true, successMessage: "Saved" });

        const successDismissed = reducer(errorDismissed, resetSuccess());
        expect(successDismissed).toMatchObject({ isSuccess: false, successMessage: "" });
    });

    it("keeps settings requests pending until the refreshed profile arrives", () => {
        const previous = reducer(initial(), getUserData.fulfilled(settings, "request", { uid }));
        const updatedSettings = { ...settings, uid, language: "ua" as const };
        let state = reducer(previous, setUserData.pending("update", updatedSettings));
        expect(state.isLoading).toBe(true);
        expect(state.user.presets).toEqual([preset]);

        state = reducer(state, getUserData.fulfilled(updatedSettings, "refresh", { uid }));
        expect(state.isLoading).toBe(false);
        expect(state.user.language).toBe("ua");
    });

    it("updates saved music and localized confirmation after save and delete succeed", () => {
        let state = reducer(initial(), setPreferences({ language: "ua" }));
        state = reducer(state, setPresets.pending("save", preset));
        expect(state.isLoading).toBe(true);
        state = reducer(state, setPresets.fulfilled([preset], "save", preset));
        expect(state.user.presets).toEqual([preset]);
        expect(state.successMessage).toBe(getTranslations("ua").PRESET_SAVED);

        state = reducer(state, deletePresets.pending("delete", { uid, presetId: 0 }));
        state = reducer(state, deletePresets.fulfilled([], "delete", { uid, presetId: 0 }));
        expect(state.user.presets).toEqual([]);
        expect(state).toMatchObject({ isLoading: false, isSuccess: true, successMessage: getTranslations("ua").PRESET_DELETED });
    });

    it("keeps saved music intact when an API request fails", () => {
        const previous = reducer(initial(), getUserData.fulfilled(settings, "request", { uid }));
        const error = Object.assign(new Error("Network failed"), { code: "unavailable" });
        const state = reducer(previous, deletePresets.rejected(error, "delete", { uid, presetId: 0 }));

        expect(state.user.presets).toEqual([preset]);
        expect(state).toMatchObject({ isLoading: false, isError: true, errorMessage: getTranslations("de").NETWORK_ERROR });
    });

    it("revokes protected access after logout succeeds and retains preferences", () => {
        const signedIn = reducer(initial(), getUserData.fulfilled(settings, "request", { uid }));
        let state = reducer(signedIn, logOut.pending("logout", undefined));
        expect(state.isLoading).toBe(true);
        state = reducer(state, logOut.fulfilled(undefined, "logout", undefined));

        expect(state).toMatchObject({ isSignedIn: false, isLoading: false, user: { theme: "light", language: "de" } });
        expect(reducer(state, setIsSignedIn(true)).isSignedIn).toBe(true);
    });
});

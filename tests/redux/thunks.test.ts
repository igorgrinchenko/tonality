import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import reducer, { setIsSignedIn } from "../../src/redux/slice";
import { decodeBase64, deletePresets, encodeBase64, getUserData, logOut, setPresets, setUserData, signIn, signUp } from "../../src/redux/thunks";
import { AuthCredentials, Presets } from "../../src/redux/interfaces";

const sdk = vi.hoisted(() => ({
    auth: { languageCode: null as string | null },
    firestore: { name: "isolated-test-database" },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    sendVerificationEmail: vi.fn(),
}));

vi.mock("../../src/firebase", () => ({ auth: sdk.auth, firestore: sdk.firestore }));
vi.mock("firebase/auth", () => ({ signInWithEmailAndPassword: sdk.signIn, createUserWithEmailAndPassword: sdk.signUp, signOut: sdk.signOut }));
vi.mock("firebase/firestore", () => ({ doc: sdk.doc, getDoc: sdk.getDoc, setDoc: sdk.setDoc }));
vi.mock("../../src/firebaseEmailVerification", () => ({ sendVerificationEmail: sdk.sendVerificationEmail }));

const uid = "verified-user-id";
const email = "musician@example.com";
const credentials: AuthCredentials = { email, password: "quiet-melody", language: "en" };
const expirationTime = "2030-01-02T03:04:05.000Z";
const settingsRef = { collection: "userSettings", uid };
const makeStore = () => configureStore({ reducer: { user: reducer } });

function snapshot(data?: object) {
    return { exists: () => data !== undefined, data: () => data };
}

function makeFirebaseUser(emailVerified = false) {
    return { uid, email, emailVerified, getIdTokenResult: vi.fn().mockResolvedValue({ expirationTime }) };
}

function seedSession() {
    for (const key of ["tokenExpTime", "userEmail", "encodedUID", "pendingVerificationEmail", "verificationEmailSentAt", "verificationEmailSendFailed"]) {
        localStorage.setItem(key, "old-session-value");
    }
}

function expectSessionCleared() {
    for (const key of ["tokenExpTime", "userEmail", "encodedUID", "pendingVerificationEmail", "verificationEmailSentAt", "verificationEmailSendFailed"]) {
        expect(localStorage.getItem(key)).toBeNull();
    }
}

beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sdk.auth.languageCode = null;
    sdk.doc.mockImplementation((_database: unknown, collection: string, documentId: string) => ({ collection, uid: documentId }));
    sdk.getDoc.mockResolvedValue(snapshot());
    sdk.setDoc.mockResolvedValue(undefined);
    sdk.signIn.mockResolvedValue({ user: makeFirebaseUser() });
    sdk.signUp.mockResolvedValue({ user: makeFirebaseUser() });
    sdk.signOut.mockResolvedValue(undefined);
    sdk.sendVerificationEmail.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("session identifiers", () => {
    it.each(["ordinary-user-id", "користувач-музикант-🎵", "Musiker-ä-Ö-ß"])("round-trips the UID %s through browser storage encoding", (value) => {
        const encoded = encodeBase64(value);
        expect(encoded).not.toBe(value);
        expect(decodeBase64(encoded)).toBe(value);
    });
});

describe("registration boundary", () => {
    it("sends confirmation in the default language and keeps a new account outside the protected session", async () => {
        const firebaseUser = makeFirebaseUser();
        sdk.signUp.mockResolvedValue({ user: firebaseUser });
        vi.spyOn(Date, "now").mockReturnValue(1900000000000);
        seedSession();
        const store = makeStore();
        const result = await store.dispatch(signUp(credentials));

        expect(result).toMatchObject({ type: signUp.fulfilled.type, payload: { email, verificationEmailSent: true } });
        expect(sdk.signUp).toHaveBeenCalledWith(sdk.auth, email, credentials.password);
        expect(sdk.auth.languageCode).toBe("en");
        expect(sdk.sendVerificationEmail).toHaveBeenCalledOnce();
        expect(sdk.sendVerificationEmail).toHaveBeenCalledWith(firebaseUser);
        expect(localStorage.getItem("pendingVerificationEmail")).toBe(email);
        expect(localStorage.getItem("verificationEmailSentAt")).toBe("1900000000000");
        expect(localStorage.getItem("verificationEmailSendFailed")).toBeNull();
        expect(localStorage.getItem("tokenExpTime")).toBeNull();
        expect(localStorage.getItem("userEmail")).toBeNull();
        expect(localStorage.getItem("encodedUID")).toBeNull();
        expect(sdk.getDoc).not.toHaveBeenCalled();
        expect(sdk.setDoc).not.toHaveBeenCalled();
        expect(store.getState().user).toMatchObject({ isSignedIn: false, isSignedUp: true, isLoading: false });
    });

    it("honors a saved Ukrainian selection using Firebase's uk locale", async () => {
        localStorage.setItem("language", "ua");
        await makeStore().dispatch(signUp({ ...credentials, language: "de" }));

        expect(sdk.auth.languageCode).toBe("uk");
        expect(localStorage.getItem("language")).toBe("ua");
    });

    it("keeps successful account creation recoverable if the confirmation email cannot be delivered", async () => {
        sdk.sendVerificationEmail.mockRejectedValueOnce(new Error("Mail delivery unavailable"));
        const store = makeStore();
        const result = await store.dispatch(signUp(credentials));

        expect(result).toMatchObject({ type: signUp.fulfilled.type, payload: { email, verificationEmailSent: false } });
        expect(localStorage.getItem("pendingVerificationEmail")).toBe(email);
        expect(localStorage.getItem("verificationEmailSendFailed")).toBe("true");
        expect(localStorage.getItem("verificationEmailSentAt")).toBeNull();
        expect(store.getState().user).toMatchObject({ isSignedIn: false, isSignedUp: true, isError: false });
    });

    it("propagates rejected account creation without attempting email delivery or profile writes", async () => {
        const error = Object.assign(new Error("Email already registered"), { code: "auth/email-already-in-use" });
        sdk.signUp.mockRejectedValueOnce(error);
        const store = makeStore();
        const result = await store.dispatch(signUp(credentials));

        expect(result).toMatchObject({ type: signUp.rejected.type, error: { code: error.code, message: error.message } });
        expect(sdk.sendVerificationEmail).not.toHaveBeenCalled();
        expect(sdk.setDoc).not.toHaveBeenCalled();
        expect(localStorage.getItem("pendingVerificationEmail")).toBeNull();
        expect(store.getState().user).toMatchObject({ isLoading: false, isSignedIn: false, isError: true });
    });
});

describe("sign-in boundary", () => {
    it("clears stale credentials and requests verification without loading settings for an unverified user", async () => {
        const firebaseUser = makeFirebaseUser(false);
        sdk.signIn.mockResolvedValueOnce({ user: firebaseUser });
        seedSession();
        localStorage.setItem("language", "de");
        const store = makeStore();
        const result = await store.dispatch(signIn(credentials));

        expect(result).toMatchObject({ type: signIn.fulfilled.type, payload: { email, requiresEmailVerification: true } });
        expect(sdk.signIn).toHaveBeenCalledWith(sdk.auth, email, credentials.password);
        expect(sdk.auth.languageCode).toBe("de");
        expect(localStorage.getItem("pendingVerificationEmail")).toBe(email);
        expect(localStorage.getItem("encodedUID")).toBeNull();
        expect(localStorage.getItem("userEmail")).toBeNull();
        expect(localStorage.getItem("tokenExpTime")).toBeNull();
        expect(localStorage.getItem("verificationEmailSendFailed")).toBeNull();
        expect(firebaseUser.getIdTokenResult).not.toHaveBeenCalled();
        expect(sdk.getDoc).not.toHaveBeenCalled();
        expect(sdk.setDoc).not.toHaveBeenCalled();
        expect(sdk.sendVerificationEmail).not.toHaveBeenCalled();
        expect(store.getState().user).toMatchObject({ isSignedIn: false, isLoading: false });
    });

    it("stores a verified session, marks the existing profile verified, and loads saved preferences", async () => {
        const firebaseUser = makeFirebaseUser(true);
        const existingSettings = { theme: "light", language: "de", isVerified: false, presets: [] };
        sdk.signIn.mockResolvedValueOnce({ user: firebaseUser });
        sdk.getDoc.mockResolvedValueOnce(snapshot(existingSettings)).mockResolvedValue(snapshot({ ...existingSettings, isVerified: true }));
        localStorage.setItem("pendingVerificationEmail", email);
        localStorage.setItem("verificationEmailSendFailed", "true");
        const store = makeStore();
        const result = await store.dispatch(signIn(credentials));

        await vi.waitFor(() => expect(store.getState().user.isSignedIn).toBe(true));
        expect(result).toMatchObject({ type: signIn.fulfilled.type, payload: { email, requiresEmailVerification: false } });
        expect(firebaseUser.getIdTokenResult).toHaveBeenCalledOnce();
        expect(sdk.doc).toHaveBeenCalledWith(sdk.firestore, "userSettings", uid);
        expect(sdk.setDoc).toHaveBeenCalledWith(settingsRef, { isVerified: true, language: "de" }, { merge: true });
        expect(localStorage.getItem("userEmail")).toBe(email);
        expect(decodeBase64(localStorage.getItem("encodedUID")!)).toBe(uid);
        expect(localStorage.getItem("tokenExpTime")).toBe(String(new Date(expirationTime).getTime()));
        expect(localStorage.getItem("pendingVerificationEmail")).toBeNull();
        expect(localStorage.getItem("verificationEmailSendFailed")).toBeNull();
        expect(store.getState().user.user).toMatchObject({ theme: "light", language: "de", isVerified: true, tokenExpTime: new Date(expirationTime).getTime() });
    });

    it.each([
        { savedTheme: null, expectedTheme: "dark" },
        { savedTheme: "light", expectedTheme: "light" },
    ] as const)("creates a missing profile using $expectedTheme appearance", async ({ savedTheme, expectedTheme }) => {
        sdk.signIn.mockResolvedValueOnce({ user: makeFirebaseUser(true) });
        sdk.getDoc.mockResolvedValueOnce(snapshot()).mockResolvedValue(snapshot({ theme: expectedTheme, language: "en", isVerified: true, presets: [] }));
        if (savedTheme) localStorage.setItem("theme", savedTheme);
        const store = makeStore();
        await store.dispatch(signIn(credentials));

        await vi.waitFor(() => expect(store.getState().user.isSignedIn).toBe(true));
        expect(sdk.setDoc).toHaveBeenCalledWith(settingsRef, { theme: expectedTheme, language: "en", isVerified: true, presets: [] }, { merge: true });
        expect(store.getState().user.user.theme).toBe(expectedTheme);
    });

    it("removes old session data after authentication rejects while preserving explicit preferences", async () => {
        seedSession();
        localStorage.setItem("theme", "light");
        localStorage.setItem("language", "ua");
        sdk.signIn.mockRejectedValueOnce(Object.assign(new Error("Wrong credentials"), { code: "auth/invalid-credential" }));
        const store = makeStore();
        const result = await store.dispatch(signIn(credentials));

        expect(result).toMatchObject({ type: signIn.rejected.type, error: { code: "auth/invalid-credential" } });
        expectSessionCleared();
        expect(localStorage.getItem("theme")).toBe("light");
        expect(localStorage.getItem("language")).toBe("ua");
        expect(sdk.getDoc).not.toHaveBeenCalled();
        expect(store.getState().user).toMatchObject({ isLoading: false, isSignedIn: false, isError: true });
    });

    it("does not leave a usable session behind if the initial profile read fails", async () => {
        sdk.signIn.mockResolvedValueOnce({ user: makeFirebaseUser(true) });
        sdk.getDoc.mockRejectedValueOnce(Object.assign(new Error("Settings unavailable"), { code: "unavailable" }));
        const store = makeStore();
        const result = await store.dispatch(signIn(credentials));

        expect(result).toMatchObject({ type: signIn.rejected.type, error: { code: "unavailable" } });
        expectSessionCleared();
        expect(sdk.setDoc).not.toHaveBeenCalled();
        expect(store.getState().user.isSignedIn).toBe(false);
    });
});

describe("user settings boundary", () => {
    it.each(["en", "de", "ua"] as const)("loads and persists a saved %s preference without rewriting valid settings", async (language) => {
        const settings = { theme: "light", language, isVerified: false, presets: [{ presetId: 4, presetName: "Warm-up", presetValue: "Am", audioPath: "/Am.mp3" }] };
        sdk.getDoc.mockResolvedValueOnce(snapshot(settings));
        const store = makeStore();
        const result = await store.dispatch(getUserData({ uid }));

        expect(result).toMatchObject({ type: getUserData.fulfilled.type, payload: settings });
        expect(localStorage.getItem("theme")).toBe("light");
        expect(localStorage.getItem("language")).toBe(language);
        expect(sdk.setDoc).not.toHaveBeenCalled();
        expect(store.getState().user.user).toMatchObject(settings);
    });

    it("normalizes old or invalid settings before exposing them to the UI", async () => {
        sdk.getDoc.mockResolvedValueOnce(snapshot({ theme: "sepia", language: "fr", presets: "invalid", isVerified: true }));
        const store = makeStore();
        const result = await store.dispatch(getUserData({ uid }));

        expect(result).toMatchObject({ type: getUserData.fulfilled.type, payload: { theme: "dark", language: "en", isVerified: true, presets: [] } });
        expect(sdk.setDoc).toHaveBeenCalledWith(settingsRef, { language: "en" }, { merge: true });
        expect(localStorage.getItem("language")).toBe("en");
        expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("returns safe defaults when the settings document does not exist", async () => {
        const result = await makeStore().dispatch(getUserData({ uid }));

        expect(result).toMatchObject({ type: getUserData.fulfilled.type, payload: { theme: "dark", language: "en", isVerified: true, presets: [] } });
        expect(sdk.setDoc).not.toHaveBeenCalled();
    });

    it("writes chosen preferences using merge and refreshes the visible profile", async () => {
        const settings = { theme: "light" as const, language: "ua" as const, isVerified: true };
        sdk.getDoc.mockResolvedValueOnce(snapshot({ ...settings, presets: [] }));
        const store = makeStore();
        const result = await store.dispatch(setUserData({ ...settings, uid }));

        await vi.waitFor(() => expect(store.getState().user.user.language).toBe("ua"));
        expect(result).toMatchObject({ type: setUserData.fulfilled.type, payload: settings });
        expect(sdk.setDoc).toHaveBeenCalledWith(settingsRef, settings, { merge: true });
        expect(sdk.getDoc).toHaveBeenCalledWith(settingsRef);
        expect(localStorage.getItem("theme")).toBe("light");
        expect(localStorage.getItem("language")).toBe("ua");
        expect(store.getState().user.isLoading).toBe(false);
    });

    it("propagates profile-read errors without manufacturing a signed-in state", async () => {
        sdk.getDoc.mockRejectedValueOnce(Object.assign(new Error("Offline"), { code: "unavailable" }));
        const store = makeStore();
        const result = await store.dispatch(getUserData({ uid }));

        expect(result).toMatchObject({ type: getUserData.rejected.type, error: { code: "unavailable" } });
        expect(store.getState().user).toMatchObject({ isLoading: false, isError: true, isSignedIn: false });
        expect(sdk.setDoc).not.toHaveBeenCalled();
    });
});

describe("logout boundary", () => {
    it("clears the session only after Firebase signs out and retains personal preferences", async () => {
        seedSession();
        localStorage.setItem("theme", "light");
        localStorage.setItem("language", "de");
        localStorage.setItem("unrelated-key", "keep");
        const store = makeStore();
        store.dispatch(setIsSignedIn(true));
        const result = await store.dispatch(logOut());

        expect(result.type).toBe(logOut.fulfilled.type);
        expect(sdk.signOut).toHaveBeenCalledWith(sdk.auth);
        expectSessionCleared();
        expect(localStorage.getItem("theme")).toBe("light");
        expect(localStorage.getItem("language")).toBe("de");
        expect(localStorage.getItem("unrelated-key")).toBe("keep");
        expect(store.getState().user).toMatchObject({ isLoading: false, isSignedIn: false });
    });

    it("preserves the session if Firebase rejects sign-out so the user can retry", async () => {
        seedSession();
        sdk.signOut.mockRejectedValueOnce(new Error("Sign-out unavailable"));
        const store = makeStore();
        store.dispatch(setIsSignedIn(true));
        const result = await store.dispatch(logOut());

        expect(result).toMatchObject({ type: logOut.rejected.type, error: { message: "Sign-out unavailable" } });
        expect(localStorage.getItem("encodedUID")).toBe("old-session-value");
        expect(store.getState().user).toMatchObject({ isLoading: false, isSignedIn: true, isError: true });
    });
});

describe("saved music boundary", () => {
    const firstPreset = { presetId: 0, presetName: "Warm-up", presetValue: "C", audioPath: "/C.mp3" };
    const laterPreset = { presetId: 2, presetName: "Evening", presetValue: "Am", audioPath: "/Am.mp3" };

    it.each([
        { name: "empty collection", data: { presets: [] }, expectedExisting: [], expectedId: 0 },
        { name: "remaining IDs after a deletion", data: { presets: [firstPreset, laterPreset] }, expectedExisting: [firstPreset, laterPreset], expectedId: 3 },
        { name: "missing presets field", data: { theme: "dark" }, expectedExisting: [], expectedId: 0 },
        { name: "missing document", data: undefined, expectedExisting: [], expectedId: 0 },
    ])("saves a new key without overwriting saved music with $name", async ({ data, expectedExisting, expectedId }) => {
        sdk.getDoc.mockResolvedValueOnce(snapshot(data));
        const input = { uid, presetName: "New practice", presetValue: "G", audioPath: "/G.mp3" };
        const added = { presetName: input.presetName, presetValue: input.presetValue, presetId: expectedId, audioPath: input.audioPath };
        const store = makeStore();
        const result = await store.dispatch(setPresets(input));

        expect(result).toMatchObject({ type: setPresets.fulfilled.type, payload: [...expectedExisting, added] });
        expect(sdk.setDoc).toHaveBeenCalledWith(settingsRef, { presets: [...expectedExisting, added] }, { merge: true });
        expect(store.getState().user.user.presets).toEqual([...expectedExisting, added]);
    });

    it("deletes only the selected saved key and writes the remaining collection", async () => {
        sdk.getDoc.mockResolvedValueOnce(snapshot({ presets: [firstPreset, laterPreset] }));
        const store = makeStore();
        const result = await store.dispatch(deletePresets({ uid, presetId: 0 }));

        expect(result).toMatchObject({ type: deletePresets.fulfilled.type, payload: [laterPreset] });
        expect(sdk.setDoc).toHaveBeenCalledWith(settingsRef, { presets: [laterPreset] }, { merge: true });
        expect(store.getState().user.user.presets).toEqual([laterPreset]);
    });

    it.each(["preferences", "save", "delete"] as const)("keeps saved music intact when the %s write fails", async (operation) => {
        const saved: Presets = { ...firstPreset, uid };
        const store = makeStore();
        store.dispatch(getUserData.fulfilled({ theme: "dark", language: "en", isVerified: true, presets: [saved] }, "settings", { uid }));
        sdk.getDoc.mockResolvedValue(snapshot({ theme: "dark", language: "en", isVerified: true, presets: [saved] }));
        sdk.setDoc.mockRejectedValueOnce(Object.assign(new Error("Write denied"), { code: "permission-denied" }));

        const result =
            operation === "preferences"
                ? await store.dispatch(setUserData({ uid, theme: "light", language: "de", isVerified: true }))
                : operation === "save"
                  ? await store.dispatch(setPresets({ uid, presetName: "New practice", presetValue: "G", audioPath: "/G.mp3" }))
                  : await store.dispatch(deletePresets({ uid, presetId: 0 }));

        expect(result).toMatchObject({ error: { code: "permission-denied", message: "Write denied" } });
        expect(result.type).toMatch(/\/rejected$/);
        expect(store.getState().user.user.presets).toEqual([saved]);
        expect(store.getState().user).toMatchObject({ isLoading: false, isError: true });
    });
});

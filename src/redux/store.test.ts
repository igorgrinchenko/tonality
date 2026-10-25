import { describe, expect, it, vi } from "vitest";
import store, { errorMessage, isError, isLoading, isSignedIn, isSignedUp, isSuccess, successMessage, user } from "./store";
import { resetError, resetSuccess, setIsSignedIn, setPreferences, setTokenExpTime } from "./slice";
import { signIn, signUp } from "./thunks";
import en from "../translations/en";

vi.mock("../firebase", () => ({ auth: {}, firestore: {} }));
vi.mock("firebase/auth", () => ({ signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(), sendEmailVerification: vi.fn() }));
vi.mock("firebase/firestore", () => ({ doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn() }));

describe("configured application store", () => {
    it("exposes request, feedback, account, and preference changes through the public selectors", () => {
        const credentials = { email: "musician@example.com", password: "quiet-melody", language: "en" as const };
        store.dispatch(setPreferences({ language: "en", theme: "dark" }));
        store.dispatch(signIn.pending("sign-in", credentials));
        expect(isLoading(store.getState())).toBe(true);

        store.dispatch(signIn.rejected(Object.assign(new Error("SDK details"), { code: "auth/invalid-credential" }), "sign-in", credentials));
        expect(isLoading(store.getState())).toBe(false);
        expect(isError(store.getState())).toBe(true);
        expect(errorMessage(store.getState())).toBe(en.AUTH_INVALID_CREDENTIALS);
        store.dispatch(resetError());
        expect(isError(store.getState())).toBe(false);
        expect(errorMessage(store.getState())).toBe("");

        store.dispatch(signUp.fulfilled({ email: credentials.email, verificationEmailSent: true }, "sign-up", credentials));
        expect(isSignedUp(store.getState())).toBe(true);
        expect(isSignedIn(store.getState())).toBe(false);
        expect(isSuccess(store.getState())).toBe(true);
        expect(successMessage(store.getState())).toBe(en.VERIFICATION_EMAIL_SENT);
        store.dispatch(resetSuccess());
        expect(isSuccess(store.getState())).toBe(false);
        expect(successMessage(store.getState())).toBe("");

        store.dispatch(setPreferences({ language: "ua", theme: "light" }));
        store.dispatch(setTokenExpTime(2000000000000));
        store.dispatch(setIsSignedIn(true));
        expect(user(store.getState())).toMatchObject({ email: credentials.email, theme: "light", language: "ua", tokenExpTime: 2000000000000 });
        expect(isSignedIn(store.getState())).toBe(true);
    });
});

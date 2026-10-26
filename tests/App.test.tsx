import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import App from "../src/App";
import en from "../src/translations/en";
import ua from "../src/translations/ua";
import { createAppTheme } from "../src/styles/theme";
import { authPath, signInPath, signUpPath, forgotPasswordPath, verifyEmailPath, tonalityPath, tunePath, presetsPath, userPath } from "../src/routes/routes";

type SessionUser = { uid: string; emailVerified: boolean };

const { state, session, dispatchMock, onAuthStateChangedMock, reloadMock, unsubscribeMock, setIsSignedInMock, getUserDataMock, logOutMock, decodeBase64Mock } = vi.hoisted(() => ({
    state: { profile: { theme: "dark" as "light" | "dark", language: "en" as "en" | "de" | "ua" }, signedIn: false, loading: false },
    session: { listener: null as ((user: SessionUser | null) => void) | null },
    dispatchMock: vi.fn(),
    onAuthStateChangedMock: vi.fn(),
    reloadMock: vi.fn(),
    unsubscribeMock: vi.fn(),
    setIsSignedInMock: vi.fn((payload: boolean) => ({ type: "user/setIsSignedIn", payload })),
    getUserDataMock: vi.fn((payload: unknown) => ({ type: "test/restoreUser", payload })),
    logOutMock: vi.fn(() => ({ type: "test/logout" })),
    decodeBase64Mock: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));
vi.mock("../src/redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isSignedIn: (value: typeof state) => value.signedIn,
    isLoading: (value: typeof state) => value.loading,
}));
vi.mock("../src/redux/slice", () => ({ setIsSignedIn: setIsSignedInMock }));
vi.mock("../src/redux/thunks", () => ({ getUserData: getUserDataMock, logOut: logOutMock, decodeBase64: decodeBase64Mock }));
vi.mock("../src/firebase", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: onAuthStateChangedMock, reload: reloadMock }));
vi.mock("../src/components/Header", () => ({ default: () => <header>Application header</header> }));
vi.mock("../src/components/Footer", () => ({ default: () => <nav aria-label="Application sections" /> }));
vi.mock("../src/components/Toast", () => ({ default: () => null }));
vi.mock("../src/components/auth/Auth", () => ({ default: () => <h1>Welcome route</h1> }));
vi.mock("../src/components/auth/SignIn", () => ({ default: () => <h1>Sign-in route</h1> }));
vi.mock("../src/components/auth/ForgotPassword", () => ({ default: () => <h1>Password recovery route</h1> }));
vi.mock("../src/components/auth/SignUp", () => ({ default: () => <h1>Registration route</h1> }));
vi.mock("../src/components/auth/VerifyEmail", () => ({ default: () => <h1>Email verification route</h1> }));
vi.mock("../src/components/pages/Tonality", () => ({ default: () => <h1>Key finder route</h1> }));
vi.mock("../src/components/pages/Tune", () => ({ default: () => <h1>Tuning fork route</h1> }));
vi.mock("../src/components/pages/Presets", () => ({ default: () => <h1>Saved keys route</h1> }));
vi.mock("../src/components/pages/User", () => ({ default: () => <h1>Profile route</h1> }));

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    state.profile = { theme: "dark", language: "en" };
    state.signedIn = false;
    state.loading = false;
    session.listener = null;
    reloadMock.mockResolvedValue(undefined);
    decodeBase64Mock.mockImplementation((value: string) => atob(value));
    onAuthStateChangedMock.mockImplementation((_auth: unknown, listener: (user: SessionUser | null) => void) => {
        session.listener = listener;
        return unsubscribeMock;
    });
    const themeMeta = document.createElement("meta");
    themeMeta.name = "theme-color";
    themeMeta.content = "initial-color";
    document.head.appendChild(themeMeta);
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.querySelector('meta[name="theme-color"]')?.remove();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("lang");
});

function renderApp(path = "/") {
    window.history.replaceState({}, "", path);
    return render(<App />);
}

async function notifySession(user: SessionUser | null) {
    await act(async () => {
        session.listener?.(user);
    });
}

function storeSession(uid = "session-user", expiresAt = Date.now() + 120_000) {
    localStorage.setItem("tokenExpTime", String(expiresAt));
    localStorage.setItem("encodedUID", btoa(uid));
    localStorage.setItem("userEmail", "musician@example.com");
}

describe("application routing and shared state", () => {
    it.each([
        ["/", "Welcome route"],
        [authPath, "Welcome route"],
        [signInPath, "Sign-in route"],
        [forgotPasswordPath, "Password recovery route"],
        [signUpPath, "Registration route"],
        [verifyEmailPath, "Email verification route"],
        ["/unknown-screen", "Welcome route"],
    ])("renders the public destination for %s", (path, heading) => {
        renderApp(path);
        expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });

    it.each([
        [tonalityPath, "Key finder route"],
        [tunePath, "Tuning fork route"],
        [presetsPath, "Saved keys route"],
        [userPath, "Profile route"],
    ])("connects authenticated navigation to %s", (path, heading) => {
        state.signedIn = true;
        renderApp(path);
        expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });

    it("keeps protected routes behind authentication", async () => {
        renderApp(userPath);
        expect(await screen.findByRole("heading", { name: "Welcome route" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Profile route" })).not.toBeInTheDocument();
        expect(window.location.pathname).toBe(authPath);
    });

    it("returns a pending registration to verification on the initial route", () => {
        localStorage.setItem("pendingVerificationEmail", "musician@example.com");
        renderApp();
        expect(screen.getByRole("heading", { name: "Email verification route" })).toBeInTheDocument();
    });

    it("routes the email-confirmation return URL to verification", () => {
        renderApp("/?verified=1");
        expect(screen.getByRole("heading", { name: "Email verification route" })).toBeInTheDocument();
    });

    it("synchronizes browser language, appearance and theme metadata when preferences change", () => {
        state.profile.language = "ua";
        const view = renderApp();
        expect(document.documentElement.lang).toBe("uk");
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", createAppTheme("dark").palette.background.default);
        expect(screen.getByRole("link", { name: ua.SKIP_TO_CONTENT })).toHaveAttribute("href", "#main-content");

        state.profile = { language: "de", theme: "light" };
        view.rerender(<App />);
        expect(document.documentElement.lang).toBe("de");
        expect(document.documentElement.dataset.theme).toBe("light");
        expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", createAppTheme("light").palette.background.default);
    });

    it("makes the application shell inert and announces loading while a request is pending", () => {
        state.loading = true;
        const view = renderApp();
        expect(view.container.querySelector(".app-shell")).toHaveAttribute("inert");
        expect(view.container.querySelector("#main-content")).toHaveAttribute("aria-busy", "true");
        expect(screen.getByRole("status")).toHaveTextContent(en.LOADING);

        state.loading = false;
        view.rerender(<App />);
        expect(view.container.querySelector(".app-shell")).not.toHaveAttribute("inert");
        expect(view.container.querySelector("#main-content")).toHaveAttribute("aria-busy", "false");
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
});

describe("stored Firebase session validation", () => {
    it("does not restore a local session without a Firebase user", async () => {
        storeSession();
        renderApp();
        await notifySession(null);
        expect(dispatchMock).toHaveBeenCalledWith({ type: "user/setIsSignedIn", payload: false });
        expect(getUserDataMock).not.toHaveBeenCalled();
        expect(reloadMock).not.toHaveBeenCalled();
    });

    it("restores only a verified Firebase user whose UID and unexpired stored session agree", async () => {
        storeSession();
        renderApp();
        const firebaseUser = { uid: "session-user", emailVerified: true };
        await notifySession(firebaseUser);
        expect(reloadMock).toHaveBeenCalledWith(firebaseUser);
        expect(getUserDataMock).toHaveBeenCalledWith({ uid: "session-user" });
        expect(dispatchMock).toHaveBeenCalledWith(getUserDataMock.mock.results[0].value);
        expect(setIsSignedInMock).not.toHaveBeenCalled();
    });

    it("clears stored credentials for an account that has not verified its email", async () => {
        storeSession();
        renderApp();
        await notifySession({ uid: "session-user", emailVerified: false });
        expect(localStorage.getItem("tokenExpTime")).toBeNull();
        expect(localStorage.getItem("encodedUID")).toBeNull();
        expect(localStorage.getItem("userEmail")).toBeNull();
        expect(getUserDataMock).not.toHaveBeenCalled();
        expect(setIsSignedInMock).toHaveBeenCalledWith(false);
    });

    it.each(["expired", "missing-uid", "different-uid", "malformed-uid"])("rejects a %s stored session", async (condition) => {
        storeSession();
        if (condition === "expired") localStorage.setItem("tokenExpTime", String(Date.now() - 1));
        if (condition === "missing-uid") localStorage.removeItem("encodedUID");
        if (condition === "different-uid") localStorage.setItem("encodedUID", btoa("another-user"));
        if (condition === "malformed-uid") localStorage.setItem("encodedUID", "%%%not-base64%%%");
        renderApp();
        await notifySession({ uid: "session-user", emailVerified: true });
        expect(getUserDataMock).not.toHaveBeenCalled();
        expect(setIsSignedInMock).toHaveBeenCalledWith(false);
    });

    it("does not restore protected data if refreshing the Firebase user fails", async () => {
        storeSession();
        reloadMock.mockRejectedValueOnce(new Error("Network unavailable"));
        renderApp();
        await notifySession({ uid: "session-user", emailVerified: true });
        expect(getUserDataMock).not.toHaveBeenCalled();
        expect(setIsSignedInMock).toHaveBeenCalledWith(false);
    });

    it("validates only the initial auth notification rather than restoring the session twice", async () => {
        storeSession();
        renderApp();
        await notifySession({ uid: "session-user", emailVerified: true });
        await notifySession({ uid: "session-user", emailVerified: true });
        expect(reloadMock).toHaveBeenCalledOnce();
        expect(getUserDataMock).toHaveBeenCalledOnce();
    });

    it("expires an old token on the periodic check and cleans up subscription and timers on unmount", async () => {
        vi.useFakeTimers();
        storeSession("session-user", Date.now() + 30_000);
        const view = renderApp();
        expect(logOutMock).not.toHaveBeenCalled();
        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });
        expect(logOutMock).toHaveBeenCalledOnce();
        expect(dispatchMock).toHaveBeenCalledWith(logOutMock.mock.results[0].value);
        view.unmount();
        expect(unsubscribeMock).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("keeps an unexpired token during periodic checks", async () => {
        vi.useFakeTimers();
        storeSession("session-user", Date.now() + 180_000);
        const view = renderApp();
        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });
        expect(logOutMock).not.toHaveBeenCalled();
        view.unmount();
        expect(unsubscribeMock).toHaveBeenCalledOnce();
    });
});

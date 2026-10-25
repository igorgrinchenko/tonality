import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import VerifyEmail from "../../../src/components/auth/VerifyEmail";
import en from "../../../src/translations/en";
import de from "../../../src/translations/de";
import ua from "../../../src/translations/ua";
import { signInPath, verifyEmailPath } from "../../../src/routes/routes";

type VerificationUser = { email: string; emailVerified: boolean };
type AuthStateListener = (user: VerificationUser | null) => void;

const { state, authMock, authListener, onAuthStateChangedMock, reloadMock, signOutMock, unsubscribeMock, sendVerificationEmailMock } = vi.hoisted(() => ({
    state: { language: "en" },
    authMock: { currentUser: null as VerificationUser | null, languageCode: null as string | null },
    authListener: { current: null as AuthStateListener | null },
    onAuthStateChangedMock: vi.fn(),
    reloadMock: vi.fn(),
    signOutMock: vi.fn(),
    unsubscribeMock: vi.fn(),
    sendVerificationEmailMock: vi.fn(),
}));

vi.mock("react-redux", () => ({ useSelector: (selector: (value: typeof state) => unknown) => selector(state) }));
vi.mock("../../../src/redux/store", () => ({ user: (value: typeof state) => value }));
vi.mock("../../../src/firebase", () => ({ auth: authMock }));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: onAuthStateChangedMock, reload: reloadMock, signOut: signOutMock }));
vi.mock("../../../src/firebaseEmailVerification", () => ({ sendVerificationEmail: sendVerificationEmailMock }));

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    state.language = "en";
    authMock.currentUser = { email: "musician@example.com", emailVerified: false };
    authMock.languageCode = null;
    authListener.current = null;
    reloadMock.mockReset().mockResolvedValue(undefined);
    signOutMock.mockReset().mockResolvedValue(undefined);
    sendVerificationEmailMock.mockReset().mockResolvedValue(undefined);
    onAuthStateChangedMock.mockImplementation((_auth, listener: AuthStateListener) => {
        authListener.current = listener;
        listener(authMock.currentUser);
        return unsubscribeMock;
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

function renderVerification(path = verifyEmailPath) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={verifyEmailPath} element={<VerifyEmail />} />
                <Route path={signInPath} element={<h1>Sign-in destination</h1>} />
            </Routes>
        </MemoryRouter>
    );
}

function pendingRequest() {
    let resolve!: () => void;
    const promise = new Promise<void>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
}

describe("email confirmation", () => {
    it("shows the pending address and a route back to sign-in when there is no Firebase session", async () => {
        authMock.currentUser = null;
        localStorage.setItem("pendingVerificationEmail", "waiting@example.com");
        const interaction = userEvent.setup();
        renderVerification();

        expect(screen.getByText("waiting@example.com")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeDisabled();
        expect(screen.getByText(en.VERIFICATION_SIGN_IN_TO_RESEND)).toBeInTheDocument();
        await interaction.click(screen.getByRole("button", { name: en.BACK_TO_SIGN_IN }));

        expect(await screen.findByRole("heading", { name: "Sign-in destination" })).toBeInTheDocument();
        expect(reloadMock).not.toHaveBeenCalled();
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it("explains how to recover when neither an account nor an address is available", () => {
        authMock.currentUser = null;
        renderVerification();

        expect(screen.getByText(en.VERIFICATION_NO_EMAIL)).toBeInTheDocument();
        expect(screen.queryByText("musician@example.com")).not.toBeInTheDocument();
    });

    it("uses the session's address and disables verification actions when that session disappears", () => {
        localStorage.setItem("pendingVerificationEmail", "old@example.com");
        renderVerification();

        expect(screen.getByText("musician@example.com")).toBeInTheDocument();
        expect(screen.queryByText("old@example.com")).not.toBeInTheDocument();
        act(() => {
            authMock.currentUser = null;
            authListener.current?.(null);
        });

        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeDisabled();
    });

    it.each([
        { name: "checking", label: en.CHECK_EMAIL_VERIFICATION },
        { name: "resending", label: en.RESEND_VERIFICATION_EMAIL },
    ])("recovers from session loss before the subscription updates while $name", async ({ label }) => {
        const interaction = userEvent.setup();
        renderVerification();
        authMock.currentUser = null;

        await interaction.click(screen.getByRole("button", { name: label }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.EMAIL_NOT_VERIFIED);
        expect(reloadMock).not.toHaveBeenCalled();
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it("keeps an unverified account on the confirmation screen after reloading its status", async () => {
        localStorage.setItem("pendingVerificationEmail", "musician@example.com");
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.EMAIL_NOT_VERIFIED);
        expect(reloadMock).toHaveBeenCalledWith(authMock.currentUser);
        expect(signOutMock).not.toHaveBeenCalled();
        expect(localStorage.getItem("pendingVerificationEmail")).toBe("musician@example.com");
        expect(screen.getByRole("heading", { name: en.VERIFY_EMAIL_TITLE })).toBeInTheDocument();
    });

    it("finishes verified accounts, clears pending data and lets the user sign in again", async () => {
        localStorage.setItem("pendingVerificationEmail", "musician@example.com");
        localStorage.setItem("verificationEmailSentAt", String(Date.now()));
        localStorage.setItem("verificationEmailSendFailed", "true");
        reloadMock.mockImplementationOnce(async () => {
            authMock.currentUser!.emailVerified = true;
        });
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION }));

        expect(await screen.findByRole("heading", { name: en.EMAIL_VERIFIED_TITLE })).toBeInTheDocument();
        await waitFor(() => expect(signOutMock).toHaveBeenCalledWith(authMock));
        expect(localStorage.getItem("pendingVerificationEmail")).toBeNull();
        expect(localStorage.getItem("verificationEmailSentAt")).toBeNull();
        expect(localStorage.getItem("verificationEmailSendFailed")).toBeNull();
        expect(screen.queryByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).not.toBeInTheDocument();
        await interaction.click(screen.getByRole("button", { name: en.SIGN_IN }));

        expect(await screen.findByRole("heading", { name: "Sign-in destination" })).toBeInTheDocument();
    });

    it("keeps a successful confirmation usable if signing out fails", async () => {
        reloadMock.mockImplementationOnce(async () => {
            authMock.currentUser!.emailVerified = true;
        });
        signOutMock.mockRejectedValueOnce(new Error("Sign-out unavailable"));
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION }));

        expect(await screen.findByRole("heading", { name: en.EMAIL_VERIFIED_TITLE })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole("button", { name: en.SIGN_IN })).toBeEnabled());
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it("shows recoverable feedback when reloading the account fails", async () => {
        reloadMock.mockRejectedValueOnce(new Error("Network unavailable"));
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.VERIFICATION_EMAIL_ERROR);
        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeEnabled();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeEnabled();
        expect(signOutMock).not.toHaveBeenCalled();
    });

    it.each([
        { language: "en", locale: "en", labels: en },
        { language: "de", locale: "de", labels: de },
        { language: "ua", locale: "uk", labels: ua },
    ])("sends a localized confirmation for $language and starts the resend cooldown", async ({ language, locale, labels }) => {
        state.language = language;
        localStorage.setItem("verificationEmailSendFailed", "true");
        const startedAt = Date.now();
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: labels.RESEND_VERIFICATION_EMAIL }));

        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(labels.VERIFICATION_EMAIL_SENT));
        expect(reloadMock).toHaveBeenCalledWith(authMock.currentUser);
        expect(sendVerificationEmailMock).toHaveBeenCalledWith(authMock.currentUser);
        expect(authMock.languageCode).toBe(locale);
        expect(Number(localStorage.getItem("verificationEmailSentAt"))).toBeGreaterThanOrEqual(startedAt);
        expect(localStorage.getItem("verificationEmailSendFailed")).toBeNull();
        expect(screen.getByRole("button", { name: labels.RESEND_VERIFICATION_EMAIL })).toBeDisabled();
        expect(screen.getByRole("button", { name: labels.CHECK_EMAIL_VERIFICATION })).toBeEnabled();
        expect(signOutMock).not.toHaveBeenCalled();
    });

    it("does not send another email if reloading before resend reveals a confirmed account", async () => {
        reloadMock.mockImplementationOnce(async () => {
            authMock.currentUser!.emailVerified = true;
        });
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL }));

        expect(await screen.findByRole("heading", { name: en.EMAIL_VERIFIED_TITLE })).toBeInTheDocument();
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
        expect(signOutMock).toHaveBeenCalledWith(authMock);
    });

    it("allows retrying a failed email delivery without starting a cooldown", async () => {
        sendVerificationEmailMock.mockRejectedValueOnce(new Error("Email unavailable"));
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.VERIFICATION_EMAIL_ERROR);
        expect(localStorage.getItem("verificationEmailSentAt")).toBeNull();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeEnabled();
        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeEnabled();
        expect(signOutMock).not.toHaveBeenCalled();
    });

    it("does not send an email when the account cannot be refreshed before resending", async () => {
        reloadMock.mockRejectedValueOnce(new Error("Status unavailable"));
        const interaction = userEvent.setup();
        renderVerification();

        await interaction.click(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.VERIFICATION_EMAIL_ERROR);
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
        expect(localStorage.getItem("verificationEmailSentAt")).toBeNull();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeEnabled();
    });

    it("restores the remaining cooldown after a reload and re-enables resend when it expires", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
        localStorage.setItem("verificationEmailSentAt", String(Date.now() - 45_000));
        renderVerification();

        expect(screen.getByText(en.VERIFICATION_RESEND_IN.replace("{seconds}", "15"))).toBeInTheDocument();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeDisabled();
        act(() => vi.advanceTimersByTime(14_000));
        expect(screen.getByText(en.VERIFICATION_RESEND_IN.replace("{seconds}", "1"))).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(1_000));

        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeEnabled();
        expect(screen.queryByText(en.VERIFICATION_RESEND_IN.replace("{seconds}", "1"))).not.toBeInTheDocument();
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it("prevents concurrent checks and resends while an account status request is pending", async () => {
        const request = pendingRequest();
        reloadMock.mockReturnValueOnce(request.promise);
        renderVerification();

        fireEvent.click(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION }));

        expect(screen.getByRole("button", { name: en.LOADING })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.BACK_TO_SIGN_IN })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL }));
        expect(reloadMock).toHaveBeenCalledOnce();
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
        await act(async () => {
            request.resolve();
            await request.promise;
        });

        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeEnabled();
    });

    it("prevents checks and navigation until an in-flight resend finishes", async () => {
        const request = pendingRequest();
        sendVerificationEmailMock.mockReturnValueOnce(request.promise);
        renderVerification();

        fireEvent.click(screen.getByRole("button", { name: en.RESEND_VERIFICATION_EMAIL }));
        await waitFor(() => expect(sendVerificationEmailMock).toHaveBeenCalledOnce());

        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.LOADING })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.BACK_TO_SIGN_IN })).toBeDisabled();
        await act(async () => {
            request.resolve();
            await request.promise;
        });

        expect(screen.getByRole("button", { name: en.CHECK_EMAIL_VERIFICATION })).toBeEnabled();
        expect(screen.getByRole("alert")).toHaveTextContent(en.VERIFICATION_EMAIL_SENT);
    });

    it("releases the Firebase subscription and cooldown interval when leaving the screen", () => {
        vi.useFakeTimers();
        const setIntervalSpy = vi.spyOn(window, "setInterval");
        const clearIntervalSpy = vi.spyOn(window, "clearInterval");
        const { unmount } = renderVerification();
        const intervalCall = setIntervalSpy.mock.calls.findIndex(([, delay]) => delay === 1000);
        expect(intervalCall).toBeGreaterThanOrEqual(0);
        const timer = setIntervalSpy.mock.results[intervalCall].value;

        unmount();

        expect(unsubscribeMock).toHaveBeenCalledOnce();
        expect(clearIntervalSpy).toHaveBeenCalledWith(timer);
    });

    it("renders the return confirmation screen without sending a duplicate email", () => {
        localStorage.setItem("pendingVerificationEmail", "musician@example.com");
        localStorage.setItem("verificationEmailSentAt", String(Date.now()));
        localStorage.setItem("verificationEmailSendFailed", "true");
        renderVerification(`${verifyEmailPath}?verified=1`);

        expect(screen.getByRole("heading", { name: en.EMAIL_VERIFIED_TITLE })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: en.SIGN_IN })).toBeEnabled();
        expect(screen.queryByRole("button", { name: en.RESEND_VERIFICATION_EMAIL })).not.toBeInTheDocument();
        expect(localStorage.getItem("pendingVerificationEmail")).toBeNull();
        expect(localStorage.getItem("verificationEmailSentAt")).toBeNull();
        expect(localStorage.getItem("verificationEmailSendFailed")).toBeNull();
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
        expect(reloadMock).not.toHaveBeenCalled();
    });
});

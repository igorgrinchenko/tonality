import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import ForgotPassword from "../../../src/components/auth/ForgotPassword";
import SignIn from "../../../src/components/auth/SignIn";
import en from "../../../src/translations/en";
import ua from "../../../src/translations/ua";
import { forgotPasswordPath, signInPath } from "../../../src/routes/routes";

const { state, authMock, dispatchMock, signInMock, sendPasswordResetEmailMock } = vi.hoisted(() => ({
    state: { profile: { language: "en" }, signedIn: false, loading: false },
    authMock: { languageCode: "" },
    dispatchMock: vi.fn(),
    signInMock: vi.fn(),
    sendPasswordResetEmailMock: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("../../../src/redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isSignedIn: (value: typeof state) => value.signedIn,
    isLoading: (value: typeof state) => value.loading,
}));

vi.mock("../../../src/redux/thunks", () => ({
    signIn: Object.assign(signInMock, {
        fulfilled: { match: (action: { type: string }) => action.type === "user/signIn/fulfilled" },
    }),
}));

vi.mock("../../../src/firebase", () => ({ auth: authMock }));
vi.mock("firebase/auth", () => ({ sendPasswordResetEmail: sendPasswordResetEmailMock }));

beforeEach(() => {
    vi.clearAllMocks();
    state.profile.language = "en";
    state.signedIn = false;
    state.loading = false;
    authMock.languageCode = "";
    dispatchMock.mockResolvedValue({ type: "user/signIn/rejected" });
    signInMock.mockImplementation((payload: unknown) => ({ type: "test/signIn", payload }));
    sendPasswordResetEmailMock.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

function renderAuth(path: string = forgotPasswordPath) {
    const interaction = userEvent.setup();
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={signInPath} element={<SignIn />} />
                <Route path={forgotPasswordPath} element={<ForgotPassword />} />
            </Routes>
        </MemoryRouter>
    );
    return interaction;
}

function emailInput(label = en.EMAIL) {
    return screen.getByRole("textbox", { name: new RegExp(`^${label}`) });
}

describe("password recovery", () => {
    it("opens from sign-in and carries the entered email into the recovery form", async () => {
        const interaction = renderAuth(signInPath);
        await interaction.type(emailInput(), "musician@example.com");
        await interaction.click(screen.getByRole("link", { name: en.FORGOT_PASSWORD }));

        expect(await screen.findByRole("heading", { name: en.FORGOT_PASSWORD_TITLE })).toBeInTheDocument();
        expect(emailInput()).toHaveValue("musician@example.com");
    });

    it("sends a reset email in the selected language and confirms the request", async () => {
        state.profile.language = "ua";
        const interaction = renderAuth();
        await interaction.type(emailInput(ua.EMAIL), "musician@example.com");
        await interaction.click(screen.getByRole("button", { name: ua.RESET_PASSWORD }));

        expect(sendPasswordResetEmailMock).toHaveBeenCalledOnce();
        expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(authMock, "musician@example.com");
        expect(authMock.languageCode).toBe("uk");
        expect(await screen.findByRole("alert")).toHaveTextContent(ua.PASSWORD_RESET_EMAIL_SENT);
    });

    it("uses the same confirmation for an unknown account", async () => {
        sendPasswordResetEmailMock.mockRejectedValueOnce({ code: "auth/user-not-found" });
        const interaction = renderAuth();
        await interaction.type(emailInput(), "unknown@example.com");
        await interaction.click(screen.getByRole("button", { name: en.RESET_PASSWORD }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.PASSWORD_RESET_EMAIL_SENT);
        expect(screen.queryByText(en.PASSWORD_RESET_EMAIL_ERROR)).not.toBeInTheDocument();
    });

    it.each([
        ["auth/invalid-email", en.AUTH_INVALID_EMAIL],
        ["auth/too-many-requests", en.REQUEST_LIMITED],
        ["auth/network-request-failed", en.NETWORK_ERROR],
        ["auth/internal-error", en.PASSWORD_RESET_EMAIL_ERROR],
    ])("shows a localized message for %s", async (code, message) => {
        sendPasswordResetEmailMock.mockRejectedValueOnce({ code });
        const interaction = renderAuth();
        await interaction.type(emailInput(), "musician@example.com");
        await interaction.click(screen.getByRole("button", { name: en.RESET_PASSWORD }));

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
    });

    it("returns to sign-in from the recovery form", async () => {
        const interaction = renderAuth();
        await interaction.click(screen.getByRole("link", { name: en.BACK_TO_SIGN_IN }));

        expect(await screen.findByRole("heading", { name: en.LOGIN_TO_YOUR_ACC })).toBeInTheDocument();
    });
});

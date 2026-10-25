import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import en from "../../translations/en";
import de from "../../translations/de";
import { signInPath, signUpPath, tonalityPath, verifyEmailPath } from "../../routes/routes";

const { state, dispatchMock, signInMock, signUpMock } = vi.hoisted(() => ({
    state: { profile: { language: "en" }, signedIn: false, loading: false },
    dispatchMock: vi.fn(),
    signInMock: vi.fn(),
    signUpMock: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("../../redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isSignedIn: (value: typeof state) => value.signedIn,
    isLoading: (value: typeof state) => value.loading,
}));

vi.mock("../../redux/thunks", () => ({
    signIn: Object.assign(signInMock, {
        fulfilled: { match: (action: { type: string }) => action.type === "user/signIn/fulfilled" },
    }),
    signUp: Object.assign(signUpMock, {
        fulfilled: { match: (action: { type: string }) => action.type === "user/signUp/fulfilled" },
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
    state.profile.language = "en";
    state.signedIn = false;
    state.loading = false;
    dispatchMock.mockResolvedValue({ type: "auth/rejected" });
    signInMock.mockImplementation((payload: unknown) => ({ type: "test/signIn", payload }));
    signUpMock.mockImplementation((payload: unknown) => ({ type: "test/signUp", payload }));
});

afterEach(() => cleanup());

function renderForm(path = signInPath) {
    const interaction = userEvent.setup();
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={signInPath} element={<SignIn />} />
                <Route path={signUpPath} element={<SignUp />} />
                <Route path={verifyEmailPath} element={<h1>Verification destination</h1>} />
                <Route path={tonalityPath} element={<h1>Key finder destination</h1>} />
            </Routes>
        </MemoryRouter>
    );
    return interaction;
}

function emailInput(label = en.EMAIL) {
    return screen.getByRole("textbox", { name: new RegExp(`^${label}`) });
}

function passwordInput(label = en.PASSWORD) {
    return screen.getByLabelText(new RegExp(`^${label}`), { selector: "input" });
}

async function fillCredentials(interaction: ReturnType<typeof userEvent.setup>, labels = en) {
    await interaction.type(emailInput(labels.EMAIL), "musician@example.com");
    await interaction.type(passwordInput(labels.PASSWORD), "quiet-melody");
}

describe("authentication forms", () => {
    it("starts sign-in with empty credentials and preserves the entered password when visibility changes", async () => {
        const interaction = renderForm();
        const email = emailInput();
        const password = passwordInput();

        expect(email).toHaveValue("");
        expect(password).toHaveValue("");
        expect(email).toHaveAttribute("type", "email");
        expect(email).toHaveAttribute("autocomplete", "email");
        expect(password).toHaveAttribute("type", "password");
        expect(password).toHaveAttribute("autocomplete", "current-password");

        await interaction.type(password, "quiet-melody");
        await interaction.click(screen.getByRole("button", { name: en.SHOW_PASSWORD }));

        expect(password).toHaveAttribute("type", "text");
        expect(password).toHaveValue("quiet-melody");
        expect(screen.getByRole("button", { name: en.HIDE_PASSWORD })).toHaveAttribute("aria-pressed", "true");
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    it("starts registration empty and exposes appropriate email and new-password requirements", () => {
        renderForm(signUpPath);

        expect(emailInput()).toHaveValue("");
        expect(passwordInput()).toHaveValue("");
        expect(emailInput()).toHaveAttribute("type", "email");
        expect(emailInput()).toHaveAttribute("autocomplete", "email");
        expect(passwordInput()).toHaveAttribute("autocomplete", "new-password");
        expect(passwordInput()).toHaveAttribute("minlength", "6");
        expect(passwordInput()).toBeRequired();
        expect(screen.getByText(en.PASSWORD_HINT)).toBeInTheDocument();
    });

    it("submits the entered credentials together with the selected language", async () => {
        state.profile.language = "de";
        const interaction = renderForm();
        await fillCredentials(interaction, de);
        await interaction.click(screen.getByRole("button", { name: de.SIGN_IN }));

        expect(signInMock).toHaveBeenCalledOnce();
        expect(signInMock).toHaveBeenCalledWith({ email: "musician@example.com", password: "quiet-melody", language: "de" });
        expect(dispatchMock).toHaveBeenCalledWith(signInMock.mock.results[0].value);
    });

    it("takes an unverified sign-in to email verification", async () => {
        dispatchMock.mockResolvedValue({
            type: "user/signIn/fulfilled",
            payload: { email: "musician@example.com", requiresEmailVerification: true },
        });
        const interaction = renderForm();
        await fillCredentials(interaction);
        await interaction.click(screen.getByRole("button", { name: en.SIGN_IN }));

        expect(await screen.findByRole("heading", { name: "Verification destination" })).toBeInTheDocument();
    });

    it("takes an already signed-in user to the key finder", async () => {
        state.signedIn = true;
        renderForm();

        expect(await screen.findByRole("heading", { name: "Key finder destination" })).toBeInTheDocument();
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    it("takes successful registration to email verification", async () => {
        dispatchMock.mockResolvedValue({
            type: "user/signUp/fulfilled",
            payload: { email: "musician@example.com", verificationEmailSent: true },
        });
        const interaction = renderForm(signUpPath);
        await fillCredentials(interaction);
        await interaction.click(screen.getByRole("button", { name: en.SIGN_UP }));

        expect(signUpMock).toHaveBeenCalledWith({ email: "musician@example.com", password: "quiet-melody", language: "en" });
        expect(dispatchMock).toHaveBeenCalledWith(signUpMock.mock.results[0].value);
        expect(await screen.findByRole("heading", { name: "Verification destination" })).toBeInTheDocument();
    });

    it("keeps rejected registration on the form without losing the entered credentials", async () => {
        dispatchMock.mockResolvedValue({ type: "user/signUp/rejected", error: { message: "Email already in use" } });
        const interaction = renderForm(signUpPath);
        await fillCredentials(interaction);
        await interaction.click(screen.getByRole("button", { name: en.SIGN_UP }));

        await waitFor(() => expect(dispatchMock).toHaveBeenCalledOnce());
        expect(screen.getByRole("heading", { name: en.CREATE_AN_ACCOUNT })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Verification destination" })).not.toBeInTheDocument();
        expect(emailInput()).toHaveValue("musician@example.com");
        expect(passwordInput()).toHaveValue("quiet-melody");
    });

    it("makes credentials and navigation unavailable while an authentication request is pending", async () => {
        state.loading = true;
        const interaction = renderForm();
        const submit = screen.getByRole("button", { name: en.LOADING });

        expect(emailInput()).toBeDisabled();
        expect(passwordInput()).toBeDisabled();
        expect(submit).toBeDisabled();
        expect(screen.getByRole("link", { name: en.SIGN_UP })).toHaveAttribute("aria-disabled", "true");
        await interaction.tab();
        expect(submit).not.toHaveFocus();
        expect(dispatchMock).not.toHaveBeenCalled();
    });
});

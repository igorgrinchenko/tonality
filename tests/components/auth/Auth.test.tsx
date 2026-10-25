import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import Auth from "../../../src/components/auth/Auth";
import AuthLayout from "../../../src/components/auth/AuthLayout";
import en from "../../../src/translations/en";
import de from "../../../src/translations/de";
import ua from "../../../src/translations/ua";
import { authPath, signInPath, signUpPath, tonalityPath } from "../../../src/routes/routes";

const { state } = vi.hoisted(() => ({ state: { profile: { language: "en" }, signedIn: false } }));

vi.mock("react-redux", () => ({ useSelector: (selector: (value: typeof state) => unknown) => selector(state) }));

vi.mock("../../../src/redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isSignedIn: (value: typeof state) => value.signedIn,
}));

beforeEach(() => {
    state.profile.language = "en";
    state.signedIn = false;
});

afterEach(() => cleanup());

function renderLanding() {
    const interaction = userEvent.setup();
    render(
        <MemoryRouter initialEntries={[authPath]}>
            <Routes>
                <Route path={authPath} element={<Auth />} />
                <Route path={signInPath} element={<h1>Sign-in destination</h1>} />
                <Route path={signUpPath} element={<h1>Registration destination</h1>} />
                <Route path={tonalityPath} element={<h1>Key finder destination</h1>} />
            </Routes>
        </MemoryRouter>
    );
    return interaction;
}

describe("authentication landing page", () => {
    it.each([
        { language: "en", labels: en },
        { language: "de", labels: de },
        { language: "ua", labels: ua },
    ])("provides localized, named authentication choices for $language", ({ language, labels }) => {
        state.profile.language = language;
        renderLanding();

        const card = screen.getByRole("region", { name: labels.AUTH_WELCOME_TITLE });
        expect(within(card).getByRole("heading", { level: 1, name: labels.AUTH_WELCOME_TITLE })).toBeInTheDocument();
        expect(within(card).getByText(labels.AUTH_WELCOME_DESCRIPTION)).toBeInTheDocument();
        expect(within(card).getByRole("link", { name: labels.SIGN_IN })).toHaveAttribute("href", signInPath);
        expect(within(card).getByRole("link", { name: labels.SIGN_UP })).toHaveAttribute("href", signUpPath);
        expect(screen.getByText(labels.SAFE_ACCOUNT)).toBeInTheDocument();
    });

    it.each([
        { label: en.SIGN_IN, destination: "Sign-in destination" },
        { label: en.SIGN_UP, destination: "Registration destination" },
    ])("opens the selected $destination", async ({ label, destination }) => {
        const interaction = renderLanding();

        await interaction.click(screen.getByRole("link", { name: label }));

        expect(await screen.findByRole("heading", { name: destination })).toBeInTheDocument();
    });

    it("sends an authenticated user directly to the key finder", async () => {
        state.signedIn = true;
        renderLanding();

        expect(await screen.findByRole("heading", { name: "Key finder destination" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: en.SIGN_IN })).not.toBeInTheDocument();
    });
});

describe("authentication layout", () => {
    it("labels the content region with its single main heading and preserves supplied actions", async () => {
        const interaction = userEvent.setup();
        const action = vi.fn();
        render(
            <AuthLayout title="Check your inbox" description="Follow the confirmation link." icon={<span>Decorative icon</span>} tone="success">
                <button onClick={action}>Continue practicing</button>
            </AuthLayout>
        );

        const card = screen.getByRole("region", { name: "Check your inbox" });
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(within(card).getByText("Follow the confirmation link.")).toBeInTheDocument();
        expect(screen.getByText("Decorative icon").closest("[aria-hidden='true']")).not.toBeNull();
        await interaction.click(within(card).getByRole("button", { name: "Continue practicing" }));

        expect(action).toHaveBeenCalledOnce();
    });
});

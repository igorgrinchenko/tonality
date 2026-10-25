import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RadioButtonsGroup from "./Radio";
import User from "./pages/User";
import en from "../translations/en";
import ua from "../translations/ua";
import { URLs } from "../common/enums";
import version from "../app_version.json";

const { state, dispatchMock, setPreferencesMock, setUserDataMock, logOutMock, decodeBase64Mock } = vi.hoisted(() => ({
    state: {
        profile: {
            email: "musician@example.com",
            theme: "dark" as "light" | "dark",
            language: "en" as "en" | "de" | "ua",
            isVerified: true,
        },
        loading: false,
    },
    dispatchMock: vi.fn(),
    setPreferencesMock: vi.fn((payload: unknown) => ({ type: "user/setPreferences", payload })),
    setUserDataMock: vi.fn((payload: unknown) => ({ type: "test/saveSettings", payload })),
    logOutMock: vi.fn(() => ({ type: "test/logout" })),
    decodeBase64Mock: vi.fn(() => "profile-user-id"),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("../redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isLoading: (value: typeof state) => value.loading,
}));

vi.mock("../redux/slice", () => ({ setPreferences: setPreferencesMock }));
vi.mock("../redux/thunks", () => ({ setUserData: setUserDataMock, logOut: logOutMock, decodeBase64: decodeBase64Mock }));

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    state.profile = { email: "musician@example.com", theme: "dark", language: "en", isVerified: true };
    state.loading = false;
});

afterEach(() => cleanup());

function renderPreferences() {
    const interaction = userEvent.setup();
    render(<RadioButtonsGroup theme={state.profile.theme} language={state.profile.language} isVerified={state.profile.isVerified} />);
    return interaction;
}

describe("appearance and language preferences", () => {
    it("reflects saved appearance and language using accessible native-language choices", () => {
        state.profile.language = "ua";
        renderPreferences();

        expect(screen.getByRole("button", { name: ua.DARK })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: ua.LIGHT })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("radiogroup", { name: ua.LANG })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /^Українська/ })).toBeChecked();
        expect(screen.getByRole("radio", { name: /^English/ })).not.toBeChecked();
        expect(screen.getByRole("radio", { name: /^Deutsch/ })).not.toBeChecked();
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    it("persists an appearance change locally and saves the current language with the verified account", async () => {
        localStorage.setItem("encodedUID", "encoded-profile-id");
        const interaction = renderPreferences();
        await interaction.click(screen.getByRole("button", { name: en.LIGHT }));

        expect(localStorage.getItem("theme")).toBe("light");
        expect(localStorage.getItem("language")).toBe("en");
        expect(setPreferencesMock).toHaveBeenCalledWith({ theme: "light", language: "en" });
        expect(decodeBase64Mock).toHaveBeenCalledWith("encoded-profile-id");
        expect(setUserDataMock).toHaveBeenCalledWith({ theme: "light", language: "en", isVerified: true, uid: "profile-user-id" });
        expect(dispatchMock).toHaveBeenCalledWith(setUserDataMock.mock.results[0].value);
    });

    it("changes language without resetting the saved appearance", async () => {
        localStorage.setItem("encodedUID", "encoded-profile-id");
        const interaction = renderPreferences();
        await interaction.click(screen.getByRole("radio", { name: /^Deutsch/ }));

        expect(localStorage.getItem("language")).toBe("de");
        expect(localStorage.getItem("theme")).toBe("dark");
        expect(setPreferencesMock).toHaveBeenCalledWith({ theme: "dark", language: "de" });
        expect(setUserDataMock).toHaveBeenCalledWith({ theme: "dark", language: "de", isVerified: true, uid: "profile-user-id" });
    });

    it("avoids duplicate requests when the current preferences are selected again", async () => {
        localStorage.setItem("encodedUID", "encoded-profile-id");
        const interaction = renderPreferences();
        await interaction.click(screen.getByRole("button", { name: en.DARK }));
        await interaction.click(screen.getByRole("radio", { name: /^English/ }));

        expect(dispatchMock).not.toHaveBeenCalled();
        expect(setUserDataMock).not.toHaveBeenCalled();
    });

    it("keeps a local preference usable when no account identifier is stored", async () => {
        const interaction = renderPreferences();
        await interaction.click(screen.getByRole("button", { name: en.LIGHT }));

        expect(localStorage.getItem("theme")).toBe("light");
        expect(dispatchMock).toHaveBeenCalledWith(setPreferencesMock.mock.results[0].value);
        expect(setUserDataMock).not.toHaveBeenCalled();
        expect(decodeBase64Mock).not.toHaveBeenCalled();
    });

    it("prevents further preference edits while a settings request is pending", () => {
        state.loading = true;
        renderPreferences();

        for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
        for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
        expect(dispatchMock).not.toHaveBeenCalled();
    });
});

describe("profile page", () => {
    it("shows the account, verification, support link and app version, and dispatches logout", async () => {
        const interaction = userEvent.setup();
        render(<User />);

        expect(screen.getByRole("heading", { name: en.PROFILE_TITLE, level: 1 })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: state.profile.email })).toBeInTheDocument();
        expect(screen.getByText(en.VERIFIED_EMAIL)).toBeInTheDocument();
        expect(screen.getByText(`${en.VERSION} ${version.version}`)).toBeInTheDocument();
        const support = screen.getByRole("link", { name: en.CONTACT_THE_DEVELOPER });
        expect(support).toHaveAttribute("href", URLs.telegram);
        expect(support).toHaveAttribute("target", "_blank");
        expect(support).toHaveAttribute("rel", "noopener noreferrer");

        await interaction.click(screen.getByRole("button", { name: en.LOG_OUT }));
        expect(logOutMock).toHaveBeenCalledOnce();
        expect(dispatchMock).toHaveBeenCalledWith(logOutMock.mock.results[0].value);
    });

    it("shows an unverified account accurately and prevents duplicate logout while loading", () => {
        state.profile.isVerified = false;
        state.loading = true;
        render(<User />);

        expect(screen.getByText(en.UNVERIFIED_EMAIL)).toBeInTheDocument();
        expect(screen.queryByText(en.VERIFIED_EMAIL)).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: en.LOG_OUT })).toBeDisabled();
        expect(logOutMock).not.toHaveBeenCalled();
    });
});

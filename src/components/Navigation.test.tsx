import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import Brand from "./Brand";
import en from "../translations/en";
import de from "../translations/de";
import ua from "../translations/ua";
import { authPath, signInPath, signUpPath, tonalityPath, tunePath, presetsPath, userPath } from "../routes/routes";

const { state, dispatchMock, setPreferencesMock, setUserDataMock, decodeBase64Mock } = vi.hoisted(() => ({
    state: {
        signedIn: false,
        loading: false,
        profile: { theme: "dark", language: "en", email: "musician@example.com", isVerified: true },
    },
    dispatchMock: vi.fn(),
    setPreferencesMock: vi.fn((payload: unknown) => ({ type: "test/preferences", payload })),
    setUserDataMock: vi.fn((payload: unknown) => ({ type: "test/persistPreferences", payload })),
    decodeBase64Mock: vi.fn(() => "verified-user-id"),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("../redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isSignedIn: (value: typeof state) => value.signedIn,
    isLoading: (value: typeof state) => value.loading,
}));

vi.mock("../redux/slice", () => ({ setPreferences: setPreferencesMock }));

vi.mock("../redux/thunks", () => ({
    setUserData: setUserDataMock,
    decodeBase64: decodeBase64Mock,
}));

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    state.signedIn = false;
    state.loading = false;
    state.profile = { theme: "dark", language: "en", email: "musician@example.com", isVerified: true };
});

afterEach(() => cleanup());

function CurrentLocation() {
    return <output aria-label="Current route">{useLocation().pathname}</output>;
}

function renderNavigation(component: ReactNode, path = tunePath) {
    const interaction = userEvent.setup();
    render(
        <MemoryRouter initialEntries={[path]}>
            {component}
            <CurrentLocation />
        </MemoryRouter>
    );
    return interaction;
}

describe("workspace navigation", () => {
    it("hides workspace destinations when the user is signed out", () => {
        renderNavigation(<Footer />);

        expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it.each([
        { language: "en", labels: en },
        { language: "de", labels: de },
        { language: "ua", labels: ua },
    ])("provides all four localized destinations and tracks the active route in $language", async ({ language, labels }) => {
        state.signedIn = true;
        state.profile.language = language;
        const interaction = renderNavigation(<Footer />);
        const navigation = screen.getByRole("navigation", { name: labels.NAVIGATION });
        const destinations = [
            { name: labels.TONALITY, path: tonalityPath },
            { name: labels.TUNE, path: tunePath },
            { name: labels.PRESETS, path: presetsPath },
            { name: labels.PROFILE, path: userPath },
        ];

        expect(within(navigation).getAllByRole("link")).toHaveLength(destinations.length);
        for (const destination of destinations) {
            expect(within(navigation).getByRole("link", { name: destination.name })).toHaveAttribute("href", destination.path);
        }
        expect(within(navigation).getByRole("link", { name: labels.TUNE })).toHaveAttribute("aria-current", "page");
        expect(within(navigation).getByRole("link", { name: labels.PRESETS })).not.toHaveAttribute("aria-current");

        await interaction.click(within(navigation).getByRole("link", { name: labels.PRESETS }));

        expect(screen.getByLabelText("Current route")).toHaveTextContent(presetsPath);
        expect(within(navigation).getByRole("link", { name: labels.PRESETS })).toHaveAttribute("aria-current", "page");
        expect(within(navigation).getByRole("link", { name: labels.TUNE })).not.toHaveAttribute("aria-current");
    });

    it("prevents pending navigation by pointer and removes workspace links from keyboard tab order", async () => {
        state.signedIn = true;
        state.loading = true;
        const interaction = renderNavigation(<Footer />);
        const navigation = screen.getByRole("navigation", { name: en.NAVIGATION });

        expect(navigation).toHaveAttribute("aria-busy", "true");
        for (const link of within(navigation).getAllByRole("link")) {
            expect(link).toHaveAttribute("aria-disabled", "true");
            expect(link).toHaveAttribute("tabindex", "-1");
        }
        await interaction.click(within(navigation).getByRole("link", { name: en.PRESETS }));
        await interaction.tab();

        expect(screen.getByLabelText("Current route")).toHaveTextContent(tunePath);
        expect(within(navigation).getAllByRole("link")).not.toContain(document.activeElement);
    });

    it.each([
        { signedIn: false, destination: authPath },
        { signedIn: true, destination: tonalityPath },
    ])("sends the brand link to $destination when signedIn=$signedIn", async ({ signedIn, destination }) => {
        state.signedIn = signedIn;
        const interaction = renderNavigation(<Brand />);
        const brand = screen.getByRole("link", { name: "Tonality" });

        expect(brand).toHaveAttribute("href", destination);
        await interaction.click(brand);
        expect(screen.getByLabelText("Current route")).toHaveTextContent(destination);
    });
});

describe("workspace header", () => {
    it.each([signInPath, signUpPath])("provides a keyboard-accessible back link to auth from %s", async (path) => {
        const interaction = renderNavigation(<Header />, path);
        const back = screen.getByRole("link", { name: en.RETURN_BACK });

        expect(back).toHaveAttribute("href", authPath);
        await interaction.click(back);
        expect(screen.getByLabelText("Current route")).toHaveTextContent(authPath);
    });

    it("announces the current workspace section and exposes a named profile link", () => {
        state.signedIn = true;
        state.profile.language = "ua";
        renderNavigation(<Header />, presetsPath);
        const header = screen.getByRole("banner");

        expect(within(header).getByText(ua.WORKSPACE)).toBeInTheDocument();
        expect(within(header).getByText(ua.PRESETS)).toBeInTheDocument();
        expect(within(header).queryByRole("link", { name: ua.RETURN_BACK })).not.toBeInTheDocument();
        const profile = within(header).getByRole("link", { name: ua.OPEN_PROFILE });
        expect(profile).toHaveAttribute("href", userPath);
        expect(profile).toHaveTextContent("M");
    });

    it.each([
        { theme: "dark", nextTheme: "light", actionName: en.SWITCH_TO_LIGHT },
        { theme: "light", nextTheme: "dark", actionName: en.SWITCH_TO_DARK },
    ])("saves a signed-out switch from $theme to $nextTheme locally without writing account settings", async ({ theme, nextTheme, actionName }) => {
        state.profile.theme = theme;
        localStorage.setItem("encodedUID", "an-old-account-id");
        const interaction = renderNavigation(<Header />, authPath);

        await interaction.click(screen.getByRole("button", { name: actionName }));

        expect(localStorage.getItem("theme")).toBe(nextTheme);
        expect(setPreferencesMock).toHaveBeenCalledWith({ theme: nextTheme });
        expect(dispatchMock).toHaveBeenCalledWith(setPreferencesMock.mock.results[0].value);
        expect(setUserDataMock).not.toHaveBeenCalled();
        expect(decodeBase64Mock).not.toHaveBeenCalled();
    });

    it("persists a signed-in theme change with the current locale and verified account", async () => {
        state.signedIn = true;
        state.profile.language = "de";
        localStorage.setItem("encodedUID", "encoded-account-id");
        const interaction = renderNavigation(<Header />);

        await interaction.click(screen.getByRole("button", { name: de.SWITCH_TO_LIGHT }));

        expect(localStorage.getItem("theme")).toBe("light");
        expect(decodeBase64Mock).toHaveBeenCalledWith("encoded-account-id");
        expect(setUserDataMock).toHaveBeenCalledWith({ theme: "light", language: "de", isVerified: true, uid: "verified-user-id" });
        expect(dispatchMock).toHaveBeenCalledWith(setPreferencesMock.mock.results[0].value);
        expect(dispatchMock).toHaveBeenCalledWith(setUserDataMock.mock.results[0].value);
    });

    it("retains a local theme change when a signed-in account has no stored identifier", async () => {
        state.signedIn = true;
        const interaction = renderNavigation(<Header />);

        await interaction.click(screen.getByRole("button", { name: en.SWITCH_TO_LIGHT }));

        expect(localStorage.getItem("theme")).toBe("light");
        expect(setPreferencesMock).toHaveBeenCalledWith({ theme: "light" });
        expect(setUserDataMock).not.toHaveBeenCalled();
    });

    it("makes the appearance action unavailable during an ongoing request", () => {
        state.loading = true;
        renderNavigation(<Header />);

        expect(screen.getByRole("button", { name: en.SWITCH_TO_LIGHT })).toBeDisabled();
        expect(setPreferencesMock).not.toHaveBeenCalled();
        expect(setUserDataMock).not.toHaveBeenCalled();
        expect(localStorage.getItem("theme")).toBeNull();
    });
});

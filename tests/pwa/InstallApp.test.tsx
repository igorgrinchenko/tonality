import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import InstallDialog, { InstallAppSection, InstallPromotion } from "../../src/components/InstallApp";
import InstallProvider, { installDismissalDuration, installDismissalKey } from "../../src/pwa/InstallProvider";
import { tonalityPath, userPath } from "../../src/routes/routes";
import en from "../../src/translations/en";
import de from "../../src/translations/de";
import ua from "../../src/translations/ua";

const { profile } = vi.hoisted(() => ({ profile: { language: "en" as "en" | "de" | "ua" } }));

vi.mock("react-redux", () => ({ useSelector: () => profile }));
vi.mock("../../src/redux/store", () => ({ user: vi.fn() }));

let media: EventTarget & { matches: boolean };

beforeEach(() => {
    localStorage.clear();
    profile.language = "en";
    media = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => media)
    );
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 15) Chrome/134.0 Mobile Safari/537.36");
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function Scenario({ eligible = true, disabled = false, profilePage = false }: { eligible?: boolean; disabled?: boolean; profilePage?: boolean }) {
    return (
        <MemoryRouter initialEntries={[profilePage ? userPath : tonalityPath]}>
            <InstallProvider>
                <InstallPromotion eligible={eligible} disabled={disabled} />
                {profilePage && <InstallAppSection disabled={disabled} />}
                <InstallDialog />
            </InstallProvider>
        </MemoryRouter>
    );
}

function offerInstall(outcome: "accepted" | "dismissed" = "accepted") {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome }) });
    act(() => {
        window.dispatchEvent(event);
    });
    return { event, prompt };
}

describe("PWA installation", () => {
    it("waits for a saved preset and a user gesture before opening the Android installation prompt", async () => {
        const view = render(<Scenario eligible={false} />);
        const { event, prompt } = offerInstall();

        expect(event.defaultPrevented).toBe(true);
        expect(prompt).not.toHaveBeenCalled();
        expect(screen.queryByRole("button", { name: en.INSTALL_APP })).not.toBeInTheDocument();

        view.rerender(<Scenario />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));

        expect(prompt).toHaveBeenCalledOnce();
        await waitFor(() => expect(screen.queryByRole("region")).not.toBeInTheDocument());
    });

    it("uses the native prompt on desktop when available", async () => {
        vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Windows NT 10.0) Chrome/134.0");
        render(<Scenario />);
        expect(screen.queryByRole("region")).not.toBeInTheDocument();

        const { prompt } = offerInstall();
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));

        await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
        await waitFor(() => expect(screen.queryByRole("region")).not.toBeInTheDocument());
    });

    it("prevents duplicate prompts and postpones the offer for seven days when native installation is dismissed", async () => {
        let finishChoice!: (choice: { outcome: "dismissed" }) => void;
        const choice = new Promise<{ outcome: "dismissed" }>((resolve) => {
            finishChoice = resolve;
        });
        const prompt = vi.fn().mockResolvedValue(undefined);
        render(<Scenario />);
        act(() => {
            window.dispatchEvent(Object.assign(new Event("beforeinstallprompt"), { prompt, userChoice: choice }));
        });
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));
        const loading = screen.getByRole("button", { name: en.LOADING });
        expect(loading).toBeDisabled();
        fireEvent.click(loading);
        expect(prompt).toHaveBeenCalledOnce();

        const now = Date.now();
        await act(async () => finishChoice({ outcome: "dismissed" }));
        const until = Number(localStorage.getItem(installDismissalKey));
        expect(until).toBeGreaterThanOrEqual(now + installDismissalDuration);
        expect(until).toBeLessThanOrEqual(Date.now() + installDismissalDuration);
        expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    it("remembers Maybe later after remounting and keeps manual installation available in the profile", () => {
        const view = render(<Scenario />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_LATER }));
        view.unmount();

        const next = render(<Scenario />);
        expect(screen.queryByRole("region")).not.toBeInTheDocument();
        next.rerender(<Scenario profilePage />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));

        expect(screen.getByRole("dialog", { name: en.INSTALL_APP })).toBeInTheDocument();
        expect(screen.getByText(en.INSTALL_ANDROID_STEP_1)).toBeInTheDocument();
    });

    it("offers installation again after the dismissal period expires", () => {
        vi.useFakeTimers();
        localStorage.setItem(installDismissalKey, String(Date.now() + installDismissalDuration));
        render(<Scenario />);
        expect(screen.queryByRole("region")).not.toBeInTheDocument();

        act(() => vi.advanceTimersByTime(installDismissalDuration));

        expect(screen.getByRole("region", { name: en.INSTALL_TITLE })).toBeInTheDocument();
        expect(localStorage.getItem(installDismissalKey)).toBeNull();
    });

    it("shows Android instructions without a native prompt and allows choosing another device", () => {
        render(<Scenario />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));
        const dialog = screen.getByRole("dialog", { name: en.INSTALL_APP });

        expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
        expect(within(dialog).getByText(en.INSTALL_ANDROID_STEP_2)).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole("button", { name: "iPhone / iPad" }));
        expect(within(dialog).getByText(en.INSTALL_IOS_STEP_2)).toBeInTheDocument();
        expect(within(dialog).queryByText(en.INSTALL_ANDROID_STEP_2)).not.toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole("button", { name: en.INSTALL_DESKTOP }));
        expect(within(dialog).getByText(en.INSTALL_DESKTOP_STEP_3)).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole("button", { name: en.INSTALL_DONE }));
        expect(Number(localStorage.getItem(installDismissalKey))).toBeGreaterThan(Date.now());
    });

    it("selects Safari home screen instructions on iPhone", () => {
        vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
        render(<Scenario />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));

        expect(screen.getByRole("button", { name: "iPhone / iPad" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText(en.INSTALL_IOS_STEP_3)).toBeInTheDocument();
    });

    it("recognizes an iPad using a desktop user agent", () => {
        const originalNavigator = window.navigator;
        vi.stubGlobal(
            "navigator",
            new Proxy(originalNavigator, {
                get(target, key) {
                    if (key === "userAgent") return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15";
                    if (key === "platform") return "MacIntel";
                    if (key === "maxTouchPoints") return 5;
                    return Reflect.get(target, key, target);
                },
            })
        );
        render(<Scenario />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));

        expect(screen.getByText(en.INSTALL_IOS_STEP_1)).toBeInTheDocument();
    });

    it.each(["display mode", "Safari standalone"])("hides installation controls when already installed via %s", (mode) => {
        if (mode === "display mode") media.matches = true;
        else {
            const originalNavigator = window.navigator;
            vi.stubGlobal(
                "navigator",
                new Proxy(originalNavigator, {
                    get: (target, key) => (key === "standalone" ? true : Reflect.get(target, key, target)),
                })
            );
        }
        render(<Scenario profilePage />);
        const { event, prompt } = offerInstall();

        expect(screen.queryByRole("region")).not.toBeInTheDocument();
        expect(event.defaultPrevented).toBe(false);
        expect(prompt).not.toHaveBeenCalled();
    });

    it("closes instructions and removes controls when the browser reports installation", async () => {
        render(<Scenario profilePage />);
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        act(() => window.dispatchEvent(new Event("appinstalled")));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByRole("button", { name: en.INSTALL_APP })).not.toBeInTheDocument();
        expect(localStorage.getItem(installDismissalKey)).toBeNull();
    });

    it("hides controls when the app switches to standalone display mode", () => {
        render(<Scenario />);
        expect(screen.getByRole("region")).toBeInTheDocument();

        act(() => {
            media.matches = true;
            media.dispatchEvent(new Event("change"));
        });

        expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    it("falls back to manual instructions if the native prompt fails", async () => {
        const prompt = vi.fn().mockRejectedValue(new Error("Prompt unavailable"));
        render(<Scenario profilePage />);
        act(() => window.dispatchEvent(Object.assign(new Event("beforeinstallprompt"), { prompt })));
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));

        expect(await screen.findByText(en.INSTALL_MANUAL_FALLBACK)).toBeInTheDocument();
        expect(screen.getByText(en.INSTALL_ANDROID_STEP_1)).toBeInTheDocument();
        expect(prompt).toHaveBeenCalledOnce();
    });

    it("avoids duplicate profile offers and prevents installation during a request", () => {
        const view = render(<Scenario disabled />);
        expect(screen.queryByRole("region")).not.toBeInTheDocument();
        view.rerender(<Scenario profilePage disabled />);
        expect(screen.getAllByRole("region")).toHaveLength(1);
        expect(screen.getByRole("button", { name: en.INSTALL_APP })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: en.INSTALL_APP }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("synchronizes dismissal from another browser tab", () => {
        render(<Scenario />);
        act(() => {
            localStorage.setItem(installDismissalKey, String(Date.now() + installDismissalDuration));
            window.dispatchEvent(new StorageEvent("storage", { key: installDismissalKey }));
        });

        expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    it.each([de, ua])("uses the current app language in instructions: $INSTALL_DEVICE", (language) => {
        profile.language = language === de ? "de" : "ua";
        render(<Scenario />);
        fireEvent.click(screen.getByRole("button", { name: language.INSTALL_APP }));

        expect(screen.getByRole("dialog", { name: language.INSTALL_APP })).toBeInTheDocument();
        expect(screen.getByText(language.INSTALL_ANDROID_STEP_1)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: language.INSTALL_DONE })).toBeInTheDocument();
    });
});

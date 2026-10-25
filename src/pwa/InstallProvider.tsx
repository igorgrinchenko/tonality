import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

export const installDismissalKey = "pwaInstallDismissedUntil";
export const installDismissalDuration = 7 * 24 * 60 * 60 * 1000;
export type InstallPlatform = "android" | "ios" | "desktop";

interface InstallChoice {
    outcome: "accepted" | "dismissed";
}

interface InstallPromptEvent extends Event {
    prompt: () => Promise<InstallChoice | void>;
    userChoice: Promise<InstallChoice>;
}

interface InstallContextValue {
    installed: boolean;
    installing: boolean;
    canPrompt: boolean;
    snoozed: boolean;
    helpOpen: boolean;
    failed: boolean;
    platform: InstallPlatform;
    requestInstall: () => Promise<void>;
    snooze: () => void;
}

const InstallContext = createContext<InstallContextValue | null>(null);

function isStandalone() {
    return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone);
}

function getPlatform(): InstallPlatform {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
    return /Android/i.test(navigator.userAgent) ? "android" : "desktop";
}

function readDismissal() {
    try {
        const until = Number(localStorage.getItem(installDismissalKey));
        return Number.isFinite(until) && until > Date.now() ? until : 0;
    } catch {
        return 0;
    }
}

function storeDismissal(until: number) {
    try {
        if (until) localStorage.setItem(installDismissalKey, String(until));
        else localStorage.removeItem(installDismissalKey);
    } catch {}
}

export default function InstallProvider({ children }: { children: ReactNode }) {
    const [installed, setInstalled] = useState(isStandalone);
    const [installing, setInstalling] = useState(false);
    const [canPrompt, setCanPrompt] = useState(false);
    const [dismissedUntil, setDismissedUntil] = useState(readDismissal);
    const [helpOpen, setHelpOpen] = useState(false);
    const [failed, setFailed] = useState(false);
    const [platform] = useState(getPlatform);
    const promptEvent = useRef<InstallPromptEvent | null>(null);
    const pending = useRef(false);
    const installedHere = useRef(false);

    const markInstalled = useCallback(() => {
        installedHere.current = true;
        promptEvent.current = null;
        setInstalled(true);
        setCanPrompt(false);
        setHelpOpen(false);
        setDismissedUntil(0);
        storeDismissal(0);
    }, []);

    const snooze = useCallback(() => {
        const until = Date.now() + installDismissalDuration;
        storeDismissal(until);
        setDismissedUntil(until);
        setHelpOpen(false);
        setFailed(false);
    }, []);

    useEffect(() => {
        const capturePrompt = (event: Event) => {
            if (installedHere.current || isStandalone()) return;
            event.preventDefault();
            promptEvent.current = event as InstallPromptEvent;
            setCanPrompt(true);
        };
        const media = window.matchMedia?.("(display-mode: standalone)");
        const syncDisplay = () => setInstalled(installedHere.current || isStandalone());
        const syncDismissal = (event: StorageEvent) => {
            if (event.key === installDismissalKey || event.key === null) setDismissedUntil(readDismissal());
        };
        window.addEventListener("beforeinstallprompt", capturePrompt);
        window.addEventListener("appinstalled", markInstalled);
        window.addEventListener("storage", syncDismissal);
        media?.addEventListener?.("change", syncDisplay);
        return () => {
            window.removeEventListener("beforeinstallprompt", capturePrompt);
            window.removeEventListener("appinstalled", markInstalled);
            window.removeEventListener("storage", syncDismissal);
            media?.removeEventListener?.("change", syncDisplay);
        };
    }, [markInstalled]);

    useEffect(() => {
        if (!dismissedUntil) return;
        const timer = window.setTimeout(
            () => {
                setDismissedUntil(0);
                storeDismissal(0);
            },
            Math.max(0, dismissedUntil - Date.now())
        );
        return () => window.clearTimeout(timer);
    }, [dismissedUntil]);

    const requestInstall = async () => {
        if (pending.current || installed || isStandalone()) return;
        setFailed(false);
        const event = promptEvent.current;
        if (!event) {
            setHelpOpen(true);
            return;
        }
        promptEvent.current = null;
        setCanPrompt(false);
        pending.current = true;
        setInstalling(true);
        try {
            const result = await event.prompt();
            const choice = result || (await event.userChoice);
            if (choice.outcome === "accepted") markInstalled();
            else snooze();
        } catch {
            if (!installedHere.current) {
                setFailed(true);
                setHelpOpen(true);
            }
        } finally {
            pending.current = false;
            setInstalling(false);
        }
    };

    return (
        <InstallContext.Provider value={{ installed, installing, canPrompt, snoozed: dismissedUntil > Date.now(), helpOpen, failed, platform, requestInstall, snooze }}>
            {children}
        </InstallContext.Provider>
    );
}

export function useInstallApp() {
    const context = useContext(InstallContext);
    if (!context) throw new Error("InstallProvider is required.");
    return context;
}

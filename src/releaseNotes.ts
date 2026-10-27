import { Language } from "./common/interfaces";

export const releaseNotes: Partial<Record<string, Record<Language, string[]>>> = {
    "2.0.1": {
        ua: [
            "Після входу показується нова версія застосунку та список змін.",
            "Для кожного акаунта повідомлення з’являється один раз на версію.",
            "Вікно оновлень оформлено у стилі Tonality та підтримує світлу й темну теми.",
        ],
        en: [
            "After sign-in, see the new app version and its release notes.",
            "Each account sees the update notice once per version.",
            "The update dialog matches Tonality’s look in both light and dark themes.",
        ],
        de: [
            "Nach der Anmeldung werden die neue App-Version und ihre Änderungen angezeigt.",
            "Jedes Konto sieht den Hinweis einmal pro Version.",
            "Der Update-Dialog passt zum Tonality-Design, sowohl im hellen als auch im dunklen Modus.",
        ],
    },
};

export function getReleaseNotes(version: string, language: Language, fallback: string): string[] {
    return releaseNotes[version]?.[language] ?? [fallback];
}

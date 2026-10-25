import { Language, Translations } from "../common/interfaces";
import de from "./de";
import en from "./en";
import ua from "./ua";

export function normalizeLanguage(language: unknown): Language {
    switch (language) {
        case "ua":
        case "de":
            return language;
        default:
            return "en";
    }
}

export function getLocaleCode(language: unknown): "en" | "de" | "uk" {
    const normalizedLanguage = normalizeLanguage(language);
    return normalizedLanguage === "ua" ? "uk" : normalizedLanguage;
}

export default function getTranslations(language: unknown): Translations {
    const normalizedLanguage = normalizeLanguage(language);

    if (normalizedLanguage === "ua") {
        return ua;
    }

    return normalizedLanguage === "de" ? de : en;
}

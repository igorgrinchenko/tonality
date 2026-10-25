import { describe, expect, it } from "vitest";
import getTranslations, { getLocaleCode, normalizeLanguage } from "./getTranslations";
import en from "./en";
import de from "./de";
import ua from "./ua";

const locales = [
    { language: "en", messages: en },
    { language: "de", messages: de },
    { language: "ua", messages: ua },
];

describe("language preferences", () => {
    it("defaults to English for missing or unsupported saved preferences", () => {
        for (const unsupported of [undefined, null, "", "fr", "DE", false, 7, {}]) {
            expect(normalizeLanguage(unsupported)).toBe("en");
            expect(getTranslations(unsupported)).toBe(en);
            expect(getLocaleCode(unsupported)).toBe("en");
        }
    });

    it.each(locales)("preserves the supported $language preference and selects its dictionary", ({ language, messages }) => {
        expect(normalizeLanguage(language)).toBe(language);
        expect(getTranslations(language)).toBe(messages);
    });

    it("maps the internal Ukrainian preference to the standard document and email locale", () => {
        expect(getLocaleCode("ua")).toBe("uk");
        expect(getLocaleCode("en")).toBe("en");
        expect(getLocaleCode("de")).toBe("de");
    });
});

describe("translation integrity", () => {
    it.each(locales)("provides the complete nonempty message set for $language", ({ messages }) => {
        expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
        for (const [key, value] of Object.entries(messages)) {
            expect(value, `Translation ${key} must be a string`).toBeTypeOf("string");
            expect(value.trim(), `Translation ${key} must not be empty`).not.toBe("");
        }
    });

    it.each(locales)("keeps the resend countdown replaceable in $language", ({ messages }) => {
        expect(messages.VERIFICATION_RESEND_IN.match(/\{seconds\}/g)).toHaveLength(1);
        const countdown = messages.VERIFICATION_RESEND_IN.replace("{seconds}", "42");
        expect(countdown).toContain("42");
        expect(countdown).not.toContain("{seconds}");
    });
});

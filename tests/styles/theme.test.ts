import { describe, expect, it } from "vitest";
import { getContrastRatio } from "@mui/material/styles";
import { createAppTheme } from "../../src/styles/theme";

function styleObject(value: unknown): Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Expected a theme style object");
    }
    return value as Record<string, unknown>;
}

describe.each(["light", "dark"] as const)("%s design system", (mode) => {
    it("keeps ordinary and muted text readable on the surfaces used by cards and results", () => {
        const theme = createAppTheme(mode);
        const baseline = styleObject(theme.components?.MuiCssBaseline?.styleOverrides);
        const tokens = styleObject(baseline[":root"]);
        const surfaces = [
            theme.palette.background.default,
            theme.palette.background.paper,
            String(tokens["--surface-soft"]),
            String(tokens["--surface-raised"]),
            String(tokens["--accent-soft"]),
        ];

        for (const surface of surfaces) {
            expect(getContrastRatio(theme.palette.text.primary, surface), `Primary text on ${surface}`).toBeGreaterThanOrEqual(4.5);
            expect(getContrastRatio(theme.palette.text.secondary, surface), `Secondary text on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
    });

    it("keeps primary action text readable against its accent background", () => {
        const theme = createAppTheme(mode);

        expect(getContrastRatio(theme.palette.primary.contrastText, theme.palette.primary.main)).toBeGreaterThanOrEqual(4.5);
    });

    it("makes outlined input boundaries distinguishable from the surrounding surface", () => {
        const theme = createAppTheme(mode);
        const inputStyles = styleObject(theme.components?.MuiOutlinedInput?.styleOverrides?.root);
        const fieldset = styleObject(inputStyles["& fieldset"]);

        expect(inputStyles.backgroundColor).toBe(theme.palette.background.paper);
        expect(getContrastRatio(String(fieldset.borderColor), theme.palette.background.paper)).toBeGreaterThanOrEqual(3);
    });

    it("shares the same colors and browser color scheme across CSS tokens and MUI components", () => {
        const theme = createAppTheme(mode);
        const baseline = styleObject(theme.components?.MuiCssBaseline?.styleOverrides);
        const tokens = styleObject(baseline[":root"]);
        const body = styleObject(baseline.body);

        expect(theme.palette.mode).toBe(mode);
        expect(tokens.colorScheme).toBe(mode);
        expect(tokens["--bg"]).toBe(theme.palette.background.default);
        expect(tokens["--surface"]).toBe(theme.palette.background.paper);
        expect(tokens["--text"]).toBe(theme.palette.text.primary);
        expect(tokens["--text-secondary"]).toBe(theme.palette.text.secondary);
        expect(tokens["--accent"]).toBe(theme.palette.primary.main);
        expect(tokens["--accent-contrast"]).toBe(theme.palette.primary.contrastText);
        expect(tokens["--border"]).toBe(theme.palette.divider);
        expect(tokens["--danger"]).toBe(theme.palette.error.main);
        expect(body.backgroundColor).toBe(theme.palette.background.default);
        expect(body.color).toBe(theme.palette.text.primary);
    });
});

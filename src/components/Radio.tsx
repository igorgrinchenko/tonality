import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, isLoading } from "../redux/store";
import { setUserData, decodeBase64 } from "../redux/thunks";
import { setPreferences } from "../redux/slice";
import { Language } from "../common/interfaces";
import getTranslations from "../translations/getTranslations";

interface RadioButtonsGroupProps {
    theme: "light" | "dark";
    language: Language;
    isVerified: boolean;
}

export default function RadioButtonsGroup({ theme, language, isVerified }: RadioButtonsGroupProps) {
    const dispatch = useDispatch<AppDispatch>();
    const loading = useSelector(isLoading);
    const lang = getTranslations(language);
    const languages: { value: Language; name: string; code: string }[] = [
        { value: "en", name: "English", code: "EN" },
        { value: "de", name: "Deutsch", code: "DE" },
        { value: "ua", name: "Українська", code: "UK" },
    ];

    const updateSettings = (nextTheme: "light" | "dark", nextLanguage: Language) => {
        if (nextTheme === theme && nextLanguage === language) return;
        localStorage.setItem("theme", nextTheme);
        localStorage.setItem("language", nextLanguage);
        dispatch(setPreferences({ theme: nextTheme, language: nextLanguage }));
        const encodedUID = localStorage.getItem("encodedUID");
        if (encodedUID) {
            dispatch(setUserData({ theme: nextTheme, language: nextLanguage, isVerified, uid: decodeBase64(encodedUID) }));
        }
    };

    return (
        <div className="preferences-controls">
            <div className="preference-section">
                <h3 className="preference-title" id="appearance-label">
                    {lang.MODE}
                </h3>
                <p className="muted preference-help">{lang.APPEARANCE_DESCRIPTION}</p>
                <div className="appearance-options" role="group" aria-labelledby="appearance-label">
                    <Button
                        variant={theme === "light" ? "contained" : "outlined"}
                        startIcon={<LightModeOutlinedIcon />}
                        aria-pressed={theme === "light"}
                        disabled={loading}
                        onClick={() => updateSettings("light", language)}
                    >
                        {lang.LIGHT}
                    </Button>
                    <Button
                        variant={theme === "dark" ? "contained" : "outlined"}
                        startIcon={<DarkModeOutlinedIcon />}
                        aria-pressed={theme === "dark"}
                        disabled={loading}
                        onClick={() => updateSettings("dark", language)}
                    >
                        {lang.DARK}
                    </Button>
                </div>
            </div>
            <FormControl className="preference-section" disabled={loading}>
                <FormLabel id="language-label" className="preference-title">
                    {lang.LANG}
                </FormLabel>
                <p className="muted preference-help">{lang.LANGUAGE_DESCRIPTION}</p>
                <RadioGroup
                    aria-labelledby="language-label"
                    value={language}
                    name="language"
                    onChange={(event) => updateSettings(theme, event.target.value as Language)}
                    className="language-options"
                >
                    {languages.map((option) => (
                        <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={<Radio size="small" />}
                            className={`language-option${language === option.value ? " language-option--selected" : ""}`}
                            label={
                                <span className="language-label">
                                    <span>{option.name}</span>
                                    <span className="language-code">{option.code}</span>
                                </span>
                            }
                        />
                    ))}
                </RadioGroup>
            </FormControl>
        </div>
    );
}

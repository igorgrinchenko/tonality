import React, { ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, user } from "../redux/store";
import { setUserData, decodeBase64 } from "../redux/thunks";
import { darkTheme, lightTheme } from "../styles/colors";
import en from "../translations/en";
import ua from "../translations/ua";
// MUI
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { Box } from "@mui/material";

interface RadioButtonsGroupProps {
    theme: string;
    language: string;
    isVerified: boolean;
    options: { dark: string; light: string; uaLang: string; enLang: string };
}

const RadioButtonsGroup: React.FC<RadioButtonsGroupProps> = ({ theme, language, isVerified, options }) => {
    const dispatch = useDispatch<AppDispatch>();

    const { theme: _theme } = useSelector(user);

    const inlineStyles = {
        color: _theme === "dark" ? lightTheme : darkTheme,
    };
    const lang = language === "ua" ? ua : en;

    const { LANG, MODE, DARK, LIGHT } = lang;
    const { dark, light, uaLang, enLang } = options;

    const changeModeHandler = (event: ChangeEvent<HTMLInputElement>) => {
        const theme: string = event.target.value;
        const encodedUID: string = localStorage.getItem("encodedUID")!;
        const uid: string = decodeBase64(encodedUID);

        dispatch(setUserData({ theme, language, isVerified, uid }));
    };

    const changeLanguageHandler = (event: ChangeEvent<HTMLInputElement>) => {
        const language: string = event.target.value;
        const encodedUID: string = localStorage.getItem("encodedUID")!;
        const uid: string = decodeBase64(encodedUID);

        dispatch(setUserData({ theme, language, isVerified, uid }));
    };

    return (
        <>
            <FormControl sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <Box>
                    <FormLabel sx={inlineStyles} id="demo-radio-buttons-group-label">
                        {MODE}:
                    </FormLabel>
                    <RadioGroup
                        sx={{ display: "flex", flexDirection: "row" }}
                        onChange={changeModeHandler}
                        aria-labelledby="demo-radio-buttons-group-label"
                        value={theme}
                        name="radio-buttons-group"
                    >
                        <FormControlLabel value={dark} control={<Radio />} label={DARK} />
                        <FormControlLabel value={light} control={<Radio />} label={LIGHT} />
                    </RadioGroup>
                </Box>

                <Box>
                    <FormLabel sx={inlineStyles} id="demo-radio-buttons-group-label">
                        {LANG}:
                    </FormLabel>
                    <RadioGroup
                        sx={{ display: "flex", flexDirection: "row" }}
                        onChange={changeLanguageHandler}
                        aria-labelledby="demo-radio-buttons-group-label"
                        value={language}
                        name="radio-buttons-group"
                    >
                        <FormControlLabel value={uaLang} control={<Radio />} label="🇺🇦" />
                        <FormControlLabel value={enLang} control={<Radio />} label="🇺🇸" />
                    </RadioGroup>
                </Box>
            </FormControl>
        </>
    );
};

export default RadioButtonsGroup;

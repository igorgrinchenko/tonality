import React from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { isLoading, isSignedIn, user } from "../redux/store";
// MUI
import { Box } from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import PersonIcon from "@mui/icons-material/Person";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
// Hooks
import useStyles from "../styles/styles";
// Other
import { tonalityPath, tunePath, presetsPath, userPath } from "../routes/routes";
import { active, darkTheme, lightTheme } from "../styles/colors";
import getTranslations from "../translations/getTranslations";

const Footer: React.FC = () => {
    const location = useLocation();
    const { footerWrapper } = useStyles();
    const { theme, language } = useSelector(user);
    const _isSignedIn: boolean = useSelector(isSignedIn);
    const _isLoading: boolean = useSelector(isLoading);
    const lang = getTranslations(language);
    const { TONALITY, TUNE, PRESETS, PROFILE } = lang;

    const inlineStylesFooterIcon = {
        width: "32px !important",
        height: "32px !important",
        color: theme === "dark" ? lightTheme : darkTheme,
    };

    const inlineStylesFooterActiveIcon = {
        width: "32px !important",
        height: "32px !important",
        color: active,
    };

    const inlineStylesFooterWrapper = {
        backgroundColor: theme === "dark" ? darkTheme : lightTheme,
    };

    const setActiveIcon = (path: string) => (path === location.pathname ? inlineStylesFooterActiveIcon : inlineStylesFooterIcon);

    return (
        <Box className={footerWrapper} sx={inlineStylesFooterWrapper} aria-busy={_isLoading}>
            {_isSignedIn && !_isLoading && (
                <>
                    <Link to={tonalityPath} aria-label={TONALITY}>
                        <MusicNoteIcon sx={setActiveIcon(tonalityPath)} />
                    </Link>
                    <Link to={tunePath} aria-label={TUNE}>
                        <FormatUnderlinedIcon sx={setActiveIcon(tunePath)} />
                    </Link>
                    <Link to={presetsPath} aria-label={PRESETS}>
                        <FormatListBulletedIcon sx={setActiveIcon(presetsPath)} />
                    </Link>
                    <Link to={userPath} aria-label={PROFILE}>
                        <PersonIcon sx={setActiveIcon(userPath)} />
                    </Link>
                </>
            )}
        </Box>
    );
};

export default Footer;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { isSignedIn } from "../redux/store";
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
import { user } from "../redux/store";

const Footer: React.FC = () => {
    const location = useLocation();
    const { footerWrapper } = useStyles();
    const { theme } = useSelector(user);
    const _isSignedIn: boolean = useSelector(isSignedIn);

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
        <Box className={footerWrapper} sx={inlineStylesFooterWrapper}>
            <Link to={tonalityPath}>{_isSignedIn && <MusicNoteIcon sx={setActiveIcon(tonalityPath)} />}</Link>
            <Link to={tunePath}>{_isSignedIn && <FormatUnderlinedIcon sx={setActiveIcon(tunePath)} />}</Link>
            <Link to={presetsPath}>{_isSignedIn && <FormatListBulletedIcon sx={setActiveIcon(presetsPath)} />}</Link>
            <Link to={userPath}>{_isSignedIn && <PersonIcon sx={setActiveIcon(userPath)} />}</Link>
        </Box>
    );
};

export default Footer;

import { Link, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { IconButton, Tooltip } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Brand from "./Brand";
import getTranslations from "../translations/getTranslations";
import { AppDispatch, isLoading, isSignedIn, user } from "../redux/store";
import { setPreferences } from "../redux/slice";
import { decodeBase64, setUserData } from "../redux/thunks";
import { authPath, signInPath, signUpPath, verifyEmailPath, tonalityPath, tunePath, presetsPath, userPath } from "../routes/routes";

export default function Header() {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const signedIn = useSelector(isSignedIn);
    const loading = useSelector(isLoading);
    const { theme, language, email, isVerified } = useSelector(user);
    const lang = getTranslations(language);
    const titles: Record<string, string> = {
        [tonalityPath]: lang.TONALITY,
        [tunePath]: lang.TUNE,
        [presetsPath]: lang.PRESETS,
        [userPath]: lang.PROFILE,
        [verifyEmailPath]: lang.VERIFY_EMAIL,
    };
    const showBack = location.pathname === signInPath || location.pathname === signUpPath;

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", nextTheme);
        dispatch(setPreferences({ theme: nextTheme }));
        const encodedUID = localStorage.getItem("encodedUID");
        if (signedIn && encodedUID) {
            dispatch(setUserData({ theme: nextTheme, language, isVerified, uid: decodeBase64(encodedUID) }));
        }
    };

    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="header-start">
                    {showBack && (
                        <IconButton component={Link} to={authPath} aria-label={lang.RETURN_BACK}>
                            <ArrowBackRoundedIcon />
                        </IconButton>
                    )}
                    <div className="header-brand">
                        <Brand />
                    </div>
                    {signedIn && (
                        <div className="header-context">
                            <span>{lang.WORKSPACE}</span>
                            <ChevronRightRoundedIcon aria-hidden="true" />
                            <strong>{titles[location.pathname] || lang.TONALITY}</strong>
                        </div>
                    )}
                </div>
                <div className="header-actions">
                    <span className="header-status">
                        <span aria-hidden="true" />
                        {lang.MUSIC_COMPANION}
                    </span>
                    <Tooltip title={theme === "dark" ? lang.SWITCH_TO_LIGHT : lang.SWITCH_TO_DARK}>
                        <span>
                            <IconButton onClick={toggleTheme} disabled={loading} aria-label={theme === "dark" ? lang.SWITCH_TO_LIGHT : lang.SWITCH_TO_DARK}>
                                {theme === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    {signedIn && (
                        <Link to={userPath} className="header-avatar" aria-label={lang.OPEN_PROFILE}>
                            {email?.charAt(0).toUpperCase() || "T"}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

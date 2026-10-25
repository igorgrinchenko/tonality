import { NavLink } from "react-router";
import { useSelector } from "react-redux";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import Brand from "./Brand";
import { isLoading, isSignedIn, user } from "../redux/store";
import { tonalityPath, tunePath, presetsPath, userPath } from "../routes/routes";
import getTranslations from "../translations/getTranslations";

export default function Footer() {
    const signedIn = useSelector(isSignedIn);
    const loading = useSelector(isLoading);
    const { language } = useSelector(user);
    const lang = getTranslations(language);

    if (!signedIn) return null;

    const items = [
        { path: tonalityPath, label: lang.TONALITY, icon: <MusicNoteRoundedIcon /> },
        { path: tunePath, label: lang.TUNE, icon: <GraphicEqRoundedIcon /> },
        { path: presetsPath, label: lang.PRESETS, icon: <BookmarkBorderRoundedIcon /> },
        { path: userPath, label: lang.PROFILE, icon: <PersonOutlineRoundedIcon /> },
    ];

    return (
        <aside className="app-navigation">
            <div className="sidebar-brand">
                <Brand />
            </div>
            <nav className="nav-links" aria-label={lang.NAVIGATION} aria-busy={loading}>
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}${loading ? " nav-link--disabled" : ""}`}
                        aria-disabled={loading || undefined}
                        tabIndex={loading ? -1 : undefined}
                        onClick={(event) => {
                            if (loading) event.preventDefault();
                        }}
                    >
                        <span className="nav-icon" aria-hidden="true">
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-note">
                <AutoAwesomeOutlinedIcon aria-hidden="true" />
                <p>{lang.APP_TAGLINE}</p>
                <span>Tonality · {lang.MUSIC_COMPANION}</span>
            </div>
        </aside>
    );
}

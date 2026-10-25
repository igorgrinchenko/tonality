import { ReactNode } from "react";
import { useSelector } from "react-redux";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import { user } from "../../redux/store";
import getTranslations from "../../translations/getTranslations";
import "../../styles/auth.css";

interface AuthLayoutProps {
    title: string;
    description: string;
    icon: ReactNode;
    children: ReactNode;
    tone?: "primary" | "success";
}

export default function AuthLayout({ title, description, icon, children, tone = "primary" }: AuthLayoutProps) {
    const { language } = useSelector(user);
    const lang = getTranslations(language);

    return (
        <div className="auth-layout">
            <aside className="auth-story">
                <span className="eyebrow">{lang.AUTH_EYEBROW}</span>
                <p className="auth-story-title">{lang.AUTH_STORY_TITLE}</p>
                <p className="auth-story-description muted">{lang.AUTH_STORY_DESCRIPTION}</p>
                <div className="auth-music-visual" aria-hidden="true">
                    <svg className="auth-staff" viewBox="0 0 440 180" fill="none">
                        <g className="auth-staff-lines">
                            <path d="M24 44H416M24 66H416M24 88H416M24 110H416M24 132H416" />
                        </g>
                        <g className="auth-staff-notes">
                            <ellipse cx="88" cy="132" rx="14" ry="10" transform="rotate(-20 88 132)" />
                            <path d="M100 129V68" />
                            <ellipse cx="184" cy="110" rx="14" ry="10" transform="rotate(-20 184 110)" />
                            <path d="M196 107V46" />
                            <ellipse cx="280" cy="88" rx="14" ry="10" transform="rotate(-20 280 88)" />
                            <path d="M292 85V24" />
                            <ellipse cx="370" cy="66" rx="14" ry="10" transform="rotate(-20 370 66)" />
                            <path d="M382 63V20" />
                        </g>
                    </svg>
                    <div className="auth-note-labels">
                        <span>C</span>
                        <span>D</span>
                        <span>E</span>
                        <span>G</span>
                    </div>
                </div>
                <ul className="auth-feature-list">
                    <li>
                        <PianoRoundedIcon />
                        {lang.FEATURE_KEYS}
                    </li>
                    <li>
                        <HeadphonesRoundedIcon />
                        {lang.FEATURE_LISTEN}
                    </li>
                    <li>
                        <BookmarkBorderRoundedIcon />
                        {lang.FEATURE_SAVE}
                    </li>
                </ul>
            </aside>
            <section className="surface-card auth-card" aria-labelledby="auth-title">
                <div className="auth-card-heading">
                    <div className={`icon-tile auth-card-icon${tone === "success" ? " auth-card-icon-success" : ""}`} aria-hidden="true">
                        {icon}
                    </div>
                    <h1 id="auth-title">{title}</h1>
                    <p className="muted">{description}</p>
                </div>
                {children}
            </section>
        </div>
    );
}

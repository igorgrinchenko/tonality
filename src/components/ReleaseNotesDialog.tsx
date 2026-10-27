import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Dialog, DialogActions, DialogContent, IconButton } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import { isSignedIn, user } from "../redux/store";
import getTranslations from "../translations/getTranslations";
import appVersion from "../app_version.json";
import { getReleaseNotes } from "../releaseNotes";
import { auth } from "../firebase";
import "../styles/release-notes.css";

export default function ReleaseNotesDialog() {
    const signedIn = useSelector(isSignedIn);
    const { email, language } = useSelector(user);
    const lang = getTranslations(language);
    const [open, setOpen] = useState(false);
    const accountKey = auth.currentUser?.uid || email?.toLowerCase();
    const storageKey = accountKey ? `tonality:last-seen-version:${accountKey}` : null;
    const notes = getReleaseNotes(appVersion.version, language, lang.RELEASE_NOTES_MINOR_CHANGES);

    useEffect(() => {
        if (!signedIn || !storageKey) {
            setOpen(false);
            return;
        }

        setOpen(localStorage.getItem(storageKey) !== appVersion.version);
    }, [signedIn, storageKey]);

    const close = () => {
        if (storageKey) localStorage.setItem(storageKey, appVersion.version);
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onClose={close}
            maxWidth="sm"
            fullWidth
            scroll="paper"
            aria-labelledby="release-notes-title"
            aria-describedby="release-notes-description"
            className="release-notes-dialog"
        >
            <div className="release-notes-header">
                <div className="release-notes-brand" aria-hidden="true">
                    <span className="brand-mark">
                        <MusicNoteRoundedIcon />
                    </span>
                    <span className="brand-name">
                        tonality<span className="brand-dot">.</span>
                    </span>
                </div>
                <svg className="release-notes-staff" viewBox="0 0 150 64" fill="none" aria-hidden="true" focusable="false">
                    <path className="release-notes-staff-lines" d="M4 20H146M4 28H146M4 36H146M4 44H146M4 52H146" />
                    <g className="release-notes-staff-notes">
                        <ellipse cx="35" cy="44" rx="6" ry="4" transform="rotate(-20 35 44)" />
                        <path d="M40 42V15" />
                        <ellipse cx="78" cy="36" rx="6" ry="4" transform="rotate(-20 78 36)" />
                        <path d="M83 34V7" />
                        <ellipse cx="121" cy="28" rx="6" ry="4" transform="rotate(-20 121 28)" />
                        <path d="M126 26V3" />
                    </g>
                </svg>
                <IconButton className="release-notes-close" aria-label={lang.CLOSE} onClick={close}>
                    <CloseRoundedIcon />
                </IconButton>
                <span className="release-notes-version">
                    <span className="release-notes-version-dot" aria-hidden="true" />
                    {lang.VERSION} {appVersion.version}
                </span>
                <h2 id="release-notes-title">{lang.UPDATE_AVAILABLE}</h2>
                <p id="release-notes-description">{lang.RELEASE_NOTES_DESCRIPTION}</p>
            </div>
            <DialogContent className="release-notes-content">
                <section className="release-notes-changes" aria-labelledby="release-notes-changes-title">
                    <h3 id="release-notes-changes-title">{lang.RELEASE_NOTES_HEADING}</h3>
                    <ul className="release-notes-list" role="list">
                        {notes.map((note) => (
                            <li key={note}>
                                <span className="release-notes-check" aria-hidden="true">
                                    <CheckRoundedIcon />
                                </span>
                                <p>{note}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </DialogContent>
            <DialogActions className="release-notes-actions">
                <Button variant="contained" fullWidth onClick={close} endIcon={<ArrowForwardRoundedIcon />}>
                    {lang.RELEASE_NOTES_CLOSE}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import PageHeading from "../PageHeading";
import { AppDispatch, isLoading, user } from "../../redux/store";
import { decodeBase64, deletePresets } from "../../redux/thunks";
import { Presets as IPreset } from "../../redux/interfaces";
import { tonalityPath } from "../../routes/routes";
import getTranslations from "../../translations/getTranslations";
import "../../styles/pages.css";

const Presets: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { presets, language } = useSelector(user);
    const busy = useSelector(isLoading);
    const lang = getTranslations(language);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<{ preset: IPreset; index: number } | null>(null);
    const [playbackError, setPlaybackError] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        return () => audio?.pause();
    }, []);

    const togglePlayback = async (preset: IPreset, index: number) => {
        const audio = audioRef.current;
        if (!audio || !preset.audioPath) {
            return;
        }
        setPlaybackError(false);
        if (activeIndex === index) {
            audio.pause();
            audio.currentTime = 0;
            setActiveIndex(null);
            return;
        }
        audio.pause();
        audio.src = preset.audioPath;
        setActiveIndex(index);
        setLoadingIndex(index);
        try {
            await audio.play();
        } catch {
            setActiveIndex(null);
            setPlaybackError(true);
        } finally {
            setLoadingIndex(null);
        }
    };

    const deletePreset = async () => {
        const encodedUID = localStorage.getItem("encodedUID");
        if (!selectedPreset || !encodedUID) {
            return;
        }
        const presetToDelete = selectedPreset;
        setSelectedPreset(null);
        const result = await dispatch(deletePresets({ presetId: presetToDelete.preset.presetId, uid: decodeBase64(encodedUID) }));
        if (!deletePresets.fulfilled.match(result)) {
            return;
        }
        if (activeIndex === presetToDelete.index) {
            audioRef.current?.pause();
            setActiveIndex(null);
        } else if (activeIndex !== null && activeIndex > presetToDelete.index) {
            setActiveIndex(activeIndex - 1);
        }
    };

    return (
        <div className="page presets-page">
            <PageHeading
                eyebrow={lang.PRESETS}
                title={lang.PRESETS_TITLE}
                description={lang.PRESETS_DESCRIPTION}
                action={
                    presets.length > 0 ? (
                        <Button component={Link} to={tonalityPath} variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
                            {lang.FIND_A_KEY}
                        </Button>
                    ) : undefined
                }
            />
            <audio ref={audioRef} loop preload="none" />
            {playbackError && <Alert severity="error">{lang.PLAYBACK_ERROR}</Alert>}
            {presets.length === 0 ? (
                <section className="surface-card presets-empty" aria-labelledby="empty-presets-title">
                    <span className="empty-presets-icon" aria-hidden="true">
                        <BookmarkBorderRoundedIcon />
                    </span>
                    <h2 id="empty-presets-title">{lang.EMPTY_PRESETS_TITLE}</h2>
                    <p className="muted">{lang.EMPTY_PRESETS_DESCRIPTION}</p>
                    <Button component={Link} to={tonalityPath} variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
                        {lang.FIND_A_KEY}
                    </Button>
                </section>
            ) : (
                <section className="surface-card presets-card" aria-labelledby="saved-keys-title">
                    <div className="saved-keys-heading">
                        <h2 id="saved-keys-title">{lang.SAVED_KEYS}</h2>
                        <span className="saved-keys-count">{presets.length}</span>
                    </div>
                    <ul className="preset-list">
                        {presets.map((preset, index) => (
                            <li className={`preset-row${activeIndex === index ? " preset-row-playing" : ""}`} key={`${preset.presetId}-${index}`}>
                                <span className="preset-order" aria-hidden="true">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div className="preset-name">
                                    <h3>{preset.presetName || lang.PRESET_NAME}</h3>
                                    {activeIndex === index && <span className="preset-playing-label">{lang.AUDIO_PLAYING}</span>}
                                </div>
                                <span className="preset-key">{preset.presetValue || "—"}</span>
                                <div className="preset-actions">
                                    <IconButton
                                        className="preset-play-button"
                                        aria-label={`${activeIndex === index ? lang.STOP : lang.PLAY} ${preset.presetName || ""}`}
                                        aria-pressed={activeIndex === index}
                                        disabled={loadingIndex !== null || !preset.audioPath}
                                        onClick={() => togglePlayback(preset, index)}
                                    >
                                        {loadingIndex === index ? <CircularProgress size={20} /> : activeIndex === index ? <StopRoundedIcon /> : <PlayArrowRoundedIcon />}
                                    </IconButton>
                                    <IconButton
                                        className="preset-delete-button"
                                        aria-label={`${lang.DELETE} ${preset.presetName || ""}`}
                                        disabled={busy || loadingIndex !== null}
                                        onClick={() => setSelectedPreset({ preset, index })}
                                    >
                                        <DeleteOutlineRoundedIcon />
                                    </IconButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            <Dialog
                className="preset-dialog"
                open={selectedPreset !== null}
                onClose={() => setSelectedPreset(null)}
                maxWidth="xs"
                fullWidth
                scroll="paper"
                aria-labelledby="delete-preset-title"
                aria-describedby="delete-preset-description"
            >
                <DialogTitle id="delete-preset-title">{lang.PRESET_DELETE_TITLE}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-preset-description">
                        {lang.DELETE_PRESET_CONFIRM_TEXT} <strong className="dialog-preset-name">“{selectedPreset?.preset.presetName}”</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setSelectedPreset(null)}>
                        {lang.CANCEL}
                    </Button>
                    <Button variant="contained" color="error" disabled={busy || loadingIndex !== null} onClick={deletePreset}>
                        {lang.DELETE}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Presets;

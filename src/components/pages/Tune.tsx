import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, CircularProgress, Slider } from "@mui/material";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import VolumeDownRoundedIcon from "@mui/icons-material/VolumeDownRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import PageHeading from "../PageHeading";
import { user } from "../../redux/store";
import getTranslations from "../../translations/getTranslations";
import forkSound from "../../audio/fork_sound.mp3";
import "../../styles/pages.css";

const Tune: React.FC = () => {
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playbackRequest = useRef(0);
    const [playing, setPlaying] = useState(false);
    const [starting, setStarting] = useState(false);
    const [volume, setVolume] = useState(30);
    const [playbackError, setPlaybackError] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            playbackRequest.current += 1;
            audio?.pause();
        };
    }, []);

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }
        setPlaybackError(false);
        if (playing || starting) {
            playbackRequest.current += 1;
            audio.pause();
            audio.currentTime = 0;
            setPlaying(false);
            setStarting(false);
            return;
        }
        const request = ++playbackRequest.current;
        setStarting(true);
        try {
            await audio.play();
            if (request === playbackRequest.current) setPlaying(true);
        } catch {
            if (request === playbackRequest.current) {
                setPlaying(false);
                setPlaybackError(true);
            }
        } finally {
            if (request === playbackRequest.current) setStarting(false);
        }
    };

    return (
        <div className="page tune-page">
            <PageHeading eyebrow={lang.TUNE} title={lang.TUNE_TITLE} description={lang.TUNE_DESCRIPTION} />
            <div className="tune-grid">
                <section className="surface-card reference-card" aria-label={lang.REFERENCE_TONE}>
                    <span className="eyebrow">{lang.REFERENCE_TONE}</span>
                    <div className={`fork-illustration${playing ? " fork-illustration-playing" : ""}`} aria-hidden="true">
                        <svg viewBox="0 0 260 260" fill="none">
                            <circle cx="130" cy="130" r="112" className="fork-outer-ring" />
                            <circle cx="130" cy="130" r="86" className="fork-inner-ring" />
                            <path d="M96 47v84a34 34 0 0 0 68 0V47M130 166v50" className="fork-shape" />
                            <path d="M70 68a74 74 0 0 0 0 63M190 68a74 74 0 0 1 0 63" className="fork-sound-wave" />
                            <circle cx="130" cy="219" r="10" className="fork-tip" />
                        </svg>
                    </div>
                    <div className="reference-pitch">
                        <span className="pitch-note">A</span>
                        <span className="pitch-frequency">
                            440 <span>Hz</span>
                        </span>
                    </div>
                    <p className="muted">{lang.STANDARD_PITCH}</p>
                </section>
                <section className="surface-card tune-control-card" aria-labelledby="tone-controls-title">
                    <div className="section-header">
                        <span className="icon-tile">
                            <GraphicEqRoundedIcon />
                        </span>
                        <div>
                            <h2 id="tone-controls-title">{lang.REFERENCE_TONE}</h2>
                            <p className="muted">{lang.LISTEN_DESCRIPTION}</p>
                        </div>
                    </div>
                    <audio ref={audioRef} src={forkSound} preload="none" onEnded={() => setPlaying(false)} />
                    <div className={`status-pill tone-status${playing ? " tone-status-playing" : ""}`} role="status">
                        <span className="status-dot" />
                        {starting ? lang.LOADING : playing ? lang.AUDIO_PLAYING : lang.AUDIO_READY}
                    </div>
                    <Button
                        fullWidth
                        variant="contained"
                        className="tone-play-button"
                        startIcon={starting ? <CircularProgress size={18} color="inherit" /> : playing ? <StopRoundedIcon /> : <PlayArrowRoundedIcon />}
                        onClick={togglePlayback}
                        aria-pressed={playing || starting}
                        aria-busy={starting}
                    >
                        {playing || starting ? lang.STOP : lang.PLAY}
                    </Button>
                    <div className="volume-control">
                        <div className="volume-heading">
                            <label id="tone-volume-label">{lang.VOLUME}</label>
                            <output>{volume}%</output>
                        </div>
                        <div className="volume-slider-row">
                            <VolumeDownRoundedIcon aria-hidden="true" />
                            <Slider
                                aria-labelledby="tone-volume-label"
                                value={volume}
                                onChange={(_event, value) => setVolume(Array.isArray(value) ? value[0] : value)}
                                valueLabelDisplay="auto"
                                getAriaValueText={(value) => `${value}%`}
                            />
                            <VolumeUpRoundedIcon aria-hidden="true" />
                        </div>
                        <p className="muted volume-help">{lang.DEVICE_VOLUME_HINT}</p>
                    </div>
                    {playbackError && <Alert severity="error">{lang.PLAYBACK_ERROR}</Alert>}
                    <div className="tune-hint">
                        <InfoOutlinedIcon aria-hidden="true" />
                        <p>{lang.TUNE_HINT}</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Tune;

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import PageHeading from "../PageHeading";
import { AppDispatch, isLoading, user } from "../../redux/store";
import { decodeBase64, setPresets } from "../../redux/thunks";
import { Alteration, Mode } from "../../common/types";
import getTranslations from "../../translations/getTranslations";
import "../../styles/pages.css";
import C from "../../audio/major/C.mp3";
import G from "../../audio/major/G.mp3";
import D from "../../audio/major/D.mp3";
import A from "../../audio/major/A.mp3";
import E from "../../audio/major/E.mp3";
import B from "../../audio/major/B.mp3";
import Fd_Gb from "../../audio/major/Fd_Gb.mp3";
import Db_Cd from "../../audio/major/Db_Cd.mp3";
import Ab_Gd from "../../audio/major/Ab_Gd.mp3";
import Eb_Dd from "../../audio/major/Eb_Dd.mp3";
import Bb_Ad from "../../audio/major/Bb_Ad.mp3";
import F from "../../audio/major/F.mp3";
import Cm from "../../audio/minor/Cm.mp3";
import Gm from "../../audio/minor/Gm.mp3";
import Dm from "../../audio/minor/Dm.mp3";
import Am from "../../audio/minor/Am.mp3";
import Em from "../../audio/minor/Em.mp3";
import Bm from "../../audio/minor/Bm.mp3";
import Fdm_Gbm from "../../audio/minor/Fdm_Gbm.mp3";
import Dbm_Cdm from "../../audio/minor/Dbm_Cdm.mp3";
import Abm_Gdm from "../../audio/minor/Abm_Gdm.mp3";
import Ebm_Ddm from "../../audio/minor/Ebm_Ddm.mp3";
import Bbm_Adm from "../../audio/minor/Bbm_Adm.mp3";
import Fm from "../../audio/minor/Fm.mp3";

const audioPaths: Record<string, string> = {
    C,
    G,
    D,
    A,
    E,
    B,
    "F#/Gb": Fd_Gb,
    "Db/C#": Db_Cd,
    "Ab/G#": Ab_Gd,
    "Eb/D#": Eb_Dd,
    "Bb/A#": Bb_Ad,
    F,
    Cm,
    Gm,
    Dm,
    Am,
    Em,
    Bm,
    "F#m/Gbm": Fdm_Gbm,
    "Dbm/C#m": Dbm_Cdm,
    "Abm/G#m": Abm_Gdm,
    "Ebm/D#m": Ebm_Ddm,
    "Bbm/A#m": Bbm_Adm,
    Fm,
};

type KeyMode = Exclude<Mode, "">;

const Tonality: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { language } = useSelector(user);
    const busy = useSelector(isLoading);
    const lang = getTranslations(language);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playbackRequest = useRef(0);
    const [count, setCount] = useState("");
    const [alteration, setAlteration] = useState<Alteration>("");
    const [mode, setMode] = useState<KeyMode>("major");
    const [resultMode, setResultMode] = useState<KeyMode>("major");
    const [tonality, setTonality] = useState("");
    const [audioPath, setAudioPath] = useState("");
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audioStarting, setAudioStarting] = useState(false);
    const [playbackError, setPlaybackError] = useState(false);
    const [presetName, setPresetName] = useState("");
    const canDetermine = count !== "" && (count === "0" || alteration !== "");
    const canSave = Boolean(presetName.trim() && tonality && audioPath) && !busy;
    const countLabels = [lang.ZERO, lang.ONE, lang.TWO, lang.THREE, lang.FOUR, lang.FIVE, lang.SIX, lang.SEVEN];

    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            playbackRequest.current += 1;
            audio?.pause();
        };
    }, []);

    const determineKey = () => {
        const circleOfFifths = [
            { note: "C", enharmonic: null },
            { note: "G", enharmonic: null },
            { note: "D", enharmonic: null },
            { note: "A", enharmonic: null },
            { note: "E", enharmonic: null },
            { note: "B", enharmonic: null },
            { note: "F#", enharmonic: "Gb" },
            { note: "Db", enharmonic: "C#" },
            { note: "Ab", enharmonic: "G#" },
            { note: "Eb", enharmonic: "D#" },
            { note: "Bb", enharmonic: "A#" },
            { note: "F", enharmonic: null },
        ];
        let tonicIndex = alteration === "b" ? -Number(count) : alteration === "#" ? Number(count) : 0;
        if (mode === "minor") {
            tonicIndex += 3;
        }
        tonicIndex = (tonicIndex + circleOfFifths.length) % circleOfFifths.length;
        const selectedNote = circleOfFifths[tonicIndex];
        const suffix = mode === "minor" ? "m" : "";
        const result = selectedNote.enharmonic ? `${selectedNote.note}${suffix}/${selectedNote.enharmonic}${suffix}` : `${selectedNote.note}${suffix}`;

        playbackRequest.current += 1;
        audioRef.current?.pause();
        setAudioPlaying(false);
        setAudioStarting(false);
        setPlaybackError(false);
        setTonality(result);
        setResultMode(mode);
        setAudioPath(audioPaths[result] || "");
    };

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio || !audioPath) {
            return;
        }
        setPlaybackError(false);
        if (audioPlaying || audioStarting) {
            playbackRequest.current += 1;
            audio.pause();
            audio.currentTime = 0;
            setAudioPlaying(false);
            setAudioStarting(false);
            return;
        }
        const request = ++playbackRequest.current;
        setAudioStarting(true);
        try {
            await audio.play();
            if (request === playbackRequest.current) setAudioPlaying(true);
        } catch {
            if (request === playbackRequest.current) {
                setAudioPlaying(false);
                setPlaybackError(true);
            }
        } finally {
            if (request === playbackRequest.current) setAudioStarting(false);
        }
    };

    const savePreset = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const encodedUID = localStorage.getItem("encodedUID");
        if (!canSave || !encodedUID) {
            return;
        }
        dispatch(setPresets({ presetName: presetName.trim(), presetValue: tonality, audioPath, uid: decodeBase64(encodedUID) }));
    };

    return (
        <div className="page tonality-page">
            <PageHeading eyebrow={lang.TONALITY} title={lang.TONALITY_TITLE} description={lang.TONALITY_DESCRIPTION} />
            <div className="tonality-grid">
                <section className="surface-card signature-card" aria-labelledby="signature-title">
                    <div className="section-header">
                        <span className="icon-tile">
                            <TuneRoundedIcon />
                        </span>
                        <div>
                            <h2 id="signature-title">{lang.FILTERS}</h2>
                            <p className="muted">{lang.FILTERS_DESCRIPTION}</p>
                        </div>
                    </div>
                    <FormControl fullWidth>
                        <InputLabel id="accidental-count-label">{lang.SELECT_COUNT_OF_ALTERATION}</InputLabel>
                        <Select
                            labelId="accidental-count-label"
                            id="accidental-count"
                            label={lang.SELECT_COUNT_OF_ALTERATION}
                            value={count}
                            onChange={(event) => {
                                setCount(event.target.value);
                                if (event.target.value === "0") {
                                    setAlteration("");
                                }
                            }}
                        >
                            {countLabels.map((label, value) => (
                                <MenuItem key={value} value={String(value)}>
                                    {value} · {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <div className="key-field">
                        <span className="key-field-label" id="accidental-type-label">
                            {lang.ACCIDENTALS}
                        </span>
                        <ToggleButtonGroup
                            className="key-toggle-group"
                            exclusive
                            value={alteration}
                            disabled={count === "" || count === "0"}
                            onChange={(_event, value: Alteration | null) => setAlteration(value || "")}
                            aria-labelledby="accidental-type-label"
                        >
                            <ToggleButton value="b" aria-label={lang.FLATS}>
                                <span className="accidental-symbol" aria-hidden="true">
                                    ♭
                                </span>
                                {lang.FLATS}
                            </ToggleButton>
                            <ToggleButton value="#" aria-label={lang.SHARPS}>
                                <span className="accidental-symbol" aria-hidden="true">
                                    ♯
                                </span>
                                {lang.SHARPS}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    <div className="key-field">
                        <span className="key-field-label" id="key-mode-label">
                            {lang.KEY_MODE}
                        </span>
                        <ToggleButtonGroup
                            className="key-toggle-group"
                            exclusive
                            value={mode}
                            onChange={(_event, value: KeyMode | null) => value && setMode(value)}
                            aria-labelledby="key-mode-label"
                        >
                            <ToggleButton value="major">{lang.MAJOR}</ToggleButton>
                            <ToggleButton value="minor">{lang.MINOR}</ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    <Button className="determine-button" fullWidth variant="contained" endIcon={<ArrowForwardRoundedIcon />} disabled={!canDetermine} onClick={determineKey}>
                        {lang.DETERMINE}
                    </Button>
                </section>
                <div className="tonality-aside">
                    <section className="surface-card result-card" aria-labelledby="result-title">
                        <h2 className="result-title" id="result-title">
                            {lang.RESULT_LABEL}
                        </h2>
                        <div className="result-preview" aria-live="polite" aria-atomic="true">
                            <div className={`result-key${tonality.length > 4 ? " result-key-long" : ""}`}>{tonality || "—"}</div>
                            <p className="result-mode">{tonality ? (resultMode === "major" ? lang.MAJOR : lang.MINOR) : lang.RESULT_EMPTY_TITLE}</p>
                            <p className="muted result-description">{tonality ? lang.LISTEN_DESCRIPTION : lang.RESULT_EMPTY_DESCRIPTION}</p>
                        </div>
                        <audio ref={audioRef} src={audioPath || undefined} preload="none" onEnded={() => setAudioPlaying(false)} />
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={audioStarting ? <CircularProgress size={18} color="inherit" /> : audioPlaying ? <StopRoundedIcon /> : <PlayArrowRoundedIcon />}
                            disabled={!audioPath}
                            onClick={togglePlayback}
                            aria-pressed={audioPlaying || audioStarting}
                            aria-busy={audioStarting}
                        >
                            {audioPlaying || audioStarting ? lang.STOP : lang.PLAY}
                        </Button>
                        {playbackError && <Alert severity="error">{lang.PLAYBACK_ERROR}</Alert>}
                    </section>
                    <form className="surface-card save-key-card" onSubmit={savePreset}>
                        <div className="section-header">
                            <span className="icon-tile">
                                <BookmarkAddOutlinedIcon />
                            </span>
                            <div>
                                <h2>{lang.SAVE_PRESET}</h2>
                                <p className="muted">{lang.SAVE_DESCRIPTION}</p>
                            </div>
                        </div>
                        <TextField
                            fullWidth
                            id="preset-name"
                            label={lang.PRESET_NAME}
                            value={presetName}
                            onChange={(event) => setPresetName(event.target.value)}
                            helperText={lang.PRESET_NAME_HINT}
                            autoComplete="off"
                        />
                        <Button fullWidth type="submit" variant="contained" disabled={!canSave} startIcon={<BookmarkAddOutlinedIcon />}>
                            {lang.SAVE_PRESET}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Tonality;

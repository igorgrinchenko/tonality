import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import { setPresets, decodeBase64 } from "../../redux/thunks";
// MUI
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Typography, Button, CircularProgress, TextField } from "@mui/material";
// Components
import IOSSwitch from "../IOsSwitch";
// Other
import useStyles from "../../styles/styles";
import en from "../../translations/en";
import ua from "../../translations/ua";
import { CharactersCountOptions } from "../../common/interfaces";
import { Alteration, Mode } from "../../common/types";
import { user } from "../../redux/store";
import { darkTheme, lightTheme } from "../../styles/colors";
// Audio
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

const Tonality: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const [count, setCount] = useState<string>("");
    const [tonality, setTonality] = useState<string>("--");
    const [isDisabledSwitch, setIsDisabledSwitch] = useState<boolean>(true);
    const [isDisabledDetermineBtn, setIsDisabledDetermineBtn] = useState<boolean>(true);
    const [isDisabledSavePresetBtn, setIsDisabledSavePresetBtn] = useState<boolean>(true);

    const [isLocalLoader, setIsLocalLoader] = useState<boolean>(false);
    const [presetName, setPresetName] = useState<string>("");

    const [isFlat, setIsFlat] = useState<boolean>(false);
    const [isSharp, setIsSharp] = useState<boolean>(false);
    const [isMinor, setIsMinor] = useState<boolean>(false);
    const [isMajor, setIsMajor] = useState<boolean>(true);

    const [audioPath, setAudioPath] = useState<string>("");
    const [audioState, setAudioState] = useState<boolean>(false);

    const { theme, language } = useSelector(user);
    const lang = language === "ua" ? ua : en;

    const inlineStyles = {
        boxShadow: `0 0 5px ${theme === "dark" ? lightTheme : darkTheme}`,
    };

    const { tonalityClass, tonalityWrapper, select, tonalitySwitch, tonalitySwitchWrapper, tonalityRow, tonalityDisabledButton, input } = useStyles();
    const { SELECT_COUNT_OF_ALTERATION, ZERO, ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, MAJOR, MINOR, DETERMINE, FILTERS, OUTPUT, SAVE_PRESET, PLAY, STOP, PRESET_NAME } = lang;

    const options: CharactersCountOptions[] = [
        { value: 0, label: ZERO },
        { value: 1, label: ONE },
        { value: 2, label: TWO },
        { value: 3, label: THREE },
        { value: 4, label: FOUR },
        { value: 5, label: FIVE },
        { value: 6, label: SIX },
        { value: 7, label: SEVEN },
    ];

    const audioPaths = {
        C: C,
        G: G,
        D: D,
        A: A,
        E: E,
        B: B,
        "F#/Gb": Fd_Gb,
        "Db/C#": Db_Cd,
        "Ab/G#": Ab_Gd,
        "Eb/D#": Eb_Dd,
        "Bb/A#": Bb_Ad,
        F: F,
        Cm: Cm,
        Gm: Gm,
        Dm: Dm,
        Am: Am,
        Em: Em,
        Bm: Bm,
        "F#m/Gbm": Fdm_Gbm,
        "Dbm/C#m": Dbm_Cdm,
        "Abm/G#m": Abm_Gdm,
        "Ebm/D#m": Ebm_Ddm,
        "Bbm/A#m": Bbm_Adm,
        Fm: Fm,
    };

    useEffect(() => setAudioStatus(), [audioPath, audioState]);

    useEffect(() => setAlterationSwitchStatus(), [count]);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (audioElement) {
            const handleAudioEnd = () => {
                setAudioState(false);
            };

            audioElement.addEventListener("ended", handleAudioEnd);

            return () => {
                audioElement.removeEventListener("ended", handleAudioEnd);
            };
        }
    }, []);

    useEffect(() => {
        if (presetName && tonality !== "--") {
            setIsDisabledSavePresetBtn(false);
        } else {
            setIsDisabledSavePresetBtn(true);
        }
    }, [presetName, tonality]);

    useEffect(() => {
        if (count && (isFlat || isSharp)) {
            setIsDisabledDetermineBtn(false);
        } else if (String(count) === "0") {
            setIsDisabledDetermineBtn(false);
        } else {
            setIsDisabledDetermineBtn(true);
        }
    }, [count, isFlat, isSharp]);

    const setAudioStatus = (): void => {
        if (audioState) {
            audioRef.current.play();
        } else {
            audioRef.current.load();
        }
    };

    const setIsFlatActive = (): void => {
        setIsFlat(true);
        setIsSharp(false);

        if (isFlat && !isSharp) {
            setIsFlat(false);
        }
    };

    const setIsSharpActive = (): void => {
        setIsFlat(false);
        setIsSharp(true);
        if (!isFlat && isSharp) {
            setIsSharp(false);
        }
    };

    const setIsMinorActive = (): void => {
        setIsMinor(true);
        setIsMajor(false);
    };

    const setIsMajorActive = (): void => {
        setIsMinor(false);
        setIsMajor(true);
    };

    const setAlterationSwitchStatus = (): void => {
        if (count) {
            setIsDisabledSwitch(false);
        } else {
            setIsDisabledSwitch(true);
            setIsFlat(false);
            setIsSharp(false);
        }
    };

    const setAlteration = () => {
        if (isFlat) {
            return "b";
        } else if (isSharp) {
            return "#";
        } else {
            return "";
        }
    };

    const setMode = () => {
        if (isMajor) {
            return "major";
        } else if (isMinor) {
            return "minor";
        } else {
            return "";
        }
    };

    const getTonicWithEnharmonics = (alterationCount: number, alteration: Alteration, mode: Mode): void => {
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

        let tonicIndex = 0;

        if (alteration === "b") {
            tonicIndex -= alterationCount;
        } else if (alteration === "#") {
            tonicIndex += alterationCount;
        }

        if (mode === "minor") {
            tonicIndex += 3;
        }

        tonicIndex = (tonicIndex + circleOfFifths.length) % circleOfFifths.length;

        const selectedNote = circleOfFifths[tonicIndex];

        let result = "";

        if (selectedNote.enharmonic) {
            if (mode === "minor") {
                result = `${selectedNote.note}m/${selectedNote.enharmonic}m`;
            } else {
                result = `${selectedNote.note}/${selectedNote.enharmonic}`;
            }
        } else {
            if (mode === "minor") {
                result = `${selectedNote.note}m`;
            } else {
                result = `${selectedNote.note}`;
            }
        }

        Object.keys(audioPaths).forEach((path, index) => {
            if (result === path) {
                setAudioPath(Object.values(audioPaths)[index]);
            }
        });

        setTonality(result);
        setIsLocalLoader(true);
        setTimeout(() => setIsLocalLoader(false), 800);
    };

    const handleChange = (event: SelectChangeEvent<string>): void => {
        setCount(event.target.value);
    };

    const handleChangePresetName = (event: ChangeEvent<HTMLInputElement>): void => {
        setPresetName(event.target.value);
    };

    const handleSavePreset = (): void => {
        const encodedUID: string = localStorage.getItem("encodedUID")!;
        const uid: string = decodeBase64(encodedUID);
        dispatch(setPresets({ presetName, presetValue: tonality, audioPath, uid }));
    };

    return (
        <Box className={tonalityClass}>
            <Box className={tonalityWrapper} sx={inlineStyles}>
                <Typography align="center" variant="h6">
                    {FILTERS.toUpperCase()}
                </Typography>
                <FormControl fullWidth required variant="filled">
                    <InputLabel id="demo-simple-select-required-label">{SELECT_COUNT_OF_ALTERATION}</InputLabel>
                    <Select className={select} labelId="demo-simple-select-required-label" id="demo-simple-select-required" value={count} onChange={handleChange}>
                        {options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box className={tonalityRow}>
                    <Box className={tonalitySwitchWrapper}>
                        <Box className={tonalitySwitch}>
                            <IOSSwitch checked={isFlat} onChange={setIsFlatActive} isDisabledSwitch={isDisabledSwitch} />
                            <Typography variant="body1">♭</Typography>
                        </Box>
                        <Box className={tonalitySwitch}>
                            <IOSSwitch checked={isSharp} onChange={setIsSharpActive} isDisabledSwitch={isDisabledSwitch} />
                            <Typography variant="body1">#</Typography>
                        </Box>
                    </Box>
                    <Box className={tonalitySwitchWrapper}>
                        <Box className={tonalitySwitch}>
                            <IOSSwitch checked={isMinor} onChange={setIsMinorActive} />
                            <Typography variant="body1">{MINOR}</Typography>
                        </Box>
                        <Box className={tonalitySwitch}>
                            <IOSSwitch checked={isMajor} onChange={setIsMajorActive} />
                            <Typography variant="body1">{MAJOR}</Typography>
                        </Box>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    disabled={isDisabledDetermineBtn}
                    className={isDisabledDetermineBtn ? tonalityDisabledButton : ""}
                    onClick={() => getTonicWithEnharmonics(Number(count), setAlteration(), setMode())}
                >
                    {DETERMINE}
                </Button>
            </Box>

            <Box className={tonalityWrapper} sx={inlineStyles}>
                <Typography align="center" variant="h6">
                    {OUTPUT.toUpperCase()}
                </Typography>
                <Typography align="center" variant="h3">
                    {isLocalLoader ? <CircularProgress /> : tonality}
                </Typography>
                <audio ref={audioRef}>
                    <source src={audioPath} type="audio/mp3"></source>
                </audio>
                <Button onClick={() => setAudioState(!audioState)} variant="contained" disabled={Boolean(!audioPath)} className={!audioPath ? tonalityDisabledButton : ""}>
                    {audioState ? STOP : PLAY}
                </Button>
            </Box>

            <Box className={tonalityWrapper} sx={inlineStyles}>
                <Typography align="center" variant="h6">
                    {SAVE_PRESET.toUpperCase()}
                </Typography>
                <TextField fullWidth className={input} id="filled-basic" label={PRESET_NAME} variant="filled" onChange={handleChangePresetName} />
                <Button variant="contained" disabled={isDisabledSavePresetBtn} className={isDisabledSavePresetBtn ? tonalityDisabledButton : ""} onClick={handleSavePreset}>
                    {SAVE_PRESET}
                </Button>
            </Box>
        </Box>
    );
};

export default Tonality;

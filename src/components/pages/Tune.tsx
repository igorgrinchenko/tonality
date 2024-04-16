import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
// MUI
import { Box, Switch, Typography, Stack, Slider } from "@mui/material";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
// Audio
import forkSound from "../../audio/fork_sound.mp3";
// Other
import lightFork from "../../images/white_fork.png";
import darkFork from "../../images/dark_fork.png";
import useStyles from "../../styles/styles";
import { user } from "../../redux/store";

const Tune: React.FC = () => {
    const styles = useStyles();
    const { theme } = useSelector(user);
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const [forkState, setForkState] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(30);

    useEffect(() => {
        setAudioStatus();
    }, [forkState]);

    useEffect(() => {
        audioRef.current.volume = volume / 100;
    }, [volume]);

    const setAudioStatus = () => {
        if (forkState) {
            audioRef.current.play();
        } else {
            audioRef.current.load();
        }
    };

    const changeVolumeHandler = (event: Event, newValue: number | number[]) => {
        setVolume(newValue as number);
    };

    const isNotAppleDevice = () => {
        const userAgent: string = window.navigator.userAgent;
        const platform: string = window.navigator.platform;
        const iosPlatforms: string[] = ["iPhone", "iPad", "iPod"];
        const macPlatforms: string[] = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];

        if (iosPlatforms.includes(platform)) {
            return false;
        } else if (macPlatforms.includes(platform)) {
            return false;
        } else if (/Mac OS X/.test(userAgent)) {
            return false;
        }

        return true;
    };

    const { forkImage, forkWrapper, forkSwitchWrapper } = styles;
    return (
        <Box className={forkWrapper}>
            <img className={forkImage} src={theme === "dark" ? lightFork : darkFork} alt="fork" />
            <audio ref={audioRef}>
                <source src={forkSound} type="audio/mp3"></source>
            </audio>
            <Box className={forkSwitchWrapper}>
                <Typography>off</Typography>
                <Switch onChange={() => setForkState(!forkState)} />
                <Typography>on</Typography>
            </Box>
            {isNotAppleDevice() && (
                <Stack spacing={2} direction="row" sx={{ width: 250 }} alignItems="center">
                    <VolumeDown />
                    <Slider aria-label="Volume" value={volume} onChange={changeVolumeHandler} />
                    <VolumeUp />
                </Stack>
            )}
        </Box>
    );
};

export default Tune;

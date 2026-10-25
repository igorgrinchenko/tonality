import React, { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import { deletePresets, decodeBase64 } from "../../redux/thunks";
import { List, ListItem, Typography, Paper, Modal, Button, Box, IconButton } from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { user } from "../../redux/store";
import useStyles from "../../styles/styles";
import { darkTheme, lightTheme } from "../../styles/colors";
import { error } from "../../styles/colors";
import getTranslations from "../../translations/getTranslations";
import { Presets as IPreset } from "../../redux/interfaces";

const Presets: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { presets, theme, language } = useSelector(user);
    const { presetsList, presetListItem, modalContent } = useStyles();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [presetId, setPresetId] = useState<number | undefined>(undefined);
    const [presetName, setPresetName] = useState<string>("");

    const lang = getTranslations(language);

    const { DELETE, DELETE_PRESET_CONFIRM_TEXT, PLAY, STOP } = lang;

    const handlePlay = (preset: IPreset, index: number) => {
        const audio = audioRef.current;

        if (activeIndex === index) {
            setActiveIndex(null);
            if (audio) {
                audio.load();
            }
        } else {
            setActiveIndex(index);
            if (audio) {
                audio.src = preset.audioPath!;
                audio.play();
            }
        }
    };

    const handleOpenModal = (preset: IPreset) => {
        setOpenModal(true);
        setPresetId(preset.presetId);
        setPresetName(preset.presetName!);
    };

    const handleDeletePreset = () => {
        const encodedUID: string = localStorage.getItem("encodedUID")!;
        const uid: string = decodeBase64(encodedUID);
        dispatch(deletePresets({ presetId, uid }));
        setOpenModal(false);
    };

    return (
        <Paper sx={{ maxHeight: "90%", width: "100%", backgroundColor: theme === "dark" ? darkTheme : lightTheme, overflow: "auto" }}>
            <audio loop ref={audioRef} />
            <List className={presetsList}>
                {presets.map((preset, index) => (
                    <ListItem className={presetListItem} key={`preset_${index}`}>
                        <Typography sx={{ textAlign: "left" }}>{preset.presetName}</Typography>
                        <Typography sx={{ textAlign: "center" }}>{preset.presetValue}</Typography>
                        <IconButton aria-label={`${activeIndex === index ? STOP : PLAY} ${preset.presetName}`} onClick={() => handlePlay(preset, index)}>
                            {activeIndex === index ? <StopCircleIcon /> : <PlayCircleIcon />}
                        </IconButton>
                        <IconButton aria-label={`${DELETE} ${preset.presetName}`} onClick={() => handleOpenModal(preset)}>
                            <DeleteIcon sx={{ color: error }} color="error" />
                        </IconButton>
                    </ListItem>
                ))}
            </List>
            <Modal open={openModal} onClose={() => setOpenModal(false)} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
                <Box
                    className={modalContent}
                    sx={{
                        color: theme === "dark" ? lightTheme : darkTheme,
                        backgroundColor: theme === "dark" ? darkTheme : lightTheme,
                    }}
                >
                    <Typography sx={{ textAlign: "center" }}>
                        {DELETE_PRESET_CONFIRM_TEXT} &quot;{presetName}&quot; ?
                    </Typography>
                    <Button fullWidth onClick={handleDeletePreset} variant="outlined" color="error">
                        {DELETE}
                    </Button>
                </Box>
            </Modal>
        </Paper>
    );
};

export default Presets;

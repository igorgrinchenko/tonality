import React, { useRef, useState, MouseEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import { deletePresets, decodeBase64 } from "../../redux/thunks";
// MUI
import { List, ListItem, Typography, Paper, Modal, Button, Box } from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import DeleteIcon from "@mui/icons-material/Delete";
// Other
import { user } from "../../redux/store";
import useStyles from "../../styles/styles";
import { darkTheme, lightTheme } from "../../styles/colors";
import { error } from "../../styles/colors";
import ua from "../../translations/ua";
import en from "../../translations/en";
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

    const lang = language === "ua" ? ua : en;

    const { DELETE, DELETE_PRESET_CONFIRM_TEXT } = lang;

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

    const handleOpenModal = (event: MouseEvent, preset: IPreset) => {
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
            <List className={presetsList}>
                {presets.map((preset, index) => (
                    <ListItem className={presetListItem} key={`preset_${index}`}>
                        <Typography textAlign="left" sx={{ width: "33%" }}>
                            {preset.presetName}
                        </Typography>
                        <Typography textAlign="center" sx={{ width: "33%" }}>
                            {preset.presetValue}
                        </Typography>
                        <Typography textAlign="center" sx={{ width: "34%" }} onClick={() => handlePlay(preset, index)}>
                            {activeIndex === index ? <StopCircleIcon fontSize="large" /> : <PlayCircleIcon fontSize="large" />}
                        </Typography>
                        <audio loop ref={audioRef} />
                        <Typography textAlign="right">
                            <DeleteIcon sx={{ color: error }} fontSize="large" color="error" onClick={(event) => handleOpenModal(event, preset)} />
                        </Typography>
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
                    <Typography textAlign="center">
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

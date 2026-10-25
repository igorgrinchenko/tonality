import React from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import useStyles from "../styles/styles";
import getTranslations from "../translations/getTranslations";
import { user } from "../redux/store";
import { authPath, signInPath, signUpPath, verifyEmailPath, defaultPath, tonalityPath, tunePath, presetsPath, userPath } from "../routes/routes";

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { language } = useSelector(user);
    const lang = getTranslations(language);

    const { headerWrapper, header } = useStyles();
    const { RETURN_BACK, VERIFY_EMAIL, TONALITY, TUNE, PRESETS, PROFILE } = lang;

    const returnBackHandler = () => {
        setHeaderArrow() && navigate(-1);
    };

    const setHeaderArrow = () => {
        switch (location.pathname) {
            case signInPath:
                return true;
            case signUpPath:
                return true;
            default:
                return false;
        }
    };

    const setHeaderTitle = () => {
        switch (location.pathname) {
            case signInPath:
                return RETURN_BACK;
            case signUpPath:
                return RETURN_BACK;
            case verifyEmailPath:
                return VERIFY_EMAIL;
            case tonalityPath:
                return TONALITY;
            case tunePath:
                return TUNE;
            case presetsPath:
                return PRESETS;
            case userPath:
                return PROFILE;
            case authPath:
                return "";
            case defaultPath:
                return "";
            default:
                return "";
        }
    };

    return (
        <Box className={headerWrapper}>
            <Box onClick={returnBackHandler} className={header}>
                {setHeaderArrow() && <ArrowBackIosIcon />}
                <Typography sx={{ textTransform: "uppercase" }} variant="h5">
                    {setHeaderTitle()}
                </Typography>
                {setHeaderArrow() && <Box></Box>}
            </Box>
        </Box>
    );
};

export default Header;

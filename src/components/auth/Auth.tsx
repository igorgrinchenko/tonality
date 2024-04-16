import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// MUI
import { Box, Button } from "@mui/material";
// Hooks
import useStyles from "../../styles/styles";
// Other
import en from "../../translations/en";
import ua from "../../translations/ua";
import { user } from "../../redux/store";
import { isSignedIn } from "../../redux/store";
import { tonalityPath, signInPath, signUpPath } from "../../routes/routes";

const Auth: React.FC = () => {
    const navigate = useNavigate();

    const _isSignedIn: boolean = useSelector(isSignedIn);
    const { language } = useSelector(user);
    const lang = language === "ua" ? ua : en;

    const { authButtonWrapper, button } = useStyles();
    const { SIGN_IN, SIGN_UP } = lang;

    useEffect(() => {
        _isSignedIn && navigate(tonalityPath);
    }, [_isSignedIn]);
    return (
        <Box className={authButtonWrapper}>
            <Link to={signInPath}>
                <Button className={button} variant="contained">
                    {SIGN_IN}
                </Button>
            </Link>
            <Link to={signUpPath}>
                <Button className={button} variant="outlined">
                    {SIGN_UP}
                </Button>
            </Link>
        </Box>
    );
};

export default Auth;

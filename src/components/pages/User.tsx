import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { user, AppDispatch } from "../../redux/store";
import { logOut } from "../../redux/thunks";
// Components
import UserAvatar from "../Avatar";
import RadioButtonsGroup from "../Radio";
// MUI
import { Box, Typography, Button } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import WarningIcon from "@mui/icons-material/Warning";
import TelegramIcon from "@mui/icons-material/Telegram";
// Hooks
import useStyles from "../../styles/styles";
// Other
import en from "../../translations/en";
import ua from "../../translations/ua";
import { darkTheme, lightTheme } from "../../styles/colors";
import version from "../../app_version.json";
import { URLs } from "../../common/enums";

const User: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const { email, theme, language, isVerified } = useSelector(user);
    const lang = language === "ua" ? ua : en;

    const { userWrapper, userSettings, userEmailWrapper, contactDeveloper } = useStyles();
    const { LOG_OUT, CONTACT_THE_DEVELOPER } = lang;

    const inlineStyles = {
        boxShadow: `0 0 5px ${theme === "dark" ? lightTheme : darkTheme}`,
    };

    const parseVersion = (): string => {
        const parsedObj = JSON.parse(JSON.stringify(version));
        const formattedString = `Version: ${parsedObj.version}`;
        return formattedString;
    };

    const openChatWithDeveloper = () => window.open(URLs.telegram);

    const developer = "Developed by Dexter © 2024";

    const logOutHandler = () => dispatch(logOut());

    return (
        <>
            <Box className={userWrapper} sx={inlineStyles}>
                <UserAvatar />
                <Box className={userSettings}>
                    <Box className={userEmailWrapper}>
                        <Typography variant="subtitle1">{email}</Typography>
                        {isVerified ? <VerifiedIcon /> : <WarningIcon />}
                    </Box>

                    <RadioButtonsGroup theme={theme} language={language} isVerified={isVerified} options={{ dark: "dark", light: "light", uaLang: "ua", enLang: "en" }} />
                </Box>

                <Button fullWidth variant="outlined" color="error" onClick={logOutHandler}>
                    {LOG_OUT}
                </Button>
                <Typography textAlign="left" sx={{ width: "100%" }} variant="subtitle2">
                    <span className={contactDeveloper}>
                        {CONTACT_THE_DEVELOPER} <TelegramIcon onClick={openChatWithDeveloper} />
                    </span>
                    <span>{developer}</span>
                    <br />
                    <span>{parseVersion()}</span>
                </Typography>
            </Box>
        </>
    );
};

export default User;

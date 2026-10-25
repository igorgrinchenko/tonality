import React, { useState, useEffect, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { signUp } from "../../redux/thunks";
import { isSignedUp, AppDispatch } from "../../redux/store";
// MUI
import { Typography, Button, TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
// Hooks
import useStyles from "../../styles/styles";
// Other
import getTranslations from "../../translations/getTranslations";
import { user } from "../../redux/store";
import { authPath } from "../../routes/routes";

const SignUp: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const _isSignedUp: boolean = useSelector(isSignedUp);
    const { language } = useSelector(user);
    const lang = getTranslations(language);

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const { input, button, signUpWrapper } = useStyles();
    const { SIGN_UP, CREATE_AN_ACCOUNT, EMAIL, PASSWORD, SHOW_PASSWORD, HIDE_PASSWORD } = lang;

    useEffect(() => {
        _isSignedUp && navigate(authPath);
    }, [_isSignedUp]);

    const register = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(signUp({ email, password }));
    };

    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.target.value);
    };

    const handleClickShowPassword = (): void => {
        setShowPassword(!showPassword);
    };

    return (
        <form className={signUpWrapper} onSubmit={register}>
            <Typography variant="subtitle1" component="span" align="center">
                {CREATE_AN_ACCOUNT}
            </Typography>
            <TextField className={input} id="filled-basic" label={EMAIL} variant="filled" onChange={handleEmailChange} required={true} />
            <TextField
                className={input}
                id="filled-password-input"
                label={PASSWORD}
                variant="filled"
                onChange={handlePasswordChange}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required={true}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton aria-label={showPassword ? HIDE_PASSWORD : SHOW_PASSWORD} onClick={handleClickShowPassword} edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />
            <Button type="submit" className={button} variant="contained">
                {SIGN_UP}
            </Button>
        </form>
    );
};

export default SignUp;

import React, { useState, useEffect, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signIn } from "../../redux/thunks";
import { isSignedIn, AppDispatch } from "../../redux/store";
// MUI
import { Typography, Button, TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
// Hooks
import useStyles from "../../styles/styles";
// Other
import en from "../../translations/en";
import ua from "../../translations/ua";
import { user } from "../../redux/store";
import { tonalityPath } from "../../routes/routes";

const SignIn: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const _isSignedIn: boolean = useSelector(isSignedIn);
    const { language } = useSelector(user);
    const lang = language === "ua" ? ua : en;

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("test@test.xxx");
    const [password, setPassword] = useState<string>("xxxxxx");

    const { input, button, signInWrapper } = useStyles();
    const { SIGN_IN, LOGIN_TO_YOUR_ACC } = lang;

    useEffect(() => {
        _isSignedIn && navigate(tonalityPath);
    }, [_isSignedIn]);

    const login = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(signIn({ email, password }));
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
        <form className={signInWrapper} onSubmit={login}>
            <Typography variant="subtitle1" component="span" align="center">
                {LOGIN_TO_YOUR_ACC}
            </Typography>
            <TextField className={input} id="filled-basic" label="Email" variant="filled" onChange={handleEmailChange} required={true} />
            <TextField
                className={input}
                id="filled-password-input"
                label="Password"
                variant="filled"
                onChange={handlePasswordChange}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required={true}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Button type="submit" className={button} variant="contained">
                {SIGN_IN}
            </Button>
        </form>
    );
};

export default SignIn;

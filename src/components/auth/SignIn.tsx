import { FormEvent, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { Button, CircularProgress, TextField, IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AuthLayout from "./AuthLayout";
import { signIn } from "../../redux/thunks";
import { isSignedIn, isLoading, AppDispatch, user } from "../../redux/store";
import getTranslations from "../../translations/getTranslations";
import { tonalityPath, verifyEmailPath, signUpPath, forgotPasswordPath } from "../../routes/routes";

export default function SignIn() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const signedIn = useSelector(isSignedIn);
    const loading = useSelector(isLoading);
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (signedIn) {
            navigate(tonalityPath, { replace: true });
        }
    }, [signedIn, navigate]);

    const login = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) {
            return;
        }
        const result = await dispatch(signIn({ email: email.trim(), password, language }));
        if (signIn.fulfilled.match(result) && result.payload.requiresEmailVerification) {
            navigate(verifyEmailPath, { replace: true });
        }
    };

    return (
        <AuthLayout title={lang.LOGIN_TO_YOUR_ACC} description={lang.SIGN_IN_DESCRIPTION} icon={<LoginRoundedIcon />}>
            <form className="auth-form" onSubmit={login} aria-busy={loading}>
                <TextField
                    id="sign-in-email"
                    name="email"
                    label={lang.EMAIL}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    required
                    fullWidth
                    slotProps={{ htmlInput: { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } }}
                />
                <TextField
                    id="sign-in-password"
                    name="password"
                    label={lang.PASSWORD}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    required
                    fullWidth
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        type="button"
                                        aria-label={showPassword ? lang.HIDE_PASSWORD : lang.SHOW_PASSWORD}
                                        aria-pressed={showPassword}
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        disabled={loading}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <div className="auth-forgot-password">
                    <Link
                        className="text-link"
                        to={forgotPasswordPath}
                        state={{ email }}
                        aria-disabled={loading}
                        tabIndex={loading ? -1 : undefined}
                        onClick={(event) => loading && event.preventDefault()}
                    >
                        {lang.FORGOT_PASSWORD}
                    </Link>
                </div>
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRoundedIcon />}
                >
                    {loading ? lang.LOADING : lang.SIGN_IN}
                </Button>
            </form>
            <p className="auth-alternate">
                {lang.NO_ACCOUNT}
                <Link className="text-link" to={signUpPath} aria-disabled={loading} tabIndex={loading ? -1 : undefined} onClick={(event) => loading && event.preventDefault()}>
                    {lang.SIGN_UP}
                </Link>
            </p>
        </AuthLayout>
    );
}

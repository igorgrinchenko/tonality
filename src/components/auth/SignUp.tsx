import { FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { Button, CircularProgress, TextField, IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AuthLayout from "./AuthLayout";
import { signUp } from "../../redux/thunks";
import { isLoading, AppDispatch, user } from "../../redux/store";
import getTranslations from "../../translations/getTranslations";
import { verifyEmailPath, signInPath } from "../../routes/routes";

export default function SignUp() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const loading = useSelector(isLoading);
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const register = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) {
            return;
        }
        const result = await dispatch(signUp({ email: email.trim(), password, language }));
        if (signUp.fulfilled.match(result)) {
            navigate(verifyEmailPath, { replace: true });
        }
    };

    return (
        <AuthLayout title={lang.CREATE_AN_ACCOUNT} description={lang.SIGN_UP_DESCRIPTION} icon={<PersonAddAltRoundedIcon />}>
            <form className="auth-form" onSubmit={register} aria-busy={loading}>
                <TextField
                    id="sign-up-email"
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
                    id="sign-up-password"
                    name="password"
                    label={lang.PASSWORD}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    helperText={lang.PASSWORD_HINT}
                    disabled={loading}
                    required
                    fullWidth
                    slotProps={{
                        htmlInput: { minLength: 6 },
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
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRoundedIcon />}
                >
                    {loading ? lang.LOADING : lang.SIGN_UP}
                </Button>
            </form>
            <p className="auth-alternate">
                {lang.HAVE_ACCOUNT}
                <Link className="text-link" to={signInPath} aria-disabled={loading} tabIndex={loading ? -1 : undefined} onClick={(event) => loading && event.preventDefault()}>
                    {lang.SIGN_IN}
                </Link>
            </p>
        </AuthLayout>
    );
}

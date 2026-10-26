import { FormEvent, useState } from "react";
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import { Link, useLocation } from "react-router";
import { sendPasswordResetEmail } from "firebase/auth";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AuthLayout from "./AuthLayout";
import { auth } from "../../firebase";
import { signInPath } from "../../routes/routes";
import getTranslations, { getLocaleCode } from "../../translations/getTranslations";
import { useSelector } from "react-redux";
import { user } from "../../redux/store";

export default function ForgotPassword() {
    const location = useLocation();
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    const [email, setEmail] = useState(() => (location.state as { email?: string } | null)?.email?.trim() ?? "");
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSending) return;

        setIsSending(true);
        setError("");
        setSent(false);
        try {
            auth.languageCode = getLocaleCode(language);
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (requestError) {
            const code = typeof requestError === "object" && requestError !== null && "code" in requestError ? requestError.code : undefined;
            if (code === "auth/user-not-found") {
                // Keep the response the same for existing and unknown accounts.
                setSent(true);
            } else if (code === "auth/invalid-email") {
                setError(lang.AUTH_INVALID_EMAIL);
            } else if (code === "auth/too-many-requests") {
                setError(lang.REQUEST_LIMITED);
            } else if (code === "auth/network-request-failed") {
                setError(lang.NETWORK_ERROR);
            } else {
                setError(lang.PASSWORD_RESET_EMAIL_ERROR);
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AuthLayout title={lang.FORGOT_PASSWORD_TITLE} description={lang.FORGOT_PASSWORD_DESCRIPTION} icon={<LockResetRoundedIcon />}>
            {sent && (
                <Alert className="verification-feedback" severity="success">
                    {lang.PASSWORD_RESET_EMAIL_SENT}
                </Alert>
            )}
            {error && (
                <Alert className="verification-feedback" severity="error">
                    {error}
                </Alert>
            )}
            <form className="auth-form" onSubmit={submit} aria-busy={isSending}>
                <TextField
                    id="forgot-password-email"
                    name="email"
                    label={lang.EMAIL}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSending}
                    required
                    fullWidth
                    slotProps={{ htmlInput: { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSending}
                    endIcon={isSending ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRoundedIcon />}
                >
                    {isSending ? lang.LOADING : lang.RESET_PASSWORD}
                </Button>
            </form>
            <p className="auth-alternate">
                <Link className="text-link" to={signInPath}>
                    {lang.BACK_TO_SIGN_IN}
                </Link>
            </p>
        </AuthLayout>
    );
}

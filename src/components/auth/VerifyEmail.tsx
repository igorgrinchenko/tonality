import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { onAuthStateChanged, reload, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { user } from "../../redux/store";
import { darkTheme, lightTheme } from "../../styles/colors";
import useStyles from "../../styles/styles";
import getTranslations, { getLocaleCode } from "../../translations/getTranslations";
import { sendVerificationEmail } from "../../firebaseEmailVerification";
import { signInPath } from "../../routes/routes";

const verificationCooldownSeconds = 60;

const getRemainingCooldown = (): number => {
    const sentAt = Number(localStorage.getItem("verificationEmailSentAt"));
    if (!sentAt) {
        return 0;
    }

    return Math.max(0, Math.ceil((sentAt + verificationCooldownSeconds * 1000 - Date.now()) / 1000));
};

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, language } = useSelector(user);
    const lang = getTranslations(language);
    const { emailVerificationWrapper, button } = useStyles();

    const [email, setEmail] = useState(() => localStorage.getItem("pendingVerificationEmail") || "");
    const [hasCurrentUser, setHasCurrentUser] = useState(Boolean(auth.currentUser));
    const [isVerified, setIsVerified] = useState(() => new URLSearchParams(location.search).get("verified") === "1");
    const [isChecking, setIsChecking] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(getRemainingCooldown);
    const [feedback, setFeedback] = useState<"sent" | "failed" | "pending" | "">(() =>
        localStorage.getItem("verificationEmailSendFailed") === "true" ? "failed" : ""
    );

    const inlineStyles = {
        backgroundColor: theme === "dark" ? darkTheme : lightTheme,
        boxShadow: `0 0 5px ${theme === "dark" ? lightTheme : darkTheme}`,
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setHasCurrentUser(Boolean(firebaseUser));
            if (firebaseUser?.email) {
                setEmail(firebaseUser.email);
            }
        });

        const cooldownInterval = window.setInterval(() => setCooldown(getRemainingCooldown()), 1000);
        return () => {
            unsubscribe();
            window.clearInterval(cooldownInterval);
        };
    }, []);

    useEffect(() => {
        if (isVerified) {
            localStorage.removeItem("pendingVerificationEmail");
            localStorage.removeItem("verificationEmailSentAt");
            localStorage.removeItem("verificationEmailSendFailed");
        }
    }, [isVerified]);

    const finishVerification = async () => {
        setIsVerified(true);
        setFeedback("");
        try {
            await signOut(auth);
        } catch (error) {
            console.error(error);
        }
    };

    const checkVerification = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setFeedback("pending");
            return;
        }

        setIsChecking(true);
        try {
            await reload(currentUser);
            if (currentUser.emailVerified) {
                await finishVerification();
            } else {
                setFeedback("pending");
            }
        } catch (error) {
            console.error(error);
            setFeedback("failed");
        } finally {
            setIsChecking(false);
        }
    };

    const resendVerificationEmail = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setFeedback("pending");
            return;
        }

        setIsResending(true);
        try {
            await reload(currentUser);
            if (currentUser.emailVerified) {
                await finishVerification();
                return;
            }

            auth.languageCode = getLocaleCode(language);
            await sendVerificationEmail(currentUser);
            localStorage.setItem("verificationEmailSentAt", String(Date.now()));
            localStorage.removeItem("verificationEmailSendFailed");
            setCooldown(verificationCooldownSeconds);
            setFeedback("sent");
        } catch (error) {
            console.error(error);
            setFeedback("failed");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Box className={emailVerificationWrapper} sx={inlineStyles}>
            <MarkEmailReadOutlinedIcon color={isVerified ? "success" : "primary"} sx={{ width: 48, height: 48 }} />
            <Typography align="center" variant="h5">
                {isVerified ? lang.EMAIL_VERIFIED_TITLE : lang.VERIFY_EMAIL_TITLE}
            </Typography>
            <Typography align="center">
                {isVerified ? lang.EMAIL_VERIFIED_MESSAGE : email ? lang.VERIFY_EMAIL_INSTRUCTIONS : lang.VERIFICATION_NO_EMAIL}
            </Typography>
            {email && (
                <Typography align="center" variant="subtitle1" sx={{ overflowWrap: "anywhere" }}>
                    {email}
                </Typography>
            )}

            {feedback === "sent" && <Alert severity="success">{lang.VERIFICATION_EMAIL_SENT}</Alert>}
            {feedback === "failed" && <Alert severity="error">{lang.VERIFICATION_EMAIL_ERROR}</Alert>}
            {feedback === "pending" && <Alert severity="info">{lang.EMAIL_NOT_VERIFIED}</Alert>}

            {!isVerified && (
                <>
                    <Button className={button} variant="contained" onClick={checkVerification} disabled={!hasCurrentUser || isChecking}>
                        {isChecking ? <CircularProgress size={22} color="inherit" /> : lang.CHECK_EMAIL_VERIFICATION}
                    </Button>
                    <Button className={button} variant="outlined" onClick={resendVerificationEmail} disabled={!hasCurrentUser || isResending || cooldown > 0}>
                        {isResending ? <CircularProgress size={22} /> : lang.RESEND_VERIFICATION_EMAIL}
                    </Button>
                    {cooldown > 0 && (
                        <Typography align="center" variant="body2">
                            {lang.VERIFICATION_RESEND_IN.replace("{seconds}", String(cooldown))}
                        </Typography>
                    )}
                    {!hasCurrentUser && (
                        <Typography align="center" variant="body2">
                            {lang.VERIFICATION_SIGN_IN_TO_RESEND}
                        </Typography>
                    )}
                </>
            )}

            <Button className={button} variant="text" onClick={() => navigate(signInPath)}>
                {isVerified ? lang.SIGN_IN : lang.BACK_TO_SIGN_IN}
            </Button>
        </Box>
    );
};

export default VerifyEmail;

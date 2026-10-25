import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Alert, Button, CircularProgress } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import { onAuthStateChanged, reload, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { user } from "../../redux/store";
import AuthLayout from "./AuthLayout";
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
    const { language } = useSelector(user);
    const lang = getTranslations(language);

    const [email, setEmail] = useState(() => localStorage.getItem("pendingVerificationEmail") || "");
    const [hasCurrentUser, setHasCurrentUser] = useState(Boolean(auth.currentUser));
    const [isVerified, setIsVerified] = useState(() => new URLSearchParams(location.search).get("verified") === "1");
    const [isChecking, setIsChecking] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(getRemainingCooldown);
    const [feedback, setFeedback] = useState<"sent" | "failed" | "pending" | "">(() => (localStorage.getItem("verificationEmailSendFailed") === "true" ? "failed" : ""));

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
        <AuthLayout
            title={isVerified ? lang.EMAIL_VERIFIED_TITLE : lang.VERIFY_EMAIL_TITLE}
            description={isVerified ? lang.EMAIL_VERIFIED_MESSAGE : email ? lang.VERIFY_EMAIL_INSTRUCTIONS : lang.VERIFICATION_NO_EMAIL}
            icon={<MarkEmailReadOutlinedIcon />}
            tone={isVerified ? "success" : "primary"}
        >
            {email && (
                <div className="verification-email" aria-label={lang.EMAIL}>
                    <MailOutlineRoundedIcon aria-hidden="true" />
                    <span>{email}</span>
                </div>
            )}

            {feedback === "sent" && (
                <Alert className="verification-feedback" severity="success">
                    {lang.VERIFICATION_EMAIL_SENT}
                </Alert>
            )}
            {feedback === "failed" && (
                <Alert className="verification-feedback" severity="error">
                    {lang.VERIFICATION_EMAIL_ERROR}
                </Alert>
            )}
            {feedback === "pending" && (
                <Alert className="verification-feedback" severity="info">
                    {lang.EMAIL_NOT_VERIFIED}
                </Alert>
            )}

            {!isVerified && (
                <>
                    <div className="verification-actions" aria-busy={isChecking || isResending}>
                        <Button
                            variant="contained"
                            onClick={checkVerification}
                            disabled={!hasCurrentUser || isChecking || isResending}
                            fullWidth
                            startIcon={isChecking ? <CircularProgress size={18} color="inherit" /> : undefined}
                        >
                            {isChecking ? lang.LOADING : lang.CHECK_EMAIL_VERIFICATION}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={resendVerificationEmail}
                            disabled={!hasCurrentUser || isChecking || isResending || cooldown > 0}
                            fullWidth
                            startIcon={isResending ? <CircularProgress size={18} color="inherit" /> : undefined}
                        >
                            {isResending ? lang.LOADING : lang.RESEND_VERIFICATION_EMAIL}
                        </Button>
                    </div>
                    {cooldown > 0 && (
                        <p className="verification-help" aria-live="off">
                            {lang.VERIFICATION_RESEND_IN.replace("{seconds}", String(cooldown))}
                        </p>
                    )}
                    {!hasCurrentUser && <p className="verification-help">{lang.VERIFICATION_SIGN_IN_TO_RESEND}</p>}
                </>
            )}

            <Button
                className={isVerified ? undefined : "verification-back"}
                variant={isVerified ? "contained" : "text"}
                onClick={() => navigate(signInPath)}
                disabled={isChecking || isResending}
                fullWidth
            >
                {isVerified ? lang.SIGN_IN : lang.BACK_TO_SIGN_IN}
            </Button>
        </AuthLayout>
    );
};

export default VerifyEmail;

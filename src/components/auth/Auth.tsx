import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Button } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import AuthLayout from "./AuthLayout";
import getTranslations from "../../translations/getTranslations";
import { isSignedIn, user } from "../../redux/store";
import { tonalityPath, signInPath, signUpPath } from "../../routes/routes";

export default function Auth() {
    const navigate = useNavigate();
    const signedIn = useSelector(isSignedIn);
    const { language } = useSelector(user);
    const lang = getTranslations(language);

    useEffect(() => {
        if (signedIn) {
            navigate(tonalityPath, { replace: true });
        }
    }, [signedIn, navigate]);

    return (
        <AuthLayout title={lang.AUTH_WELCOME_TITLE} description={lang.AUTH_WELCOME_DESCRIPTION} icon={<MusicNoteRoundedIcon />}>
            <div className="auth-actions">
                <Button component={Link} to={signInPath} variant="contained" fullWidth endIcon={<ArrowForwardRoundedIcon />}>
                    {lang.SIGN_IN}
                </Button>
                <Button component={Link} to={signUpPath} variant="outlined" fullWidth>
                    {lang.SIGN_UP}
                </Button>
            </div>
            <p className="auth-security">
                <LockOutlinedIcon aria-hidden="true" />
                {lang.SAFE_ACCOUNT}
            </p>
        </AuthLayout>
    );
}

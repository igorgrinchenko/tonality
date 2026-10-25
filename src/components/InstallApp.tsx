import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import AddToHomeScreenRoundedIcon from "@mui/icons-material/AddToHomeScreenRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { user } from "../redux/store";
import { InstallPlatform, useInstallApp } from "../pwa/InstallProvider";
import getTranslations from "../translations/getTranslations";
import { userPath } from "../routes/routes";
import "../styles/install.css";

export function InstallPromotion({ eligible, disabled }: { eligible: boolean; disabled: boolean }) {
    const install = useInstallApp();
    const location = useLocation();
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    if (location.pathname === userPath || !eligible || disabled || install.installed || install.snoozed || (!install.canPrompt && install.platform === "desktop")) return null;

    return (
        <section className="install-promotion" aria-labelledby="install-promotion-title">
            <span className="icon-tile" aria-hidden="true">
                <AddToHomeScreenRoundedIcon />
            </span>
            <div className="install-copy">
                <h2 id="install-promotion-title">{lang.INSTALL_TITLE}</h2>
                <p>{lang.INSTALL_DESCRIPTION}</p>
            </div>
            <div className="install-actions">
                <Button
                    variant="contained"
                    onClick={install.requestInstall}
                    disabled={install.installing}
                    startIcon={install.installing ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    {install.installing ? lang.LOADING : lang.INSTALL_APP}
                </Button>
                <Button onClick={install.snooze} disabled={install.installing}>
                    {lang.INSTALL_LATER}
                </Button>
            </div>
        </section>
    );
}

export function InstallAppSection({ disabled }: { disabled: boolean }) {
    const install = useInstallApp();
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    if (install.installed) return null;

    return (
        <section className="surface-card install-profile" aria-labelledby="install-profile-title">
            <div className="section-header">
                <span className="icon-tile" aria-hidden="true">
                    <AddToHomeScreenRoundedIcon />
                </span>
                <div>
                    <h2 id="install-profile-title">{lang.INSTALL_TITLE}</h2>
                    <p>{lang.INSTALL_DESCRIPTION}</p>
                </div>
            </div>
            <Button variant="outlined" onClick={install.requestInstall} disabled={disabled || install.installing} startIcon={<AddToHomeScreenRoundedIcon />}>
                {install.installing ? lang.LOADING : lang.INSTALL_APP}
            </Button>
        </section>
    );
}

export default function InstallDialog() {
    const install = useInstallApp();
    const [platform, setPlatform] = useState<InstallPlatform>(install.platform);
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    const steps = {
        android: [lang.INSTALL_ANDROID_STEP_1, lang.INSTALL_ANDROID_STEP_2, lang.INSTALL_ANDROID_STEP_3],
        ios: [lang.INSTALL_IOS_STEP_1, lang.INSTALL_IOS_STEP_2, lang.INSTALL_IOS_STEP_3],
        desktop: [lang.INSTALL_DESKTOP_STEP_1, lang.INSTALL_DESKTOP_STEP_2, lang.INSTALL_DESKTOP_STEP_3],
    };

    return (
        <Dialog
            open={install.helpOpen && !install.installed}
            onClose={install.snooze}
            maxWidth="sm"
            fullWidth
            scroll="paper"
            aria-labelledby="install-dialog-title"
            aria-describedby="install-dialog-description"
            className="install-dialog"
        >
            <DialogTitle id="install-dialog-title">
                {lang.INSTALL_APP}
                <IconButton className="install-close" aria-label={lang.CLOSE} onClick={install.snooze}>
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <p id="install-dialog-description" className="muted">
                    {lang.INSTALL_HELP_DESCRIPTION}
                </p>
                {install.failed && <Alert severity="info">{lang.INSTALL_MANUAL_FALLBACK}</Alert>}
                <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={platform}
                    onChange={(_event, value: InstallPlatform | null) => value && setPlatform(value)}
                    aria-label={lang.INSTALL_DEVICE}
                    className="install-platforms"
                >
                    <ToggleButton value="android">Android</ToggleButton>
                    <ToggleButton value="ios">iPhone / iPad</ToggleButton>
                    <ToggleButton value="desktop">{lang.INSTALL_DESKTOP}</ToggleButton>
                </ToggleButtonGroup>
                <ol className="install-steps">
                    {steps[platform].map((step, index) => (
                        <li key={index}>
                            <span aria-hidden="true">{index + 1}</span>
                            <p>{step}</p>
                        </li>
                    ))}
                </ol>
                <p className="install-note muted">{lang.INSTALL_BROWSER_NOTE}</p>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={install.snooze}>
                    {lang.INSTALL_DONE}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Button } from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PageHeading from "../PageHeading";
import RadioButtonsGroup from "../Radio";
import { AppDispatch, isLoading, user } from "../../redux/store";
import { logOut } from "../../redux/thunks";
import { URLs } from "../../common/enums";
import getTranslations from "../../translations/getTranslations";
import version from "../../app_version.json";
import "../../styles/pages.css";

const User: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { email, theme, language, isVerified } = useSelector(user);
    const busy = useSelector(isLoading);
    const lang = getTranslations(language);

    return (
        <div className="page profile-page">
            <PageHeading eyebrow={lang.PROFILE} title={lang.PROFILE_TITLE} description={lang.PROFILE_DESCRIPTION} />
            <div className="profile-grid">
                <section className="surface-card account-card" aria-labelledby="account-title">
                    <span className="eyebrow" id="account-title">
                        {lang.ACCOUNT}
                    </span>
                    <Avatar className="profile-avatar" aria-hidden="true">
                        {(email || "T").charAt(0).toUpperCase()}
                    </Avatar>
                    <h2 className="profile-email">{email}</h2>
                    <span className={`status-pill account-status${isVerified ? " account-status-verified" : ""}`}>
                        {isVerified ? <CheckCircleRoundedIcon /> : <WarningAmberRoundedIcon />}
                        {isVerified ? lang.VERIFIED_EMAIL : lang.UNVERIFIED_EMAIL}
                    </span>
                    <Button className="profile-logout-button" fullWidth variant="outlined" startIcon={<LogoutRoundedIcon />} disabled={busy} onClick={() => dispatch(logOut())}>
                        {lang.LOG_OUT}
                    </Button>
                </section>
                <section className="surface-card preferences-card" aria-labelledby="preferences-title">
                    <div className="section-header">
                        <span className="icon-tile">
                            <TuneRoundedIcon />
                        </span>
                        <div>
                            <h2 id="preferences-title">{lang.PREFERENCES}</h2>
                            <p className="muted">{lang.PREFERENCES_DESCRIPTION}</p>
                        </div>
                    </div>
                    <RadioButtonsGroup theme={theme} language={language} isVerified={isVerified} />
                </section>
                <section className="surface-card profile-support" aria-labelledby="support-title">
                    <div className="section-header">
                        <span className="icon-tile">
                            <SupportAgentRoundedIcon />
                        </span>
                        <div>
                            <h2 id="support-title">{lang.SUPPORT}</h2>
                            <p className="muted">{lang.SUPPORT_DESCRIPTION}</p>
                        </div>
                    </div>
                    <a className="text-link support-link" href={URLs.telegram} target="_blank" rel="noopener noreferrer">
                        {lang.CONTACT_THE_DEVELOPER}
                        <ArrowOutwardRoundedIcon fontSize="small" />
                    </a>
                    <div className="profile-meta">
                        <span>{lang.DEVELOPER_CREDIT}</span>
                        <span>
                            {lang.VERSION} {version.version}
                        </span>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default User;

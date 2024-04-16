import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Helmet } from "react-helmet";
// MUI
import { Box, Container } from "@mui/material";
// Components
import User from "./components/pages/User";
import Tonality from "./components/pages/Tonality";
import Tune from "./components/pages/Tune";
import Presets from "./components/pages/Presets";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";
import Loader from "./components/Loader";
import Auth from "./components/auth/Auth";
import Toast from "./components/Toast";
import PrivateRoute from "./routes/PrivateRoute";
import NotPWAPage from "./components/NotPWAPage";
import LandscapeForbidden from "./components/LandscapeForbidden";
import ErrorBoundary from "./components/ErrorBoundary";
// Hooks
import useStyles from "./styles/styles";
// Routes
import { defaultPath, tonalityPath, tunePath, presetsPath, userPath, authPath, signUpPath, signInPath } from "./routes/routes";
// Redux
import { AppDispatch, isLoading, user } from "./redux/store";
import { setIsSignedIn } from "./redux/slice";
import { logOut, decodeBase64, getUserData } from "./redux/thunks";
// Other
import { darkTheme, lightTheme } from "./styles/colors";
import en from "./translations/en";
import ua from "./translations/ua";

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [orientation, setOrientation] = useState<string>("portrait");
    const _isLoading: boolean = useSelector(isLoading);
    const { theme, language } = useSelector(user);

    const { app, container, errorBoundary, notPWAPageContainer, landscapeForbiddenContainer, footerContainer } = useStyles();

    const inlineStyles = { backgroundColor: theme === "dark" ? darkTheme : lightTheme, color: theme === "dark" ? lightTheme : darkTheme };
    const inlineStylesFooterContainer = { backgroundColor: theme === "dark" ? darkTheme : lightTheme };

    const lang = language === "ua" ? ua : en;

    const { ERROR_BOUNDARY_MESSAGE, RELOAD } = lang;

    useEffect(() => {
        const encodedUID: string = localStorage.getItem("encodedUID")!;

        if (encodedUID) {
            const uid: string = decodeBase64(encodedUID);
            dispatch(getUserData({ uid }));
        }

        checkTokenExpTime();

        const interval = setInterval(() => checkTokenExpTime(), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => setOrientationStatus(), []);

    useEffect(() => window.addEventListener("orientationchange", setOrientationStatus), [orientation]);

    const checkTokenExpTime = (): void => {
        const tokenExpTime: number = Number(localStorage.getItem("tokenExpTime"));
        const currentTime: number = new Date().getTime();

        if (tokenExpTime) {
            tokenExpTime > currentTime ? dispatch(setIsSignedIn(true)) : dispatch(logOut());
        } else {
            dispatch(setIsSignedIn(false));
        }
    };

    const setOrientationStatus = () => {
        if (window.orientation === 0 || window.orientation === 180) {
            setOrientation("portrait");
        } else {
            setOrientation("landscape");
        }
    };

    const checkIsLandscapeOrientation = () => {
        if (orientation === "landscape") {
            return true;
        } else {
            return false;
        }
    };

    const checkIsPWA = () => {
        interface NavigatorExtended extends Navigator {
            standalone?: boolean;
        }

        const isStandalone = (navigator as NavigatorExtended).standalone === true;
        const isIOS: boolean = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

        if (isIOS) {
            if (isStandalone) {
                // console.log("IOS | PWA");
                return false;
            } else {
                // console.log("IOS | Browser");
                return true;
            }
        } else {
            if (window.matchMedia("(display-mode: standalone)").matches) {
                // console.log("Other platform | PWA");
                return false;
            } else {
                // console.log("Other platform | Browser");
                return true;
            }
        }
    };

    const warningPageRender = () => {
        if (checkIsPWA()) {
            return (
                <Container maxWidth="sm" className={notPWAPageContainer}>
                    <NotPWAPage />
                </Container>
            );
        }
        if (checkIsLandscapeOrientation()) {
            return (
                <Container maxWidth="sm" className={landscapeForbiddenContainer}>
                    <LandscapeForbidden />
                </Container>
            );
        }
    };

    return (
        <>
            <Helmet>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#101418" />
                <meta name="description" content="Web site for determining tones" />
                <meta name="keywords" content="tonality, music" />
                <meta name="robots" content="noindex, nofollow" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                <meta name="apple-mobile-web-app-title" content="Tonality Finder" />
                <link rel="apple-touch-icon" href="../public/favicon.webp" />
                <link rel="manifest" href="../public/manifest.json" />
            </Helmet>

            <ErrorBoundary errorBoundary={errorBoundary} errorMessage={ERROR_BOUNDARY_MESSAGE} buttonText={RELOAD} theme={theme}>
                <Box className={app} sx={inlineStyles}>
                    {!checkIsLandscapeOrientation() && !checkIsPWA() && (
                        <Router>
                            <Container maxWidth="sm">
                                <Header />
                            </Container>
                            <Container maxWidth="sm" className={container}>
                                {_isLoading && <Loader />}
                                <Toast />
                                <Routes>
                                    <Route path={defaultPath} element={<Auth />} />
                                    <Route path={authPath} element={<Auth />} />
                                    <Route path={signUpPath} element={<SignUp />} />
                                    <Route path={signInPath} element={<SignIn />} />
                                    <Route path={tonalityPath} element={<PrivateRoute routeElement={<Tonality />} />} />
                                    <Route path={tunePath} element={<PrivateRoute routeElement={<Tune />} />} />
                                    <Route path={presetsPath} element={<PrivateRoute routeElement={<Presets />} />} />
                                    <Route path={userPath} element={<PrivateRoute routeElement={<User />} />} />
                                </Routes>
                            </Container>
                            <Container className={footerContainer} maxWidth="sm" sx={inlineStylesFooterContainer}>
                                <Footer />
                            </Container>
                        </Router>
                    )}
                    {warningPageRender()}
                </Box>
            </ErrorBoundary>
        </>
    );
};

export default App;

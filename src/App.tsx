import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { onAuthStateChanged, reload, User as FirebaseUser } from "firebase/auth";
import { Box, Container } from "@mui/material";
import User from "./components/pages/User";
import Tonality from "./components/pages/Tonality";
import Tune from "./components/pages/Tune";
import Presets from "./components/pages/Presets";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";
import VerifyEmail from "./components/auth/VerifyEmail";
import Loader from "./components/Loader";
import Auth from "./components/auth/Auth";
import Toast from "./components/Toast";
import PrivateRoute from "./routes/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import useStyles from "./styles/styles";
import { defaultPath, tonalityPath, tunePath, presetsPath, userPath, authPath, signUpPath, signInPath, verifyEmailPath } from "./routes/routes";
import { AppDispatch, isLoading, user } from "./redux/store";
import { setIsSignedIn } from "./redux/slice";
import { logOut, decodeBase64, getUserData } from "./redux/thunks";
import { auth } from "./firebase";
import { darkTheme, lightTheme } from "./styles/colors";
import getTranslations, { getLocaleCode } from "./translations/getTranslations";

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const _isLoading: boolean = useSelector(isLoading);
    const { theme, language } = useSelector(user);

    const { app, container, errorBoundary, footerContainer } = useStyles();

    const inlineStyles = { backgroundColor: theme === "dark" ? darkTheme : lightTheme, color: theme === "dark" ? lightTheme : darkTheme };
    const inlineStylesFooterContainer = { backgroundColor: theme === "dark" ? darkTheme : lightTheme };

    const lang = getTranslations(language);

    const { ERROR_BOUNDARY_MESSAGE, RELOAD } = lang;

    useEffect(() => {
        let waitingForInitialAuthState = true;

        const validateStoredSession = async (firebaseUser: FirebaseUser | null) => {
            if (!firebaseUser) {
                dispatch(setIsSignedIn(false));
                return;
            }

            try {
                await reload(firebaseUser);
            } catch {
                dispatch(setIsSignedIn(false));
                return;
            }

            const tokenExpTime = Number(localStorage.getItem("tokenExpTime"));
            const encodedUID = localStorage.getItem("encodedUID");

            if (!firebaseUser.emailVerified) {
                localStorage.removeItem("tokenExpTime");
                localStorage.removeItem("userEmail");
                localStorage.removeItem("encodedUID");
                dispatch(setIsSignedIn(false));
                return;
            }

            if (tokenExpTime > Date.now() && encodedUID) {
                try {
                    const uid = decodeBase64(encodedUID);
                    if (uid === firebaseUser.uid) {
                        dispatch(getUserData({ uid }));
                        return;
                    }
                } catch {}
            }

            dispatch(setIsSignedIn(false));
        };

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!waitingForInitialAuthState) {
                return;
            }
            waitingForInitialAuthState = false;
            void validateStoredSession(firebaseUser);
        });

        const interval = setInterval(() => {
            const tokenExpTime = Number(localStorage.getItem("tokenExpTime"));
            if (tokenExpTime && tokenExpTime <= Date.now()) {
                dispatch(logOut());
            }
        }, 60000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        document.documentElement.lang = getLocaleCode(language);
    }, [language]);

    return (
        <ErrorBoundary errorBoundary={errorBoundary} errorMessage={ERROR_BOUNDARY_MESSAGE} buttonText={RELOAD} theme={theme}>
            <Box className={app} sx={inlineStyles}>
                <Router>
                    <Container maxWidth="md">
                        <Header />
                    </Container>
                    <Container maxWidth="md" className={container}>
                        {_isLoading && <Loader />}
                        <Toast />
                        <Routes>
                            <Route
                                path={defaultPath}
                                element={
                                    new URLSearchParams(window.location.search).get("verified") === "1" || localStorage.getItem("pendingVerificationEmail") ? (
                                        <VerifyEmail />
                                    ) : (
                                        <Auth />
                                    )
                                }
                            />
                            <Route path={authPath} element={<Auth />} />
                            <Route path={signUpPath} element={<SignUp />} />
                            <Route path={signInPath} element={<SignIn />} />
                            <Route path={verifyEmailPath} element={<VerifyEmail />} />
                            <Route path={tonalityPath} element={<PrivateRoute routeElement={<Tonality />} />} />
                            <Route path={tunePath} element={<PrivateRoute routeElement={<Tune />} />} />
                            <Route path={presetsPath} element={<PrivateRoute routeElement={<Presets />} />} />
                            <Route path={userPath} element={<PrivateRoute routeElement={<User />} />} />
                        </Routes>
                    </Container>
                    <Container className={footerContainer} sx={inlineStylesFooterContainer}>
                        <Footer />
                    </Container>
                </Router>
            </Box>
        </ErrorBoundary>
    );
};

export default App;

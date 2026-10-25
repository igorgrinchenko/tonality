import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { useSelector, useDispatch } from "react-redux";
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
import getTranslations from "./translations/getTranslations";

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
        const encodedUID: string = localStorage.getItem("encodedUID")!;

        if (encodedUID) {
            const uid: string = decodeBase64(encodedUID);
            dispatch(getUserData({ uid }));
        }

        checkTokenExpTime();

        const interval = setInterval(() => checkTokenExpTime(), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        document.documentElement.lang = language === "ua" ? "uk" : language === "de" ? "de" : "en";
    }, [language]);

    const checkTokenExpTime = (): void => {
        const tokenExpTime: number = Number(localStorage.getItem("tokenExpTime"));
        const currentTime: number = new Date().getTime();

        if (tokenExpTime) {
            tokenExpTime > currentTime ? dispatch(setIsSignedIn(true)) : dispatch(logOut());
        } else {
            dispatch(setIsSignedIn(false));
        }
    };

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
                    <Container className={footerContainer} sx={inlineStylesFooterContainer}>
                        <Footer />
                    </Container>
                </Router>
            </Box>
        </ErrorBoundary>
    );
};

export default App;

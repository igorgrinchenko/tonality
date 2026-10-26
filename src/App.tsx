import React, { useEffect, useMemo } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { onAuthStateChanged, reload, User as FirebaseUser } from "firebase/auth";
import { CssBaseline, ThemeProvider } from "@mui/material";
import User from "./components/pages/User";
import Tonality from "./components/pages/Tonality";
import Tune from "./components/pages/Tune";
import Presets from "./components/pages/Presets";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyEmail from "./components/auth/VerifyEmail";
import Loader from "./components/Loader";
import Auth from "./components/auth/Auth";
import Toast from "./components/Toast";
import PrivateRoute from "./routes/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import InstallDialog, { InstallPromotion } from "./components/InstallApp";
import InstallProvider from "./pwa/InstallProvider";
import { defaultPath, tonalityPath, tunePath, presetsPath, userPath, authPath, signUpPath, signInPath, forgotPasswordPath, verifyEmailPath } from "./routes/routes";
import { AppDispatch, isLoading, isSignedIn, user } from "./redux/store";
import { setIsSignedIn } from "./redux/slice";
import { logOut, decodeBase64, getUserData } from "./redux/thunks";
import { auth } from "./firebase";
import { createAppTheme } from "./styles/theme";
import getTranslations, { getLocaleCode } from "./translations/getTranslations";

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const _isLoading: boolean = useSelector(isLoading);
    const signedIn = useSelector(isSignedIn);
    const { theme, language, presets } = useSelector(user);
    const appTheme = useMemo(() => createAppTheme(theme), [theme]);

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

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (themeMeta) themeMeta.content = appTheme.palette.background.default;
    }, [theme, appTheme]);

    return (
        <ThemeProvider theme={appTheme}>
            <CssBaseline />
            <ErrorBoundary errorMessage={ERROR_BOUNDARY_MESSAGE} buttonText={RELOAD}>
                <InstallProvider>
                    <div className={`app ${signedIn ? "app--signed" : "app--public"}`}>
                        <Router>
                            <div className="app-shell" inert={_isLoading}>
                                <a className="skip-link" href="#main-content">
                                    {lang.SKIP_TO_CONTENT}
                                </a>
                                <Header />
                                <main id="main-content" tabIndex={-1} className="main-content" aria-busy={_isLoading}>
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
                                        <Route path={forgotPasswordPath} element={<ForgotPassword />} />
                                        <Route path={verifyEmailPath} element={<VerifyEmail />} />
                                        <Route path={tonalityPath} element={<PrivateRoute routeElement={<Tonality />} />} />
                                        <Route path={tunePath} element={<PrivateRoute routeElement={<Tune />} />} />
                                        <Route path={presetsPath} element={<PrivateRoute routeElement={<Presets />} />} />
                                        <Route path={userPath} element={<PrivateRoute routeElement={<User />} />} />
                                        <Route path="*" element={<Auth />} />
                                    </Routes>
                                    <InstallPromotion eligible={signedIn && (presets?.length ?? 0) > 0} disabled={_isLoading} />
                                </main>
                                <Footer />
                            </div>
                            <Toast />
                            <InstallDialog />
                            {_isLoading && <Loader />}
                        </Router>
                    </div>
                </InstallProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
};

export default App;

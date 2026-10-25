import { createAsyncThunk } from "@reduxjs/toolkit";
import { setTokenExpTime } from "./slice";
import { AuthCredentials, UserData, IUId, Presets, SignInResult, SignUpResult, UserSettings } from "./interfaces";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential, IdTokenResult } from "firebase/auth";
import { auth, firestore } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { sendVerificationEmail } from "../firebaseEmailVerification";
import { getLocaleCode, normalizeLanguage } from "../translations/getTranslations";

export const encodeBase64 = (uid: string) => btoa(unescape(encodeURIComponent(uid)));
export const decodeBase64 = (uid: string) => decodeURIComponent(escape(atob(uid)));

const setStorage = (tokenExpTime: number, userEmail: string | null, uid: string) => {
    const encodedUID: string = encodeBase64(uid);

    localStorage.setItem("tokenExpTime", String(tokenExpTime));
    localStorage.setItem("userEmail", String(userEmail));
    localStorage.setItem("encodedUID", String(encodedUID));
};

const resetStorage = () => {
    localStorage.removeItem("tokenExpTime");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("encodedUID");
    localStorage.removeItem("pendingVerificationEmail");
    localStorage.removeItem("verificationEmailSentAt");
    localStorage.removeItem("verificationEmailSendFailed");
};

export const signIn = createAsyncThunk<SignInResult, AuthCredentials>("user/signIn", async ({ email, password, language }, { dispatch }) => {
    try {
        auth.languageCode = getLocaleCode(localStorage.getItem("language") ?? language);
        const data: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid: string = data.user.uid;

        if (!data.user.emailVerified) {
            localStorage.removeItem("tokenExpTime");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("encodedUID");
            localStorage.removeItem("verificationEmailSendFailed");
            localStorage.setItem("pendingVerificationEmail", data.user.email || email);
            return { email: data.user.email, requiresEmailVerification: true };
        }

        const userEmail: string | null = data.user.email;
        const token: IdTokenResult = await data.user.getIdTokenResult();
        const tokenExpTime: number = new Date(token.expirationTime).getTime();
        setStorage(tokenExpTime, userEmail, uid);

        const settingsRef = doc(firestore, "userSettings", uid);
        const settingsSnapshot = await getDoc(settingsRef);
        if (settingsSnapshot.exists()) {
            await setDoc(settingsRef, { isVerified: true, language: normalizeLanguage(settingsSnapshot.data()?.language ?? language) }, { merge: true });
        } else {
            const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
            await setDoc(settingsRef, { theme, language: normalizeLanguage(language), isVerified: true, presets: [] }, { merge: true });
        }

        localStorage.removeItem("pendingVerificationEmail");
        localStorage.removeItem("verificationEmailSendFailed");
        dispatch(getUserData({ uid }));

        dispatch(setTokenExpTime(tokenExpTime));

        return { email: userEmail, requiresEmailVerification: false };
    } catch (error) {
        resetStorage();
        console.error(error);
        throw error;
    }
});

export const signUp = createAsyncThunk<SignUpResult, AuthCredentials>("user/signUp", async ({ email, password, language }) => {
    try {
        auth.languageCode = getLocaleCode(localStorage.getItem("language") ?? language);
        const data: UserCredential = await createUserWithEmailAndPassword(auth, email, password);

        resetStorage();
        localStorage.setItem("pendingVerificationEmail", data.user.email || email);
        localStorage.removeItem("verificationEmailSentAt");
        localStorage.removeItem("verificationEmailSendFailed");

        let verificationEmailSent = false;
        try {
            await sendVerificationEmail(data.user);
            verificationEmailSent = true;
            localStorage.setItem("verificationEmailSentAt", String(Date.now()));
        } catch (verificationError) {
            console.error(verificationError);
            localStorage.setItem("verificationEmailSendFailed", "true");
        }

        return { email: data.user.email || email, verificationEmailSent };
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const logOut = createAsyncThunk("user/logout", async () => {
    try {
        await signOut(auth);
        resetStorage();
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const getUserData = createAsyncThunk<UserSettings, IUId>("users/getUserData", async ({ uid }) => {
    try {
        const docRef = doc(firestore, "userSettings", uid);
        const docSnap = await getDoc(docRef);

        const userData = docSnap.data();
        const language = normalizeLanguage(userData?.language);
        const theme = userData?.theme === "dark" ? "dark" : "light";
        localStorage.setItem("language", language);
        localStorage.setItem("theme", theme);
        if (userData && userData.language !== language) {
            await setDoc(docRef, { language }, { merge: true });
        }

        return {
            theme,
            language,
            isVerified: userData ? userData.isVerified === true : true,
            presets: Array.isArray(userData?.presets) ? userData.presets : [],
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const setUserData = createAsyncThunk("users/setUserData", async ({ theme, language, isVerified, uid }: UserData, { dispatch }) => {
    try {
        localStorage.setItem("language", language);
        localStorage.setItem("theme", theme);
        const docRef = doc(firestore, "userSettings", uid);
        await setDoc(docRef, { theme, language, isVerified }, { merge: true });
        dispatch(getUserData({ uid }));

        return { theme, language, isVerified };
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const setPresets = createAsyncThunk("users/setPresets", async ({ presetName, presetValue, audioPath, uid }: Presets) => {
    try {
        const docRef = doc(firestore, "userSettings", uid);
        const docSnap = await getDoc(docRef);
        const currentPresets = docSnap.data()?.presets;
        const presetId: number = currentPresets.length;
        const updatedPresets = [...currentPresets, { presetName, presetValue, presetId, audioPath }];

        await setDoc(docRef, { presets: updatedPresets }, { merge: true });

        return updatedPresets;
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const deletePresets = createAsyncThunk("users/deletePresets", async ({ presetId, uid }: Presets) => {
    try {
        const docRef = doc(firestore, "userSettings", uid);
        const docSnap = await getDoc(docRef);
        const currentPresets = docSnap.data()?.presets;
        const updatedPresets = currentPresets.filter((preset: Presets) => preset.presetId !== presetId);

        await setDoc(docRef, { presets: updatedPresets }, { merge: true });

        return updatedPresets;
    } catch (error) {
        console.error(error);
        throw error;
    }
});

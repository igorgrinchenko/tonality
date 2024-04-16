import { createAsyncThunk } from "@reduxjs/toolkit";
import { setTokenExpTime } from "./slice";
import { AuthCredentials, UserData, IUId, Presets } from "./interfaces";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential, IdTokenResult } from "firebase/auth";
import { auth, firestore } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
};

export const signIn = createAsyncThunk<UserCredential, AuthCredentials>("user/signIn", async ({ email, password }, { dispatch }) => {
    try {
        const data: UserCredential = await signInWithEmailAndPassword(auth, email, password);

        const uid: string = data.user.uid;
        dispatch(getUserData({ uid }));

        const userEmail: string | null = data.user.email;
        const token: IdTokenResult = await data.user.getIdTokenResult();
        const tokenExpTime: number = new Date(token.expirationTime).getTime();
        setStorage(tokenExpTime, userEmail, uid);

        dispatch(setTokenExpTime(tokenExpTime));

        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const signUp = createAsyncThunk<UserCredential, AuthCredentials>("user/signUp", async ({ email, password }) => {
    try {
        const data: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid: string = data.user.uid;

        const docRef = doc(firestore, "userSettings", uid);
        await setDoc(docRef, { theme: "dark", language: "ua", isVerified: false, presets: [] }, { merge: true }); // Default settings after registration

        return data;
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

export const getUserData = createAsyncThunk("users/getUserData", async ({ uid }: IUId) => {
    try {
        const docRef = doc(firestore, "userSettings", uid);
        const docSnap = await getDoc(docRef);

        return docSnap.data();
    } catch (error) {
        console.error(error);
        throw error;
    }
});

export const setUserData = createAsyncThunk("users/setUserData", async ({ theme, language, isVerified, uid }: UserData, { dispatch }) => {
    try {
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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialState } from "./initialState";
import { DefaultPendingState, DefaultRejectedAction, UserSettings, UserState } from "./interfaces";
import { signIn, signUp, logOut, getUserData, setUserData, setPresets, deletePresets } from "./thunks";
import getTranslations, { normalizeLanguage } from "../translations/getTranslations";

const setDefaultPendingState = (state: DefaultPendingState) => {
    state.isLoading = true;
    state.isSuccess = false;
    state.successMessage = "";
    state.isError = false;
    state.errorMessage = "";
};

const setDefaultRejectedState = (state: UserState, action: DefaultRejectedAction) => {
    state.isLoading = false;
    state.isError = true;
    const lang = getTranslations(state.user.language);
    const messages: Record<string, string> = {
        "auth/invalid-credential": lang.AUTH_INVALID_CREDENTIALS,
        "auth/user-not-found": lang.AUTH_INVALID_CREDENTIALS,
        "auth/wrong-password": lang.AUTH_INVALID_CREDENTIALS,
        "auth/email-already-in-use": lang.AUTH_EMAIL_IN_USE,
        "auth/weak-password": lang.AUTH_WEAK_PASSWORD,
        "auth/invalid-email": lang.AUTH_INVALID_EMAIL,
        "auth/too-many-requests": lang.REQUEST_LIMITED,
        "auth/network-request-failed": lang.NETWORK_ERROR,
        unavailable: lang.NETWORK_ERROR,
    };
    state.errorMessage = messages[action.error.code || ""] || action.error.message || lang.UNKNOWN_ERROR;
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setPreferences: (state, action: PayloadAction<Partial<Pick<UserSettings, "theme" | "language">>>) => {
            if (action.payload.theme) state.user.theme = action.payload.theme;
            if (action.payload.language) state.user.language = action.payload.language;
        },
        setIsSignedIn: (state, action) => {
            state.isSignedIn = action.payload;
        },
        resetError: (state) => {
            state.errorMessage = "";
            state.isError = false;
        },
        resetSuccess: (state) => {
            state.successMessage = "";
            state.isSuccess = false;
        },
        setTokenExpTime: (state, action) => {
            state.user.tokenExpTime = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(signIn.pending, (state) => setDefaultPendingState(state))
            .addCase(signIn.fulfilled, (state, action) => {
                state.user.email = action.payload.email;
                if (action.payload.requiresEmailVerification) {
                    state.isLoading = false;
                    state.isSignedIn = false;
                }
            })
            .addCase(signIn.rejected, (state, action) => setDefaultRejectedState(state, action));
        builder
            .addCase(signUp.pending, (state) => setDefaultPendingState(state))
            .addCase(signUp.fulfilled, (state, action) => {
                state.user.email = action.payload.email;
                state.isSignedIn = false;
                state.successMessage = action.payload.verificationEmailSent
                    ? getTranslations(state.user.language).VERIFICATION_EMAIL_SENT
                    : getTranslations(state.user.language).PROFILE_CREATED;
                state.isSuccess = true;
                state.isSignedUp = true;
                state.isLoading = false;
            })
            .addCase(signUp.rejected, (state, action) => setDefaultRejectedState(state, action));
        builder
            .addCase(logOut.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(logOut.fulfilled, (state) => {
                state.isLoading = false;
                state.isSignedIn = false;
            })
            .addCase(logOut.rejected, (state, action) => setDefaultRejectedState(state, action));
        builder
            .addCase(setUserData.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(setUserData.fulfilled, () => {})
            .addCase(setUserData.rejected, (state, action) => setDefaultRejectedState(state, action));
        builder
            .addCase(getUserData.pending, (state) => setDefaultPendingState(state))
            .addCase(getUserData.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.isSignedIn = true;
                state.user.theme = payload?.theme;
                state.user.language = normalizeLanguage(payload?.language);
                state.user.isVerified = payload?.isVerified;
                state.user.presets = payload?.presets;
            })
            .addCase(getUserData.rejected, (state, action) => setDefaultRejectedState(state, action));
        builder
            .addCase(setPresets.pending, (state) => setDefaultPendingState(state))
            .addCase(setPresets.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.user.presets = payload;
                state.isSuccess = true;
                state.successMessage = getTranslations(state.user.language).PRESET_SAVED;
            })
            .addCase(setPresets.rejected, (state, action) => setDefaultRejectedState(state, action));
        builder
            .addCase(deletePresets.pending, (state) => setDefaultPendingState(state))
            .addCase(deletePresets.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.user.presets = payload;
                state.isSuccess = true;
                state.successMessage = getTranslations(state.user.language).PRESET_DELETED;
            })
            .addCase(deletePresets.rejected, (state, action) => setDefaultRejectedState(state, action));
    },
});

export const { setIsSignedIn, resetError, resetSuccess, setTokenExpTime, setPreferences } = userSlice.actions;
export default userSlice.reducer;

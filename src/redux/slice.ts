import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";
import { DefaultPendingState, DefaultRejectedState, DefaultRejectedAction } from "./interfaces";
import { signIn, signUp, logOut, getUserData, setUserData, setPresets, deletePresets } from "./thunks";
import en from "../translations/en";

const { PROFILE_CREATED, PRESET_SAVED, PRESET_DELETED, UNKNOWN_ERROR } = en;

// Use it if you need success popup
const setDefaultPendingState = (state: DefaultPendingState) => {
    state.isLoading = true;
    state.isSuccess = false; // State for success popup only
    state.successMessage = ""; // State for success popup only
    state.isError = false;
    state.errorMessage = "";
};

const setDefaultRejectedState = (state: DefaultRejectedState, action: DefaultRejectedAction) => {
    state.isLoading = false;
    state.isError = true;
    state.errorMessage = action.error.message || UNKNOWN_ERROR;
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
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
        // SIGN IN
        builder
            .addCase(signIn.pending, (state) => setDefaultPendingState(state))
            .addCase(signIn.fulfilled, (state, action) => {
                // state.isSuccess = true; Moved to getUserData.fulfilled()
                // state.isLoading = false; Moved to getUserData.fulfilled()
                // state.isSignedIn = true; Moved to getUserData.fulfilled()
                state.user.email = action.payload.user.email;
            })
            .addCase(signIn.rejected, (state, action) => setDefaultRejectedState(state, action));
        // SIGN UP
        builder
            .addCase(signUp.pending, (state) => setDefaultPendingState(state))
            .addCase(signUp.fulfilled, (state) => {
                state.successMessage = PROFILE_CREATED;
                state.isSuccess = true;
                state.isSignedUp = true;
                state.isLoading = false;
            })
            .addCase(signUp.rejected, (state, action) => setDefaultRejectedState(state, action));
        // LOG OUT
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
        // SET USER DATA
        builder
            .addCase(setUserData.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(setUserData.fulfilled, () => {})
            .addCase(setUserData.rejected, (state, action) => setDefaultRejectedState(state, action));
        // GET USER DATA
        builder
            .addCase(getUserData.pending, (state) => setDefaultPendingState(state))
            .addCase(getUserData.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.isSignedIn = true;
                state.user.theme = payload?.theme;
                state.user.language = payload?.language;
                state.user.isVerified = payload?.isVerified;
                state.user.presets = payload?.presets;
            })
            .addCase(getUserData.rejected, (state, action) => setDefaultRejectedState(state, action));
        // SET PRESETS
        builder
            .addCase(setPresets.pending, (state) => setDefaultPendingState(state))
            .addCase(setPresets.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.user.presets = payload;
                state.isSuccess = true;
                state.successMessage = PRESET_SAVED;
            })
            .addCase(setPresets.rejected, (state, action) => setDefaultRejectedState(state, action));
        // DELETE PRESETS
        builder
            .addCase(deletePresets.pending, (state) => setDefaultPendingState(state))
            .addCase(deletePresets.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.user.presets = payload;
                state.isSuccess = true;
                state.successMessage = PRESET_DELETED;
            })
            .addCase(deletePresets.rejected, (state, action) => setDefaultRejectedState(state, action));
    },
});

export const { setIsSignedIn, resetError, resetSuccess, setTokenExpTime } = userSlice.actions;
export default userSlice.reducer;

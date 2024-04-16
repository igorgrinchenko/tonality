import { configureStore } from "@reduxjs/toolkit";
import { userSlice } from "./slice";

export const userReducer = userSlice.reducer;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Selectors
export const user = (state: RootState) => state.user.user;
export const isSignedIn = (state: RootState) => state.user.isSignedIn;
export const isSignedUp = (state: RootState) => state.user.isSignedUp;
export const isLoading = (state: RootState) => state.user.isLoading;
export const isError = (state: RootState) => state.user.isError;
export const isSuccess = (state: RootState) => state.user.isSuccess;
export const errorMessage = (state: RootState) => state.user.errorMessage;
export const successMessage = (state: RootState) => state.user.successMessage;
// Selectors

const rootReducer = {
    user: userReducer,
};

const store = configureStore({
    reducer: rootReducer,
});

export default store;

import { UserState } from "./interfaces";

const STORAGE_tokenExpTime: string | null = localStorage.getItem("tokenExpTime");
const STORAGE_userEmail: string | null = localStorage.getItem("userEmail");

export const initialState: UserState = {
    user: {
        email: STORAGE_userEmail || "",
        tokenExpTime: Number(STORAGE_tokenExpTime) || Number(null),
        theme: "dark",
        language: "ua",
        isVerified: false,
        presets: [],
    },
    isSignedIn: false,
    isSignedUp: false,
    isLoading: false,
    isError: false,
    isSuccess: false,
    errorMessage: "",
    successMessage: "",
};

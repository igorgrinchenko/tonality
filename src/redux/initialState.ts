import { UserState } from "./interfaces";
import { normalizeLanguage } from "../translations/getTranslations";

const STORAGE_tokenExpTime: string | null = localStorage.getItem("tokenExpTime");
const STORAGE_userEmail: string | null = localStorage.getItem("userEmail");
const STORAGE_language: string | null = localStorage.getItem("language");
const initialLanguage = normalizeLanguage(STORAGE_language);

if (STORAGE_language !== initialLanguage) {
    localStorage.setItem("language", initialLanguage);
}

export const initialState: UserState = {
    user: {
        email: STORAGE_userEmail || "",
        tokenExpTime: Number(STORAGE_tokenExpTime) || Number(null),
        theme: "dark",
        language: initialLanguage,
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

import { Language } from "../common/interfaces";

export interface UserState {
    user: {
        email: string | null;
        tokenExpTime: number;
        theme: "dark" | "light";
        language: Language;
        isVerified: boolean;
        presets: [] | Presets[];
    };
    isSignedIn: boolean;
    isSignedUp: boolean;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    errorMessage: string;
    successMessage: string;
}

export interface DefaultPendingState {
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    errorMessage: string;
    successMessage: string;
}

export interface DefaultRejectedAction {
    error: {
        message?: string;
    };
}

export interface AuthCredentials {
    email: string;
    password: string;
    language?: Language;
}

export interface SignInResult {
    email: string | null;
    requiresEmailVerification: boolean;
}

export interface SignUpResult {
    email: string;
    verificationEmailSent: boolean;
}

export interface UserSettings {
    theme: "dark" | "light";
    language: Language;
    isVerified: boolean;
    presets: Presets[];
}

export interface UserData {
    theme: string;
    language: Language;
    isVerified: boolean;
    uid: string;
}

export interface IUId {
    uid: string;
}

export interface Presets extends IUId {
    presetId?: number;
    presetName?: string;
    presetValue?: string;
    audioPath?: string;
}

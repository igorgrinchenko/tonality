export interface PrivateRouteProps {
    routeElement: React.ReactElement;
}

export interface FirebaseConfig {
    apiKey: "AIzaSyCsqt_C6kFGyR5GfVUac8w1tHzA0b74Fck" & string;
    authDomain: "tonallity-app.firebaseapp.com" & string;
    projectId: "tonallity-app" & string;
    storageBucket: "tonallity-app.appspot.com" & string;
    messagingSenderId: "109086601547" & string;
    appId: "1:109086601547:web:b81cc4c7f0e848ef5638ce" & string;
}

export interface Translations {
    PROFILE_CREATED: string;
    SIGN_IN: string;
    SIGN_UP: string;
    LOG_OUT: string;
    LOGIN_TO_YOUR_ACC: string;
    CREATE_AN_ACCOUNT: string;
    SELECT_COUNT_OF_ALTERATION: string;
    ZERO: string;
    ONE: string;
    TWO: string;
    THREE: string;
    FOUR: string;
    FIVE: string;
    SIX: string;
    SEVEN: string;
    MAJOR: string;
    MINOR: string;
    DETERMINE: string;
    FILTERS: string;
    OUTPUT: string;
    UNKNOWN_ERROR: string;
    RETURN_BACK: string;
    LANG: string;
    MODE: string;
    DARK: string;
    LIGHT: string;
    UA: string;
    EN: string;
    ERROR_BOUNDARY_MESSAGE: string;
    RELOAD: string;
    SAVE_PRESET: string;
    PRESET_SAVED: string;
    PRESET_DELETED: string;
    TONALITY: string;
    TUNE: string;
    PRESETS: string;
    PROFILE: string;
    PLAY: string;
    STOP: string;
    DELETE: string;
    DELETE_PRESET_CONFIRM_TEXT: string;
    CONTACT_THE_DEVELOPER: string;
    PRESET_NAME: string;
}

export interface CharactersCountOptions {
    value: number;
    label: string;
}

export interface TonalitySwitchProps {
    checked: boolean;
    onChange: () => void;
    isDisabledSwitch?: boolean;
}

import { SyntheticEvent } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { isError, isSuccess, errorMessage, successMessage, user } from "../redux/store";
import { resetError, resetSuccess } from "../redux/slice";
import getTranslations from "../translations/getTranslations";

export default function Toast() {
    const hasError = useSelector(isError);
    const hasSuccess = useSelector(isSuccess);
    const errorText = useSelector(errorMessage);
    const successText = useSelector(successMessage);
    const { language } = useSelector(user);
    const lang = getTranslations(language);
    const dispatch = useDispatch();

    const dismiss = () => {
        dispatch(resetError());
        dispatch(resetSuccess());
    };

    const handleClose = (_event: SyntheticEvent | Event | null, reason: string) => {
        if (reason !== "clickaway") dismiss();
    };

    return (
        <Snackbar className="app-toast" anchorOrigin={{ vertical: "bottom", horizontal: "center" }} open={hasError || hasSuccess} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={dismiss} closeText={lang.CLOSE} severity={hasError ? "error" : "success"} variant="outlined">
                {hasError ? errorText : successText}
            </Alert>
        </Snackbar>
    );
}

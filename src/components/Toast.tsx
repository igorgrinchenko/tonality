import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { isError, isSuccess, errorMessage, successMessage } from "../redux/store";
import { resetError, resetSuccess } from "../redux/slice";
import { ToastType } from "../common/enums";

const Toast: React.FC = () => {
    const _isError: boolean = useSelector(isError);
    const _isSuccess: boolean = useSelector(isSuccess);
    const _errorMessage: string = useSelector(errorMessage);
    const _successMessage: string = useSelector(successMessage);

    const dispatch = useDispatch();

    const setToastOpenStatus = _isError || _isSuccess;
    const setToastType = () => (_isError ? ToastType.error : ToastType.success);
    const setErrorMessage = () => (_isError ? _errorMessage : _successMessage);

    const handleClose = (_event: Event | React.SyntheticEvent<any, Event> | null, reason: string): void => {
        if (reason === "clickaway") {
            return;
        }
        dispatch(resetError());
        dispatch(resetSuccess());
    };

    const handleAlertClose = (): void => {
        dispatch(resetError());
        dispatch(resetSuccess());
    };
    return (
        <Snackbar
            anchorOrigin={{
                vertical: "top",
                horizontal: "center",
            }}
            open={setToastOpenStatus}
            autoHideDuration={6000}
            onClose={handleClose}
        >
            <Alert
                onClose={handleAlertClose}
                severity={setToastType()}
                variant="filled"
                sx={{
                    width: "100%",
                }}
            >
                {setErrorMessage()}
            </Alert>
        </Snackbar>
    );
};

export default Toast;

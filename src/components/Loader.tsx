import { Backdrop, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { user } from "../redux/store";
import getTranslations from "../translations/getTranslations";

export default function Loader() {
    const { language } = useSelector(user);
    const lang = getTranslations(language);

    return (
        <Backdrop open className="loading-backdrop" sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}>
            <div className="loading-card" role="status" aria-live="polite">
                <CircularProgress size={28} />
                <span>{lang.LOADING}</span>
            </div>
        </Backdrop>
    );
}

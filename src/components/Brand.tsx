import { Link } from "react-router";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import { useSelector } from "react-redux";
import { isSignedIn } from "../redux/store";
import { authPath, tonalityPath } from "../routes/routes";

export default function Brand() {
    const signedIn = useSelector(isSignedIn);

    return (
        <Link className="brand" to={signedIn ? tonalityPath : authPath} aria-label="Tonality">
            <span className="brand-mark" aria-hidden="true">
                <MusicNoteRoundedIcon />
            </span>
            <span className="brand-name">
                tonality<span className="brand-dot">.</span>
            </span>
        </Link>
    );
}

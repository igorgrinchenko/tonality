import { makeStyles } from "@mui/styles";
import { darkTheme, lightTheme, active, disabled } from "./colors";

const useStyles = makeStyles({
    app: {
        backgroundColor: darkTheme,
        color: lightTheme,
        position: "relative",
        zIndex: 0,
        height: "100vh",
    },
    container: {
        height: "88vh",
        padding: "0px 10px",
        display: "flex !important",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    errorBoundary: {
        height: "100vh",
        padding: "0px 10px",
        backgroundColor: darkTheme,
        color: lightTheme,
        display: "flex !important",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },

    select: {
        backgroundColor: `${lightTheme} !important`,
    },
    // General
    button: {
        width: "260px",
        height: "50px",
    },
    input: {
        backgroundColor: lightTheme,
        borderRadius: "4px",
        width: "260px",
    },
    loader: {
        position: "absolute",
        zIndex: 3,
        width: "100px !important",
        height: "100px !important",
        color: darkTheme,
    },
    blur: {
        position: "absolute",
        top: 0,
        right: 0,
        width: "100%",
        height: "100%",
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        zIndex: 2,
    },
    contactDeveloper: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    // Header
    headerWrapper: {
        height: "5vh",
        paddingTop: "20px",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
    },
    // Footer
    footerContainer: {
        position: "fixed",
        backgroundColor: darkTheme,
        minWidth: "100%",
    },
    footerWrapper: {
        height: "7vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
    },
    // Auth
    authButtonWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
    },
    // Sign In
    signInWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
    },
    // Sign Up
    signUpWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
    },
    // Tonality
    tonalityClass: {
        width: "100%",
        maxWidth: "340px",
        display: "flex",
        flexDirection: "column",
        gap: "30px",
    },
    tonalityWrapper: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "340px",
        padding: "14px",
        borderRadius: "4px",
        boxShadow: `0 0 5px ${lightTheme}`,
        gap: "12px",
    },
    tonalitySwitchWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    tonalitySwitch: {
        display: "flex",
        flexDirection: "row",
        gap: "10px",
    },
    tonalityRow: {
        display: "flex",
        justifyContent: "space-between",
    },
    tonalityDisabledButton: {
        backgroundColor: `${disabled} !important`,
    },
    // User
    userWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        maxWidth: "340px",
        padding: "14px",
        borderRadius: "4px",
        boxShadow: `0 0 5px ${lightTheme}`,
    },
    userAvatar: {
        width: "100px !important",
        height: "100px !important",
    },
    userSettings: {
        width: "250px",
    },
    userEmailWrapper: {
        display: "flex",
        marginBottom: "20px",
        gap: "10px",
    },
    // Tune
    forkWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "30px",
    },
    forkImage: {
        width: "200px",
        height: "auto",
        display: "block",
    },
    forkSwitchWrapper: {
        display: "flex",
        gap: "20px",
        alignItems: "center",
    },
    // Presets
    presetsList: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "0px !important",
    },
    presetListItem: {
        width: "100%",
        backgroundColor: active,
        borderRadius: "4px",
    },
    // NotPWAPage
    notPWAPageWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
    },
    notPWAPageContainer: {
        height: "100vh",
        overflowY: "auto",
        padding: "10px",
        display: "flex !important",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    accordionDetails: {
        maxHeight: "500px",
        overflowY: "auto",
    },
    accordionImages: {
        maxWidth: "350px",
        width: "100%",
        display: "block",
    },
    // LandscapeForbiddenPage
    landscapeForbiddenWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
    },
    landscapeForbiddenContainer: {
        height: "100vh",
        padding: "0px 10px",
        display: "flex !important",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    // Modal
    modalContent: {
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        padding: "40px 20px",
        borderRadius: "4px",
    },
});

export default useStyles;

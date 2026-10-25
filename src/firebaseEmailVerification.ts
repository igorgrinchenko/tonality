import { sendEmailVerification, User } from "firebase/auth";

function getEmailVerificationActionSettings() {
    const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);

    return {
        url: new URL("?verified=1", appBaseUrl).toString(),
        handleCodeInApp: false,
    };
}

export async function sendVerificationEmail(user: User): Promise<void> {
    try {
        await sendEmailVerification(user, getEmailVerificationActionSettings());
    } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
        if (code !== "auth/unauthorized-continue-uri" && code !== "auth/invalid-continue-uri") {
            throw error;
        }

        await sendEmailVerification(user);
    }
}

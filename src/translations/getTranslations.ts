import { Translations } from "../common/interfaces";
import de from "./de";
import en from "./en";
import ua from "./ua";

export default function getTranslations(language: string): Translations {
    if (language === "ua") {
        return ua;
    }

    if (language === "de") {
        return de;
    }

    return en;
}

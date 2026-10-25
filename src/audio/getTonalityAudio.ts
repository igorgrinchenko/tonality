import C from "./major/C.mp3";
import G from "./major/G.mp3";
import D from "./major/D.mp3";
import A from "./major/A.mp3";
import E from "./major/E.mp3";
import B from "./major/B.mp3";
import Fd_Gb from "./major/Fd_Gb.mp3";
import Db_Cd from "./major/Db_Cd.mp3";
import Ab_Gd from "./major/Ab_Gd.mp3";
import Eb_Dd from "./major/Eb_Dd.mp3";
import Bb_Ad from "./major/Bb_Ad.mp3";
import F from "./major/F.mp3";
import Cm from "./minor/Cm.mp3";
import Gm from "./minor/Gm.mp3";
import Dm from "./minor/Dm.mp3";
import Am from "./minor/Am.mp3";
import Em from "./minor/Em.mp3";
import Bm from "./minor/Bm.mp3";
import Fdm_Gbm from "./minor/Fdm_Gbm.mp3";
import Dbm_Cdm from "./minor/Dbm_Cdm.mp3";
import Abm_Gdm from "./minor/Abm_Gdm.mp3";
import Ebm_Ddm from "./minor/Ebm_Ddm.mp3";
import Bbm_Adm from "./minor/Bbm_Adm.mp3";
import Fm from "./minor/Fm.mp3";

const audioPaths: Record<string, string> = {
    C,
    G,
    D,
    A,
    E,
    B,
    "F#/Gb": Fd_Gb,
    "Db/C#": Db_Cd,
    "Ab/G#": Ab_Gd,
    "Eb/D#": Eb_Dd,
    "Bb/A#": Bb_Ad,
    F,
    Cm,
    Gm,
    Dm,
    Am,
    Em,
    Bm,
    "F#m/Gbm": Fdm_Gbm,
    "Dbm/C#m": Dbm_Cdm,
    "Abm/G#m": Abm_Gdm,
    "Ebm/D#m": Ebm_Ddm,
    "Bbm/A#m": Bbm_Adm,
    Fm,
};

export default function getTonalityAudio(tonality?: string) {
    return tonality ? audioPaths[tonality] : undefined;
}

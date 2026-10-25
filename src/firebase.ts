import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { FirebaseConfig } from "./common/interfaces";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseConfig = {
    apiKey: "AIzaSyCsqt_C6kFGyR5GfVUac8w1tHzA0b74Fck",
    authDomain: "tonallity-app.firebaseapp.com",
    projectId: "tonallity-app",
    storageBucket: "tonallity-app.appspot.com",
    messagingSenderId: "109086601547",
    appId: "1:109086601547:web:b81cc4c7f0e848ef5638ce",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

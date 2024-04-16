// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { FirebaseConfig } from "./common/interfaces";
import { getFirestore } from "firebase/firestore"; // Для роботи з Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig: FirebaseConfig = {
    apiKey: "AIzaSyCsqt_C6kFGyR5GfVUac8w1tHzA0b74Fck",
    authDomain: "tonallity-app.firebaseapp.com",
    projectId: "tonallity-app",
    storageBucket: "tonallity-app.appspot.com",
    messagingSenderId: "109086601547",
    appId: "1:109086601547:web:b81cc4c7f0e848ef5638ce",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app); // Ініціалізація Firestore

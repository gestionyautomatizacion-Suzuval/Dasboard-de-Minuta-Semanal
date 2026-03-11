import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyClJzSQk-whlAbX88mNl63uCLOpS_doIzk",
    authDomain: "gen-lang-client-0135747098.firebaseapp.com",
    projectId: "gen-lang-client-0135747098",
    storageBucket: "gen-lang-client-0135747098.firebasestorage.app",
    messagingSenderId: "623434334058",
    appId: "1:623434334058:web:be5082c9b5c02973906f13"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "minuta-suzuval-eevv");
const auth = getAuth(app);

export { app, db, auth, collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, setDoc, getDoc, serverTimestamp };

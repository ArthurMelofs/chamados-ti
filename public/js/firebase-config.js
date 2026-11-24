
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5Wgpig5m5X470mCZMXed_Gk1plwGttKA",
    authDomain: "chamados-ti-5e808.firebaseapp.com",
    projectId: "chamados-ti-5e808",
    storageBucket: "chamados-ti-5e808.firebasestorage.app",
    messagingSenderId: "960789456968",
    appId: "1:960789456968:web:c09d967ce9b45f64ad107d",
    measurementId: "G-Z3R0337S89"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };

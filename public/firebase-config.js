import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    updateDoc, 
    onSnapshot, 
    orderBy, 
    query, 
    where, 
    getDocs, 
    serverTimestamp,
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB9nn3MB9EqRD8BTNdZlBec7Z2XnbguhXE",
    authDomain: "wira-diary.firebaseapp.com",
    projectId: "wira-diary",
    storageBucket: "wira-diary.firebasestorage.app",
    messagingSenderId: "1049277772566",
    appId: "1:1049277772566:web:fa14470b20fd712fc01637",
    measurementId: "G-G6BYN1SF63"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export {
    db,
    analytics,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    orderBy,
    query,
    where,
    getDocs,
    serverTimestamp,
    getDoc
}; 
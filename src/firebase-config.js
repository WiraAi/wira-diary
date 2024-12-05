import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
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
const db = getFirestore(app);

export {
    db,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    getDoc
}; 
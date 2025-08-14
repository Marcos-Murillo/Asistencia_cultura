import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAtADGUjuS6ZRrsQZ78QNbpR95w9bxxGHw",
  authDomain: "culturestock-a5ca9.firebaseapp.com",
  projectId: "culturestock-a5ca9",
  storageBucket: "culturestock-a5ca9.firebasestorage.app",
  messagingSenderId: "746178900246",
  appId: "1:746178900246:web:912c5ca6b4a381197aa037",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

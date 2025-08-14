import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAKX6N6CI-tHg5xp_mIxRmXVxNbHcqFP9U",
  authDomain: "cultuaraasistencia.firebaseapp.com",
  projectId: "cultuaraasistencia",
  storageBucket: "cultuaraasistencia.firebasestorage.app",
  messagingSenderId: "431009261783",
  appId: "1:431009261783:web:5f1d305ece22d74873a892",
  measurementId: "G-MF6JDY016S"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

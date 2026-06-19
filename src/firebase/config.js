import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCVB3S4boXm3lWnh7KJTnQxDH1WnHAa7Lo",
  authDomain: "mj-store-5fb1a.firebaseapp.com",
  projectId: "mj-store-5fb1a",
  storageBucket: "mj-store-5fb1a.firebasestorage.app", // ✅ Correct bucket setup
  messagingSenderId: "425588980600",
  appId: "1:425588980600:web:a10ac97df301434777a68d"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export default app
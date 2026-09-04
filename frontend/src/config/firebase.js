import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD_ZgobyyyuCY5AwhBW8uwW33GSSZYHD1o",
  authDomain: "agileflow-d885a.firebaseapp.com",
  projectId: "agileflow-d885a",
  storageBucket: "agileflow-d885a.appspot.com",
  messagingSenderId: "240713246310",
  appId: "1:240713246310:web:d4c92cdb89851ec3496fa7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

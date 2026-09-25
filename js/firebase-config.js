  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  const firebaseConfig = {
    apiKey:            "AIzaSyDgS9GvbvHaHpaaRlu-JnmjDyEblgIggIU",
    authDomain:        "cuaderno-44643.firebaseapp.com",
    projectId:         "cuaderno-44643",
    storageBucket:     "cuaderno-44643.firebasestorage.app",
    messagingSenderId: "608607720420",
    appId:             "1:608607720420:web:d99e9ec4146f24482b6df1",
    measurementId:     "G-ZV86FXSBND"
  };

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  window._fbDb   = db;
  window._fbFns  = { doc, getDoc, setDoc, collection, getDocs, deleteDoc };
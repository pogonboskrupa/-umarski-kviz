// Popunite ove vrijednosti podacima svog Firebase projekta:
// Firebase Console → Project settings (zupčanik) → General → Your apps → SDK setup and configuration.
// Ovo NISU tajni ključevi — sigurno je da stoje javno u frontend kodu. Stvarna zaštita
// podataka postavlja se preko Firestore Security Rules (uputstvo u README.md).
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const FIREBASE_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY";

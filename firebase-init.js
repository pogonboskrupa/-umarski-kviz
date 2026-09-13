let db = null;
let auth = null;

if (typeof FIREBASE_CONFIGURED !== "undefined" && FIREBASE_CONFIGURED) {
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
}

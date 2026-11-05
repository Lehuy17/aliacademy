// ALI English Firebase Web App configuration (public client identifiers).
// Admin/service-account credentials must never be placed here.
export const firebaseConfig = {
  apiKey: "AIzaSyC2C4wYUyAs2FS5-fhV7eM422POZC3nccw",
  authDomain: "ali-english.firebaseapp.com",
  projectId: "ali-english",
  storageBucket: "ali-english.firebasestorage.app",
  messagingSenderId: "310829974242",
  appId: "1:310829974242:web:f0e96b42b3023e77d014bb",
  measurementId: "G-SCE345TH6C"
};
export const isConfigured = () => !Object.values(firebaseConfig).some(v => !v || String(v).includes("PASTE_"));

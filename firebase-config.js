// Firebase → Project settings → Your apps → Web app → SDK setup and configuration.
// Paste ONLY the Firebase Web App config values (not a service account key).
export const firebaseConfig={
  apiKey:'PASTE_FIREBASE_WEB_API_KEY',
  authDomain:'PASTE_PROJECT_ID.firebaseapp.com',
  projectId:'PASTE_PROJECT_ID',
  appId:'PASTE_FIREBASE_WEB_APP_ID',
  messagingSenderId:'PASTE_MESSAGING_SENDER_ID'
};
export const isConfigured=()=>!Object.values(firebaseConfig).some(v=>!v||String(v).includes('PASTE_'));

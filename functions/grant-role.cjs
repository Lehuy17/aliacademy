"use strict";
// Run ONLY on a trusted admin machine with Application Default Credentials or
// a service account supplied through GOOGLE_APPLICATION_CREDENTIALS.
// Usage: ALI_BOOTSTRAP_CONFIRM=YES node functions/grant-role.cjs teacher@example.com teacher
const {initializeApp,applicationDefault}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const [email,role]=process.argv.slice(2);
if(process.env.ALI_BOOTSTRAP_CONFIRM!=="YES"||!email||!["teacher","admin"].includes(role)){
 console.error("Usage: ALI_BOOTSTRAP_CONFIRM=YES node functions/grant-role.cjs <email> <teacher|admin>");
 process.exit(1);
}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){console.error("Invalid email");process.exit(1);}
initializeApp({credential:applicationDefault(),projectId:"ali-english"});
(async()=>{
 const auth=getAuth(),db=getFirestore();
 const target=await auth.getUserByEmail(email.trim().toLowerCase());
 if(target.disabled)throw Error("Target Firebase Authentication account is disabled.");
 const existing=await db.doc("users/"+target.uid).get();
 const existingData=existing.exists?existing.data():{};
 const claims={...(target.customClaims||{}),role};
 await auth.setCustomUserClaims(target.uid,claims);
 await db.doc("users/"+target.uid).set({
   name:existingData.name||target.displayName||email.split("@")[0],
   email:target.email,role,status:"active",
   staffActivatedAt:FieldValue.serverTimestamp()
 },{merge:true});
 console.log("Role assigned to Firebase UID: "+target.uid+"; role="+role+
             ". User must sign out and sign in again to refresh token.");
})().catch(e=>{console.error(e.message);process.exitCode=1;});

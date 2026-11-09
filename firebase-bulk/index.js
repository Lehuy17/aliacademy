'use strict';
/**
 * ALI English bulk student provisioner.
 * Deploy only to Firebase project ali-english.
 * Apps Script signs requests with the secret stored only in Script Properties.
 * Do not expose this endpoint or any secret in GitHub Pages.
 */
const crypto=require('node:crypto');
const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const admin=require('firebase-admin');
admin.initializeApp();
const SYNC_KEY=defineSecret('ALI_BULK_SYNC_KEY');
const RESEND_KEY=defineSecret('ALI_RESEND_API_KEY');
const db=admin.firestore();
const safeText=(value,max=120)=>String(value||'').trim().slice(0,max);
const emailOK=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<255;
const same=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(a,b);
async function invite(user,email,secret){
  const apiKey=secret.value();
  const from=process.env.ALI_INVITE_FROM;
  if(!apiKey||!from)return 'CHUA_CAU_HINH_EMAIL';
  const record=db.collection('users').doc(user.uid);
  const snapshot=await record.get();
  if(snapshot.data()?.invitationSentAt)return 'DA_GUI';
  const link=await admin.auth().generatePasswordResetLink(email);
  const html='<p>Chào mừng bạn đến với ALI English.</p><p>Vui lòng đặt mật khẩu qua liên kết riêng bên dưới (không chia sẻ liên kết):</p><p><a href="'+link.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">Thiết lập mật khẩu</a></p><p>Nếu không yêu cầu tài khoản, vui lòng liên hệ ALI.</p>';
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:'ALI English | Kích hoạt tài khoản học viên',html})});
  if(!response.ok){console.error('Invite delivery error',response.status);return 'LOI_GUI_EMAIL';}
  await record.set({invitationSentAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
  return 'DA_GUI';
}
async function provision(entry,secret){
 const email=safeText(entry.email,254).toLowerCase();
 if(!emailOK(email))return {row:entry.row,status:'EMAIL_KHONG_HOP_LE',uid:'',invite:'CHUA_GUI'};
 let user,created=false;
 try{
   try{user=await admin.auth().getUserByEmail(email);}
   catch(e){if(e.code!=='auth/user-not-found')throw e;
     user=await admin.auth().createUser({email,emailVerified:false,disabled:false});created=true;}
   const ref=db.collection('users').doc(user.uid);
   const snap=await ref.get();
   const profile=snap.data();
   if(profile?.role&&profile.role!=='student')return {row:entry.row,status:'XUNG_DOT_QUYEN',uid:user.uid,invite:'CHUA_GUI'};
   if(user.disabled)return {row:entry.row,status:'TAI_KHOAN_BI_KHOA',uid:user.uid,invite:'CHUA_GUI'};
   const newProfile={email,role:'student',status:profile?.status||'active',name:profile?.name||safeText(entry.name,120)||email.split('@')[0],school:profile?.school||safeText(entry.school,120)||'ALI English'};
   if(profile){await ref.set(newProfile,{merge:true});}
   else{await ref.set({...newProfile,createdAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});}
   let invitation='CHUA_GUI';
   try{invitation=await invite(user,email,secret);}
   catch(err){console.error('Invite error',err?.message);invitation='LOI_GUI_EMAIL';}
   return {row:entry.row,status:created?'DA_TAO':'DA_TON_TAI',uid:user.uid,invite:invitation};
 }catch(err){
   console.error('Provision error:',err?.code||err?.message);
   return {row:entry.row,status:'LOI',uid:user?.uid||'',invite:'CHUA_GUI',error:String(err?.code||'SERVER_ERROR').slice(0,100)};
 }
}
exports.bulkProvisionStudents=onRequest({region:'asia-southeast1',memory:'512MiB',timeoutSeconds:120,maxInstances:3,secrets:[SYNC_KEY,RESEND_KEY],invoker:'public'},async(req,res)=>{
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const raw=req.rawBody?.toString('utf8')||'';
 const timestamp=req.get('x-ali-timestamp')||'',signature=req.get('x-ali-signature')||'';
 const time=Number(timestamp);
 if(!/^\d{13}$/.test(timestamp)||Math.abs(Date.now()-time)>120000)return res.status(401).json({error:'TIMESTAMP_INVALID'});
 const expected=crypto.createHmac('sha256',SYNC_KEY.value()).update(timestamp+'.'+raw).digest('hex');
 if(!/^[0-9a-f]{64}$/.test(signature)||!same(Buffer.from(signature,'hex'),Buffer.from(expected,'hex')))return res.status(401).json({error:'SIGNATURE_INVALID'});
 let payload;
 try{payload=JSON.parse(raw);}catch{return res.status(400).json({error:'INVALID_JSON'});}
 if(payload?.project!=='ali-english'||!Array.isArray(payload?.rows)||payload.rows.length<1||payload.rows.length>20)return res.status(400).json({error:'INVALID_BATCH'});
 if(payload.rows.some(x=>!Number.isInteger(x.row)||x.row<2||x.row>1001||typeof x.email!=='string'))return res.status(400).json({error:'INVALID_ROWS'});
 const result=[];
 // Serial provisioning reduces Firebase rate pressure and is retry-safe.
 for(const entry of payload.rows)result.push(await provision(entry,RESEND_KEY));
 return res.status(200).json({results:result});
});
#!/usr/bin/env node
'use strict';
/**
 * ALI English: Small-batch student import for Firebase Spark.
 * Usage:
 *    npm install
 *    node create-students.cjs students.csv           # dry run
 *    node create-students.cjs students.csv --apply   # makes changes
 *
 * Credentials: keep firebase-service-account.json on your own computer only.
 * NEVER upload the JSON key or students.csv to GitHub.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {parse}=require('csv-parse/sync');
const admin=require('firebase-admin');
const MAX_ROWS=10;
const projectId='ali-english';
const input=process.argv[2];
const apply=process.argv.includes('--apply');
if(!input||process.argv.includes('--help')){
 console.log('Cách dùng: node create-students.cjs students.csv [--apply]');
 console.log('Không có --apply: chỉ kiểm tra. Có --apply: tạo tài khoản Firebase.');
 process.exit(input?0:1);
}
const csvPath=path.resolve(input);
if(!fs.existsSync(csvPath)){console.error('Không tìm thấy file:',csvPath);process.exit(1);}
const serviceKeyPath=path.join(__dirname,'firebase-service-account.json');
if(!fs.existsSync(serviceKeyPath)){
 console.error('Thiếu firebase-service-account.json trong thư mục spark-local. Giữ khóa riêng trên máy, không tải lên GitHub.');
 process.exit(1);
}
let key;
try{key=JSON.parse(fs.readFileSync(serviceKeyPath,'utf8'));}
catch{console.error('File Firebase service-account JSON không hợp lệ.');process.exit(1);}
if(key.project_id!==projectId){console.error('Dừng: Khóa Firebase không thuộc dự án ali-english.');process.exit(1);}
const records=parse(fs.readFileSync(csvPath,'utf8').replace(/^\uFEFF/,''),{columns:true,skip_empty_lines:true,bom:true,trim:true,relax_quotes:true});
if(records.length>MAX_ROWS){console.error('Tối đa '+MAX_ROWS+' học viên mỗi lần để tránh nhập nhầm. File hiện có '+records.length+' dòng.');process.exit(1);}
if(!records.length){console.error('File CSV chưa có học viên.');process.exit(1);}
const emailKey=Object.keys(records[0]).find(s=>['email','e-mail'].includes(s.toLowerCase().trim()));
if(!emailKey){console.error('Không có cột Email. Hãy xuất tab Học viên sang CSV.');process.exit(1);}
const nameKey=Object.keys(records[0]).find(s=>['họ tên','ho ten','name'].includes(s.toLowerCase().trim()));
const schoolKey=Object.keys(records[0]).find(s=>['lớp','lop','school','class'].includes(s.toLowerCase().trim()));
const requestKey=Object.keys(records[0]).find(s=>['yêu cầu','yeu cau'].includes(s.toLowerCase().trim()));
const requests=records.map((row,i)=>({
 line:i+2,
 email:String(row[emailKey]||'').trim().toLowerCase(),
 name:String(nameKey?row[nameKey]||'':'').trim().slice(0,120),
 school:String(schoolKey?row[schoolKey]||'':'').trim().slice(0,120),
 action:String(requestKey?row[requestKey]||'':'').trim().toUpperCase()
})).filter(x=>x.email&&x.action!=='BO_QUA');
const invalid=requests.filter(x=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)||x.email.length>254||(x.action&&x.action!=='CHO_TAO'));
const unique=new Set(requests.map(x=>x.email));
if(invalid.length||unique.size!==requests.length){
 console.error('Lỗi dữ liệu: email không hợp lệ, trùng trong file hoặc lệnh Yêu cầu không hợp lệ.');
 invalid.forEach(x=>console.error('Dòng '+x.line+': '+x.email));
 process.exit(1);
}
console.log('Firebase:',projectId,'| Số email hợp lệ:',requests.length,'| Chế độ:',apply?'TẠO TÀI KHOẢN':'CHỈ KIỂM TRA');
console.table(requests.map(x=>({row:x.line,email:x.email,name:x.name,school:x.school})));
if(!requests.length){console.error('Không tìm thấy email cần tạo.');process.exit(1);}
if(!apply){console.log('Chưa tạo tài khoản nào. Nếu đúng danh sách, chạy lại và thêm --apply.');process.exit(0);}
admin.initializeApp({credential:admin.credential.cert(key),projectId});
const auth=admin.auth(),db=admin.firestore();
async function processOne(item){
 let user,created=false;
 try{
  try{user=await auth.getUserByEmail(item.email);}
  catch(err){
   if(err.code!=='auth/user-not-found')throw err;
   user=await auth.createUser({email:item.email,emailVerified:false,disabled:false,password:crypto.randomBytes(36).toString('base64url')});
   created=true;
  }
  const ref=db.collection('users').doc(user.uid);
  const snap=await ref.get();
  const current=snap.exists?snap.data():null;
  if(user.disabled)return {email:item.email,status:'TAI_KHOAN_BI_KHOA',uid:user.uid};
  if(current?.role && current.role!=='student')return {email:item.email,status:'KHONG_PHAI_HOC_VIEN',uid:user.uid};
  if(current?.status && current.status!=='active')return {email:item.email,status:'DANG_BI_KHOA',uid:user.uid};
  const profile={
   email:item.email,
   name:current?.name||item.name||item.email.split('@')[0],
   school:current?.school||item.school||'ALI English',
   role:'student',
   status:'active'
  };
  await ref.set(current?profile:{...profile,createdAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
  return {email:item.email,status:created?'DA_TAO':'DA_TON_TAI_DA_DONG_BO',uid:user.uid};
 }catch(err){
  return {email:item.email,status:'LOI',uid:user?.uid||'',error:String(err?.code||err?.message||'unknown').slice(0,160)};
 }
}
(async()=>{
 const results=[];
 for(const item of requests){
  const result=await processOne(item);results.push(result);
  console.log(item.email,'=>',result.status,result.error||'');
 }
 const outPath=path.join(__dirname,'results-'+new Date().toISOString().replace(/[:.]/g,'-')+'.csv');
 const q=v=>'"'+String(v||'').replace(/"/g,'""')+'"';
 // Avoid CSV formula injection if results are opened in spreadsheet software.
 const safe=v=>/^[=+@-]/.test(String(v||''))?"'"+v:v;
 fs.writeFileSync(outPath,'Email,Trạng thái,UID,Lỗi\n'+results.map(x=>[x.email,x.status,x.uid,x.error||''].map(v=>q(safe(v))).join(',')).join('\n'),'utf8');
 console.log('Đã tạo báo cáo:',outPath);
 console.log('Học viên sử dụng nút "Quên mật khẩu?" ở trang đăng nhập ALI để tự đặt mật khẩu.');
 if(results.some(x=>x.status==='LOI'))process.exitCode=2;
})().catch(err=>{console.error('Lỗi tổng:',String(err.message||err));process.exitCode=2;});

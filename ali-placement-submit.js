/* Authenticated student placement attempt submission (teacher-only review). */
import {firebaseConfig} from './firebase-config.js';
const SDK='https://www.gstatic.com/firebasejs/13.2.0/';
const [appSdk,authSdk,functionsSdk]=await Promise.all([
 import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-functions.js')
]);
const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(firebaseConfig);
const auth=authSdk.getAuth(app);
const fns=functionsSdk.getFunctions(app,'asia-southeast1');
const path=location.pathname.split('/').pop(),test=path.replace('.html','');
const allowed=['b1','toeic','ielts'].includes(test);
const $=id=>document.getElementById(id);
function selected(name){return document.querySelector('input[name="'+name+'"]:checked')?.value||'';}
function gather(){
 let answers=[],writing='';
 if(test==='b1'){
  answers=Array.from({length:15},(_,i)=>{const v=selected('q'+i);return v!==''?String.fromCharCode(65+Number(v)):'';});
  writing=[...document.querySelectorAll('#reading textarea,#sentences textarea')].map(e=>e.value).join('\n\n');
 }else if(test==='toeic'){
  answers=Array.from({length:55},(_,i)=>selected('toeic'+(i+1)));
  writing=[...document.querySelectorAll('.ali-toeic-swfield')].map(e=>e.value).filter(Boolean).join('\n\n');
 }else if(test==='ielts'){
  answers=[...Array.from({length:20},(_,i)=>$('listen'+i)?.value||''),...Array.from({length:13},(_,i)=>$('read'+i)?.value||'')];
  writing=$('writing')?.value||'';
 }
 const student=(()=>{try{return JSON.parse(sessionStorage.getItem('ALI_TEST_REGISTRATION')||'null')||{}}catch{return {}}})();
 return {test,answers,writing,profile:{phone:student.phone||'',school:student.school||'',goal:student.goal||''}};
}
let already=false;
document.addEventListener('ali:placement-graded',async()=>{
 if(!allowed||already)return;already=true;
 const result=$('aliUnifiedResult');if(!result)return;
 const status=document.createElement('p');status.className='ali-placement-save-status';
 status.style.cssText='padding:14px 16px;margin-top:18px;border:1px solid #eed4be;border-radius:12px;background:#fff8f1;color:#6b3f2a;font-weight:650';
 status.setAttribute('role','status');status.textContent='Đang lưu kết quả vào hồ sơ ALI để giáo viên kiểm tra…';result.append(status);
 try{
  const user=await new Promise(resolve=>{const stop=authSdk.onAuthStateChanged(auth,u=>{stop();resolve(u);},()=>resolve(null));});
  if(!user){status.textContent='Chưa lưu: học viên phải đăng nhập tài khoản ALI trước khi làm bài. Vui lòng liên hệ giáo viên để được cấp tài khoản.';return;}
  const submit=functionsSdk.httpsCallable(fns,'submitPlacementAttempt');
  const data=(await submit(gather())).data;
  status.textContent='Đã lưu kết quả '+data.total+'/'+data.max+' để giáo viên kiểm tra. Mã bài nộp: '+data.attemptId+'.';
 }catch(e){
  status.textContent='Chưa lưu được kết quả vào hồ sơ giáo viên: '+(e.code==='functions/not-found'?'chức năng Firebase chưa triển khai.':String(e.message||e).slice(0,180));
 }
});

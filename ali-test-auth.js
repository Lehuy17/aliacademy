/* Require issued ALI student account before starting placement tests that feed Teacher Dashboard. */
import {firebaseConfig} from './firebase-config.js';
const base='https://www.gstatic.com/firebasejs/13.2.0/';
const [appSdk,authSdk,firestore]=await Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore.js'].map(s=>import(base+s)));
const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(firebaseConfig);
const auth=authSdk.getAuth(app),db=firestore.getFirestore(app);
let checked=false,allowed=false;
authSdk.onAuthStateChanged(auth,async user=>{
 checked=true;allowed=false;
 if(user)try{
  const profile=await firestore.getDoc(firestore.doc(db,'users',user.uid));
  allowed=profile.exists()&&profile.data().role==='student'&&profile.data().status==='active';
 }catch(e){allowed=false}
 const notice=document.getElementById('aliTestAuthNotice');
 if(notice)notice.textContent=allowed?'Tài khoản học viên đã được xác thực. Kết quả B1, TOEIC và IELTS sẽ gửi đến giáo viên.':'Để giáo viên xem được kết quả B1, TOEIC và IELTS, hãy đăng nhập tài khoản học viên ALI đã được cấp trước khi làm bài.';
});
if(location.pathname.split('/').pop()==='tests.html'){
 const btn=document.getElementById('startBtn');
 const note=document.createElement('p');note.id='aliTestAuthNotice';note.className='note';
 note.textContent='Đang xác minh tài khoản học viên ALI…';
 btn.parentElement.after(note);
 btn.addEventListener('click',event=>{
  const current=document.querySelector('.choice.selected')?.dataset.test;
  if(!['b1','ielts','toeic'].includes(current))return;
  if(checked&&allowed)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!checked){alert('Đang xác minh tài khoản. Hãy thử lại sau khi hệ thống hoàn tất đăng nhập.');return}
  alert('Để lưu bài test và cho giáo viên ALI xem kết quả, hãy đăng nhập bằng tài khoản học viên được cấp. Sau khi đăng nhập, quay lại trang Bài kiểm tra.');
  location.assign('./login.html');
 },true);
}

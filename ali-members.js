import {firebaseConfig,isConfigured} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,onAuthStateChanged,signOut,updateProfile} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import {getFirestore,doc,setDoc,getDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
const $=id=>document.getElementById(id);
const page=document.body.dataset.page;
const show=(msg,good=false)=>{const box=$('notice');if(box){box.textContent=msg;box.classList.add('show');box.classList.toggle('good',good);}};
const errors={ 'auth/email-already-in-use':'Email này đã có tài khoản. Hãy đăng nhập.', 'auth/invalid-email':'Địa chỉ email không hợp lệ.', 'auth/weak-password':'Mật khẩu chưa đủ mạnh.', 'auth/invalid-credential':'Email hoặc mật khẩu không chính xác.', 'auth/too-many-requests':'Bạn thao tác quá nhiều lần. Hãy thử lại sau.', 'permission-denied':'Không đủ quyền đọc/ghi hồ sơ. Kiểm tra Firestore Rules.', 'auth/operation-not-allowed':'Bạn cần bật Email/Password trong Firebase Authentication.', 'auth/unauthorized-domain':'Hãy thêm lehuy17.github.io trong Authorized domains.' };
const errorText=e=>errors[e?.code]||errors[e?.message]||('Không thể thực hiện: '+String(e?.message||e).slice(0,200));
function disabled(b,status){if(b)b.disabled=status;}
if(!isConfigured()){show('Website chưa được kết nối với dự án Firebase. ALI cần điền firebase-config.js bằng Firebase Web App Configuration trước khi sử dụng.',false);document.querySelectorAll('button[type=submit]').forEach(b=>b.disabled=true);}
else{
 const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
 const profile=async user=>{const snap=await getDoc(doc(db,'users',user.uid));return snap.exists()?snap.data():null;};
 if(page==='register'){
  $('registerForm').addEventListener('submit',async ev=>{
   ev.preventDefault();
   const name=$('name').value.trim(),email=$('email').value.trim(),pass=$('password').value,confirm=$('confirm').value,btn=$('submit');
   if(name.length<2){show('Vui lòng nhập họ tên ít nhất 2 ký tự.');return;}
   if(pass.length<8){show('Mật khẩu nên có ít nhất 8 ký tự.');return;}
   if(pass!==confirm){show('Hai mật khẩu không trùng nhau.');return;}
   disabled(btn,true);
   try{
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    await updateProfile(cred.user,{displayName:name});
    try{await setDoc(doc(db,'users',cred.user.uid),{name,email:cred.user.email,role:'student',status:'active',createdAt:serverTimestamp()});}
    catch(e){await signOut(auth);show('Tài khoản Authentication đã được tạo nhưng lưu hồ sơ Firestore thất bại. Hãy liên hệ ALI để hoàn tất hồ sơ, không đăng ký lại. '+errorText(e));return;}
    await sendEmailVerification(cred.user);
    await signOut(auth);
    show('Đã tạo tài khoản! Hãy kiểm tra email xác minh, sau đó đăng nhập.',true);
    $('registerForm').reset();
   }catch(e){show(errorText(e));}finally{disabled(btn,false);}
  });
 }
 if(page==='login'){
  $('loginForm').addEventListener('submit',async ev=>{
   ev.preventDefault();const btn=$('submit');disabled(btn,true);
   try{
    const cred=await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);
    if(!cred.user.emailVerified){await sendEmailVerification(cred.user).catch(()=>{});await signOut(auth);show('Email chưa được xác minh. Hãy mở email xác minh rồi đăng nhập lại.');return;}
    const p=await profile(cred.user);
    if(!p||p.status!=='active'){await signOut(auth);show(!p?'Tài khoản chưa có hồ sơ học viên. Liên hệ ALI để kích hoạt.':'Tài khoản đang bị khóa. Vui lòng liên hệ ALI.');return;}
    window.location.replace('./movies.html');
   }catch(e){show(errorText(e));}finally{disabled(btn,false);}
  });
  $('reset').addEventListener('click',async()=>{const email=$('email').value.trim();if(!email){show('Nhập email của bạn trước khi đặt lại mật khẩu.');return;}try{await sendPasswordResetEmail(auth,email);show('Nếu email hợp lệ, hệ thống sẽ gửi thư đặt lại mật khẩu. Hãy kiểm tra hộp thư.',true)}catch(e){show(errorText(e))}});
 }
 if(page==='movies'){
  onAuthStateChanged(auth,async user=>{
   if(!user){window.location.replace('./login.html?next=movies');return;}
   if(!user.emailVerified){await signOut(auth);window.location.replace('./login.html');return;}
   try{
    const p=await profile(user);
    if(!p||p.status!=='active'){await signOut(auth);window.location.replace('./login.html?blocked=1');return;}
    $('memberName').textContent=p.name||user.email||'Học viên';
    $('memberEmail').textContent=user.email||'';
    $('memberContent').classList.remove('hidden');$('loading').classList.add('hidden');
   }catch(e){show('Không thể kiểm tra hồ sơ truy cập: '+errorText(e));$('loading').textContent='Không thể xác minh quyền tài khoản.';}
  });
  $('logout').addEventListener('click',async()=>{await signOut(auth);window.location.replace('./login.html');});
  document.querySelectorAll('[data-lesson]').forEach(btn=>btn.addEventListener('click',()=>{
   const title=btn.dataset.lesson,dialog=$('lessonModal');$('lessonTitle').textContent=title;
   dialog.classList.remove('hidden');dialog.scrollIntoView({behavior:'smooth'});
  }));
  $('hideLesson').addEventListener('click',()=>$('lessonModal').classList.add('hidden'));
 }
}

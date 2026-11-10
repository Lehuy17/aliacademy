import {firebaseConfig} from './firebase-config.js';
"use strict";
const $=id=>document.getElementById(id);
const SDK="https://www.gstatic.com/firebasejs/13.2.0/";
let sdk={},auth=null,db=null,storage=null,functions=null,currentUser=null,currentRole=null;
let students=[],movieRows=[],videoState=null,videoRequest=0,submitting=false;
function notify(message,type="info"){
 const el=$("teacherNotice");el.textContent=message;el.dataset.kind=type;el.hidden=false;
}
function friendlyError(err){
 const code=String(err?.code||"");
 if(code.includes("permission-denied"))return "Tài khoản chưa được cấp quyền Teacher/Admin hoặc Firebase Rules chưa được triển khai.";
 if(code.includes("unauthenticated"))return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
 if(code.includes("already-exists"))return err.message||"Dữ liệu đã tồn tại.";
 if(code.includes("resource-exhausted"))return "Tệp quá lớn hoặc hệ thống tạm quá tải.";
 if(code.includes("functions/not-found"))return "Cloud Functions chưa được triển khai trong vùng asia-southeast1.";
 if(code.includes("storage/unauthorized"))return "Storage từ chối quyền tải lên; kiểm tra quyền Teacher và Storage Rules.";
 if(code.includes("storage/retry-limit-exceeded"))return "Tải lên không thành công, kiểm tra kết nối mạng.";
 return String(err?.message||"Đã xảy ra lỗi chưa xác định.").slice(0,350);
}
function setBusy(busy){
 submitting=busy;
 $("teacherCreateStudentBtn").disabled=busy;
 $("teacherPublishBtn").disabled=busy;
}
function showPane(name){
 for(const b of document.querySelectorAll("[data-teacher-tab]")){
  const selected=b.dataset.teacherTab===name;
  b.classList.toggle("is-selected",selected);b.setAttribute("aria-selected",String(selected));
 }
 $("teacherPaneStudents").hidden=name!=="students";
 $("teacherPaneMovies").hidden=name!=="movies";
}
function make(tag,content,className){
 const e=document.createElement(tag);if(content!==undefined)e.textContent=String(content);
 if(className)e.className=className;return e;
}
function readText(file){return file.text();}
function parseStamp(raw){
 const s=String(raw).trim().replace(",",".");
 const parts=s.split(":").map(Number);
 if(!parts.length||parts.some(x=>!Number.isFinite(x)))throw Error("Mốc thời gian phụ đề không hợp lệ.");
 return parts.reduce((acc,n)=>acc*60+n,0);
}
function parseBilingualSubtitles(text,name){
 let cues=[];
 if(/\.json$/i.test(name)){
  const j=JSON.parse(text.replace(/^\uFEFF/,""));
  if(!Array.isArray(j.cues))throw Error("JSON phải có mảng cues gồm start, end, en, vi.");
  cues=j.cues.map(c=>({start:Number(c.start),end:Number(c.end),en:String(c.en||"").trim(),vi:String(c.vi||"").trim()}));
 }else{
  const blocks=text.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n").trim().split(/\n\s*\n+/);
  for(const block of blocks){
   const lines=block.split("\n").map(l=>l.trim()).filter(Boolean);
   const index=lines.findIndex(line=>/-->/.test(line));
   if(index<0)continue;
   const bounds=lines[index].split(/\s+-->\s+/);
   if(bounds.length!==2)throw Error("Sai mốc thời gian SRT.");
   const words=lines.slice(index+1).filter(Boolean);
   if(words.length<2)throw Error("Mỗi đoạn SRT cần có dòng tiếng Anh và dòng tiếng Việt.");
   cues.push({start:parseStamp(bounds[0].split(/\s+/)[0]),
     end:parseStamp(bounds[1].split(/\s+/)[0]),
     en:words[0].replace(/<[^>]+>/g,"").trim(),
     vi:words.slice(1).join(" ").replace(/<[^>]+>/g,"").trim()});
  }
 }
 if(!cues.length||cues.length>1600)throw Error("Phải có từ 1 đến 1.600 câu phụ đề.");
 let previous=-1;
 for(const [i,c] of cues.entries()){
  if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start)
   throw Error("Sai mốc thời gian câu "+(i+1)+".");
  if(c.start<previous)throw Error("Các câu phải được sắp xếp theo thời gian.");
  if(!c.en||!c.vi||c.en.length>500||c.vi.length>500)
   throw Error("Câu "+(i+1)+" thiếu lời thoại Anh/Việt hoặc quá dài.");
  previous=c.start;
 }
 return cues;
}
function updateStats(){
 $("teacherStudentCount").textContent=String(students.length);
 $("teacherActiveCount").textContent=String(students.filter(s=>s.status==="active").length);
 $("teacherMovieCount").textContent=String(movieRows.filter(m=>m.ownerUid===currentUser?.uid&&m.status==="published").length);
}
function renderStudents(){
 const q=$("teacherStudentSearch").value.trim().toLocaleLowerCase("vi");
 const rows=$("teacherStudentRows");rows.replaceChildren();
 const filtered=students.filter(x=>!q||(x.name||"").toLocaleLowerCase("vi").includes(q)||(x.email||"").toLocaleLowerCase("vi").includes(q));
 if(!filtered.length){
  const tr=make("tr");const td=make("td","Không tìm thấy học viên.");td.colSpan=4;tr.append(td);rows.append(tr);return;
 }
 for(const student of filtered){
  const tr=make("tr");
  tr.append(make("td",student.name||"Chưa đặt tên","student-name"),make("td",student.email||"—"));
  const statusTd=make("td");
  statusTd.append(make("span",student.status==="active"?"Đang học":"Đã khóa","teacher-status"+(student.status==="active"?"":" is-inactive")));
  tr.append(statusTd);
  const control=make("td");
  const button=make("button",student.status==="active"?"Khóa":"Mở khóa","teacher-small-btn");
  button.type="button";
  button.addEventListener("click",()=>changeStudentStatus(student,button));
  control.append(button);tr.append(control);rows.append(tr);
 }
}
async function loadStudents(){
 if(!db)return;
 try{
  const snap=await sdk.firestore.getDocs(sdk.firestore.query(
   sdk.firestore.collection(db,"users"),sdk.firestore.limit(300)));
  students=snap.docs.map(d=>({uid:d.id,...d.data()})).filter(x=>x.role==="student")
   .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"vi"));
  renderStudents();updateStats();
 }catch(e){$("teacherStudentRows").replaceChildren(make("tr",""));notify("Chưa đọc được danh sách học viên: "+friendlyError(e),"error");}
}
async function changeStudentStatus(student,button){
 if(submitting)return;
 const status=student.status==="active"?"inactive":"active";
 if(!confirm((status==="inactive"?"Khóa":"Mở khóa")+" tài khoản "+(student.name||student.email)+"?"))return;
 button.disabled=true;
 try{
  const call=sdk.functions.httpsCallable(functions,"teacherSetStudentStatus");
  await call({uid:student.uid,status});
  student.status=status;renderStudents();updateStats();
  notify("Đã "+(status==="active"?"mở khóa":"khóa")+" tài khoản "+student.email+".","success");
 }catch(err){notify("Không cập nhật được học viên: "+friendlyError(err),"error");}
 finally{button.disabled=false;}
}
async function createStudent(event){
 event.preventDefault();if(submitting)return;
 setBusy(true);$("teacherNewAccount").hidden=true;
 try{
  const name=$("teacherStudentName").value.trim(),email=$("teacherStudentEmail").value.trim().toLowerCase();
  const call=sdk.functions.httpsCallable(functions,"teacherCreateStudent");
  const response=await call({name,email});const result=response.data;
  $("teacherNewEmail").textContent=result.email;
  $("teacherTempPassword").textContent=result.temporaryPassword;
  $("teacherNewAccount").hidden=false;
  $("teacherStudentName").value="";$("teacherStudentEmail").value="";
  notify("Đã tạo học viên "+name+". Mật khẩu tạm thời chỉ được hiển thị một lần bên dưới.","success");
  await loadStudents();
 }catch(e){notify("Chưa tạo được học viên: "+friendlyError(e),"error");}
 finally{setBusy(false);}
}
function clearVideoPreview(){
 if(videoState?.previewUrl)URL.revokeObjectURL(videoState.previewUrl);
 videoState=null;
 $("teacherPreviewDuration").textContent="Chưa chọn video";
 const holder=$("teacherPreviewImage");holder.replaceChildren(make("span","▣"),make("small","Ảnh xem trước video"));
}
async function probeMovie(file){
 return new Promise((resolve,reject)=>{
  let done=false;
  const media=document.createElement("video");
  media.preload="auto";media.muted=true;media.playsInline=true;
  const url=URL.createObjectURL(file);
  const finish=(err,data)=>{
   if(done)return;done=true;
   clearTimeout(timer);
   media.pause();media.removeAttribute("src");media.load();
   URL.revokeObjectURL(url);
   err?reject(err):resolve(data);
  };
  const timer=setTimeout(()=>finish(Error("Không thể đọc video. Hãy chuyển sang H.264/AAC MP4.")),16000);
  media.addEventListener("error",()=>finish(Error("Trình duyệt không đọc được video MP4 này.")),{once:true});
  media.addEventListener("loadedmetadata",()=>{
   const duration=media.duration;
   if(!Number.isFinite(duration)||duration<=0)return finish(Error("Không xác định được thời lượng phim."));
   if(!media.videoWidth||!media.videoHeight)return finish(Error("Video không có khung hình."));
   if(media.videoWidth>1280||media.videoHeight>720)return finish(Error("ALI chỉ cho phép video tối đa 1280×720."));
   if(duration>3600)return finish(Error("Video không được dài hơn 60 phút."));
   const stamp=Math.max(.1,Math.min(3,duration/4));
   try{media.currentTime=stamp;}catch(e){finish(Error("Không tua được video để lấy ảnh xem trước."));}
  },{once:true});
  media.addEventListener("seeked",()=>{
   const canvas=document.createElement("canvas");canvas.width=640;canvas.height=360;
   const ctx=canvas.getContext("2d");if(!ctx)return finish(Error("Không thể tạo ảnh xem trước."));
   const scale=Math.min(640/media.videoWidth,360/media.videoHeight),w=media.videoWidth*scale,h=media.videoHeight*scale;
   ctx.fillStyle="#130e11";ctx.fillRect(0,0,640,360);
   try{ctx.drawImage(media,(640-w)/2,(360-h)/2,w,h);}catch(e){return finish(Error("Không thể chụp khung hình từ video."));}
   canvas.toBlob(blob=>{
    if(!blob)return finish(Error("Không thể tạo ảnh JPG."));
    finish(null,{duration,posterBlob:blob,width:media.videoWidth,height:media.videoHeight});
   },"image/jpeg",.82);
  },{once:true});
  media.src=url;media.load();
 });
}
async function handleVideoChange(){
 const file=$("teacherMovieVideo").files?.[0];
 clearVideoPreview();if(!file)return;
 const request=++videoRequest;
 if(file.type!=="video/mp4"&&!/\.mp4$/i.test(file.name)){notify("Hãy chọn video định dạng .mp4.","error");return;}
 if(file.size>=90*1024*1024){notify("Video quá 90 MB. Hãy nén lại thành MP4 H.264/AAC trước khi tải lên.","error");return;}
 $("teacherPreviewDuration").textContent="Đang kiểm tra video…";
 try{
  const state=await probeMovie(file);
  if(request!==videoRequest)return;
  state.file=file;
  state.previewUrl=URL.createObjectURL(state.posterBlob);
  videoState=state;
  const img=document.createElement("img");img.src=state.previewUrl;img.alt="Ảnh xem trước trích từ chính video";
  $("teacherPreviewImage").replaceChildren(img);
  $("teacherPreviewDuration").textContent=
   Math.floor(state.duration/60)+" phút "+Math.floor(state.duration%60)+" giây · "+state.width+"×"+state.height;
  notify("Video đã được đọc. Hãy chọn phụ đề Anh–Việt và xác nhận trước khi xuất bản.","success");
 }catch(e){notify("Không đọc được video: "+friendlyError(e),"error");$("teacherPreviewDuration").textContent="Video chưa hợp lệ";}
}
async function handleCaptionChange(){
 const file=$("teacherMovieCaptions").files?.[0];
 if(!file){$("teacherCaptionCount").textContent="Chưa chọn phụ đề";return;}
 try{
  const cues=parseBilingualSubtitles(await readText(file),file.name);
  $("teacherCaptionCount").textContent=cues.length+" câu Anh–Việt · "+file.name;
 }catch(e){$("teacherCaptionCount").textContent="Lỗi phụ đề";notify("Tệp phụ đề chưa hợp lệ: "+friendlyError(e),"error");}
}
function updateUploadProgress(percent,label){
 $("teacherMovieProgress").hidden=false;
 $("teacherUploadFill").style.width=Math.max(0,Math.min(100,percent))+"%";
 $("teacherUploadText").textContent=label;
}
function uploadFile(path,file,contentType,start,end){
 return new Promise((resolve,reject)=>{
  const ref=sdk.storage.ref(storage,path);
  const task=sdk.storage.uploadBytesResumable(ref,file,{contentType,cacheControl:"private,max-age=300"});
  task.on("state_changed",snap=>{
   const ratio=snap.totalBytes?Math.min(1,snap.bytesTransferred/snap.totalBytes):0;
   const percent=start+(end-start)*ratio;
   updateUploadProgress(percent,Math.round(percent)+"% · "+file.name);
  },reject,()=>resolve(task.snapshot));
 });
}
async function publishMovie(event){
 event.preventDefault();if(submitting)return;
 const file=$("teacherMovieVideo").files?.[0];
 if(!file){notify("Vui lòng chọn video MP4.","error");return;}
 if(file.size>=90*1024*1024){notify("Video phải nhỏ hơn 90 MB.","error");return;}
 setBusy(true);
 try{
  if(!videoState||videoState.file!==file){
   const probe=await probeMovie(file);
   probe.file=file;probe.previewUrl=URL.createObjectURL(probe.posterBlob);videoState=probe;
  }
  const captionFile=$("teacherMovieCaptions").files?.[0];
  if(!captionFile)throw Error("Cần tệp phụ đề Anh–Việt .json hoặc .srt.");
  const cues=parseBilingualSubtitles(await readText(captionFile),captionFile.name);
  if(cues[cues.length-1].end>videoState.duration+1)throw Error("Phụ đề vượt thời lượng phim, vui lòng kiểm tra bản cắt.");
  const confirmations=["teacherRights","teacherEnglishChecked","teacherVietnameseChecked","teacherTimesChecked"];
  if(confirmations.some(x=>!$(x).checked))throw Error("Bạn cần xác nhận quyền sử dụng và đã rà soát đủ phụ đề.");
  const userPoster=$("teacherMoviePoster").files?.[0];
  let poster=videoState.posterBlob;
  if(userPoster){
   if(!userPoster.type.startsWith("image/")||userPoster.size>5*1024*1024)
    throw Error("Ảnh xem trước phải là JPG/PNG/WebP, dưới 5 MB.");
   const image=await createImageBitmap(userPoster);
   const canvas=document.createElement("canvas");canvas.width=640;canvas.height=360;
   const ctx=canvas.getContext("2d");ctx.fillStyle="#130e11";ctx.fillRect(0,0,640,360);
   const scale=Math.min(640/image.width,360/image.height),w=image.width*scale,h=image.height*scale;
   ctx.drawImage(image,(640-w)/2,(360-h)/2,w,h);image.close?.();
   poster=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Không xuất được JPG.")),"image/jpeg",.82));
  }
  const captionBlob=new Blob([JSON.stringify({status:"reviewed",synchronized:true,
   duration:videoState.duration,cues})],{type:"application/json"});
  if(captionBlob.size>650000)throw Error("Phụ đề quá lớn. Hãy chia thành các bài ngắn hơn.");
  const id="ali-"+crypto.randomUUID().replace(/-/g,"").slice(0,20);
  const dir="teacher_movies/"+currentUser.uid+"/"+id+"/";
  updateUploadProgress(3,"Chuẩn bị tải các tệp lên Firebase Storage…");
  await uploadFile(dir+"video.mp4",file,"video/mp4",3,76);
  await uploadFile(dir+"poster.jpg",new File([poster],"poster.jpg",{type:"image/jpeg"}),"image/jpeg",76,87);
  await uploadFile(dir+"captions.json",new File([captionBlob],"captions.json",{type:"application/json"}),"application/json",87,93);
  updateUploadProgress(95,"Đang kiểm tra codec, thời lượng và xuất bản video…");
  const publish=sdk.functions.httpsCallable(functions,"teacherPublishMovie");
  const response=await publish({
   id,title:$("teacherMovieTitle").value.trim(),description:$("teacherMovieDescription").value.trim(),
   rightsConfirmed:true,englishReviewed:true,vietnameseReviewed:true,timingsReviewed:true
  });
  updateUploadProgress(100,"Đã xuất bản: "+response.data.title+" — "+response.data.captionCount+" câu song ngữ.");
  notify("Đã xuất bản phim thành công! Học viên sẽ thấy video mới khi tải lại thư viện. Không cần Admin phê duyệt.","success");
  $("teacherMovieForm").reset();clearVideoPreview();$("teacherCaptionCount").textContent="Chưa chọn phụ đề";
  await loadTeacherMovies();
 }catch(e){
  updateUploadProgress(0,"Chưa thể xuất bản: "+friendlyError(e));
  notify("Phim chưa được xuất bản: "+friendlyError(e),"error");
 }finally{setBusy(false);}
}
async function loadTeacherMovies(){
 try{
  const snap=await sdk.firestore.getDocs(sdk.firestore.query(
   sdk.firestore.collection(db,"teacherMovies"),sdk.firestore.limit(300)));
  movieRows=snap.docs.map(x=>({id:x.id,...x.data()}));
  movieRows.sort((a,b)=>(b.publishedAt?.seconds||0)-(a.publishedAt?.seconds||0));
  const host=$("teacherMovieRows");host.replaceChildren();
  const items=movieRows.filter(m=>m.ownerUid===currentUser.uid||currentRole==="admin");
  if(!items.length)host.append(make("p","Bạn chưa xuất bản phim nào."));
  for(const movie of items){
   const card=make("div",undefined,"teacher-published-item");
   card.append(make("strong",movie.title),make("small",(movie.duration||"")+" · "+(movie.captionCount||0)+" câu · "+(movie.status==="published"?"Đã xuất bản":"Bản nháp")));
   const link=make("a","Xem trên thư viện ALI ↗");link.href="./movies.html";card.append(link);host.append(card);
  }
  updateStats();
 }catch(e){$("teacherMovieRows").textContent="Chưa đọc được danh sách phim: "+friendlyError(e);}
}
async function init(){
 try{
  const [appSdk,authSdk,dbSdk,storageSdk,fnSdk]=await Promise.all([
   import(SDK+"firebase-app.js"),import(SDK+"firebase-auth.js"),import(SDK+"firebase-firestore.js"),
   import(SDK+"firebase-storage.js"),import(SDK+"firebase-functions.js")]);
  sdk={auth:authSdk,firestore:dbSdk,storage:storageSdk,functions:fnSdk};
  const app=appSdk.initializeApp(firebaseConfig);
  auth=authSdk.getAuth(app);db=dbSdk.getFirestore(app);storage=storageSdk.getStorage(app);
  functions=fnSdk.getFunctions(app,"asia-southeast1");
  authSdk.onAuthStateChanged(auth,async user=>{
   if(!user){notify("Bạn cần đăng nhập tài khoản giáo viên ALI để sử dụng trang này.","error");return;}
   try{
    const token=await user.getIdTokenResult(true);
    const role=token.claims.role;
    if(!["teacher","admin"].includes(role))throw Error("Tài khoản chưa được quản trị viên cấp quyền Teacher/Admin.");
    const profile=await dbSdk.getDoc(dbSdk.doc(db,"users",user.uid));
    if(!profile.exists()||profile.data().status!=="active")throw Error("Hồ sơ giáo viên chưa được kích hoạt trong Firestore users/{UID}.");
    currentUser=user;currentRole=role;
    $("teacherName").textContent=profile.data().name||user.displayName||"Giáo viên ALI";
    $("teacherEmail").textContent=user.email||"";
    $("teacherRole").textContent=role==="admin"?"ADMIN":"TEACHER";
    $("teacherLogout").hidden=false;
    $("teacherWorkspace").hidden=false;
    notify("Đã xác minh quyền "+role.toUpperCase()+". Bạn có thể tạo học viên và tự xuất bản phim, không cần Admin duyệt.","success");
    await Promise.all([loadStudents(),loadTeacherMovies()]);
   }catch(e){$("teacherWorkspace").hidden=true;notify(friendlyError(e)+" Đăng nhập lại sau khi Admin cấp quyền.","error");}
  });
 }catch(e){notify("Chưa kết nối được Firebase: "+friendlyError(e),"error");}
}
document.querySelectorAll("[data-teacher-tab]").forEach(b=>b.addEventListener("click",()=>showPane(b.dataset.teacherTab)));
$("teacherLogout").addEventListener("click",async()=>{if(auth)await sdk.auth.signOut(auth);location.href="./login.html";});
$("teacherRefreshStudents").addEventListener("click",loadStudents);
$("teacherStudentSearch").addEventListener("input",renderStudents);
$("teacherCreateStudent").addEventListener("submit",createStudent);
$("teacherCopyPassword").addEventListener("click",async()=>{
 const password=$("teacherTempPassword").textContent;
 try{await navigator.clipboard.writeText(password);notify("Đã sao chép mật khẩu tạm thời. Chỉ gửi riêng cho học viên.","success");}
 catch(e){notify("Trình duyệt chặn sao chép; hãy chọn và sao chép mật khẩu thủ công.","error");}
});
$("teacherMovieVideo").addEventListener("change",handleVideoChange);
$("teacherMovieCaptions").addEventListener("change",handleCaptionChange);
$("teacherMovieForm").addEventListener("submit",publishMovie);
init();

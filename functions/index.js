"use strict";
/* ALI Teacher Backend (Firebase Functions v2, asia-southeast1)
 * Teacher publishes directly after automated validation; no admin approval.
 * Account privileges MUST come from Firebase Auth custom claims, NOT editable
 * Firestore role text or public browser code.
 */
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {getStorage}=require("firebase-admin/storage");
const ffprobe=require("ffprobe-static");
const {randomBytes}=require("node:crypto");
const {execFileSync}=require("node:child_process");
const fs=require("node:fs/promises");
const os=require("node:os");
const path=require("node:path");
initializeApp();
const region="asia-southeast1";
const config={region,memory:"1GiB",timeoutSeconds:300,maxInstances:6};
const isText=(v,max=150)=>typeof v==="string"&&v.trim().length>0&&v.trim().length<=max;
const mailPattern=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const movieIdPattern=/^ali-[a-z0-9]{8,40}$/;
function verifyStaff(request){
 const role=request.auth?.token?.role;
 if(!request.auth||!["teacher","admin"].includes(role))
  throw new HttpsError("permission-denied","Chỉ giáo viên hoặc quản trị viên ALI được phép sử dụng chức năng này.");
 return {uid:request.auth.uid,role};
}
async function checkStaffActive(uid){
 const profile=await getFirestore().doc("users/"+uid).get();
 if(!profile.exists||profile.data().status!=="active")
  throw new HttpsError("permission-denied","Hồ sơ giáo viên chưa được kích hoạt.");
}
function invalid(message){throw new HttpsError("invalid-argument",message);}
exports.teacherCreateStudent=onCall({...config,timeoutSeconds:60},async request=>{
 const staff=verifyStaff(request);await checkStaffActive(staff.uid);
 const d=request.data||{};
 const name=String(d.name||"").trim(),email=String(d.email||"").trim().toLowerCase();
 if(!isText(name,100)||!mailPattern.test(email)||email.length>180)
  invalid("Hãy nhập họ tên và email hợp lệ.");
 const password=randomBytes(15).toString("base64url")+"!";
 let user;
 try{
  user=await getAuth().createUser({email,password,displayName:name,emailVerified:false,disabled:false});
  await getFirestore().doc("users/"+user.uid).create({
   name,email,role:"student",status:"active",teacherUid:staff.uid,
   createdAt:FieldValue.serverTimestamp(),createdBy:staff.uid
  });
  // Do not log or persist the temporary password, return it once to the staff.
  return {uid:user.uid,email,name,temporaryPassword:password};
 }catch(e){
  if(user){try{await getAuth().deleteUser(user.uid);}catch(_){/* log no secrets */}}
  if(e.code==="auth/email-already-exists")
   throw new HttpsError("already-exists","Email này đã có tài khoản. Hãy kiểm tra danh sách học viên.");
  if(e.code==="already-exists")throw new HttpsError("already-exists","Tài khoản đã tồn tại.");
  if(e instanceof HttpsError)throw e;
  throw new HttpsError("internal","Chưa tạo được học viên, vui lòng kiểm tra Firebase Authentication.");
 }
});
exports.teacherSetStudentStatus=onCall({...config,timeoutSeconds:60},async request=>{
 const staff=verifyStaff(request);await checkStaffActive(staff.uid);
 const uid=String(request.data?.uid||"").trim(),status=request.data?.status;
 if(!/^[A-Za-z0-9_-]{12,160}$/.test(uid)||!["active","inactive"].includes(status))
  invalid("Học viên hoặc trạng thái không hợp lệ.");
 if(uid===staff.uid)throw new HttpsError("permission-denied","Không thể tự khóa tài khoản.");
 let target=await getFirestore().doc("users/"+uid).get();
 if(!target.exists)target=await getFirestore().doc("user/"+uid).get();
 if(!target.exists||target.data().role!=="student")
  throw new HttpsError("permission-denied","Chỉ được điều chỉnh tài khoản học viên.");
 // Also supports existing ALI profiles in the legacy singular 'user' collection.
 await getAuth().updateUser(uid,{disabled:status==="inactive"});
 await target.ref.update({status,updatedBy:staff.uid,updatedAt:FieldValue.serverTimestamp()});
 return {uid,status};
});
function validateCues(document,duration){
 if(!document||!Array.isArray(document.cues)||document.cues.length<1||document.cues.length>1600)
  invalid("Bản phụ đề cần có 1–1600 câu Anh–Việt.");
 const cues=[];let lastStart=-1;
 for(const [i,line] of document.cues.entries()){
  const start=Number(line.start),end=Number(line.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>duration+1)
   invalid("Sai mốc thời gian ở câu "+(i+1)+".");
  if(start<lastStart)invalid("Phụ đề phải theo thứ tự thời gian.");
  if(!isText(line.en,500)||!isText(line.vi,500))
   invalid("Câu "+(i+1)+" thiếu tiếng Anh hoặc tiếng Việt.");
  cues.push({start:Math.round(start*1000)/1000,end:Math.round(end*1000)/1000,
   en:line.en.trim(),vi:line.vi.trim()});
  lastStart=start;
 }
 return cues;
}
async function requireAsset(bucket,key,mime,maxSize){
 const file=bucket.file(key);
 const [exists]=await file.exists();
 if(!exists)invalid("Chưa tải đủ tệp: "+key.split("/").pop());
 const [metadata]=await file.getMetadata();
 const size=Number(metadata.size);
 if(!Number.isFinite(size)||size<100||size>maxSize)
  invalid("Tệp sai kích thước: "+key.split("/").pop());
 const contentType=String(metadata.contentType||"").split(";")[0].toLowerCase();
 if(!mime.includes(contentType))invalid("Sai định dạng tệp: "+key.split("/").pop());
 return {file,size,contentType};
}
async function analyzeVideo(file){
 const destination=path.join(os.tmpdir(),"ali-"+randomBytes(10).toString("hex")+".mp4");
 try{
  await file.download({destination});
  let raw;
  try{
   raw=execFileSync(ffprobe.path,["-v","error","-show_entries",
    "format=duration:stream=codec_type,codec_name,pix_fmt,width,height",
    "-of","json",destination],{encoding:"utf8",timeout:45000,maxBuffer:1024*1024});
  }catch(error){invalid("Video không đọc được. Hãy chuyển thành MP4 H.264/AAC và thử lại.");}
  const info=JSON.parse(raw),streams=info.streams||[];
  const v=streams.find(s=>s.codec_type==="video"),a=streams.find(s=>s.codec_type==="audio");
  const duration=Number(info.format?.duration);
  if(!v||v.codec_name!=="h264"||v.pix_fmt!=="yuv420p"||!a||a.codec_name!=="aac")
   invalid("Video phải dùng H.264 (yuv420p) và tiếng AAC. Hệ thống không tự chuyển mã.");
  if(v.width>1280||v.height>720)
   invalid("Độ phân giải vượt 720p. Hãy xuất lại video theo chuẩn ALI.");
  if(!Number.isFinite(duration)||duration<=0||duration>3600)
   invalid("Thời lượng video không hợp lệ hoặc vượt 60 phút.");
  const fd=await fs.open(destination,"r");
  try{
   const stat=await fd.stat();const buf=Buffer.alloc(Math.min(stat.size,262144));
   const {bytesRead}=await fd.read(buf,0,buf.length,0);
   if(!buf.subarray(0,bytesRead).includes(Buffer.from("moov")))
    invalid("Video chưa tối ưu cho phát web. Hãy xuất MP4 với -movflags +faststart.");
  }finally{await fd.close();}
  return {duration};
 }finally{await fs.rm(destination,{force:true}).catch(()=>{});}
}
exports.teacherPublishMovie=onCall(config,async request=>{
 const staff=verifyStaff(request);await checkStaffActive(staff.uid);
 const d=request.data||{},id=String(d.id||"");
 const title=String(d.title||"").trim(),description=String(d.description||"").trim();
 if(!movieIdPattern.test(id)||!isText(title,180)||!isText(description,500))
  invalid("Thiếu mã phim, tiêu đề hoặc mô tả hợp lệ.");
 if(d.rightsConfirmed!==true||d.englishReviewed!==true||
    d.vietnameseReviewed!==true||d.timingsReviewed!==true)
  invalid("Giáo viên phải xác nhận quyền sử dụng và kiểm tra nội dung phụ đề.");
 const db=getFirestore(),movieRef=db.doc("teacherMovies/"+id),captionsRef=db.doc("teacherMovieCaptions/"+id);
 if((await movieRef.get()).exists)throw new HttpsError("already-exists","Phim này đã được xuất bản.");
 const prefix="teacher_movies/"+staff.uid+"/"+id+"/";
 const videoPath=prefix+"video.mp4",posterPath=prefix+"poster.jpg",captionsPath=prefix+"captions.json";
 const bucket=getStorage().bucket();
 const media=await requireAsset(bucket,videoPath,["video/mp4","application/mp4"],90*1024*1024);
 await requireAsset(bucket,posterPath,["image/jpeg"],5*1024*1024);
 const subtitles=await requireAsset(bucket,captionsPath,["application/json"],2*1024*1024);
 const {duration}=await analyzeVideo(media.file);
 let json;
 try{
  const [buffer]=await subtitles.file.download();
  json=JSON.parse(buffer.toString("utf8"));
 }catch(e){invalid("Không đọc được tệp phụ đề JSON.");}
 const cues=validateCues(json,duration);
 if(json.status!=="reviewed"||Math.abs(Number(json.duration)-duration)>1.5)
  invalid("Phụ đề chưa xác nhận đã rà soát hoặc không khớp thời lượng video.");
 // Firestore documents have 1 MiB limits; stricter limit protects student playback.
 const encoded=Buffer.byteLength(JSON.stringify(cues),"utf8");
 if(encoded>650000)invalid("Phụ đề quá lớn. Hãy chia phim thành các bài ngắn hơn.");
 const seconds=Math.round(duration*1000)/1000;
 const label=String(Math.floor(duration/60)).padStart(2,"0")+":"+String(Math.floor(duration%60)).padStart(2,"0");
 const batch=db.batch();
 batch.create(movieRef,{
  title,description,category:"PHIM SONG NGỮ · ALI",duration:label,
  durationSeconds:seconds,videoPath,posterPath,captionsPath,
  ownerUid:staff.uid,status:"published",captionCount:cues.length,
  sourceType:"firebase-storage",publishedAt:FieldValue.serverTimestamp(),
  presentation:{hideSourceLink:true,background:"film-blur",layout:"video-left-captions-right"},
  qa:{rightsConfirmed:true,englishReviewed:true,vietnameseReviewed:true,timingsReviewed:true,
      approvedByTeacher:staff.uid,approvedAt:FieldValue.serverTimestamp()}
 });
 batch.create(captionsRef,{status:"reviewed",duration:seconds,cues,ownerUid:staff.uid,createdAt:FieldValue.serverTimestamp()});
 await batch.commit();
 return {id,title,captionCount:cues.length,duration:label,status:"published"};
});

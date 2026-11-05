import {firebaseConfig} from './firebase-config.js';
const $=id=>document.getElementById(id);
const video=$('aliHtmlVideo');
const list=$('aliTranscriptList');
const scroller=$('aliTranscriptScroll');
const status=$('aliVideoMode');
const clock=$('aliVideoClock');
let cues=[],active=-1,mediaUrl=null,loadTicket=0,lang='both',fontScale=1,auth=null;
const time=t=>String(Math.floor((t||0)/60)).padStart(2,'0')+':'+String(Math.floor((t||0)%60)).padStart(2,'0');
function message(s){$('notice').textContent=s;$('notice').classList.remove('hidden');}
function showCues(){
 list.replaceChildren();
 if(!cues.length){const p=document.createElement('p');p.className='ali-empty';p.textContent='Chưa có phụ đề được xác minh cho video này.';list.append(p);return;}
 cues.forEach((cue,i)=>{
  const row=document.createElement('button');row.type='button';row.className='ali-cue';row.dataset.index=i;
  const stamp=document.createElement('span');stamp.className='ali-stamp';stamp.textContent=String(i+1).padStart(2,'0')+' · '+time(cue.start);
  const text=document.createElement('span');text.className='ali-cue-text';
  const en=document.createElement('strong');en.className='ali-en';en.textContent=cue.en;
  const vi=document.createElement('span');vi.className='ali-vi';vi.textContent=cue.vi;
  text.append(en,vi);row.append(stamp,text);
  row.addEventListener('click',()=>{if(video.readyState){video.currentTime=cue.start;video.play().catch(()=>{});}});
  list.append(row);
 });
 applyLanguage();
}
function applyLanguage(){
 list.querySelectorAll('.ali-en').forEach(e=>e.classList.toggle('hidden',lang==='vi'));
 list.querySelectorAll('.ali-vi').forEach(e=>e.classList.toggle('hidden',lang==='en'));
 list.style.setProperty('--textscale',fontScale);
}
function sync(){
 const now=video.currentTime;
 clock.textContent=time(now)+' / '+time(video.duration||53.4);
 const index=cues.findIndex(c=>now>=c.start&&now<c.end);
 if(index===active)return;
 const prev=list.querySelector('.ali-cue.current');if(prev){prev.classList.remove('current');prev.removeAttribute('aria-current');}
 active=index;
 if(index<0)return;
 const row=list.querySelector('[data-index="'+index+'"]');
 if(!row)return;
 row.classList.add('current');row.setAttribute('aria-current','true');
 scroller.scrollTo({top:Math.max(0,scroller.scrollTop+row.getBoundingClientRect().top-scroller.getBoundingClientRect().top-scroller.clientHeight/2+row.offsetHeight/2),behavior:'smooth'});
}
for(const ev of ['timeupdate','seeking','seeked','play','loadedmetadata'])video.addEventListener(ev,sync);
function clearMedia(){video.pause();video.removeAttribute('src');video.load();if(mediaUrl){URL.revokeObjectURL(mediaUrl);mediaUrl=null;}}
function fallback(){
 ++loadTicket;clearMedia();video.classList.add('hidden');$('aliDrivePlayer').classList.remove('hidden');
 $('aliDrivePlayer').src='https://drive.google.com/file/d/1FTYlfU8Aa1mRPyRwnrUFe5x3q6X6Bq8B/preview';
 $('fallbackBtn').classList.add('hidden');$('syncBtn').classList.remove('hidden');
 status.textContent='Trình phát dự phòng: không đồng bộ tự động';
}
async function openSync(){
 const ticket=++loadTicket;
 $('aliDrivePlayer').removeAttribute('src');$('aliDrivePlayer').classList.add('hidden');video.classList.remove('hidden');
 clearMedia();$('fallbackBtn').classList.remove('hidden');$('syncBtn').classList.add('hidden');
 status.textContent='Đang tải video cho phụ đề đồng bộ…';
 try{
  if(!window.AliVideoMedia)throw Error('Video loader unavailable');
  const url=await window.AliVideoMedia.open();
  if(ticket!==loadTicket){URL.revokeObjectURL(url);return;}
  mediaUrl=url;video.src=url;video.load();
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Video metadata timed out')),12000);
   video.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});
   video.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Cannot play local media'));},{once:true});
  });
  if(ticket!==loadTicket)return;
  status.textContent='Phụ đề đồng bộ theo video · nhấn một câu để nghe lại';
  sync();
 }catch(e){if(ticket===loadTicket){console.warn(e);fallback();}}
}
async function init(){
 try{
  const base='https://www.gstatic.com/firebasejs/13.2.0/';
  const [app,authSdk,dbSdk]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  auth=authSdk.getAuth(app.initializeApp(firebaseConfig));
  authSdk.onAuthStateChanged(auth,async user=>{
   if(!user){location.replace('./login.html?next=movies');return;}
   try{
    const doc=await dbSdk.getDoc(dbSdk.doc(dbSdk.getFirestore(), 'users',user.uid));
    if(!doc.exists()||doc.data().status!=='active'){await authSdk.signOut(auth);location.replace('./login.html?blocked=1');return;}
    $('memberName').textContent=doc.data().name||user.email||'Học viên';
    $('loading').classList.add('hidden');$('memberContent').classList.remove('hidden');
   }catch(err){message('Không thể xác minh tài khoản học viên.');}
  });
  $('logout').addEventListener('click',async()=>{clearMedia();await authSdk.signOut(auth);location.assign('./login.html');});
 }catch(err){message('Không kết nối được Firebase. Hãy thử tải lại trang.');}
}
$('openMovie').addEventListener('click',async()=>{
 $('aliVideoPlayer').classList.remove('hidden');
 $('aliVideoPlayer').scrollIntoView({behavior:'smooth'});
 try{
  const r=await fetch('./captions/1FTYlfU8Aa1mRPyRwnrUFe5x3q6X6Bq8B.json');
  if(!r.ok)throw Error('No captions');
  const json=await r.json();cues=(json.cues||[]).filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&typeof x.en==='string'&&typeof x.vi==='string');
 }catch(e){cues=[];}
 active=-1;showCues();openSync();
});
$('closeMovie').addEventListener('click',()=>{++loadTicket;clearMedia();$('aliDrivePlayer').removeAttribute('src');$('aliVideoPlayer').classList.add('hidden');});
$('fallbackBtn').addEventListener('click',fallback);
$('syncBtn').addEventListener('click',openSync);
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{
 lang=button.dataset.language;document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));applyLanguage();
}));
$('smaller').addEventListener('click',()=>{fontScale=Math.max(.8,fontScale-.1);applyLanguage();});
$('larger').addEventListener('click',()=>{fontScale=Math.min(1.5,fontScale+.1);applyLanguage();});
$('topCues').addEventListener('click',()=>scroller.scrollTo({top:0,behavior:'smooth'}));
init();

import {firebaseConfig} from './firebase-config.js';
const $=id=>document.getElementById(id);
const video=$('aliHtmlVideo');
const list=$('aliTranscriptList');
const scroller=$('aliTranscriptScroll');
const status=$('aliVideoMode');
const clock=$('aliVideoClock');
let cues=[],active=-1,mediaUrl=null,loadTicket=0,lang='both',fontScale=1,auth=null,currentMovie=null,libraryLoaded=false;

/* The ambient blur uses actual frames of the SAME playing HTML video.
   A tiny canvas at 8fps keeps the desktop glass backdrop lightweight.
   On mobile, when paused, or in Drive fallback, the real film poster remains. */
const ambientHost=$('aliCinemaAmbient');
const ambientCanvas=$('aliCinemaAmbientCanvas');
const ambientPoster=$('aliCinemaAmbientPoster');
const ambientContext=ambientCanvas?.getContext('2d',{alpha:false});
let ambientFrame=0,ambientLastFrame=0;
const ambientDesktop=()=>window.matchMedia('(min-width:851px)').matches;
function setAmbientPoster(movie){
 stopAmbient();
 if(!ambientPoster)return;
 const image=movie?.previewSrc||movie?.poster||'';
 if(image){ambientPoster.src=image;ambientPoster.style.opacity='1';}
 else{ambientPoster.removeAttribute('src');ambientPoster.style.opacity='0';}
}
function paintAmbient(){
 if(!ambientDesktop()||!ambientContext||!currentMovie||video.classList.contains('hidden')
    ||video.readyState<2||!video.videoWidth||!video.videoHeight)return;
 try{
  const cw=ambientCanvas.width,ch=ambientCanvas.height;
  const vw=video.videoWidth,vh=video.videoHeight,ratio=cw/ch;
  let sx=0,sy=0,sw=vw,sh=vh;
  // Center crop to cover the canvas without stretching portrait video.
  if(vw/vh>ratio){sw=vh*ratio;sx=(vw-sw)/2;}
  else{sh=vw/ratio;sy=(vh-sh)/2;}
  ambientContext.drawImage(video,sx,sy,sw,sh,0,0,cw,ch);
  ambientHost.classList.add('is-live');
 }catch(error){
  // Protected/cross-origin videos or unsupported browser decoders keep a poster.
  ambientHost?.classList.remove('is-live');
  stopAmbient();
 }
}
function stopAmbient(hide=true){
 if(ambientFrame){cancelAnimationFrame(ambientFrame);ambientFrame=0;}
 if(hide)ambientHost?.classList.remove('is-live');
}
function tickAmbient(now){
 ambientFrame=0;
 if(video.paused||video.ended||!ambientDesktop()||document.hidden||!currentMovie)return;
 if(now-ambientLastFrame>=125){paintAmbient();ambientLastFrame=now;}
 ambientFrame=requestAnimationFrame(tickAmbient);
}
function refreshAmbient(){
 if(!ambientDesktop()||document.hidden){stopAmbient();return;}
 paintAmbient();
 if(!video.paused&&!video.ended&&!ambientFrame)ambientFrame=requestAnimationFrame(tickAmbient);
}
video.addEventListener('playing',refreshAmbient);
video.addEventListener('loadeddata',refreshAmbient);
video.addEventListener('seeked',refreshAmbient);
video.addEventListener('pause',()=>{stopAmbient(false);paintAmbient();});
video.addEventListener('ended',()=>{stopAmbient(false);paintAmbient();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAmbient(false);else refreshAmbient();});
window.addEventListener('resize',refreshAmbient);

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
function clearMedia(){stopAmbient();video.pause();video.removeAttribute('src');video.load();if(mediaUrl){URL.revokeObjectURL(mediaUrl);mediaUrl=null;}}
function fallback(){
 ++loadTicket;clearMedia();
 const driveId=currentMovie?.driveId||'';
 if(!/^[a-zA-Z0-9_-]{20,}$/.test(driveId)){
  status.textContent='Không có nguồn phát dự phòng cho video này.';return;
 }
 video.classList.add('hidden');$('aliDrivePlayer').classList.remove('hidden');
 $('aliDrivePlayer').src='https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview';
 $('fallbackBtn').classList.add('hidden');$('syncBtn').classList.remove('hidden');
 status.textContent=currentMovie?.subtitleStatus==='pending'?'Video từ Drive · chưa có phụ đề Anh–Việt đồng bộ · cần quyền xem Drive':'Phát từ Drive: không đồng bộ tự động phụ đề';
}
async function openSync(){
 const ticket=++loadTicket;
 $('aliDrivePlayer').removeAttribute('src');$('aliDrivePlayer').classList.add('hidden');video.classList.remove('hidden');
 clearMedia();$('fallbackBtn').classList.remove('hidden');$('syncBtn').classList.add('hidden');
 status.textContent='Đang tải video cho phụ đề đồng bộ…';
 try{
  if(!currentMovie)throw Error('No movie selected');
  const source=currentMovie.source||{};
  let url='';
  if(source.type==='chunked'&&source.loader==='ali-video-01'){
   if(!window.AliVideoMedia)throw Error('Video loader unavailable');
   url=await window.AliVideoMedia.open();
   mediaUrl=url;
  }else if(source.type==='url'){
   const resolved=new URL(source.url,location.href);
   if(resolved.origin!==location.origin)throw Error('Video phải được tải từ website ALI để đồng bộ');
   url=resolved.href;
  }else{
   fallback();return;
  }
  if(ticket!==loadTicket){if(mediaUrl===url&&url.startsWith('blob:'))URL.revokeObjectURL(url);return;}
  video.src=url;
  if(currentMovie.previewSrc)video.poster=currentMovie.previewSrc;
  video.load();
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{reject(Error('Video metadata timed out'));},12000);
   video.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});
   video.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Cannot play video'));},{once:true});
  });
  if(ticket!==loadTicket)return;
  status.textContent='Phụ đề đồng bộ theo video · nhấn một câu để nghe lại';
  sync();
 }catch(e){if(ticket===loadTicket){console.warn('Video playback unavailable',e);fallback();}}
}
async function openMovie(movie){
 currentMovie=movie;
 setAmbientPoster(movie);
 $('aliCurrentMovieTitle').textContent=movie.title||'Phim song ngữ ALI';
 $('aliVideoPlayer').classList.remove('hidden');
 $('aliVideoPlayer').scrollIntoView({behavior:'smooth'});
 cues=[];
 try{
  if(movie.captions){
   const url=new URL(movie.captions,location.href);
   if(url.origin!==location.origin)throw Error('Chỉ tải phụ đề từ website ALI');
   const response=await fetch(url.href);
   if(!response.ok)throw Error('No captions');
   const json=await response.json();
   cues=(json.cues||[]).filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&typeof x.en==='string'&&typeof x.vi==='string');
  }
 }catch(e){console.info('Bộ phụ đề chưa sẵn sàng cho phim này');cues=[];}
 active=-1;showCues();openSync();
}
function makeMovieCard(movie){
 const card=document.createElement('article');card.className='movie-card';
 const cover=document.createElement('button');cover.type='button';cover.className='movie-cover';
 cover.setAttribute('aria-label','Xem phim '+movie.title);
 const img=document.createElement('img');img.alt='Ảnh xem trước của '+movie.title;img.loading='lazy';img.decoding='async';
 const play=document.createElement('span');play.className='movie-play';play.setAttribute('aria-hidden','true');play.textContent='▶';
 const duration=document.createElement('span');duration.className='movie-duration';duration.textContent=movie.duration||'VIDEO';
 const previewNote=document.createElement('span');previewNote.className='movie-thumbnail-note';previewNote.textContent='Đang tải ảnh xem trước…';
 cover.append(img,play,duration,previewNote);
 const body=document.createElement('div');body.className='movie-card-body';
 const category=document.createElement('div');category.className='eyebrow';category.textContent=movie.category||'PHIM SONG NGỮ · ALI';
 if(movie.availability==='needs_drive_permission'){cover.title='Video này hiện cần được cấp quyền xem trên Google Drive.';}
 const h3=document.createElement('h3');h3.textContent=movie.title;
 const desc=document.createElement('p');desc.className='small';desc.textContent=movie.description||'Xem video với phụ đề Anh – Việt.';
 const open=document.createElement('button');open.type='button';open.className='btn primary';open.textContent='Xem phim & học song ngữ →';
 cover.addEventListener('click',()=>openMovie(movie));open.addEventListener('click',()=>openMovie(movie));
 body.append(category,h3,desc,open);card.append(cover,body);
 img.addEventListener('load',()=>{img.classList.add('is-ready');previewNote.classList.add('hidden');});
 img.addEventListener('error',()=>{img.removeAttribute('src');makeFramePreview(movie,img,previewNote).catch(()=>{
  previewNote.textContent='Chưa có ảnh xem trước';previewNote.classList.remove('hidden');
 });},{once:true});
 const cacheKey='ALI_MOVIE_PREVIEW_'+movie.id;
 let cached='';
 try{cached=sessionStorage.getItem(cacheKey)||'';}catch{}
 if(cached){img.src=cached;movie.previewSrc=cached;}
 else if(movie.poster){img.src=movie.poster;movie.previewSrc=movie.poster;}
 else makeFramePreview(movie,img,previewNote).catch(()=>{previewNote.textContent='Chưa có ảnh xem trước';});
 return card;
}
let previewTask=null;
async function makeFramePreview(movie,img,note){
 // Use a frame from the actual local film if Drive's thumbnail is unavailable.
 if(movie.source?.type!=='chunked'||movie.source.loader!=='ali-video-01'||!window.AliVideoMedia)
  throw Error('No local video frame source');
 if(!previewTask){
  previewTask=(async()=>{
   const url=await window.AliVideoMedia.open();
   const probe=document.createElement('video');probe.muted=true;probe.playsInline=true;probe.preload='auto';
   try{
    const frame=await new Promise((resolve,reject)=>{
     let timer=setTimeout(()=>reject(Error('Preview timed out')),18000);
     const ok=()=>{clearTimeout(timer);resolve(probe);};
     const bad=()=>{clearTimeout(timer);reject(Error('Cannot decode thumbnail frame'));};
     probe.addEventListener('loadedmetadata',()=>{
      if(!probe.videoWidth||!probe.videoHeight){bad();return;}
      probe.currentTime=Math.min(Math.max(0,Number(movie.previewSecond)||8),Math.max(0,probe.duration-1));
     },{once:true});
     probe.addEventListener('seeked',ok,{once:true});probe.addEventListener('error',bad,{once:true});
     probe.src=url;probe.load();
    });
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('No canvas context');
    const vw=frame.videoWidth,vh=frame.videoHeight,W=640,H=360;
    const scale=Math.max(W/vw,H/vh);
    ctx.filter='blur(22px) brightness(0.66)';
    ctx.drawImage(frame,(W-vw*scale)/2,(H-vh*scale)/2,vw*scale,vh*scale);
    ctx.filter='none';
    const contain=Math.min(W/vw,H/vh);
    ctx.drawImage(frame,(W-vw*contain)/2,(H-vh*contain)/2,vw*contain,vh*contain);
    return canvas.toDataURL('image/jpeg',0.8);
   }finally{probe.pause();probe.removeAttribute('src');probe.load();URL.revokeObjectURL(url);}
  })();
 }
 const src=await previewTask;
 img.src=src;movie.previewSrc=src;
 note.classList.add('hidden');
 try{sessionStorage.setItem('ALI_MOVIE_PREVIEW_'+movie.id,src);}catch{}
}
async function loadLibrary(){
 if(libraryLoaded)return;libraryLoaded=true;
 const host=$('aliMovieLibrary');
 try{
  const response=await fetch('./ali-movies.json?v=1',{cache:'no-store'});
  if(!response.ok)throw Error('Movie catalog unavailable');
  const data=await response.json();
  const movies=(Array.isArray(data.movies)?data.movies:[]).filter(m=>m&&typeof m.id==='string'&&typeof m.title==='string'&&m.source);
  host.replaceChildren();
  $('aliLibraryCount').textContent=movies.length+' video';
  if(!movies.length){
   const empty=document.createElement('p');empty.className='ali-library-empty';empty.textContent='Chưa có phim song ngữ nào được đăng. ALI sẽ cập nhật thư viện tại đây.';host.append(empty);return;
  }
  movies.forEach(movie=>host.append(makeMovieCard(movie)));
 }catch(error){
  console.warn('ALI cinema library unavailable',error);
  host.textContent='Không tải được thư viện phim. Vui lòng làm mới trang.';
  $('aliLibraryCount').textContent='Chưa tải được';
 }
}
async function init(){
 try{
  const base='https://www.gstatic.com/firebasejs/13.2.0/';
  const [app,authSdk,dbSdk]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  auth=authSdk.getAuth(app.initializeApp(firebaseConfig));
  authSdk.onAuthStateChanged(auth,async user=>{
   if(!user){location.replace('./login.html?next=movies');return;}
   try{
    const db=dbSdk.getFirestore();
    let doc=await dbSdk.getDoc(dbSdk.doc(db,'users',user.uid));
    if(!doc.exists())doc=await dbSdk.getDoc(dbSdk.doc(db,'user',user.uid));
    if(!doc.exists()||doc.data().status!=='active'){await authSdk.signOut(auth);location.replace('./login.html?blocked=1');return;}
    $('memberName').textContent=doc.data().name||user.email||'Học viên';
    $('loading').classList.add('hidden');$('memberContent').classList.remove('hidden');
    loadLibrary();
   }catch(err){message('Không thể xác minh tài khoản học viên.');}
  });
  $('logout').addEventListener('click',async()=>{clearMedia();await authSdk.signOut(auth);location.assign('./login.html');});
 }catch(err){message('Không kết nối được Firebase. Hãy thử tải lại trang.');}
}
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

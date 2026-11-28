import {firebaseConfig} from './firebase-config.js';
import {showMovieQuiz,clearMovieQuiz} from './ali-movie-quiz.js?v=3';
import {buildCompactCaptionSegments} from './ali-caption-segments.js?v=1';
const $=id=>document.getElementById(id);
const video=$('aliHtmlVideo');
// ALI Cinema mobile standard: inline playback before assigning any media.
video.playsInline=true;
video.setAttribute('playsinline','');
video.setAttribute('webkit-playsinline','');
video.setAttribute('controlsList','nofullscreen noremoteplayback');
video.disablePictureInPicture=true;
video.disableRemotePlayback=true;
const driveFrame=$('aliDrivePlayer');
driveFrame.removeAttribute('allowfullscreen');
driveFrame.setAttribute('allow','autoplay; fullscreen \'none\'');
// On iPhone, native WebKit controls can still enter fullscreen on pinch/double tap,
// even when playsinline and controlslist=nofullscreen are set. Use page controls.
const useIphoneControls=/iPhone|iPod/i.test(navigator.userAgent);
const iosControls=$('aliIosControls');
const iosPlay=$('aliIosPlay'),iosSeek=$('aliIosSeek');
const iosMute=$('aliIosMute'),iosSpeed=$('aliIosSpeed');
const iosTap=$('aliVideoTap');
let iosSeeking=false;
if(useIphoneControls){
 document.documentElement.classList.add('ali-iphone-inline');
 video.controls=false;
 video.removeAttribute('controls');
}
const list=$('aliTranscriptList');
const scroller=$('aliTranscriptScroll');
const status=$('aliVideoMode');
const clock=$('aliVideoClock');
let cues=[],active=-1,mediaUrl=null,loadTicket=0,lang='both',fontScale=1,auth=null,currentMovie=null,libraryLoaded=false;
let autoScroll=true, overlayEnabled=true;
let compactSegments=[],pauseAfterCue=false,pauseFrame=0,lastPausedCue=-1;
let firebaseMovieContext=null;
let selectionTicket=0;

/* The ambient blur uses actual frames of the SAME playing HTML video.
   A tiny canvas at 8fps keeps the desktop glass backdrop lightweight.
   On mobile, when paused, or in Drive fallback, the real film poster remains. */
const ambientHost=$('aliCinemaAmbient');
const ambientCanvas=$('aliCinemaAmbientCanvas');
const ambientPoster=$('aliCinemaAmbientPoster');
const ambientFilm=$('aliCinemaAmbientVideo');
const movieScreen=document.querySelector('#aliVideoPlayer .screen');
const ambientContext=ambientCanvas?.getContext('2d',{alpha:false});
let ambientFrame=0,ambientLastFrame=0;
const ambientDesktop=()=>window.matchMedia('(min-width:851px)').matches;
function setAmbientPoster(movie){
 stopAmbient();
 if(ambientFilm){
  ambientFilm.pause();ambientFilm.removeAttribute('src');ambientFilm.load();
  ambientHost?.classList.remove('has-ambient-film');
  // New ALI-hosted movies may supply a low-resolution, silent film preview.
  // This is a real blurred movie background, not a thumbnail animation.
  if(movie?.source?.type==='drive'&&typeof movie?.ambientVideo==='string'&&movie.ambientVideo){
   try{
    const src=new URL(movie.ambientVideo,document.baseURI);
    if(src.origin===location.origin){
     ambientFilm.src=src.href;
     ambientFilm.load();
     if(window.matchMedia('(min-width:851px)').matches){
      ambientFilm.play().then(()=>ambientHost?.classList.add('has-ambient-film')).catch(()=>{});
     }
    }
   }catch(error){console.info('ALI ambient preview unavailable');}
  }
 }
 if(movieScreen)movieScreen.classList.toggle('is-drive-embed',movie?.source?.type==='drive');
 if(!ambientPoster)return;
 const image=movie?.previewSrc||movie?.poster||(movie?.driveId?'https://drive.google.com/thumbnail?id='+encodeURIComponent(movie.driveId)+'&sz=w1280':'');
 ambientHost.classList.toggle('is-drive',movie?.source?.type==='drive');
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
window.addEventListener('resize',()=>{
 refreshAmbient();
 if(!ambientFilm||!currentMovie?.ambientVideo||currentMovie.source?.type!=='drive'||$('aliVideoPlayer').classList.contains('hidden'))return;
 if(ambientDesktop()&&ambientFilm.paused){ambientFilm.play().then(()=>ambientHost?.classList.add('has-ambient-film')).catch(()=>{});}
 else if(!ambientDesktop()){ambientFilm.pause();ambientHost?.classList.remove('has-ambient-film');}
});

const time=t=>String(Math.floor((t||0)/60)).padStart(2,'0')+':'+String(Math.floor((t||0)%60)).padStart(2,'0');
function message(s){$('notice').textContent=s;$('notice').classList.remove('hidden');}
function syncReady(){
 return !!currentMovie && currentMovie.source?.type!=='drive' && !video.classList.contains('hidden');
}
function updateIphoneControls(){
 if(!iosControls)return;
 const available=useIphoneControls&&!!currentMovie&&currentMovie.source?.type!=='drive'&&!video.classList.contains('hidden');
 iosControls.hidden=!available;
 if(iosTap)iosTap.hidden=!available;
 if(!available)return;
 iosPlay.disabled=!video.hasAttribute('src');
 iosPlay.textContent=video.paused?'▶ Phát':'Ⅱ Tạm dừng';
 iosPlay.setAttribute('aria-label',video.paused?'Phát video':'Tạm dừng video');
 if(iosTap)iosTap.setAttribute('aria-label',video.paused?'Phát video':'Tạm dừng video');
 const duration=video.duration;
 const canSeek=Number.isFinite(duration)&&duration>0;
 iosSeek.disabled=!canSeek;
 if(!iosSeeking&&canSeek)iosSeek.value=String(Math.round(Math.min(1,video.currentTime/duration)*1000));
 iosSeek.setAttribute('aria-valuetext',time(video.currentTime));
 iosMute.textContent=video.muted?'Bật tiếng':'Tắt tiếng';
 iosMute.setAttribute('aria-label',video.muted?'Bật tiếng':'Tắt tiếng');
 iosSpeed.value=String(video.playbackRate);
}
if(useIphoneControls&&iosControls){
 const toggleInlinePlayback=()=>{
  if(!video.hasAttribute('src')){status.textContent='Đang chuẩn bị video. Vui lòng thử lại.';return;}
  if(video.paused){
   video.play().catch(()=>{status.textContent='Không thể phát video. Hãy thử lại hoặc mở bằng Safari.';updateIphoneControls();});
  }else video.pause();
  updateIphoneControls();
 };
 iosPlay.addEventListener('click',toggleInlinePlayback);
 iosTap?.addEventListener('click',toggleInlinePlayback);
 iosSeek.addEventListener('input',()=>{
  if(!Number.isFinite(video.duration)||video.duration<=0)return;
  iosSeeking=true;
  try{video.currentTime=(Number(iosSeek.value)/1000)*video.duration;}catch(e){}
  iosSeek.setAttribute('aria-valuetext',time(video.currentTime));
 });
 iosSeek.addEventListener('change',()=>{iosSeeking=false;updateIphoneControls();});
 iosMute.addEventListener('click',()=>{video.muted=!video.muted;updateIphoneControls();});
 iosSpeed.addEventListener('change',()=>{video.playbackRate=Number(iosSpeed.value)||1;updateIphoneControls();});
 for(const ev of ['timeupdate','loadedmetadata','play','pause','ended','volumechange','ratechange','emptied']){
  video.addEventListener(ev,updateIphoneControls);
 }
}
function updateSyncControls(){
 const ready=syncReady();
 const badge=$('aliSyncIndicator');
 const label=$('aliSyncStatus');
 const toggle=$('aliAutoScroll');
 const cc=$('aliScreenCc');
 const pauseButton=$('aliPauseAfterCue');
 const help=$('aliTranscriptHelp');
 const note=document.querySelector('.cinema-player-tip span:last-child');
 badge.classList.toggle('is-active',ready&&video.readyState>=1);
 badge.classList.toggle('is-disabled',!ready);
 label.textContent=!ready?'Đang xem phim':video.readyState<1?'Đang chuẩn bị video':video.paused?'Sẵn sàng đồng bộ':'Đang phát đồng bộ';
 toggle.disabled=!ready;
 toggle.setAttribute('aria-pressed',String(autoScroll));
 toggle.textContent=autoScroll?'☷ Tự động cuộn':'☷ Cuộn thủ công';
 cc.classList.toggle('hidden',!ready||!cues.length);
 cc.setAttribute('aria-pressed',String(overlayEnabled));
 if(pauseButton)pauseButton.disabled=!ready||!cues.length;
 help.textContent=ready?'Nhấn vào câu để nghe lại từ thời điểm đó':'Phụ đề song ngữ Anh–Việt';
 if(note)note.textContent=ready?'Nhấn một câu trong cột phụ đề để nhảy đến đúng thời điểm trong phim.':'Theo dõi lời thoại Anh–Việt trong khi xem phim.';
 updateIphoneControls();
}
function showCues(){
 list.replaceChildren();
 const ready=currentMovie?.source?.type!=='drive';
 if(!cues.length){
  const p=document.createElement('p');p.className='ali-empty';p.textContent='Phụ đề đang được cập nhật.';list.append(p);
  updateSyncControls();return;
 }
 const fragment=document.createDocumentFragment();
 cues.forEach((cue,i)=>{
  const row=document.createElement(ready?'button':'div');
  if(ready){row.type='button';row.setAttribute('aria-label','Phát lại từ '+time(cue.start)+': '+cue.en);}
  row.className='ali-cue';row.dataset.index=i;
  const stamp=document.createElement('span');stamp.className='ali-stamp';stamp.textContent=String(i+1).padStart(2,'0')+' · '+time(cue.start);
  const text=document.createElement('span');text.className='ali-cue-text';
  const en=document.createElement('strong');en.className='ali-en';en.textContent=cue.en;
  const vi=document.createElement('span');vi.className='ali-vi';vi.textContent=cue.vi;
  text.append(en,vi);row.append(stamp,text);
  if(ready){
   const action=document.createElement('span');action.className='ali-cue-play';action.setAttribute('aria-hidden','true');action.textContent='▶';
   row.append(action);
   row.addEventListener('click',()=>{
    if(video.readyState<1){status.textContent='Video đang tải. Hãy thử lại sau vài giây.';return;}
    const max=Number.isFinite(video.duration)?Math.max(0,video.duration-.05):cue.start;
    video.currentTime=Math.min(cue.start+.02,max);
    active=-1;sync();
    video.play().catch(()=>{updateSyncControls();});
   });
  }
  fragment.append(row);
 });
 list.append(fragment);applyLanguage();updateSyncControls();
}
function applyLanguage(){
 list.querySelectorAll('.ali-en').forEach(e=>e.classList.toggle('hidden',lang==='vi'));
 list.querySelectorAll('.ali-vi').forEach(e=>e.classList.toggle('hidden',lang==='en'));
 list.style.setProperty('--textscale',fontScale);
 movieScreen?.style.setProperty('--caption-textscale',String(fontScale));
 $('aliScreenCaptions')?.style.setProperty('--caption-textscale',String(fontScale));
 updateScreenCaptions();
}
function updateScreenCaptions(){
 const el=$('aliScreenCaptions');
 const compact=window.matchMedia('(max-width:700px)').matches;
 const ready=syncReady()&&overlayEnabled&&cues.length>0&&video.readyState>=1;
 movieScreen?.classList.toggle('has-mobile-captions',compact&&ready);
 if(!ready){el.classList.add('hidden');return;}
 const cue=active>=0?cues[active]:null;
 const speaking=cue&&video.currentTime>=cue.start&&video.currentTime<=cue.end+.35;
 const en=$('aliScreenCaptionEn'),vi=$('aliScreenCaptionVi');
 if(!speaking){
  en.textContent='';vi.textContent='';
  el.classList.toggle('is-idle',compact);
  el.classList.toggle('hidden',!compact);
  return;
 }
 let shown=cue;
 if(compact){
  const parts=compactSegments[active]||[];
  if(parts.length){
   // We estimate sub-cue times inside the original timestamp boundaries.
   const now=video.currentTime;
   shown=parts.find(part=>now>=part.start&&now<part.end)||
     (now>=parts[parts.length-1].end?parts[parts.length-1]:parts[0]);
  }
 }
 if(en.textContent!==shown.en)en.textContent=shown.en;
 if(vi.textContent!==shown.vi)vi.textContent=shown.vi;
 en.classList.toggle('hidden',lang==='vi');
 vi.classList.toggle('hidden',lang==='en');
 el.classList.remove('is-idle','hidden');
}
window.addEventListener('resize',updateScreenCaptions);
function sync(){
 if(!syncReady()){updateScreenCaptions();return;}
 const now=video.currentTime;
 clock.textContent=time(now)+' / '+time(video.duration||Number(currentMovie?.durationSeconds)||0);
 // Keep the most recent caption selected through short pauses between lines.
 let lo=0,hi=cues.length-1,i=-1;
 while(lo<=hi){const mid=(lo+hi)>>1;if(cues[mid].start<=now){i=mid;lo=mid+1;}else hi=mid-1;}
 // A transcript row is current only while its words are actually being spoken.
 if(i>=0&&now>cues[i].end+.35)i=-1;
 if(i===active){updateScreenCaptions();return;}
 const previous=list.querySelector('.ali-cue.current');
 if(previous){previous.classList.remove('current');previous.removeAttribute('aria-current');}
 active=i;
 if(i<0){updateScreenCaptions();return;}
 const row=list.querySelector('[data-index="'+i+'"]');
 if(row){
  row.classList.add('current');row.setAttribute('aria-current','true');
  if(autoScroll&&scroller.clientHeight){
   const top=row.offsetTop - list.offsetTop - scroller.clientHeight/2 + row.offsetHeight/2;
   scroller.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  }
 }
 updateScreenCaptions();
}
// Optional A1–A2 study mode: pause at the end of an original caption cue.
function stopPauseWatch(){if(pauseFrame){cancelAnimationFrame(pauseFrame);pauseFrame=0;}}
function watchCueEnd(){
 pauseFrame=0;
 if(!pauseAfterCue||video.paused||video.ended||!syncReady())return;
 const now=video.currentTime;
 // Short look-ahead avoids missing the endpoint on 60/120 Hz iPhones.
 let lo=0,hi=cues.length-1,i=-1;
 while(lo<=hi){const mid=(lo+hi)>>1;if(cues[mid].start<=now){i=mid;lo=mid+1;}else hi=mid-1;}
 const cue=i>=0?cues[i]:null;
 if(cue&&i!==lastPausedCue&&now>=cue.end-.085&&now<=cue.end+.14){
  lastPausedCue=i;
  video.pause();
  updateSyncControls();
  return;
 }
 pauseFrame=requestAnimationFrame(watchCueEnd);
}
function updatePauseWatch(){
 stopPauseWatch();
 if(pauseAfterCue&&!video.paused&&!video.ended)pauseFrame=requestAnimationFrame(watchCueEnd);
}
const pauseButton=$('aliPauseAfterCue');
pauseButton?.addEventListener('click',()=>{
 pauseAfterCue=!pauseAfterCue;
 pauseButton.setAttribute('aria-pressed',String(pauseAfterCue));
 pauseButton.textContent=pauseAfterCue?'⏸ Dừng sau từng câu: Bật':'⏸ Dừng sau từng câu: Tắt';
 lastPausedCue=-1;
 updatePauseWatch();
});
video.addEventListener('seeking',()=>{lastPausedCue=-1;});
video.addEventListener('play',updatePauseWatch);
video.addEventListener('pause',stopPauseWatch);
video.addEventListener('ended',stopPauseWatch);
for(const ev of ['timeupdate','seeking','seeked','play','playing','loadedmetadata','pause','ended'])video.addEventListener(ev,()=>{
 sync();if(ev==='playing'||ev==='pause'||ev==='loadedmetadata'||ev==='ended')updateSyncControls();
});
$('aliAutoScroll').addEventListener('click',()=>{
 if(!syncReady())return;
 autoScroll=!autoScroll;updateSyncControls();
 if(autoScroll){active=-1;sync();}
});
$('aliScreenCc').addEventListener('click',()=>{
 overlayEnabled=!overlayEnabled;updateSyncControls();updateScreenCaptions();
});
function clearMedia(){stopPauseWatch();lastPausedCue=-1;stopAmbient();video.pause();video.removeAttribute('src');video.load();if(mediaUrl){URL.revokeObjectURL(mediaUrl);mediaUrl=null;}}
function fallback(){
 ++loadTicket;clearMedia();
 const driveId=currentMovie?.driveId||'';
 if(!/^[a-zA-Z0-9_-]{20,}$/.test(driveId)){
  status.textContent='Không có nguồn phát dự phòng cho video này.';return;
 }
 video.classList.add('hidden');$('aliDrivePlayer').classList.remove('hidden');
 movieScreen?.classList.add('is-drive-embed');
 $('aliDrivePlayer').src='https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview';
 $('fallbackBtn').classList.add('hidden');
 // Never display an outbound original-source link in the student player.
 $('syncBtn').classList.toggle('hidden',currentMovie?.source?.type==='drive');$('syncBtn').textContent='Phát đồng bộ';
 clock.textContent='00:00 / '+(currentMovie?.duration||'--:--');
 status.textContent='Nguồn dự phòng: phụ đề không đồng bộ tự động.';updateSyncControls();
}
async function openSync(){
 const ticket=++loadTicket;
 $('aliDrivePlayer').removeAttribute('src');$('aliDrivePlayer').classList.add('hidden');video.classList.remove('hidden');
 clearMedia();$('fallbackBtn').classList.toggle('hidden',!currentMovie?.driveId);$('syncBtn').classList.add('hidden');
 movieScreen?.classList.remove('is-drive-embed');
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
   const resolved=new URL(source.url,document.baseURI);
   if(resolved.origin!==location.origin&&!currentMovie?.firebaseManaged)throw Error('Nguồn video không được hệ thống ALI xác minh');
   url=resolved.href;
  }else{
   fallback();return;
  }
  if(ticket!==loadTicket){if(mediaUrl===url&&url.startsWith('blob:'))URL.revokeObjectURL(url);return;}
  video.src=url;
  updateIphoneControls();
  if(currentMovie.previewSrc)video.poster=currentMovie.previewSrc;
  video.load();
  await new Promise((resolve,reject)=>{
   const cleanup=()=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',loaded);video.removeEventListener('error',failed);};
   const loaded=()=>{cleanup();resolve();};
   const failed=()=>{cleanup();reject(Error('Cannot play video'));};
   const timer=setTimeout(()=>{cleanup();reject(Error('Video metadata timed out'));},45000);
   video.addEventListener('loadedmetadata',loaded);
   video.addEventListener('error',failed);
   if(video.readyState>=1)loaded();
  });
  if(ticket!==loadTicket)return;
  status.textContent='Đã sẵn sàng';updateSyncControls();
  active=-1;sync();
 }catch(e){if(ticket===loadTicket){
  console.warn('Video playback unavailable',e);
  status.textContent='Video tải chậm hoặc chưa phát được. Hãy thử lại chế độ đồng bộ.';
  $('syncBtn').classList.remove('hidden');$('syncBtn').textContent='Thử lại';
  $('fallbackBtn').classList.toggle('hidden',!currentMovie?.driveId);
  updateSyncControls();
 }}
}
async function openMovie(movie){
 const selected=++selectionTicket;
 // Cancel the previous film immediately, even if its captions are still loading.
 ++loadTicket;clearMedia();clearMovieQuiz();
 $('aliDrivePlayer').removeAttribute('src');$('aliDrivePlayer').classList.add('hidden');
 currentMovie=movie;
 $('aliCurrentMovieTitle').textContent=movie.title||'Phim song ngữ ALI';
 $('aliVideoPlayer').classList.remove('hidden');
 setAmbientPoster(movie);
 $('aliVideoPlayer').scrollIntoView({behavior:'smooth'});
 let loadedCues=[];
 cues=[];
 clock.textContent='00:00 / '+(movie.duration||'--:--');
 status.textContent='Đang tải nội dung…';
 try{
  if(Array.isArray(movie.captionsInline)){
   loadedCues=movie.captionsInline.filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.end>x.start&&typeof x.en==='string'&&typeof x.vi==='string').sort((x,y)=>x.start-y.start);
  }else if(movie.captions){
   const url=new URL(movie.captions,document.baseURI);
   if(url.origin!==location.origin)throw Error('Chỉ tải phụ đề từ website ALI');
   const response=await fetch(url.href);
   if(!response.ok)throw Error('No captions');
   const json=await response.json();
   loadedCues=(Array.isArray(json.cues)?json.cues:[]).filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.end>x.start&&typeof x.en==='string'&&typeof x.vi==='string').sort((a,b)=>a.start-b.start);
  }
 }catch(e){console.info('Bộ phụ đề chưa sẵn sàng cho phim này');loadedCues=[];}
 // Ignore a stale caption fetch after a learner switches to another movie.
 if(selected!==selectionTicket)return;
 cues=loadedCues;
 compactSegments=cues.map(buildCompactCaptionSegments);
 lastPausedCue=-1;
 active=-1;autoScroll=true;showCues();
 // Quiz is independent from playback and must not delay loading the film.
 showMovieQuiz(movie,cues,auth?.currentUser?.uid||'guest');
 if(movie.source?.type==='drive')fallback();else openSync();
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
async function teacherPublishedMovies(){
 if(!firebaseMovieContext)return [];
 const {db,dbSdk,app}=firebaseMovieContext;
 const base='https://www.gstatic.com/firebasejs/13.2.0/';
 const storageSdk=await import(base+'firebase-storage.js');
 const storage=storageSdk.getStorage(app);
 const snapshot=await dbSdk.getDocs(dbSdk.query(dbSdk.collection(db,'teacherMovies'),
   dbSdk.where('status','==','published'),dbSdk.limit(250)));
 const films=[];
 await Promise.all(snapshot.docs.map(async document=>{
  try{
   const m=document.data();
   if(!m.videoPath||!m.posterPath)return;
   // Trusted URLs are resolved by the Firebase Storage SDK, not received from
   // unauthenticated browser input or a public JSON catalog.
   const [videoUrl,posterUrl,captionDoc]=await Promise.all([
    storageSdk.getDownloadURL(storageSdk.ref(storage,m.videoPath)),
    storageSdk.getDownloadURL(storageSdk.ref(storage,m.posterPath)),
    dbSdk.getDoc(dbSdk.doc(db,'teacherMovieCaptions',document.id))
   ]);
   if(!captionDoc.exists())return;
   const c=captionDoc.data();
   if(!Array.isArray(c.cues)||!c.cues.length)return;
   films.push({
    id:document.id,title:m.title,category:m.category||'PHIM SONG NGỮ · ALI',
    description:m.description||'Học tiếng Anh qua phim song ngữ',
    duration:m.duration||'VIDEO',durationSeconds:m.durationSeconds,
    poster:posterUrl,previewSrc:posterUrl,
    source:{type:'url',url:videoUrl},captionsInline:c.cues,
    firebaseManaged:true,publishedAt:m.publishedAt?.seconds||0,
    presentation:m.presentation||{background:'film-blur',layout:'video-left-captions-right'}
   });
  }catch(error){console.warn('A teacher movie could not be loaded:',document.id,error);}
 }));
 return films.sort((a,b)=>b.publishedAt-a.publishedAt);
}
async function loadLibrary(){
 if(libraryLoaded)return;libraryLoaded=true;
 const host=$('aliMovieLibrary');
 let staticMovies=[],teacherMovies=[];
 try{
  const response=await fetch('./ali-movies.json?v=1',{cache:'no-store'});
  if(!response.ok)throw Error('Static movie catalog unavailable');
  const data=await response.json();
  staticMovies=(Array.isArray(data.movies)?data.movies:[])
   .filter(m=>m&&typeof m.id==='string'&&typeof m.title==='string'&&m.source);
 }catch(e){console.warn('ALI static library unavailable',e);}
 try{teacherMovies=await teacherPublishedMovies();}
 catch(error){console.warn('Teacher movie library is not activated or access was denied.',error);}
 const deduplicated=new Map();
 for(const movie of staticMovies)deduplicated.set(movie.id,movie);
 for(const movie of teacherMovies)deduplicated.set(movie.id,movie);
 // Hide titles retired from the ALI public library, including teacher-sourced entries.
 const retiredMovieIds=new Set(['spiderman-nwh-peter-meets-other-spidermen']);
 const movies=[...deduplicated.values()].filter(m=>!retiredMovieIds.has(m.id));
 host.replaceChildren();
 $('aliLibraryCount').textContent=movies.length+' video';
 if(!movies.length){
  const empty=document.createElement('p');
  empty.className='ali-library-empty';
  empty.textContent='Chưa có phim song ngữ nào. ALI sẽ cập nhật tại đây.';
  host.append(empty);return;
 }
 movies.forEach(movie=>host.append(makeMovieCard(movie)));
}
async function init(){
 try{
  const base='https://www.gstatic.com/firebasejs/13.2.0/';
  const [app,authSdk,dbSdk]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  const appInstance=app.initializeApp(firebaseConfig);
  auth=authSdk.getAuth(appInstance);
  firebaseMovieContext={app:appInstance,db:dbSdk.getFirestore(appInstance),dbSdk};
  authSdk.onAuthStateChanged(auth,async user=>{
   if(!user){location.replace('/login/?next=movies');return;}
   try{
    const db=dbSdk.getFirestore();
    let doc=await dbSdk.getDoc(dbSdk.doc(db,'users',user.uid));
    if(!doc.exists())doc=await dbSdk.getDoc(dbSdk.doc(db,'user',user.uid));
    if(!doc.exists()||doc.data().status!=='active'){await authSdk.signOut(auth);location.replace('/login/?blocked=1');return;}
    $('memberName').textContent=doc.data().name||user.email||'Học viên';
    const claim=await user.getIdTokenResult();
    if(['teacher','admin'].includes(claim.claims.role)){
      const staffLink=$('aliTeacherNavLink');if(staffLink)staffLink.hidden=false;
    }
    $('loading').classList.add('hidden');$('memberContent').classList.remove('hidden');
    loadLibrary();
   }catch(err){message('Không thể xác minh tài khoản học viên.');}
  });
  $('logout').addEventListener('click',async()=>{clearMedia();await authSdk.signOut(auth);location.assign('/login/');});
 }catch(err){message('Không kết nối được Firebase. Hãy thử tải lại trang.');}
}
$('closeMovie').addEventListener('click',()=>{
 ++selectionTicket;++loadTicket;clearMedia();clearMovieQuiz();$('aliDrivePlayer').removeAttribute('src');$('aliVideoPlayer').classList.add('hidden');
 if(ambientFilm){ambientFilm.pause();ambientFilm.removeAttribute('src');ambientFilm.load();}
 ambientHost?.classList.remove('has-ambient-film');
 currentMovie=null;cues=[];compactSegments=[];active=-1;updateScreenCaptions();updateSyncControls();
});
$('fallbackBtn').addEventListener('click',()=>{
 if(window.confirm('Nguồn dự phòng có thể không đồng bộ phụ đề. Bạn có muốn tiếp tục?'))fallback();
});
$('syncBtn').addEventListener('click',()=>{
 if(currentMovie?.source?.type==='drive')return;
 openSync();
});
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{
 lang=button.dataset.language;document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===lang)));applyLanguage();
}));
$('smaller').addEventListener('click',()=>{fontScale=Math.max(.8,fontScale-.1);applyLanguage();});
$('larger').addEventListener('click',()=>{fontScale=Math.min(1.5,fontScale+.1);applyLanguage();});
$('topCues').addEventListener('click',()=>scroller.scrollTo({top:0,behavior:'smooth'}));
init();

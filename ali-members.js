import { firebaseConfig, isConfigured } from './firebase-config.js';

const $ = id => document.getElementById(id);
const page = document.body.dataset.page;
const submitButton = $('submit');
const notice = $('notice');

function show(message, good = false) {
  if (!notice) return;
  notice.textContent = message;
  notice.classList.add('show');
  notice.classList.toggle('good', good);
}

function friendlyError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không chính xác.',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ ALI English.',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
    'auth/operation-not-allowed': 'Chưa bật Email/Password trong Firebase Authentication.',
    'auth/unauthorized-domain': 'Miền website chưa được cấp quyền. Thêm lehuy17.github.io vào Authorized domains.',
    'auth/invalid-api-key': 'Firebase API key không hợp lệ. Kiểm tra firebase-config.js.',
    'permission-denied': 'Firestore từ chối lưu hoặc đọc hồ sơ. Kiểm tra Firestore Rules.',
    'auth/network-request-failed': 'Không kết nối được Firebase. Hãy kiểm tra mạng hoặc trình chặn quảng cáo.'
  };
  return messages[code] || 'Đã xảy ra lỗi (' + (code || 'unknown') + '): ' + String(error?.message || error).slice(0, 200);
}

if (submitButton) submitButton.disabled = true;
if ($('reset')) $('reset').disabled = true;
show('Đang kết nối hệ thống tài khoản Firebase…');

async function init() {
  if (!isConfigured()) {
    show('Chưa có cấu hình Firebase Web App. Vui lòng liên hệ ALI English để kích hoạt tài khoản.');
    return;
  }

  // Dynamic imports let us display a useful error if a Firebase CDN module fails.
  const version = '13.2.0';
  const root = 'https://www.gstatic.com/firebasejs/' + version + '/';
  let modules;
  try {
    modules = await Promise.all([
      import(root + 'firebase-app.js'),
      import(root + 'firebase-auth.js'),
      import(root + 'firebase-firestore.js')
    ]);
  } catch (error) {
    console.error('ALI Firebase SDK loading error:', error);
    show('Không tải được thư viện Firebase. Hãy kiểm tra mạng, thử trình duyệt khác hoặc tắt tiện ích chặn script rồi tải lại. ' + friendlyError(error));
    return;
  }

  const [appSdk, authSdk, dbSdk] = modules;
  let auth, db;
  try {
    const app = appSdk.initializeApp(firebaseConfig);
    auth = authSdk.getAuth(app);
    db = dbSdk.getFirestore(app);
  } catch (error) {
    console.error('ALI Firebase initialization error:', error);
    show('Không khởi tạo được kết nối Firebase. ' + friendlyError(error));
    return;
  }

  async function getProfile(user) {
    const snap = await dbSdk.getDoc(dbSdk.doc(db, 'users', user.uid));
    return snap.exists() ? snap.data() : null;
  }
  if (submitButton) submitButton.disabled = false;
  if ($('reset')) $('reset').disabled = false;
  if (notice) { notice.textContent = ''; notice.classList.remove('show', 'good'); }

  if (page === 'login') {
    $('loginForm').addEventListener('submit', async event => {
      event.preventDefault();
      submitButton.disabled = true;
      show('Đang xác thực tài khoản…');
      try {
        const result = await authSdk.signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value);
        const user = result.user;
        const p = await getProfile(user);
        if (!p || p.status !== 'active') {
          await authSdk.signOut(auth);
          show(!p ? 'Tài khoản chưa có hồ sơ học viên trong Firestore. Vui lòng liên hệ ALI.' : 'Tài khoản không có quyền truy cập hoặc đã bị khóa.');
          return;
        }
        window.location.assign('./movies.html');
      } catch (error) {
        console.error('ALI login error:', error);
        show(friendlyError(error));
      } finally {
        submitButton.disabled = false;
      }
    });
    $('reset').addEventListener('click', async () => {
      const email = $('email').value.trim();
      if (!email) { show('Nhập địa chỉ email trước khi yêu cầu đặt lại mật khẩu.'); return; }
      $('reset').disabled = true;
      try {
        await authSdk.sendPasswordResetEmail(auth, email);
        show('Nếu tài khoản tồn tại, Firebase sẽ gửi email hướng dẫn đặt lại mật khẩu.', true);
      } catch (error) { show(friendlyError(error)); }
      finally { $('reset').disabled = false; }
    });
  }

  if (page === 'movies') {
    authSdk.onAuthStateChanged(auth, async user => {
      if (!user) { window.location.replace('./login.html?next=movies'); return; }
      try {
        const p = await getProfile(user);
        if (!p || p.status !== 'active') {
          await authSdk.signOut(auth);
          window.location.replace('./login.html?blocked=1');
          return;
        }
        $('memberName').textContent = p.name || user.email || 'Học viên';
        $('memberEmail').textContent = user.email || '';
        $('memberContent').classList.remove('hidden');
        $('loading').classList.add('hidden');
      } catch (error) {
        console.error('ALI access check error:', error);
        show(friendlyError(error));
        $('loading').textContent = 'Không thể xác minh quyền truy cập tài khoản.';
      }
    }, error => {
      show('Lỗi xác thực phiên đăng nhập: ' + friendlyError(error));
    });
    $('logout').addEventListener('click', async () => {
      await authSdk.signOut(auth);
      window.location.assign('./login.html');
    });
    document.querySelectorAll('[data-lesson]').forEach(button => button.addEventListener('click', () => {
      $('lessonTitle').textContent = button.dataset.lesson;
      $('lessonModal').classList.remove('hidden');
      $('lessonModal').scrollIntoView({ behavior:'smooth' });
    }));
    $('hideLesson').addEventListener('click', () => $('lessonModal').classList.add('hidden'));
    // Display a bilingual transcript in the cinematic layout.
    // Captions may be supplied as verified JSON at captions/{fileId}.json.
    let aliSubtitleMode = 'both';
    let aliCaptionSize = 1;
    let activeCues = [];
    let currentCue = -1;
    const transcriptList = $('aliTranscriptList');
    const transcriptScroll = $('aliTranscriptScroll');
    const transcriptNote = $('aliTranscriptNote');
    function showTranscript(cues) {
      activeCues = cues;
      currentCue = -1;
      transcriptList.replaceChildren();
      if (!cues.length) {
        const empty = document.createElement('div');
        empty.className = 'ali-transcript-empty';
        const mark = document.createElement('span'); mark.className='ali-transcript-empty-icon';mark.textContent='“ ”';
        const title=document.createElement('strong');title.textContent='Không gian học theo lời thoại';
        const note=document.createElement('p');note.textContent='Video chưa có dữ liệu phụ đề được xác minh. Khi có phụ đề, từng câu tiếng Anh và bản dịch tiếng Việt sẽ xuất hiện ở đây.';
        empty.append(mark,title,note);transcriptList.append(empty);
        transcriptNote.textContent = 'Chưa có bản phụ đề của video này';
        return;
      }
      for (let i=0;i<cues.length;i++) {
        const cue=cues[i];
        const card=document.createElement('div');
        card.className='ali-transcript-cue';
        card.dataset.cueIndex=String(i);
        const serial=document.createElement('span');serial.className='ali-cue-index';serial.textContent=String(i+1).padStart(2,'0')+' · '+String(Math.floor(cue.start/60)).padStart(2,'0')+':'+String(Math.floor(cue.start%60)).padStart(2,'0');
        const lines=document.createElement('div');lines.className='ali-cue-lines';
        const en=document.createElement('div');en.className='ali-cue-en';en.textContent=cue.en;
        const vi=document.createElement('div');vi.className='ali-cue-vi';vi.textContent=cue.vi;
        lines.append(en,vi);card.append(serial,lines);transcriptList.append(card);
        card.tabIndex=0;
        card.title='Phát lại từ câu này';
        card.addEventListener('click',()=>{const video=$('aliHtmlVideo');if(!video.classList.contains('hidden')){video.currentTime=cue.start;video.play().catch(()=>{});}});
        card.addEventListener('keydown',event=>{if(event.key==='Enter')card.click();});
      }
      applyTranscriptSettings();
      transcriptNote.textContent = cues.length+' câu thoại Anh–Việt · thời gian ước lượng từ video';
    }
    function applyTranscriptSettings() {
      transcriptList.style.setProperty('--caption-scale',String(aliCaptionSize));
      transcriptList.querySelectorAll('.ali-cue-en').forEach(x=>x.classList.toggle('hidden',aliSubtitleMode==='vi'));
      transcriptList.querySelectorAll('.ali-cue-vi').forEach(x=>x.classList.toggle('hidden',aliSubtitleMode==='en'));
    }
    document.querySelectorAll('[data-sub-lang]').forEach(button => button.addEventListener('click', () => {
      aliSubtitleMode=button.dataset.subLang;
      document.querySelectorAll('[data-sub-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      applyTranscriptSettings();
    }));
    $('aliTextSmaller').addEventListener('click',()=>{aliCaptionSize=Math.max(.8,Math.round((aliCaptionSize-.1)*10)/10);applyTranscriptSettings();});
    $('aliTextLarger').addEventListener('click',()=>{aliCaptionSize=Math.min(1.5,Math.round((aliCaptionSize+.1)*10)/10);applyTranscriptSettings();});
    $('aliTranscriptTop').addEventListener('click',()=>transcriptScroll.scrollTo({top:0,behavior:'smooth'}));
    async function prepareAliCaptions(id) {
      showTranscript([]);
      try {
        const response=await fetch('./captions/'+encodeURIComponent(id)+'.json',{cache:'no-store'});
        if(!response.ok)return;
        const json=await response.json();
        const cues=(Array.isArray(json)?json:json.cues);
        if(!Array.isArray(cues))return;
        const valid=cues.filter(c=>typeof c.en==='string'&&typeof c.vi==='string'&&Number.isFinite(c.start)&&Number.isFinite(c.end)).sort((a,b)=>a.start-b.start);
        showTranscript(valid);
      } catch(error) { console.info('Transcript unavailable for this video.'); }
    }


    const aliPlayer = $('aliVideoPlayer');
    const video = $('aliHtmlVideo');
    const frame = $('aliDrivePlayer');
    let videoId = '';
    const timeLabel = seconds => {
      const n = Number.isFinite(seconds) ? seconds : 0;
      return String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');
    };
    function resetHighlight() {
      transcriptList.querySelectorAll('.is-current').forEach(row=>row.classList.remove('is-current'));
      currentCue=-1;
    }
    function syncCaptions() {
      const t=video.currentTime;
      $('aliVideoClock').textContent=timeLabel(t)+' / '+timeLabel(video.duration||53.4);
      const index=activeCues.findIndex(c=>t>=c.start&&t<c.end);
      if(index===currentCue)return;
      resetHighlight();
      if(index<0)return;
      const row=transcriptList.querySelector('[data-cue-index="'+index+'"]');
      if(!row)return;
      row.classList.add('is-current');
      currentCue=index;
      const target=row.offsetTop-transcriptScroll.offsetTop-(transcriptScroll.clientHeight-row.offsetHeight)/2;
      transcriptScroll.scrollTo({top:Math.max(0,target),behavior:'smooth'});
      transcriptNote.textContent='Đang phát câu '+(index+1)+' / '+activeCues.length;
    }
    ['timeupdate','seeked','play','loadedmetadata'].forEach(name=>video.addEventListener(name,syncCaptions));
    function activateFallback(){
      video.pause();
      video.classList.add('hidden');
      frame.classList.remove('hidden');
      frame.src='https://drive.google.com/file/d/'+encodeURIComponent(videoId)+'/preview';
      $('aliVideoMode').textContent='Phát dự phòng · không đồng bộ';
      $('aliFallbackBtn').classList.add('hidden');
      $('aliSyncBtn').classList.remove('hidden');
      resetHighlight();
    }
    function activateSync(){
      frame.removeAttribute('src');
      frame.classList.add('hidden');
      video.classList.remove('hidden');
      video.src='https://drive.google.com/uc?export=download&id='+encodeURIComponent(videoId);
      video.load();
      $('aliVideoMode').textContent='Đồng bộ phụ đề đang bật';
      $('aliFallbackBtn').classList.remove('hidden');
      $('aliSyncBtn').classList.add('hidden');
    }
    video.addEventListener('error',()=>{
      if(!video.classList.contains('hidden')&&videoId)activateFallback();
    });
    $('aliFallbackBtn').addEventListener('click',activateFallback);
    $('aliSyncBtn').addEventListener('click',activateSync);
    document.querySelectorAll('[data-video-id]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.videoId;
      if(!/^[a-zA-Z0-9_-]{20,}$/.test(id))return;
      videoId=id;
      $('lessonModal').classList.add('hidden');
      $('aliVideoTitle').textContent=button.dataset.videoTitle||'Video luyện nghe ALI';
      aliPlayer.classList.remove('hidden');
      activateSync();
      prepareAliCaptions(id);
      aliPlayer.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    $('closeAliVideo').addEventListener('click',()=>{
      video.pause();
      video.removeAttribute('src');
      video.load();
      frame.removeAttribute('src');
      aliPlayer.classList.add('hidden');
      resetHighlight();
      videoId='';
    });

  }
}

init().catch(error => {
  console.error('ALI member portal startup error:', error);
  show('Hệ thống tài khoản gặp lỗi khi khởi động. ' + friendlyError(error));
});

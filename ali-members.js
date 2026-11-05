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
    // Timed bilingual captions: only show verified cues; do not fabricate dialogue.
    let aliSubtitleMode = 'both';
    const subtitleNodes = {
      status: $('aliSubtitleStatus'), current: $('aliSubtitleCurrent'),
      en: $('aliSubtitleEn'), vi: $('aliSubtitleVi')
    };
    const aliCues = new Map();
    function renderAliCaption(cue) {
      if (!cue) {
        subtitleNodes.current.classList.add('hidden');
        subtitleNodes.en.textContent = '';
        subtitleNodes.vi.textContent = '';
        return;
      }
      subtitleNodes.current.classList.remove('hidden');
      subtitleNodes.en.textContent = cue.en || '';
      subtitleNodes.vi.textContent = cue.vi || '';
      subtitleNodes.en.classList.toggle('hidden',aliSubtitleMode === 'vi');
      subtitleNodes.vi.classList.toggle('hidden',aliSubtitleMode === 'en');
    }
    document.querySelectorAll('[data-sub-lang]').forEach(button => button.addEventListener('click', () => {
      aliSubtitleMode = button.dataset.subLang;
      document.querySelectorAll('[data-sub-lang]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
      subtitleNodes.en.classList.toggle('hidden',aliSubtitleMode === 'vi');
      subtitleNodes.vi.classList.toggle('hidden',aliSubtitleMode === 'en');
    }));
    // The iframe provider does not expose a trustworthy currentTime to the page.
    // Real cue synchronization requires a player with a supported time API.
    function prepareAliCaptions(id) {
      const cues = aliCues.get(id) || [];
      renderAliCaption(null);
      subtitleNodes.status.textContent = cues.length
        ? 'Phụ đề đã sẵn sàng khi video hỗ trợ đồng bộ thời gian.'
        : 'Chưa có bản lời thoại được xác minh cho video này.';
    }

    const aliPlayer = $('aliVideoPlayer');
    const aliFrame = $('aliDrivePlayer');
    document.querySelectorAll('[data-video-id]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.videoId;
      if (!/^[a-zA-Z0-9_-]{20,}$/.test(id)) return;
      $('lessonModal').classList.add('hidden');
      $('aliVideoTitle').textContent = button.dataset.videoTitle || 'Video luyện nghe ALI';
      prepareAliCaptions(id);
      aliFrame.src = 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/preview';
      aliPlayer.classList.remove('hidden');
      aliPlayer.scrollIntoView({ behavior:'smooth', block:'start' });
    }));
    $('closeAliVideo').addEventListener('click', () => {
      aliFrame.removeAttribute('src');
      aliPlayer.classList.add('hidden');
    });

  }
}

init().catch(error => {
  console.error('ALI member portal startup error:', error);
  show('Hệ thống tài khoản gặp lỗi khi khởi động. ' + friendlyError(error));
});

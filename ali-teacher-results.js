/* Staff-only review of placement submissions; Firebase rules enforce authorization. */
import {firebaseConfig} from './firebase-config.js';
const base='https://www.gstatic.com/firebasejs/13.2.0/';
const [ap,au,fs,fn]=await Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore.js','firebase-functions.js'].map(x=>import(base+x)));
const app=ap.getApps().length?ap.getApp():ap.initializeApp(firebaseConfig);
const auth=au.getAuth(app),db=fs.getFirestore(app),functions=fn.getFunctions(app,'asia-southeast1');
const $=id=>document.getElementById(id);
const el=(tag,s,cls)=>{const e=document.createElement(tag);if(s!==undefined)e.textContent=String(s);if(cls)e.className=cls;return e};
let allowed=false,role=null,items=[],busy=false;
const readableDate=v=>v?.toDate?.().toLocaleString('vi-VN')||'Chưa rõ';
const setStatus=t=>$('teacherResultsStatus').textContent=t;
au.onAuthStateChanged(auth,async user=>{
 allowed=false;role=null;$('aliAdminTeacherCreation').hidden=true;
 if(!user)return;
 try{
  const token=await user.getIdTokenResult(true);role=token.claims.role;
  if(!['teacher','admin'].includes(role))return;
  const p=await fs.getDoc(fs.doc(db,'users',user.uid));if(!p.exists()||p.data().status!=='active')return;
  allowed=true;if(role==='admin')$('aliAdminTeacherCreation').hidden=false;
  if(!$('teacherPaneResults').hidden)load();
 }catch(e){setStatus('Không xác minh được quyền giáo viên: '+e.message);}
});
document.addEventListener('ali:teacher-results-open',()=>{if(allowed)load();else setStatus('Bạn cần đăng nhập tài khoản giáo viên đã được kích hoạt.');});
function dateSort(a,b){return (b.submittedAt?.seconds||0)-(a.submittedAt?.seconds||0)}
function render(){
 const tbody=$('teacherResultsRows');tbody.replaceChildren();
 const text=$('teacherResultsSearch').value.toLocaleLowerCase('vi-VN').trim(),type=$('teacherResultsType').value;
 const rows=items.filter(x=>(!type||x.test===type)&&(!text||[x.studentName,x.email,x.id,x.studentUid].some(y=>String(y||'').toLocaleLowerCase('vi-VN').includes(text))));
 if(!rows.length){const tr=el('tr'),td=el('td','Không có kết quả phù hợp.');td.colSpan=5;tr.append(td);tbody.append(tr);return}
 for(const a of rows){
  const tr=el('tr'),td=el('td');
  td.append(el('strong',a.studentName),el('div',a.email));tr.append(td,el('td',String(a.test).toUpperCase()),el('td',readableDate(a.submittedAt)),el('td',a.total+'/'+a.max));
  const last=el('td'),btn=el('button','Xem bài làm','teacher-outline');btn.type='button';btn.addEventListener('click',()=>detail(a));
  last.append(btn);tr.append(last);tbody.append(tr);
 }
}
async function load(){
 if(!allowed){setStatus('Không có quyền Teacher/Admin.');return}
 if(busy)return;busy=true;setStatus('Đang tải kết quả Firebase…');
 try{
  const snap=await fs.getDocs(fs.query(fs.collection(db,'placementAttempts'),fs.limit(300)));
  items=snap.docs.map(d=>({id:d.id,...d.data()})).sort(dateSort);
  render();setStatus('Đã tải '+items.length+' lượt nộp. Chọn một học viên để xem câu đúng, sai và điểm kỹ năng.');
 }catch(e){setStatus('Chưa đọc được kết quả: '+String(e.message||e).slice(0,200));}
 finally{busy=false}
}
function row(parent,a,b){
 const d=el('div',undefined,'ali-tr-line');d.append(el('strong',a),el('span',b));parent.append(d);
}
function detail(d){
 const host=$('teacherResultDetail');host.hidden=false;host.replaceChildren();
 host.append(el('h3',d.studentName+' · '+d.test.toUpperCase()),el('p',(d.email||'')+' · '+readableDate(d.submittedAt)+' · Mã: '+d.id,'ali-tr-muted'));
 const summary=el('div',undefined,'ali-tr-summary');summary.append(el('strong',d.total+'/'+d.max+' điểm đã chấm'));
 summary.append(el('p',(d.breakdown||[]).map(x=>x.name+': '+(Number.isFinite(x.score)?x.score+'/'+x.max:'Chưa chấm')).join(' · ')));
 summary.append(el('p',d.placement||'Chờ giáo viên đánh giá'));host.append(summary);
 row(host,'Điện thoại',d.phone||'Chưa cung cấp');row(host,'Trường',d.school||'Chưa cung cấp');
 host.append(el('h4','Chữa bài và đối chiếu đáp án'));
 const filters=el('div',undefined,'ali-tr-filters'),box=el('div',undefined,'ali-tr-items');let mode='wrong';
 function paint(){
  box.replaceChildren();const recs=(d.records||[]).filter(x=>mode==='all'||(mode==='wrong'?!x.correct:x.correct));
  if(!recs.length){box.append(el('p','Không có câu phù hợp.'));return}
  for(const r of recs){
   const card=el('article',undefined,'ali-tr-item '+(r.correct?'good':'wrong'));
   card.append(el('strong',r.part+' · Câu '+r.number+' · '+(r.correct?'Đúng':'Sai / bỏ trống')));
   row(card,'Học viên chọn',r.answer||'Chưa trả lời');row(card,'Đáp án',r.expected);
   card.append(el('p',r.explanation||'Đối chiếu đáp án ALI.','ali-tr-muted'));box.append(card);
  }
 }
 for(const [id,label] of [['wrong','Sai / bỏ trống'],['all','Tất cả'],['right','Đúng']]){
  const b=el('button',label,'teacher-outline');b.type='button';b.setAttribute('aria-pressed',String(id===mode));
  b.addEventListener('click',()=>{mode=id;filters.querySelectorAll('button').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));paint()});filters.append(b);
 }
 host.append(filters,box);paint();
 if(d.writing){const det=el('details'),pre=el('pre',d.writing);pre.style.whiteSpace='pre-wrap';pre.style.wordBreak='break-word';
  det.append(el('summary','Bài Writing / tự luận (chờ chấm)'),pre);host.append(det)}
 host.append(el('p','Thang điểm nội bộ ALI. Không quy đổi chính thức khi thiếu kỹ năng.','ali-tr-muted'));
 host.scrollIntoView({behavior:'smooth',block:'start'});
}
$('teacherResultsSearch').addEventListener('input',render);
$('teacherResultsType').addEventListener('change',render);
$('teacherRefreshResults').addEventListener('click',load);
$('aliCreateTeacherForm').addEventListener('submit',async e=>{
 e.preventDefault();const out=$('aliNewTeacherResult');
 if(!allowed||role!=='admin'){out.textContent='Chỉ Admin được tạo tài khoản giáo viên.';return}
 const btn=$('aliNewTeacherBtn');btn.disabled=true;out.textContent='Đang tạo tài khoản…';
 try{
  const call=fn.httpsCallable(functions,'adminCreateTeacher');
  const d=(await call({name:$('aliNewTeacherName').value.trim(),email:$('aliNewTeacherEmail').value.trim()})).data;
  out.textContent='Đã tạo giáo viên '+d.name+'\nEmail: '+d.email+'\nMật khẩu tạm thời (chỉ hiển thị một lần): '+d.temporaryPassword+'\nHãy gửi riêng và yêu cầu đổi mật khẩu.';
  $('aliCreateTeacherForm').reset();
 }catch(err){out.textContent='Chưa tạo được giáo viên: '+String(err.message||err).slice(0,200)}
 finally{btn.disabled=false}
});
const style=document.createElement('style');
style.textContent='.ali-tr-summary{padding:17px;margin:15px 0;background:#fff5ec;border:1px solid #ffdcc2;border-radius:14px}.ali-tr-summary strong{font-size:24px;color:#c35618}.ali-tr-muted{color:#785f53;font-size:13px;line-height:1.8}.ali-tr-line{display:flex;gap:12px;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f3e4da;font-size:13px}.ali-tr-line strong{min-width:110px}.ali-tr-filters{display:flex;gap:9px;flex-wrap:wrap;margin:16px 0}.ali-tr-filters button[aria-pressed=true]{background:#ff681e!important;color:white!important}.ali-tr-items{max-height:650px;overflow:auto}.ali-tr-item{padding:15px;border:1px solid #f0d8c6;border-left:4px solid #f1874f;border-radius:13px;margin-bottom:10px;background:#fff}.ali-tr-item.good{border-left-color:#319e73}.ali-tr-item .ali-tr-line{border:0;padding:4px 0}@media(max-width:640px){.ali-tr-line{display:block}.ali-tr-line strong{display:block}.ali-tr-items{max-height:none}}';
document.head.append(style);

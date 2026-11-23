/* ALI Academy · placement result handoff.
   Explicitly distinguishes a local score from server-confirmed Google Sheets saving.
   This module does not transmit data until the administrator deploys/configures
   the matching ali-placement-results.gs Google Apps Script web app.
*/
(function(global){
'use strict';
const CONF=global.ALI_PLACEMENT_SYNC_CONFIG||{};
const KEY='ALI_PENDING_PLACEMENT_SUBMISSIONS_V1';
const TESTS=new Set(['ielts','toeic','b1']);
const APP_URL=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
function load(){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.slice(0,20):[];}
 catch{return [];}
}
function save(items){try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,20)));return true}catch{return false}}
function random(){
 if(global.crypto?.randomUUID)return global.crypto.randomUUID().replace(/-/g,'');
 if(global.crypto?.getRandomValues){const b=new Uint8Array(16);global.crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
 throw Error('Secure browser random not available');
}
function reg(){try{return JSON.parse(sessionStorage.getItem('ALI_TEST_REGISTRATION')||'null')}catch{return null}}
function testType(){const file=location.pathname.replace(/\/+$/,'').split('/').pop();return file.replace(/\.html$/,'').toLowerCase();}
function getAnswers(type){
 const out={};
 if(type==='ielts'){
  for(let i=0;i<20;i++)out['listen'+i]=document.getElementById('listen'+i)?.value||'';
  for(let i=0;i<13;i++)out['read'+i]=document.getElementById('read'+i)?.value||'';
 }else if(type==='toeic'){
  for(let i=1;i<=55;i++)out['toeic'+i]=document.querySelector('input[name="toeic'+i+'"]:checked')?.value||'';
 }else if(type==='b1'){
  for(let i=0;i<15;i++)out['q'+i]=document.querySelector('input[name="q'+i+'"]:checked')?.value||'';
  document.querySelectorAll('#reading textarea,#sentences textarea,#writing textarea').forEach((n,i)=>out[n.id||'written'+i]=n.value);
 }
 return out;
}
function getWriting(type){
 if(type==='ielts')return document.getElementById('writing')?.value||'';
 if(type==='toeic'){
  if(!document.getElementById('toeicSWToggle')?.checked)return '';
  return ['W1a: '+(document.getElementById('toeicW10')?.value||''),
   'W1b: '+(document.getElementById('toeicW11')?.value||''),
   'W2: '+(document.getElementById('toeicW2')?.value||'')].join('\n');
 }
 return Array.from(document.querySelectorAll('#reading textarea,#sentences textarea,#writing textarea'))
  .map((el,i)=>'Response '+(i+1)+': '+el.value).join('\n');
}
function buildPayload(type,result){
 const student=reg();
 if(!student||student.consent!==true||!String(student.name||'').trim())return null;
 const scores={};
 for(const part of (result.breakdown||[])){
  if(!Number.isFinite(part.score))continue;
  if(type==='ielts'){
   if(/Listening/i.test(part.label))scores.listening=part.score;
   if(/Reading/i.test(part.label))scores.reading=part.score;
  }else if(type==='toeic'){
   if(/Reading/i.test(part.label))scores.reading=part.score;
  }else if(type==='b1'){
   if(/Grammar/i.test(part.label))scores.grammar=part.score;
  }
 }
 if(type==='toeic'){
  const correct=['B','C','D','C','B','C'];
  scores.foundation=correct.reduce((n,letter,i)=>
   n+(document.querySelector('input[name="toeic'+(26+i)+'"]:checked')?.value===letter?1:0),0);
 }
 return {
  type:'ali_placement_submission',schemaVersion:1,
  submissionId:'ALI-PL-'+random(),test:type,consent:true,
  student:{name:String(student.name||'').slice(0,120),phone:String(student.phone||'').slice(0,35),
   school:String(student.school||'').slice(0,200),goal:String(student.goal||'').slice(0,120)},
  scores,answers:getAnswers(type),writing:getWriting(type).slice(0,12000),
  startedAt:new Date().toISOString()
 };
}
function messageText(node,text){node.textContent=text;node.style.fontSize='12px';node.style.lineHeight='1.7';node.style.marginTop='12px';}
function post(payload){
 return new Promise((resolve,reject)=>{
  const endpoint=String(CONF.endpoint||'').trim();
  if(!APP_URL.test(endpoint))return reject(Error('Chưa kết nối Web App nhận kết quả của ALI.'));
  const nonce=random()+random().slice(0,8);
  const frame=document.createElement('iframe');
  frame.hidden=true;frame.name='aliPlacementFrame_'+nonce;frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');
  form.method='POST';form.target=frame.name;form.action=endpoint;form.hidden=true;
  for(const [name,value] of Object.entries({payload:JSON.stringify(payload),nonce})){
   const el=document.createElement('input');el.type='hidden';el.name=name;el.value=value;form.append(el);
  }
  let done=false;
  const cleanup=()=>{clearTimeout(timer);global.removeEventListener('message',receive);form.remove();frame.remove();};
  const finish=(ok,v)=>{if(done)return;done=true;cleanup();ok?resolve(v):reject(v)};
  function receive(event){
   if(event.source!==frame.contentWindow)return;
   if(event.origin!=='null'&&!/^https:\/\/(script\.google\.com|[a-z0-9.-]*googleusercontent\.com)$/.test(event.origin))return;
   const v=event.data;
   if(!v||v.type!=='ALI_PLACEMENT_RECEIPT'||v.nonce!==nonce||v.submissionId!==payload.submissionId)return;
   if(v.ok===true&&v.saved===true&&Number.isInteger(v.row)&&v.row>=2)finish(true,v);
   else finish(false,Error(v.error||'Máy chủ không xác nhận việc lưu.'));
  }
  const timer=setTimeout(()=>finish(false,Error('Không nhận được xác nhận trong 25 giây. Bài vẫn được lưu trong trình duyệt để gửi lại.')),25000);
  global.addEventListener('message',receive);document.body.append(frame,form);
  try{form.submit()}catch(err){finish(false,err)}
 });
}
function downloadBackup(payload){
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ALI-placement-'+payload.test+'-'+payload.submissionId+'.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function attach(result,target){
 const type=testType();if(!TESTS.has(type))return;
 const box=document.createElement('div');
 box.setAttribute('role','status');box.className='ali-result-note';
 target.append(box);
 const payload=buildPayload(type,result);
 if(!payload){messageText(box,'Thiếu thông tin học viên hoặc quyền đồng ý; chưa thể gửi kết quả. Vui lòng quay lại đăng ký từ danh sách bài test.');return;}
 const existing=load();
 existing.unshift(payload);save(existing);
 const intro=document.createElement('p');intro.textContent='Mã bài làm: '+payload.submissionId;
 box.append(intro);
 const status=document.createElement('p');status.setAttribute('aria-live','polite');box.append(status);
 const actions=document.createElement('div');actions.className='ali-result-actions';box.append(actions);
 const backup=document.createElement('button');backup.type='button';backup.className='ali-result-btn ali-result-secondary';
 backup.textContent='↓ Tải bản sao câu trả lời';backup.onclick=()=>downloadBackup(payload);actions.append(backup);
 const retry=document.createElement('button');retry.type='button';retry.className='ali-result-btn ali-result-secondary';
 retry.textContent='↻ Gửi lại về Google Sheets';actions.append(retry);
 let busy=false;
 async function send(){
  if(busy)return;busy=true;retry.disabled=true;
  messageText(status,'Đang chuyển bài đến ALI; chưa được xác nhận lưu.');
  try{
   const v=await post(payload);
   const items=load();save(items.filter(p=>p.submissionId!==payload.submissionId));
   messageText(status,'✓ Đã xác nhận lưu Google Sheets · '+v.test.toUpperCase()+' · dòng '+v.row+'. Bài viết/kỹ năng chưa chấm vẫn cần giáo viên đánh giá.');
   retry.hidden=true;
  }catch(e){
   messageText(status,'Chưa lưu được vào Google Sheets: '+e.message+' Bài còn trong bộ nhớ thiết bị này. Tải bản sao hoặc gửi lại sau khi ALI kết nối máy chủ.');
  }finally{busy=false;retry.disabled=false;}
 }
 retry.onclick=send;
 if(APP_URL.test(String(CONF.endpoint||'')))send();
 else messageText(status,'Chưa cấu hình kết nối Google Sheets cho bài '+type.toUpperCase()+'. Điểm hiện chỉ được lưu cục bộ, KHÔNG có bản ghi trên Google. Có thể tải bản sao để gửi cho giáo viên.');
}
global.ALIPlacementSync={attach};
})(window);

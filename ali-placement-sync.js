/* ALI Academy · placement result handoff.
   Explicitly distinguishes a local score from server-confirmed Google Sheets saving.
   This module does not transmit data until the administrator deploys/configures
   the matching ali-placement-results.gs Google Apps Script web app.
*/
(function(global){
'use strict';
const CONF=global.ALI_PLACEMENT_SYNC_CONFIG||{};
const DEFAULT_ENDPOINT='https://script.google.com/macros/s/AKfycbwzy_r_rvaj9CEon3UIX0RhA_QbiVOttO50KdMfbAizzdc7v8tN_ZlP09-ReR29tktY/exec';
const ENDPOINT=String(CONF.endpoint||DEFAULT_ENDPOINT).trim();
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
function testType(){
 const file=location.pathname.split('/').filter(Boolean).pop()?.replace(/\.html$/,'').toLowerCase()||'';
 const expected=String(document.documentElement.getAttribute('data-ali-exam')||'').trim().toLowerCase();
 return TESTS.has(expected)&&expected===file?expected:'';
}
function validatedPayload(p){
 if(!p||!TESTS.has(p.test)||!/^ALI-PL-[A-Za-z0-9_-]{8,90}$/.test(String(p.submissionId||'')))return false;
 const a=p.answers||{},keys=Object.keys(a);
 if(p.test==='ielts')return Object.prototype.hasOwnProperty.call(a,'listen0')&&Object.prototype.hasOwnProperty.call(a,'read0')&&!keys.some(k=>/^toeic[0-9]+$/.test(k));
 if(p.test==='toeic')return Object.prototype.hasOwnProperty.call(a,'toeic1')&&Object.prototype.hasOwnProperty.call(a,'toeic55')&&!keys.some(k=>/^(listen|read)[0-9]+$/.test(k));
 if(p.test==='b1')return Object.prototype.hasOwnProperty.call(a,'q0')&&Object.prototype.hasOwnProperty.call(a,'q14');
 return false;
}
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
   if(/Listening/i.test(part.label))scores.listening=part.score;
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
  const endpoint=ENDPOINT;
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
   if(v.ok===true&&v.saved===true&&v.test===payload.test&&Number.isInteger(v.row)&&v.row>=2)finish(true,v);
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
// Background-only persistence: learners only see their assessment result.
let sending=false;
async function drainPending(){
 if(sending||!APP_URL.test(ENDPOINT)||navigator.onLine===false)return;
 sending=true;
 try{
  // Submit the newest first; never let a failed IELTS attempt block TOEIC or B1.
  const batch=load().filter(validatedPayload);
  for(const payload of batch){
   try{
    const receipt=await post(payload);
    if(receipt.ok===true&&receipt.saved===true&&receipt.test===payload.test){
     save(load().filter(p=>p.submissionId!==payload.submissionId));
     console.info('[ALI placement] Confirmed',payload.test,payload.submissionId,receipt.row);
    }else{
     console.warn('[ALI placement] Receipt type mismatch, retained',payload.test);
    }
   }catch(err){
    console.warn('[ALI placement] Pending retry',payload.test,String(err?.message||err));
    continue;
   }
  }
 }finally{sending=false}
}
function attach(result,target){
 const type=testType();if(!TESTS.has(type))return;
 const payload=buildPayload(type,result);
 if(payload&&!validatedPayload(payload)){console.error('[ALI placement] Exam type and answers mismatch; submission blocked');return;}
 if(!payload){
  console.warn('[ALI placement] No registration/consent, cannot submit result.');
  return;
 }
 // Never display the submission ID, Sheets state, or backup/retry buttons to a student.
 // Save the complete answers before any network request for offline recovery.
 const pending=load();
 pending.unshift(payload);
 const locallySaved=save(pending);
 if(!locallySaved)console.error('[ALI placement] Local backup failed; verify browser storage permissions.');
 drainPending();
}
global.addEventListener('online',()=>{drainPending();});
global.addEventListener('pageshow',()=>{drainPending();});
// Background recovery while the learner keeps the results page open.
global.setInterval(()=>{if(!document.hidden)drainPending();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)drainPending();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>drainPending(),{once:true});
else queueMicrotask(drainPending);

global.ALIPlacementSync={attach};
})(window);

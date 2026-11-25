/**
 * ALI Academy · Placement results receiver (B1 / IELTS / TOEIC).
 *
 * Use the existing dedicated ALI Placement Web App and deploy a NEW VERSION
 * (execute as owner; Anyone access only if needed for public student submissions).
 * Do not paste this into the student-account provisioning Script, the A1-A2
 * result receiver, or the Speaking recording receiver.
 * Spreadsheet: 18akzuhbaPHxihINySIUrMJlvfzjNx59qW7jRIs_2j-0
 * The web application accepts enrollment records, not authentication secrets.
 *
 * Security: size/range checks, anti-formula-injection, idempotency and write lock.
 * Browser scoring is provisional and is NOT a certified IELTS/TOEIC result.
 * For production, consider App Check, rate limiting and an authenticated backend.
 */
const ALI_PLACEMENT_SHEET_ID='18akzuhbaPHxihINySIUrMJlvfzjNx59qW7jRIs_2j-0';
const ALI_PLACEMENT_TABS={ielts:'IELTS Results',toeic:'TOEIC Results',b1:'B1 Results'};
const ALI_PLACEMENT_COLS={ielts:18,toeic:19,b1:18};
const ALI_PLACEMENT_VERSION=1;
/* TOEIC Test 1 official test-order mapping into ALI placement 1–25:
 * original 1–4, 11–19, 41–43, 68–70, 77–79, 95–97.
 * External source key cross-checked against reading answers in ALI materials. */
const ALI_TOEIC_LISTENING_KEY='CADCCBBACBCACBDBBCADCDCAC';

const ALI_TOEIC_READING_KEY='BCDCBCABADADBACBACDBCBCDDBDACD';
// Internal ALI placement uses its own 1–55 numbering.
function aliToeicGradePart_(answers,start,key){
  return Array.from({length:key.length},(_,i)=>
    String((answers||{})['toeic'+(start+i)]||'').trim().toUpperCase()===key[i]?1:0
  ).reduce((sum,mark)=>sum+mark,0);
}

function aliToeicListeningGrade_(answers){
  const map=answers||{};
  return Array.from({length:25},(_,i)=>String(map['toeic'+(i+1)]||'').trim().toUpperCase()===ALI_TOEIC_LISTENING_KEY[i]?1:0)
    .reduce((sum,mark)=>sum+mark,0);
}
function aliPlacementSafe_(v,max){
  let s=String(v===undefined||v===null?'':v).slice(0,max||500);
  // Avoid a spreadsheet treating user text as a formula. SetValues also needs this.
  return /^\s*[=+@\-]/.test(s)?("'"+s):s;
}
function aliPlacementNumber_(v,max){
  return typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max?v:'';
}
function aliPlacementEmpty_(n){return Array.from({length:n},()=> '');}
function aliPlacementGetSheet_(type){
  const book=SpreadsheetApp.openById(ALI_PLACEMENT_SHEET_ID);
  const tab=book.getSheetByName(ALI_PLACEMENT_TABS[type]);
  if(!tab)throw new Error('Missing destination sheet: '+type);
  return tab;
}
function aliPlacementRow_(p){
  const student=p.student||{};
  const scores=p.scores||{};
  const type=p.test;
  const now=Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','dd/MM/yyyy HH:mm:ss');
  const id=aliPlacementSafe_(p.submissionId,100);
  const row=aliPlacementEmpty_(ALI_PLACEMENT_COLS[type]);
  row[0]=id; row[1]=now;
  row[2]=aliPlacementSafe_(student.name,120);
  row[3]=aliPlacementSafe_(student.phone,35);
  row[4]=aliPlacementSafe_(student.school,200);
  row[5]=aliPlacementSafe_(student.goal,120);
  const answers=JSON.stringify(p.answers||{});
  if(answers.length>30000)throw new Error('Answers too long');
  const started=aliPlacementSafe_(p.startedAt,80);
  if(type==='ielts'){
    row[6]=aliPlacementNumber_(scores.listening,20);
    row[7]=aliPlacementNumber_(scores.reading,13);
    row[11]='WAITING_WRITING_TEACHER';
    row[12]=aliPlacementSafe_(p.writing,12000);
    row[13]=aliPlacementSafe_(answers,30000);
    row[14]=started;
    row[17]='ALI website · client self-score';
  }else if(type==='toeic'){
    // Grade Listening on the server from submitted A/B/C/D choices.
    // Recompute all TOEIC scores; do not trust browser-supplied grades.
    row[6]=aliToeicListeningGrade_(p.answers);
    row[7]=aliToeicGradePart_(p.answers,26,ALI_TOEIC_READING_KEY);
    row[8]=aliToeicGradePart_(p.answers,26,ALI_TOEIC_READING_KEY.slice(0,6));
    row[11]='AUTO_GRADED_LR';
    row[13]=aliPlacementSafe_(p.writing,12000);
    row[14]=aliPlacementSafe_(answers,30000);
    row[15]=started;
    row[17]='ALI website · client self-score';
    // Number answered is separate from the number correct.
    row[18]=Array.from({length:25},(_,i)=>p.answers&&p.answers['toeic'+(i+1)])
      .filter(v=>/^[A-D]$/.test(String(v||''))).length;
  }else if(type==='b1'){
    row[6]=aliPlacementNumber_(scores.grammar,15);
    row[12]='WAITING_TEACHER';
    row[13]=aliPlacementSafe_(p.writing,12000);
    row[14]=aliPlacementSafe_(answers,30000);
    row[15]=started;
    row[17]='ALI website · client self-score';
  }
  return row;
}
function aliPlacementNextRow_(sheet){
  const end=Math.max(2,sheet.getLastRow());
  const ids=sheet.getRange(2,1,Math.max(1,end-1),1).getValues();
  for(let i=ids.length-1;i>=0;i--)if(String(ids[i][0]).trim())return i+3;
  return 2;
}
function aliPlacementValidateExam_(p){
  const a=p.answers||{},type=p.test;
  if(typeof a!=='object'||Array.isArray(a))throw new Error('Missing answer map');
  const keys=Object.keys(a);
  if(type==='ielts'){
    if(!Object.prototype.hasOwnProperty.call(a,'listen0')||
       !Object.prototype.hasOwnProperty.call(a,'read0')||
       keys.some(k=>/^toeic[0-9]+$/.test(k)))throw new Error('IELTS payload has incorrect question structure');
  }else if(type==='toeic'){
    if(!Array.from({length:55},(_,i)=>'toeic'+(i+1)).every(k=>Object.prototype.hasOwnProperty.call(a,k))||
       keys.some(k=>/^(listen|read)[0-9]+$/.test(k))||
       Array.from({length:55},(_,i)=>a['toeic'+(i+1)]).some(v=>typeof v!=='string'||!/^[A-D]?$/.test(v)))
      throw new Error('TOEIC submission must include 55 A/B/C/D or blank answers');
  }else if(type==='b1'){
    if(!Object.prototype.hasOwnProperty.call(a,'q0')||
       !Object.prototype.hasOwnProperty.call(a,'q14'))throw new Error('B1 payload has incorrect question structure');
  }else throw new Error('Unknown exam');
}
function aliPlacementStore_(p){
  if(!p||p.type!=='ali_placement_submission'||!ALI_PLACEMENT_TABS[p.test])throw new Error('Unsupported type');
  if(p.schemaVersion!==ALI_PLACEMENT_VERSION||p.consent!==true)throw new Error('Missing consent or schema');
  if(!/^ALI-PL-[A-Za-z0-9_-]{8,90}$/.test(String(p.submissionId||'')))throw new Error('Invalid submission ID');
  if(!p.student||String(p.student.name||'').trim().length<2)throw new Error('Missing student name');
  aliPlacementValidateExam_(p);
  const sh=aliPlacementGetSheet_(p.test);
  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    // Idempotent receipt: one submission ID should generate only one row.
    const search=sh.getRange(2,1,Math.max(1,sh.getLastRow()-1),1)
                   .createTextFinder(String(p.submissionId)).matchEntireCell(true).findNext();
    if(search)return {ok:true,saved:true,duplicate:true,row:search.getRow(),submissionId:p.submissionId,test:p.test};
    const row=aliPlacementRow_(p), dest=aliPlacementNextRow_(sh);
    if(dest>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),500);
    // Skip formula-driven columns: IELTS J/K, TOEIC J/K, B1 K/L.
    // Writing only selected segments prevents overwriting array-formula spill.
    const segments=p.test==='ielts'?[[0,9],[11,18]]:
                   p.test==='toeic'?[[0,9],[11,19]]:[[0,10],[12,18]];
    for(const segment of segments){
      const start=segment[0],end=segment[1];
      sh.getRange(dest,start+1,1,end-start).setValues([row.slice(start,end)]);
    }
    SpreadsheetApp.flush();
    const verify=sh.getRange(dest,1).getDisplayValue();
    if(verify!==p.submissionId)throw new Error('Row verification failed');
    return {ok:true,saved:true,duplicate:false,row:dest,submissionId:p.submissionId,test:p.test};
  }finally{lock.releaseLock();}
}
function doPost(e){
  let nonce='',id='',reply;
  try{
    if(!e||!e.parameter||!e.parameter.payload)throw new Error('Missing payload');
    const raw=String(e.parameter.payload||'');
    if(raw.length>90000)throw new Error('Payload exceeds limit');
    const p=JSON.parse(raw);
    nonce=String(e.parameter.nonce||'');
    id=String(p.submissionId||'');
    if(!/^[a-zA-Z0-9_-]{20,90}$/.test(nonce))throw new Error('Invalid request nonce');
    reply=aliPlacementStore_(p);
  }catch(err){
    reply={ok:false,saved:false,submissionId:id,error:String(err.message||err).slice(0,220)};
  }
  reply.type='ALI_PLACEMENT_RECEIPT';reply.nonce=nonce;
  const serialized=JSON.stringify(reply).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="utf-8"></head><body>'+
    '<script>window.parent.postMessage('+serialized+', "*");</script></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(){
  return ContentService.createTextOutput(
    JSON.stringify({service:'ALI placement submissions',status:'ready',version:ALI_PLACEMENT_VERSION}))
    .setMimeType(ContentService.MimeType.JSON);
}
/**
 * Safe smoke test: generates synthetic answers in memory only.
 * Does not create Sheet rows, change accounts, or send network requests.
 */
function aliPlacementSelfTest(){
  if(ALI_TOEIC_LISTENING_KEY.length!==25||ALI_TOEIC_READING_KEY.length!==30)
    throw new Error('TOEIC key length mismatch');
  const perfect={};
  for(let i=0;i<25;i++)perfect['toeic'+(i+1)]=ALI_TOEIC_LISTENING_KEY[i];
  for(let i=0;i<30;i++)perfect['toeic'+(i+26)]=ALI_TOEIC_READING_KEY[i];
  const sample={type:'ali_placement_submission',schemaVersion:1,test:'toeic',consent:true,
    submissionId:'ALI-PL-TEST123456789',student:{name:'ALI TEST',phone:'',school:'',goal:''},
    answers:perfect,scores:{listening:0,reading:0,foundation:0},writing:'',startedAt:''};
  aliPlacementValidateExam_(sample);
  const row=aliPlacementRow_(sample);
  if(row.length!==19||row[6]!==25||row[7]!==30||row[8]!==6||row[18]!==25)
    throw new Error('TOEIC scoring regression: '+JSON.stringify(row.slice(6,9)));
  for(let i=1;i<=55;i++)sample.answers['toeic'+i]='';
  const blank=aliPlacementRow_(sample);
  if(blank[6]!==0||blank[7]!==0||blank[8]!==0||blank[18]!==0)
    throw new Error('Blank answer scoring regression');
  Logger.log('PASS: TOEIC Listening 25/25, Reading 30/30, Foundation 6/6; blank answers 0.');
  return 'PASS — no student records were created or changed';
}
function aliPlacementVerifySetup(){
  const book=SpreadsheetApp.openById(ALI_PLACEMENT_SHEET_ID);
  const report=Object.keys(ALI_PLACEMENT_TABS).map(k=>{
    const sh=book.getSheetByName(ALI_PLACEMENT_TABS[k]);
    if(!sh)throw new Error('Missing '+k+' sheet');
    return {exam:k,sheet:sh.getName(),columns:sh.getLastColumn()};
  });
  Logger.log(JSON.stringify(report));
  return report;
}

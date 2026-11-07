/**
 * ALI ENGLISH - Speaking A1-B2 submission receiver
 * Install this code in a Google Apps Script project owned by ALI.
 * Run setupAliSpeaking() once; deploy Web App as Execute as Me / Anyone.
 * The Google Sheet and Drive folder remain private to your Google account.
 * The public endpoint accepts uploads: add stronger user authentication for production.
 */
const ALI_HEADERS=[
 'Submitted at','Session ID','Part','Student name','Email','Phone','School','Goal',
 'Drive recording URL','File name','MIME type','Size (bytes)','Teacher status',
 'Fluency /5','Grammar /5','Vocabulary /5','Pronunciation /5','Interaction /5',
 'Total /25','CEFR reference','Teacher feedback','Sent at'
];
const ALI_STATUS_CACHE_SECONDS=21600;
const ALI_EXISTING_FOLDER_ID='1jKrAaDRZDR8QGXDPx7aAEiKUrYfV7RPk';
const ALI_EXISTING_SHEET_ID='1ZKWMCOQsgG48JZ3mqeIt_kh9yg5w-UuoryCaxuHRjpo';
const ALI_MAX_BYTES=7*1024*1024;
function setupAliSpeaking(){
 const props=PropertiesService.getScriptProperties();
 let folderId=props.getProperty('ALI_FOLDER_ID')||ALI_EXISTING_FOLDER_ID;
 let sheetId=props.getProperty('ALI_SHEET_ID')||ALI_EXISTING_SHEET_ID;
 DriveApp.getFolderById(folderId).getName();
 SpreadsheetApp.openById(sheetId).getName();
 props.setProperty('ALI_FOLDER_ID',folderId);
 props.setProperty('ALI_SHEET_ID',sheetId);
 const sh=SpreadsheetApp.openById(sheetId).getSheetByName('Speaking submissions')||SpreadsheetApp.openById(sheetId).getSheets()[0];
 sh.setName('Speaking submissions');
 sh.getRange(1,1,1,ALI_HEADERS.length).setValues([ALI_HEADERS]).setFontWeight('bold').setBackground('#fff0e4').setFontColor('#bf4c18');
 sh.setFrozenRows(1);sh.setColumnWidths(1,ALI_HEADERS.length,135);sh.setColumnWidth(9,310);sh.setColumnWidth(21,380);
 const triggers=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='onAliSpeakingGradeEdited');
 if(!triggers.length)ScriptApp.newTrigger('onAliSpeakingGradeEdited').forSpreadsheet(sheetId).onEdit().create();
 Logger.log('Drive folder: https://drive.google.com/drive/folders/'+folderId);
 Logger.log('Sheet: https://docs.google.com/spreadsheets/d/'+sheetId+'/edit');
 return {folderId,sheetId};
}
function aliCacheKey(id){return 'ALI_SP_'+id;}
function aliCacheWrite(id,data){CacheService.getScriptCache().put(aliCacheKey(id),JSON.stringify(data),ALI_STATUS_CACHE_SECONDS);}
function doPost(e){
 let id='';
 try{
  if(!e||!e.parameter||!e.parameter.payload)throw Error('Empty submission');
  const p=JSON.parse(e.parameter.payload);
  id=String(p.uploadId||'');
  if(!/^[a-zA-Z0-9_-]{12,100}$/.test(id))throw Error('Invalid upload ID');
  if(p.type!=='speaking_upload'||p.consent!==true)throw Error('Invalid request or consent');
  if(!/^[a-zA-Z0-9_-]{12,100}$/.test(String(p.sessionId||'')))throw Error('Invalid session');
  const part=Number(p.part);
  if(!Number.isInteger(part)||part<1||part>4)throw Error('Invalid part');
  const name=String(p.name||'').trim().slice(0,120);
  if(name.length<2)throw Error('Missing student name');
  const mime=String(p.mime||'').split(';')[0].toLowerCase();
  if(!['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/aac'].includes(mime))throw Error('Unsupported audio type');
  if(typeof p.base64!=='string'||p.base64.length>Math.ceil(ALI_MAX_BYTES*4/3)+10)throw Error('Audio too large');
  const bytes=Utilities.base64Decode(p.base64);
  if(bytes.length<300||bytes.length>ALI_MAX_BYTES)throw Error('Invalid audio size');
  const props=PropertiesService.getScriptProperties();
  const folderId=props.getProperty('ALI_FOLDER_ID'),sheetId=props.getProperty('ALI_SHEET_ID');
  if(!folderId||!sheetId)throw Error('Run setupAliSpeaking() first');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(20000))throw Error('Server busy. Retry shortly');
  try{
   const cached=CacheService.getScriptCache().get(aliCacheKey(id));
   if(cached){const value=JSON.parse(cached);if(value.status==='saved')return ContentService.createTextOutput('ALREADY SAVED');}
   const sh=SpreadsheetApp.openById(sheetId).getSheetByName('Speaking submissions');
   const existing=sh.getLastRow()>1?sh.getRange(2,2,sh.getLastRow()-1,2).getDisplayValues():[];
   if(existing.some(row=>row[0]===String(p.sessionId) && Number(row[1])===part)){
     aliCacheWrite(id,{status:'saved',ok:true});
     return ContentService.createTextOutput('ALREADY SAVED');
   }
   // Keep retries idempotent by checking this session+part's existing file name.
   const marker='ALI_Speaking_'+p.sessionId+'_part_'+part;
   const fn=marker+'.'+(mime==='audio/mp4'?'m4a':mime==='audio/ogg'?'ogg':mime==='audio/mpeg'?'mp3':'webm');
   const file=DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes,mime,fn));
   const email=String(p.email||'').trim().slice(0,150);
   if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email');
   const safe=v=>String(v||'').slice(0,150).replace(/^[=+@-]/,"'String(v||'').slice(0,150).replace(/^[=+@-]/,"'&")");
   sh.appendRow([new Date(),safe(p.sessionId),part,safe(name),safe(email),safe(p.phone),safe(p.school),safe(p.goal),file.getUrl(),fn,mime,bytes.length,'Chờ giảng viên','','','','','','','','','']);
   aliCacheWrite(id,{status:'saved',ok:true});
   return ContentService.createTextOutput('SAVED');
  } finally {lock.releaseLock();}
 }catch(error){
  if(id && /^[a-zA-Z0-9_-]{12,100}$/.test(id))aliCacheWrite(id,{status:'error',ok:false,error:String(error.message||error).slice(0,140)});
  return ContentService.createTextOutput('ERROR');
 }
}
function doGet(e){
 const p=e?.parameter||{};
 if(p.action!=='status')return ContentService.createTextOutput('ALI Speaking receiver active');
 const callback=String(p.callback||'');
 if(!/^ALIstatus_[a-zA-Z0-9_]{5,80}$/.test(callback))return ContentService.createTextOutput('Invalid callback');
 const id=String(p.uploadId||'');
 const value=/^[a-zA-Z0-9_-]{12,100}$/.test(id)?CacheService.getScriptCache().get(aliCacheKey(id)):null;
 const obj=value?JSON.parse(value):{ok:false,status:'pending'};
 return ContentService.createTextOutput(callback+'('+JSON.stringify(obj)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
/** Teacher adds 0..5 in N:R and a comment in U, then sets M to "Đã chấm".
 *  This is an installed edit trigger created by setupAliSpeaking().
 */
function onAliSpeakingGradeEdited(e){
 if(!e?.range || e.range.getSheet().getName()!=='Speaking submissions')return;
 const cell=e.range;
 if(cell.getColumn()!==13||cell.getRow()<=1||e.value!=='Đã chấm')return;
 const sh=cell.getSheet(),r=cell.getRow();
 const points=sh.getRange(r,14,1,5).getValues()[0].map(Number);
 if(points.some(n=>!Number.isInteger(n)||n<0||n>5)){sh.getRange(r,13).setValue('Thiếu điểm rubric');return;}
 const total=points.reduce((a,b)=>a+b,0);
 const level=total<=7?'Dưới A1':total<=12?'A1':total<=16?'A2':total<=20?'B1':total<=23?'B2':'B2 vững';
 const name=sh.getRange(r,4).getDisplayValue();
 const email=sh.getRange(r,5).getDisplayValue().trim();
 const feedback=sh.getRange(r,21).getDisplayValue();
 sh.getRange(r,19,1,2).setValues([[total,level]]);
 if(!email){sh.getRange(r,13).setValue('Đã chấm · liên hệ qua điện thoại');return;}
 try{
  MailApp.sendEmail({to:email,subject:'ALI English - Kết quả Speaking Placement A1–B2',body:
    'Xin chào '+name+',\n\nGiảng viên ALI đã đánh giá bài Speaking của bạn.\n'+
    'Tổng điểm: '+total+'/25\nMức tham chiếu nội bộ: '+level+'\n'+
    'Nhận xét giảng viên: '+(feedback||'Giảng viên chưa ghi nhận xét chi tiết.')+
    '\n\nĐây là kết quả xếp lớp nội bộ, không phải chứng chỉ CEFR.\n\nALI English'});
  sh.getRange(r,22).setValue(new Date());
 }catch(err){sh.getRange(r,13).setValue('Gửi email thất bại: '+String(err.message||err).slice(0,80));}
}

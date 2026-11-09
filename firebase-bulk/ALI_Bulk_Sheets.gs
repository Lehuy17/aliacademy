/**
 * ALI English — Google Sheets -> Firebase provisioning.
 * Bind this Apps Script to the Google Sheet created for ALI.
 * SCRIPT PROPERTIES (set only in Apps Script settings):
 *   ALI_BULK_ENDPOINT = deployed Firebase Function HTTPS URL
 *   ALI_BULK_SYNC_KEY = identical secret configured in Firebase Secret Manager
 *
 * No time trigger is installed by default. Use ALI Academy > Đồng bộ 20 học viên.
 * After successful pilot, run installAliBulkTrigger() once to sync every five minutes.
 */
const ALI_BULK_SHEET_ID='1XBb9DVDc2tjb9f1wgjIk08wRrrZcWWK84r_PWH6FZgI';
const ALI_BULK_TAB='Học viên';
const ALI_BULK_ROWS_PER_RUN=20;
function onOpen(){SpreadsheetApp.getUi().createMenu('ALI Academy').addItem('Đồng bộ 20 học viên','runAliBulkSync').addItem('Bật đồng bộ 5 phút','installAliBulkTrigger').addItem('Tắt đồng bộ tự động','removeAliBulkTrigger').addToUi();}
function runAliBulkSync(){
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(1000))return;
 try{
 const props=PropertiesService.getScriptProperties();
 const url=props.getProperty('ALI_BULK_ENDPOINT'),secret=props.getProperty('ALI_BULK_SYNC_KEY');
 if(!url||!/^https:\/\//.test(url)||!secret)throw Error('Chưa cấu hình ALI_BULK_ENDPOINT và ALI_BULK_SYNC_KEY trong Script properties.');
 const sheet=SpreadsheetApp.openById(ALI_BULK_SHEET_ID).getSheetByName(ALI_BULK_TAB);
 if(!sheet)throw Error('Thiếu tab Học viên');
 const last=Math.min(sheet.getLastRow(),1001);
 if(last<2)return;
 const rows=sheet.getRange(2,1,last-1,10).getValues();
 const batch=[];
 rows.forEach((values,index)=>{
  const [email,name,school,role,action,status]=values;
  const task=String(action||'').trim().toUpperCase();
  if(batch.length>=ALI_BULK_ROWS_PER_RUN||!String(email||'').trim()||task==='BO_QUA')return;
  // Empty action is treated as CHO_TAO for email-only imports.
  if(task&&task!=='CHO_TAO')return;
  if(['DA_TAO','DA_TON_TAI','XUNG_DOT_QUYEN','TAI_KHOAN_BI_KHOA'].includes(String(status||'')))return;
  if(role&&String(role).trim()!=='student')return;
  batch.push({row:index+2,email:String(email).trim(),name:String(name||'').trim(),school:String(school||'').trim()});
 });
 if(!batch.length)return;
 const data=JSON.stringify({project:'ali-english',rows:batch});
 const stamp=String(Date.now());
 const bytes=Utilities.computeHmacSha256Signature(stamp+'.'+data,secret);
 const signature=bytes.map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
 const result=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:data,headers:{'x-ali-timestamp':stamp,'x-ali-signature':signature},muteHttpExceptions:true});
 if(result.getResponseCode()!==200)throw Error('Firebase backend trả '+result.getResponseCode()+': '+result.getContentText().slice(0,140));
 const output=JSON.parse(result.getContentText());
 const lookup=new Map((output.results||[]).map(item=>[item.row,item]));
 for(const student of batch){
  const r=lookup.get(student.row);
  if(!r)continue;
  const row=student.row;
  sheet.getRange(row,6,1,5).setValues([[r.status,r.uid||'',r.error||'',new Date(),r.invite||'CHUA_GUI']]);
 }
 }finally{lock.releaseLock();}
}
function installAliBulkTrigger(){
 removeAliBulkTrigger();
 ScriptApp.newTrigger('runAliBulkSync').timeBased().everyMinutes(5).create();
 SpreadsheetApp.getUi().alert('Đã bật đồng bộ theo lịch 5 phút; tối đa 20 tài khoản mỗi lượt.');
}
function removeAliBulkTrigger(){
 ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runAliBulkSync').forEach(t=>ScriptApp.deleteTrigger(t));
}

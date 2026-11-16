/**
 * ALI English · Speaking recordings backend (Apps Script Web App).
 * Deploy as a new standalone Apps Script web app, executing as the ALI Drive owner.
 * Required Script Properties:
 *  ALI_SPEAKING_FOLDER_ID, ALI_SPEAKING_SHEET_ID, ALI_RESULTS_SHEET_ID
 * Configure "Who has access" carefully; public placement tests require anonymous
 * upload, so use quotas/monitoring and never share Drive recordings publicly.
 *
 * This handler is separate from ALI's existing A1–A2 test grading web app.
 * The A1–A2 results endpoint MUST remain unchanged.
 */
var ALI_AUDIO_MAX_BYTES = 7 * 1024 * 1024;
var ALI_AUDIO_STATUS_PREFIX = 'ALI_REC_';
function aliAudioConfig_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('ALI_SPEAKING_FOLDER_ID');
  var speakingSheetId = props.getProperty('ALI_SPEAKING_SHEET_ID');
  var resultsSheetId = props.getProperty('ALI_RESULTS_SHEET_ID');
  if (!folderId || !speakingSheetId || !resultsSheetId) {
    throw new Error('Chưa cấu hình ba Script Properties của ALI Speaking.');
  }
  return {folderId: folderId, speakingSheetId: speakingSheetId, resultsSheetId: resultsSheetId};
}
function aliAudioText_(v,max) {
  return String(v == null ? '' : v).trim().slice(0,max || 150);
}
function aliAudioOutput_(value,callback) {
  var json = JSON.stringify(value);
  var fn = String(callback || '');
  if (fn && /^[a-zA-Z_$][a-zA-Z0-9_$]{0,100}$/.test(fn)) {
    return ContentService.createTextOutput(fn+'('+json+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  var p = e && e.parameter || {};
  if (p.action === 'status') {
    var uploadId = String(p.uploadId || '');
    if (!/^[A-Za-z0-9_-]{8,150}$/.test(uploadId)) {
      return aliAudioOutput_({ok:false,status:'error',error:'Upload ID không hợp lệ'},p.callback);
    }
    var stored = PropertiesService.getScriptProperties().getProperty(ALI_AUDIO_STATUS_PREFIX+uploadId);
    return aliAudioOutput_(stored ? JSON.parse(stored) : {ok:false,status:'pending'},p.callback);
  }
  return aliAudioOutput_({ok:true,service:'ALI Speaking Recordings',status:'ready'},p.callback);
}
function doPost(e) {
  var p = null;
  try {
    if (!e || !e.parameter || !e.parameter.payload) throw new Error('Thiếu payload');
    p = JSON.parse(e.parameter.payload);
    if (p.type !== 'speaking_upload') throw new Error('Kiểu yêu cầu không được hỗ trợ');
    var receipt = aliAudioStore_(p);
    return aliAudioOutput_(receipt);
  } catch (err) {
    var problem = {ok:false,status:'error',error:aliAudioText_(err.message,250)};
    // The browser independently checks this receipt; post response is opaque.
    if (p && /^[A-Za-z0-9_-]{8,150}$/.test(String(p.uploadId||''))) {
      PropertiesService.getScriptProperties().setProperty(ALI_AUDIO_STATUS_PREFIX+p.uploadId,JSON.stringify(problem));
    }
    return aliAudioOutput_(problem);
  }
}
function aliAudioStore_(p) {
  if (p.consent !== true) throw new Error('Học viên chưa đồng ý gửi ghi âm');
  var uploadId = String(p.uploadId || ''), sessionId = String(p.sessionId || '');
  var part = Number(p.part);
  if (!/^[A-Za-z0-9_-]{8,150}$/.test(uploadId) ||
      !/^[A-Za-z0-9_-]{8,150}$/.test(sessionId) ||
      !Number.isInteger(part) || part < 1 || part > 4) {
    throw new Error('Mã bài thi hoặc số phần không hợp lệ');
  }
  var rawMime = String(p.mime || 'audio/webm');
  var mime = rawMime.split(';')[0].toLowerCase();
  if (['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/wav','audio/x-m4a','audio/aac'].indexOf(mime)<0) {
    throw new Error('Định dạng file ghi âm không được hỗ trợ');
  }
  if (typeof p.base64 !== 'string' || !p.base64 || p.base64.length > 10400000) {
    throw new Error('File trống hoặc vượt giới hạn 7 MB');
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(28000)) throw new Error('Máy chủ đang bận. Vui lòng gửi lại.');
  try {
    var props = PropertiesService.getScriptProperties(), key = ALI_AUDIO_STATUS_PREFIX+uploadId;
    var prior = props.getProperty(key);
    if (prior) {
      var parsed = JSON.parse(prior);
      if (parsed.ok && parsed.status === 'saved') return parsed;
    }
    var data = Utilities.base64Decode(p.base64);
    if (!data.length || data.length > ALI_AUDIO_MAX_BYTES) throw new Error('File ghi âm vượt giới hạn 7 MB');
    var cfg = aliAudioConfig_();
    var extension = mime.indexOf('mp4')>=0 || mime.indexOf('m4a')>=0?'m4a':
                    mime.indexOf('ogg')>=0?'ogg':mime.indexOf('wav')>=0?'wav':
                    mime.indexOf('mpeg')>=0?'mp3':'webm';
    var filename = 'ALI_Speaking_'+sessionId+'_part_'+part+'.'+extension;
    var blob = Utilities.newBlob(data,mime,filename);
    var file = DriveApp.getFolderById(cfg.folderId).createFile(blob);
    file.setDescription('ALI English Speaking placement; session '+sessionId+'; part '+part+'. Internal teacher assessment only.');
    // Private-by-default: do not call setSharing(ANYONE_WITH_LINK).
    var book = SpreadsheetApp.openById(cfg.speakingSheetId);
    var sh = book.getSheetByName('Speaking submissions');
    if (!sh) throw new Error('Không tìm thấy tab Speaking submissions');
    sh.appendRow([
      new Date(),sessionId,part,aliAudioText_(p.name,150),
      aliAudioText_(p.email,150),aliAudioText_(p.phone,40),
      aliAudioText_(p.school,150),aliAudioText_(p.goal,100),
      file.getUrl(),filename,mime,data.length,'Chờ chấm',
      '', '', '', '', '', '', '', '', new Date(), '', '', ''
    ]);
    // Keep the original A1–A2 results intact and attach links by exact submissionId.
    try {aliAudioLinkResult_(cfg.resultsSheetId,sessionId,part,file.getUrl());}
    catch (syncErr) {console.log('Results link can be reconciled later: '+syncErr);}
    var receipt = {ok:true,status:'saved',sessionId:sessionId,part:part};
    props.setProperty(key,JSON.stringify(receipt));
    return receipt;
  } finally {lock.releaseLock();}
}
function aliAudioLinkResult_(resultsId,sessionId,part,url) {
  var sh = SpreadsheetApp.openById(resultsId).getSheetByName('Results');
  if (!sh) return false;
  var last = sh.getLastRow();
  if (last < 2) return false;
  var ids = sh.getRange(2,1,last-1,1).getValues();
  for (var i=0;i<ids.length;i++) {
    if (String(ids[i][0]) !== sessionId) continue;
    var row = i+2;
    sh.getRange(row,22+part).setValue(url); // W–Z (23 to 26)
    var status = sh.getRange(row,27);
    if (!status.getValue()) status.setValue('Chờ chấm');
    sh.getRange(row,31).setValue('ALI Speaking recordings'); // AE
    return true;
  }
  return false;
}
/**
 * Run manually or schedule once per hour. Backfills audio links when test
 * Results rows were inserted after the audio was received. Never overwrites
 * the original test scores, teacher feedback, or manually completed marks.
 */
function aliSyncSpeakingLinksToResults() {
  var cfg=aliAudioConfig_();
  var sh=SpreadsheetApp.openById(cfg.speakingSheetId).getSheetByName('Speaking submissions');
  var last=sh.getLastRow();
  if(last<2)return 0;
  var rows=sh.getRange(2,1,last-1,25).getValues();
  var updated=0;
  rows.forEach(function(row){
    var session=String(row[1]||''),part=Number(row[2]),url=String(row[8]||'');
    if(!url || !(part>=1 && part<=4) || !session)return;
    if(aliAudioLinkResult_(cfg.resultsSheetId,session,part,url))updated++;
  });
  return updated;
}
/**
 * Apply teacher-approved Speaking marks from the dedicated teacher Sheet.
 * Only rows explicitly marked "Đã chấm" and with valid numeric /25 totals
 * are copied into the A1–A2 Results sheet.
 * The existing transcript-only /10 score and /60 result are not modified.
 */
function aliSyncTeacherSpeakingGrades() {
  var cfg=aliAudioConfig_(),sh=SpreadsheetApp.openById(cfg.speakingSheetId).getSheetByName('Speaking submissions');
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,25).getValues():[];
  var results=SpreadsheetApp.openById(cfg.resultsSheetId).getSheetByName('Results');
  if(!results || results.getLastRow()<2)return 0;
  var ids=results.getRange(2,1,results.getLastRow()-1,1).getValues();
  var index={};ids.forEach(function(row,i){if(row[0])index[String(row[0])]=i+2;});
  var updated=0,done={};
  rows.forEach(function(row){
    var id=String(row[1]||'');
    if(!index[id] || done[id] || row[12]!=='Đã chấm')return;
    var points=row.slice(13,18);
    if(!points.every(function(n){return typeof n==='number' && n>=0 && n<=5;}))return;
    var sum=points.reduce(function(a,b){return a+b;},0);
    results.getRange(index[id],27,1,4).setValues([['Đã chấm',sum,String(row[20]||''),new Date()]]);
    done[id]=true;updated++;
  });
  return updated;
}

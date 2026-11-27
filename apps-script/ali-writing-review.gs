/**
 * ALI Academy · Writing Review (staff-only Google Sheet tab).
 * Add this file as a THIRD .gs file in the ALI Placement Results Apps Script.
 * Safe for historical A1-A2, IELTS, TOEIC and B1; never changes score
 * columns in the source result tabs.
 *
 * Run aliSyncWritingReview() once, then aliEnableWritingReviewSync() for
 * an automatic update every 5 minutes. Do not publish the spreadsheet.
 * Requires only spreadsheet access; no Gemini API key needed to review text.
 */
const ALI_WRITING_REVIEW_TAB='Writing Review';
const ALI_WRITING_REVIEW_FIELDS=[
 'Ngày nộp','Bài thi','Học viên','Mã bài nộp','Bài Writing nguyên văn',
 'Điểm Writing','Điểm tối đa','Trạng thái chấm','Nhận xét sau chấm',
 'Mở dữ liệu gốc','Đồng bộ lúc','Nguồn đánh giá'
];
const ALI_WRITING_REVIEW_SOURCES=[
 {sheet:'Results',test:'A1–A2',gid:2046534644,cols:21,score:10,max:6,status:19,feedback:16},
 {sheet:'IELTS Results',test:'IELTS',gid:500948439,cols:19,essay:13,score:9,max:100,status:12,feedback:16},
 {sheet:'TOEIC Results',test:'TOEIC',gid:1385950166,cols:20,essay:14,score:13,max:10,status:12,feedback:17},
 {sheet:'B1 Results',test:'B1',gid:1793487366,cols:19,essay:14,score:9,max:15,status:13,feedback:17}
];
function aliWritingReviewText_(v){
 return v===undefined||v===null?'':String(v);
}
function aliWritingReviewEssay_(config,row){
 if(config.test==='A1–A2'){
  try{
   const answers=JSON.parse(aliWritingReviewText_(row[20])||'{}');
   return aliWritingReviewText_(answers.essay);
  }catch(err){console.warn('Invalid historical A1-A2 answers JSON');return '';}
 }
 const text=aliWritingReviewText_(row[config.essay-1]);
 // Older B1 submissions sometimes have 10 empty "Response N:" placeholders.
 if(config.test==='B1'&&!text.replace(/Response \d+:\s*/g,'').trim())return '';
 return text;
}
function aliWritingReviewSource_(config,status,score){
 if(/AI_WRITING_GRADED/.test(status))return 'AI tự động (tham khảo)';
 if(config.test==='A1–A2')return 'Điểm tự động/AI hiện có';
 return score!==''?'Điểm đã nhập':'Chưa chấm Writing';
}
function aliSyncWritingReview(){
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(5000))return 'WRITING_REVIEW_BUSY';
 try{
  const book=SpreadsheetApp.openById(ALI_PLACEMENT_SHEET_ID);
  let review=book.getSheetByName(ALI_WRITING_REVIEW_TAB);
  if(!review){
   review=book.insertSheet(ALI_WRITING_REVIEW_TAB);
   review.getRange(1,1,1,ALI_WRITING_REVIEW_FIELDS.length).setValues([ALI_WRITING_REVIEW_FIELDS]);
   review.setFrozenRows(1);
  }
  const last=review.getLastRow();
  const existing=last>=2?review.getRange(2,2,last-1,3).getDisplayValues():[];
  const index={};
  existing.forEach((row,i)=>{const key=row[0]+'|'+row[2];if(row[0]&&row[2])index[key]=i+2;});
  let inserted=0,updated=0;
  for(const config of ALI_WRITING_REVIEW_SOURCES){
   const source=book.getSheetByName(config.sheet);
   if(!source)continue;
   const count=source.getLastRow()-1;
   if(count<=0)continue;
   const rows=source.getRange(2,1,count,config.cols).getDisplayValues();
   for(let n=0;n<rows.length;n++){
    const r=rows[n],id=aliWritingReviewText_(r[0]);
    if(!id)continue;
    const essay=aliWritingReviewEssay_(config,r);
    if(!essay.trim())continue;
    const score=aliWritingReviewText_(r[config.score-1]);
    const status=aliWritingReviewText_(r[config.status-1]);
    const feedback=aliWritingReviewText_(r[config.feedback-1]);
    const url='https://docs.google.com/spreadsheets/d/'+ALI_PLACEMENT_SHEET_ID+'/edit#gid='+config.gid+'&range=A'+(n+2);
    const entry=[
     aliWritingReviewText_(r[1]),config.test,aliWritingReviewText_(r[2]),id,essay,
     score,String(config.max),status,feedback,url,
     Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','dd/MM/yyyy HH:mm:ss'),
     aliWritingReviewSource_(config,status,score)
    ];
    const key=config.test+'|'+id,dest=index[key];
    if(dest){
     // Preserve identity/source columns. Refresh original text and the grade
     // so an AI/teacher update becomes visible without overwriting source data.
     review.getRange(dest,5,1,8).setValues([entry.slice(4,12)]);
     updated++;
    }else{
     const next=review.getLastRow()+1;
     if(next>review.getMaxRows())review.insertRowsAfter(review.getMaxRows(),100);
     review.getRange(next,1,1,12).setValues([entry]);
     index[key]=next;inserted++;
    }
   }
  }
  return {inserted:inserted,updated:updated,tab:ALI_WRITING_REVIEW_TAB};
 }finally{lock.releaseLock();}
}
function aliEnableWritingReviewSync(){
 if(ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='aliSyncWritingReview'))
  return 'Writing Review trigger already enabled';
 ScriptApp.newTrigger('aliSyncWritingReview').timeBased().everyMinutes(5).create();
 return 'Writing Review will refresh every 5 minutes';
}
function aliDisableWritingReviewSync(){
 ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='aliSyncWritingReview').forEach(t=>ScriptApp.deleteTrigger(t));
 return 'Writing Review trigger disabled';
}
function aliWritingReviewSelfTest(){
 const empty=Array.from({length:21},()=> '');
 empty[20]=JSON.stringify({essay:'An original A1-A2 student essay.'});
 if(aliWritingReviewEssay_(ALI_WRITING_REVIEW_SOURCES[0],empty)!=='An original A1-A2 student essay.')
  throw new Error('Original A1-A2 essay extraction failed');
 const b=Array.from({length:19},()=> '');
 b[13]=['Response 1: ','Response 2: '].join(String.fromCharCode(10));
 if(aliWritingReviewEssay_(ALI_WRITING_REVIEW_SOURCES[3],b).trim())
  throw new Error('Empty B1 placeholder must be skipped');
 return 'PASS: original Writing retained; empty B1 placeholders excluded';
}

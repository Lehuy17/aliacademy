(() => {
"use strict";
const $=id=>document.getElementById(id);
const reg=(()=>{try{return JSON.parse(sessionStorage.getItem('ALI_TEST_REGISTRATION')||'null')}catch{return null}})();
if(!reg || !reg.name?.trim() || reg.consent!==true){location.replace('./tests.html');return;}
const cfg=window.ALI_SPEAKING_CONFIG||{};
const titles=['Introduction & Everyday Life (A1–A2)','Individual Long Turn (A2–B1)','Opinion & Discussion (B1–B2)','Situational Task'];
const content=[
  {help:'Trả lời những câu phù hợp với khả năng của bạn. Thời lượng tham khảo: 2–3 phút.',question:`<ol>
<li>What’s your name? Where are you from?</li><li>Where do you live? Can you describe your home?</li><li>What do you do? / What are you studying?</li><li>What do you usually do on weekdays?</li><li>What do you like doing in your free time? Why?</li><li>Tell me about someone in your family or a close friend.</li><li>What did you do last weekend?</li><li>What are you going to do next weekend?</li><li>Have you ever travelled to another city or country? Tell me about it.</li><li>What is one thing you would like to change about your daily routine?</li></ol>`},
  {help:'Chọn một chủ đề. Chuẩn bị 30–45 giây, nói 1–2 phút. Bạn có thể nói ngắn hơn tùy trình độ.',question:`<div class="ali-sp-topic"><strong>A. A MEMORABLE EXPERIENCE</strong><p>Describe a memorable day or experience. When and where did it happen? Who were you with? What happened? Why do you remember it?</p></div><div class="ali-sp-topic"><strong>B. A PLACE YOU LIKE</strong><p>Describe a place you enjoy visiting. Where is it? What can people do there? When do you go? Why do you like it?</p></div><div class="ali-sp-topic"><strong>C. WORK OR STUDY</strong><p>Describe your work or studies. What is a typical day like? What do you enjoy or find difficult? What would you like to do in the future?</p></div><p>Gợi ý B1: What did you learn? Would you recommend it? Why or why not?</p>`},
  {help:'Chọn 2–3 câu, giải thích ý kiến và đưa ví dụ. Thời lượng tham khảo: 4–6 phút.',question:`<div class="ali-sp-topic"><strong>Technology</strong><p>How has technology changed communication? Do people spend too much time on their phones? What are the pros and cons of studying or working online?</p></div><div class="ali-sp-topic"><strong>Work</strong><p>What matters most when choosing a job: salary, job satisfaction or work-life balance? Should people change jobs several times?</p></div><div class="ali-sp-topic"><strong>Travel & Society</strong><p>What can people learn from travelling? How can tourism benefit or harm local communities?</p></div><p>Câu hỏi nâng cao B2: Can you think of a counterargument? To what extent do you agree? What might the long-term consequences be?</p>`},
  {help:'Thời lượng tham khảo: 3–5 phút. Bài gốc yêu cầu giáo viên đưa tình huống phù hợp, chưa có một kịch bản cố định.',question:`<p>Giáo viên cung cấp một tình huống giao tiếp phù hợp với trình độ. Hãy hỏi đáp, làm rõ thông tin và đề xuất cách giải quyết.</p><p><strong>Nếu chưa có tình huống từ giáo viên:</strong> bạn có thể bỏ qua phần này và ghi âm các phần còn lại. Bản đánh giá cuối cùng cần giảng viên kiểm tra trực tiếp kỹ năng tương tác.</p>`}
];
const blobs=[null,null,null,null],urls=[null,null,null,null],durations=[0,0,0,0],receipts=[null,null,null,null];
const nodes=[],tabs=[];let active=0,recorder=null,stream=null,recordingIndex=-1,recordStart=0,clockInterval=null,recTimer=null,isUploading=false;
const sessionId=(globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2)).replace(/[^\w-]/g,'');
function alertUser(message){$('aliSpAlert').textContent=message;$('aliSpAlert').classList.remove('hidden');$('aliSpAlert').scrollIntoView({behavior:'smooth'});}
function status(i,msg,recording=false){const node=nodes[i];node.status.textContent=msg;node.status.classList.toggle('ali-sp-recording',recording);node.pulse.classList.toggle('hidden',!recording);}
function ext(mime){return mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm';}
function download(i){if(!urls[i])return;const a=document.createElement('a');a.href=urls[i];a.download='ALI_Speaking_'+sessionId+'_part_'+(i+1)+'.'+ext(blobs[i].type);document.body.append(a);a.click();a.remove();}
function updateProgress(){
 const count=blobs.filter(Boolean).length;
 $('aliSpProgressText').textContent=count+' / 4 phần đã ghi';
 $('aliSpProgressFill').style.width=(count/4*100)+'%';
 blobs.forEach((blob,i)=>{$('aliSpState'+i).textContent=receipts[i]?'Đã gửi':blob?'Đã ghi':'Chưa ghi';if(receipts[i])nodes[i].again.disabled=true;});
}
function build(){
 $('aliSpName').textContent=reg.name;
 $('aliSpAvatar').textContent=reg.name.trim().charAt(0).toUpperCase();
 $('aliSpSchool').textContent=reg.school||'ALI English';
 titles.forEach((title,i)=>{
  const tab=document.createElement('button');tab.type='button';tab.textContent=String(i+1).padStart(2,'0')+' · '+['Introduction','Long turn','Discussion','Situation'][i];tab.setAttribute('role','tab');
  tab.addEventListener('click',()=>go(i));$('aliSpTabs').append(tab);tabs.push(tab);
  const section=document.createElement('section');section.className='ali-sp-part';section.setAttribute('role','tabpanel');
  section.innerHTML=`<span class="ali-sp-part-eyebrow">PART ${String(i+1).padStart(2,'0')} / 4</span><h2>${title}</h2><p>${content[i].help}</p><div class="ali-sp-prompts"><h3>Đề bài</h3>${content[i].question}</div><div class="ali-sp-recorder"><h3>Ghi âm câu trả lời · Phần ${i+1}</h3><div class="ali-sp-record-status"><span class="ali-sp-pulse hidden"></span><span class="ali-sp-message">Chưa ghi âm</span></div><div class="ali-sp-record-controls"><button type="button" class="ali-sp-primary ali-start">● Bắt đầu ghi âm</button><button type="button" class="ali-sp-secondary ali-stop" disabled>■ Dừng</button><button type="button" class="ali-sp-secondary ali-again" disabled>↺ Ghi âm lại</button><button type="button" class="ali-sp-secondary ali-download" disabled>↓ Tải bản ghi</button></div><audio class="ali-sp-playback hidden" controls preload="none" aria-label="Nghe lại ghi âm phần ${i+1}"></audio><p class="ali-sp-record-help">Cho phép micro khi trình duyệt hỏi. Sau khi ghi, bạn có thể nghe lại và ghi âm lại nếu chưa hài lòng. File được giữ trên thiết bị cho đến khi gửi thành công.</p></div>`;
  const n={section,start:section.querySelector('.ali-start'),stop:section.querySelector('.ali-stop'),again:section.querySelector('.ali-again'),download:section.querySelector('.ali-download'),play:section.querySelector('audio'),status:section.querySelector('.ali-sp-message'),pulse:section.querySelector('.ali-sp-pulse')};
  n.start.onclick=()=>start(i,false);n.stop.onclick=()=>stop();n.again.onclick=()=>start(i,true);n.download.onclick=()=>download(i);
  $('aliSpSections').append(section);nodes.push(n);
 });
 go(0);updateProgress();
 const began=Date.now();clockInterval=setInterval(()=>{const left=Math.max(0,18*60-Math.floor((Date.now()-began)/1000));$('aliSpClock').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(!left)clearInterval(clockInterval);},1000);
}
function go(i){if(recordingIndex!==-1){alertUser('Hãy dừng ghi âm trước khi chuyển phần.');return;}active=Math.max(0,Math.min(3,i));nodes.forEach((n,k)=>n.section.hidden=k!==active);tabs.forEach((t,k)=>{t.setAttribute('aria-selected',String(k===active));t.tabIndex=k===active?0:-1});$('aliSpPrev').disabled=active===0;$('aliSpNext').disabled=active===3;}
$('aliSpPrev').onclick=()=>go(active-1);$('aliSpNext').onclick=()=>go(active+1);
async function start(i,replace){
 if(isUploading||recordingIndex!==-1)return;
 if(receipts[i]){alertUser('Phần này đã được nộp thành công. Để bảo toàn bản nộp giảng viên, bạn không thể ghi đè sau khi gửi.');return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status(i,'Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome, Edge hoặc Safari mới nhất trên HTTPS.');return;}
 if(replace && blobs[i] && !confirm('Ghi âm lại sẽ thay thế bản ghi hiện tại của phần này. Bạn có muốn tiếp tục?'))return;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  const types=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];
  const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:48000}:{audioBitsPerSecond:48000});
  let chunks=[];const oldRecorder=recorder;recordingIndex=i;recordStart=Date.now();
  oldRecorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
  oldRecorder.onstop=()=>{
   const blob=new Blob(chunks,{type:oldRecorder.mimeType||'audio/webm'});
   if(blob.size){if(urls[i])URL.revokeObjectURL(urls[i]);blobs[i]=blob;urls[i]=URL.createObjectURL(blob);receipts[i]=null;nplay(i);status(i,'Đã ghi · '+Math.round(blob.size/1024)+' KB · nghe lại hoặc ghi âm lại');}
   else status(i,'Không thu được âm thanh; vui lòng ghi lại.');
   cleanup();recordingIndex=-1;recorder=null;updateProgress();
  };
  oldRecorder.onerror=()=>{status(i,'Có lỗi khi ghi âm. Hãy thử lại.');cleanup();recordingIndex=-1;};
  oldRecorder.start(1000);
  const n=nodes[i];n.start.disabled=true;n.stop.disabled=false;n.again.disabled=true;n.download.disabled=true;
  recTimer=setInterval(()=>{const secs=Math.floor((Date.now()-recordStart)/1000);status(i,'Đang ghi âm · '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0'),true)},500);
 }catch(err){cleanup();status(i,err?.name==='NotAllowedError'?'Bạn chưa cấp quyền micro. Hãy cho phép sử dụng microphone trong trình duyệt.':'Không mở được micro: '+(err.message||'lỗi không xác định'));}
}
function nplay(i){const n=nodes[i];n.play.src=urls[i];n.play.classList.remove('hidden');n.start.disabled=true;n.stop.disabled=true;n.again.disabled=false;n.download.disabled=false;}
function stop(){if(recorder && recorder.state==='recording')recorder.stop();}
function cleanup(){clearInterval(recTimer);if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}if(recordingIndex>=0){nodes[recordingIndex].stop.disabled=true;nodes[recordingIndex].pulse.classList.add('hidden');}}
$('aliSpExport').onclick=()=>{let count=0;blobs.forEach((b,i)=>{if(b){download(i);count++;}});if(!count)alertUser('Chưa có bản ghi âm để tải xuống.');};
function readAsDataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('Không đọc được file ghi âm'));reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(blob);});}
function waitForReceipt(endpoint,uploadId,limitMs=23000){
 return new Promise((resolve,reject)=>{
  const callback='ALIstatus_'+Math.random().toString(36).slice(2);
  let ended=false;let timeout=null;let script=null;
  const clean=()=>{if(script)script.remove();if(timeout)clearTimeout(timeout);try{delete window[callback]}catch{}};
  const finish=(ok,data)=>{if(ended)return;ended=true;clean();ok?resolve(data):reject(Error(data?.error||'Chưa nhận được xác nhận lưu file'))};
  window[callback]=(data)=>{if(data?.ok && data?.status==='saved')finish(true,data);else if(data?.status==='error')finish(false,data);else{if(script)script.remove();script=null;setTimeout(poll,1500);}};
  function poll(){if(ended)return;script=document.createElement('script');script.onerror=()=>{script.remove();script=null;setTimeout(poll,1700)};script.src=endpoint+'?action=status&uploadId='+encodeURIComponent(uploadId)+'&callback='+encodeURIComponent(callback)+'&t='+Date.now();document.head.append(script);}
  timeout=setTimeout(()=>finish(false,{error:'Chưa xác minh được upload trong thời gian chờ. Kiểm tra Sheet trước khi thử gửi lại.'}),limitMs);
  poll();
 });
}
async function sendPart(endpoint,i){
 const blob=blobs[i];if(!blob)throw Error('Chưa có ghi âm phần '+(i+1));
 if(blob.size>Math.min(7,Number(cfg.maxRecordingMB)||7)*1024*1024)throw Error('Bản ghi phần '+(i+1)+' quá lớn (giới hạn 7 MB). Hãy ghi ngắn hơn.');
 const uploadId=sessionId+'-p'+i;
 const payload={type:'speaking_upload',uploadId,sessionId,part:i+1,name:reg.name,email:$('aliSpStudentEmail').value.trim(),phone:reg.phone||'',school:reg.school||'',goal:reg.goal||'',consent:true,mime:blob.type||'audio/webm',fileName:'ALI_Speaking_'+sessionId+'_part_'+(i+1)+'.'+ext(blob.type),base64:await readAsDataURL(blob)};
 // Simple form request avoids cross-origin preflight; a separate status request confirms server save.
 const body=new URLSearchParams({payload:JSON.stringify(payload)});
 await fetch(endpoint,{method:'POST',mode:'no-cors',body});
 const receipt=await waitForReceipt(endpoint,uploadId);
 return receipt;
}
$('aliSpSend').onclick=async()=>{
 if(isUploading)return;
 if(recordingIndex!==-1){alertUser('Hãy dừng ghi âm trước khi nộp bài.');return;}
 if(!$('aliSpRecordingConsent').checked){alertUser('Vui lòng xác nhận đồng ý lưu trữ bản ghi âm để giảng viên chấm.');return;}
 if(!blobs.some(Boolean)){alertUser('Bạn cần ghi âm ít nhất một phần trước khi nộp.');return;}
 if(!$('aliSpStudentEmail').checkValidity()){alertUser('Email chưa đúng định dạng. Vui lòng kiểm tra lại.');return;}
 const endpoint=String(cfg.uploadEndpoint||'').trim();
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)){
  $('aliSpUploadStatus').textContent='Chưa kết nối Google Drive/Sheets. Bản ghi chưa được gửi. Vui lòng tải file và liên hệ ALI; quản lý cần thiết lập Apps Script.';
  return;
 }
 if(!confirm('Gửi '+blobs.filter(Boolean).length+' bản ghi âm của bạn để giảng viên chấm?'))return;
 isUploading=true;$('aliSpSend').disabled=true;
 try{
  for(let i=0;i<4;i++){
   if(!blobs[i]||receipts[i])continue;
   $('aliSpUploadStatus').textContent='Đang gửi phần '+(i+1)+' / 4…';
   receipts[i]=await sendPart(endpoint,i);
   $('aliSpUploadStatus').textContent='Đã lưu phần '+(i+1)+' trên hệ thống.';
   updateProgress();
  }
  $('aliSpUploadStatus').textContent='Đã nhận xác nhận lưu '+receipts.filter(Boolean).length+' file. Giảng viên sẽ nghe và chấm điểm sau.';
  $('aliSpAiBtn').disabled=false;
  $('aliSpAiStatus').textContent='Đã lưu bản ghi. Bạn có thể yêu cầu AI nhận xét tham khảo nếu đồng ý.';
  $('aliSpResult').scrollIntoView({behavior:'smooth'});
 }catch(err){$('aliSpUploadStatus').textContent='Chưa xác minh được việc nộp bài: '+err.message+' Bạn vẫn có thể tải bản ghi về máy. Không xoá bản ghi cho đến khi xác nhận trên Sheet.';}
 finally{isUploading=false;$('aliSpSend').disabled=false;}
};
$('aliSpAiBtn').onclick=async()=>{
 if(isUploading)return;
 if(!$('aliSpAiConsent').checked){alertUser('Hãy xác nhận đồng ý để AI phân tích bản ghi âm đã nộp.');return;}
 if(!receipts.some(Boolean)){alertUser('Bạn phải nộp ít nhất một bản ghi thành công trước khi yêu cầu AI.');return;}
 const endpoint=String(cfg.uploadEndpoint||'').trim();
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)){
  $('aliSpAiStatus').textContent='Hệ thống AI chưa được cấu hình. Vui lòng đợi ALI kích hoạt tính năng.';
  return;
 }
 if(!confirm('Bạn đồng ý gửi các bản ghi đã nộp cho dịch vụ AI để nhận xét sơ bộ, chỉ mang tính tham khảo?'))return;
 isUploading=true;$('aliSpAiBtn').disabled=true;
 $('aliSpAiStatus').textContent='Đang yêu cầu AI phân tích bản ghi…';
 try{
  const uploadId=sessionId+'-ai';
  const payload={type:'speaking_ai',uploadId,sessionId,consent:true,aiConsent:true};
  await fetch(endpoint,{method:'POST',mode:'no-cors',body:new URLSearchParams({payload:JSON.stringify(payload)})});
  const result=await waitForReceipt(endpoint,uploadId,115000);
  const score=Number(result.score);
  const feedback=String(result.feedback||'').slice(0,1500);
  const heading=document.createElement('strong');
  heading.textContent=Number.isFinite(score)?'Điểm AI tham khảo: '+score+'/20':'Nhận xét AI tham khảo';
  const note=document.createElement('p');
  note.textContent=feedback||'Chưa có nhận xét cụ thể.';
  const warning=document.createElement('p');
  warning.textContent='Đây là ước lượng AI cho 4 tiêu chí. Khả năng tương tác /5 chưa được chấm; kết quả chính xác cần chờ giảng viên đánh giá toàn bộ /25.';
  $('aliSpAiFeedback').replaceChildren(heading,note,warning);
  $('aliSpAiStatus').textContent='Đã nhận nhận xét AI tham khảo. Vui lòng chờ điểm giảng viên.';
 }catch(e){
  $('aliSpAiStatus').textContent='Chưa nhận được đánh giá AI: '+e.message+'. Kết quả chính thức vẫn do giảng viên chấm.';
 }finally{
  isUploading=false;$('aliSpAiBtn').disabled=false;
 }
};
window.addEventListener('beforeunload',event=>{if(blobs.some(Boolean)&&!receipts.filter(Boolean).length){event.preventDefault();event.returnValue='';}});
build();
})();

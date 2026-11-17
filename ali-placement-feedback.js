/* ALI Academy — transparent per-question review and placement guidance.
   Uses only verified answer keys from ALI's provided placement documents. */
(function(){
'use strict';
const path=location.pathname.split('/').pop();
const css=document.createElement('style');css.textContent=`
.ali-feedback-details{margin-top:25px;font-family:inherit;text-align:left;color:#29252c}
.ali-feedback-placement,.ali-feedback-review{background:#fffaf7;border:1px solid #f1d9c8;border-radius:17px;padding:20px;margin:18px 0;box-shadow:0 5px 20px #9d521012}
.ali-feedback-placement h3{margin:0 0 12px;color:#c64c0b;font-size:19px}
.ali-feedback-placement p,.ali-feedback-review p{line-height:1.8}
.ali-feedback-table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px}
.ali-feedback-table td{border-bottom:1px solid #f2ded0;padding:12px 9px;text-align:left;vertical-align:top}
.ali-feedback-table tr:nth-child(odd){background:#fff5ed}
.ali-feedback-table td:first-child{font-weight:750}
.ali-feedback-muted{font-size:12px;color:#816d64;line-height:1.7}
.ali-feedback-review summary{font-weight:800;color:#af430e;font-size:17px;cursor:pointer;line-height:1.5}
.ali-feedback-filter{display:flex;gap:8px;flex-wrap:wrap;margin:17px 0}
.ali-feedback-filter .ali-feedback-filter-btn{border:1px solid #f0c8ae!important;border-radius:999px!important;background:#fff!important;color:#a54918!important;font-size:12px!important;font-weight:750!important;padding:9px 14px!important;box-shadow:none!important}
.ali-feedback-filter .ali-feedback-filter-btn[aria-pressed=true]{background:#ff681e!important;color:white!important;border-color:#ff681e!important}
.ali-feedback-items{display:grid;gap:10px;max-height:650px;overflow-y:auto}
.ali-feedback-item{border-radius:12px;padding:13px 15px;background:#fff;border:1px solid #edd9cc;border-left:4px solid #e38f4f}
.ali-feedback-item.ali-feedback-correct{border-left-color:#289b70}
.ali-feedback-item strong{font-size:13px}
.ali-feedback-item p{font-size:12px;margin:7px 0 0}
.ali-feedback-item .ali-feedback-explain{color:#715c51}
@media(max-width:600px){.ali-feedback-placement,.ali-feedback-review{padding:13px}.ali-feedback-table{font-size:11px}.ali-feedback-table td{padding:10px 6px}.ali-feedback-items{max-height:none}}
`;document.head.append(css);

const keysToeic='B C D C B C A B A D A D B A C B A C D B C B C D D B D A C D'.split(' ');
const toeicExplain=[
'at the end of the block: giới từ at chỉ vị trí.','well là trạng từ bổ nghĩa cho performs.','plan to + V nguyên mẫu.','his associate: danh từ số ít chỉ một cộng sự.','between A and B: giữa hai đối tượng.','local là tính từ bổ nghĩa cho housing market.','has gone: hiện tại hoàn thành, người đó đang đi vắng.','by 5 p.m.: chậm nhất trước hạn chót.','their: tính từ sở hữu cho IXC chips số nhiều.','more experienced: tính từ chỉ kinh nghiệm, so sánh hơn.','due to + cụm danh từ chỉ nguyên nhân.','be released to the press: cấu trúc bị động.','unless = trừ khi.','need to be reminded: bị động sau need to.','get somebody to do something.','rather than: thay vì.','apologize: xin lỗi về sai sót.','If you encounter…: mệnh đề điều kiện.','have received: hiện tại hoàn thành.','set up an interview: sắp xếp cuộc phỏng vấn.','employees make: chủ ngữ số nhiều đi với make.','15% discount on rental car: chi tiết trong quảng cáo.','Package 2 có show; tuổi 70 thuộc Adults 65+, giá $120.','Memo thông báo chính sách nghỉ phép mới.','As of January 1st có nghĩa bắt đầu từ năm mới.','HR Director máy lẻ 254 hoặc trợ lý 256; 526 là đáp án nhiễu.','premier publisher of travel and tourism books.','founded six years ago tương đương started six years ago.','seminar về MarkTrends; cần dùng tốt phần mềm.','listed among Thailand’s ten most successful businesses.'
];
const keyB1='B B B B C B B C A B A B B C A'.split(' ');
const b1Explain=['Quá khứ hoàn thành had studied xảy ra trước moved.','will be opened: bị động tương lai.','If I were: câu điều kiện loại 2.','where I lived: trật tự câu gián tiếp.','who chỉ người làm chủ ngữ mệnh đề quan hệ.','should + động từ nguyên mẫu.','be used to + V-ing.','because of + cụm danh từ.','so + adjective + that.','wish + quá khứ đơn diễn tả điều trái hiện tại.','should have + V3 chỉ việc đáng lẽ nên làm.','make a decision là collocation.','despite + V-ing.','had already started: xảy ra trước mốc quá khứ.','have worked here for two years: kéo dài đến hiện tại.'];
const ieltsL=[['13 january','13th january','the 13th january','the 13th of january','13.01','13.1','13th of january'],['48','forty eight'],['pizza'],['india'],['mirror'],['6 april','6th april','the 6th april','the 6th of april','06.04','6.4','6th of april'],['natural'],['67.50','sixty seven fifty'],['shirt'],['hammer']];
const ieltsR='mining|education|notes|journals|Venice|canteen|friends|TRUE|NOT GIVEN|FALSE|NOT GIVEN|TRUE|TRUE'.split('|');
function norm(v){return String(v||'').toLowerCase().trim().replace(/[‐‑‒–—-]/g,' ').replace(/[^a-z0-9. ]/g,'').replace(/\s+/g,' ');}
function node(t,cl,txt){const x=document.createElement(t);if(cl)x.className=cl;if(txt!==undefined)x.textContent=txt;return x;}
function describeResult(i,type,answer,expected,reason,pass){return {id:i,type,answer:answer||'Chưa trả lời',expected,reason,pass};}
function reviewB1(){return Array.from({length:15},(_,i)=>{const a=document.querySelector('input[name="q'+i+'"]:checked');const v=a?String.fromCharCode(65+Number(a.value)):'';return describeResult(i+1,'Grammar & Vocabulary',v,keyB1[i],b1Explain[i],v===keyB1[i]);});}
function reviewToeic(){return Array.from({length:30},(_,i)=>{const n=i+26,a=document.querySelector('input[name="toeic'+n+'"]:checked');const v=a?.value||'';return describeResult(n,n<=40?'Part 5 · Grammar':n<=46?'Part 6 · Text Completion':'Part 7 · Reading',v,keysToeic[i],toeicExplain[i],v===keysToeic[i]);});}
function reviewIELTS(){const all=[];for(let i=0;i<20;i++){let v=document.getElementById('listen'+i)?.value||'',expected='',pass=false,why='';if(i<10){expected=ieltsL[i][0];pass=ieltsL[i].some(k=>norm(k)===norm(v));why='Đối chiếu thông tin nghe: ngày, số, tên hoặc từ khóa; chú ý chính tả và cách ghi số.';}else if(i<14){const pair=i<12?['B','E']:['C','D'],start=i<12?10:12;const partner=document.getElementById('listen'+(i===start?start+1:start))?.value||'';expected=pair.join(' và ')+' (không xét thứ tự)';pass=pair.includes(v)&&v!==partner;why='Bài chọn HAI đáp án: cần chọn đủ hai chữ cái khác nhau, đúng cặp theo đề.';}else{expected='F B D A H E'.split(' ')[i-14];pass=v===expected;why='Định vị địa điểm trên sơ đồ Melby Coal Mine theo thông tin trong audio.';}all.push(describeResult(i+1,'IELTS Listening',v,expected,why,pass));}
for(let i=0;i<13;i++){const v=document.getElementById('read'+i)?.value||'',expected=ieltsR[i];let why=i<7?'Tìm chính xác một từ trong đoạn “The Davies Sisters” và đối chiếu ngữ cảnh.':'Đối chiếu phát biểu với bằng chứng trong bài đọc; NOT GIVEN nghĩa là bài không cung cấp thông tin.';all.push(describeResult(i+1,'IELTS Reading',v,expected,why,norm(v)===norm(expected)));}
return all;}
function addHeading(parent,title){parent.append(node('h3','',title));}
function thresholds(parent,kind,records,data){
 const box=node('section','ali-feedback-placement');
 addHeading(box,'Quy đổi điểm & định hướng xếp lớp');
 const info=node('p','');
 if(kind==='toeic'){
  const r=records.filter(x=>x.pass).length,foundation=records.filter(x=>x.id<=31&&x.pass).length;
  info.textContent='Reading: '+r+'/30 · Ngữ pháp nền câu 26–31: '+foundation+'/6. Listening /25 chưa thể chấm vì thiếu audio và đáp án gốc được xác minh, nên chưa thể tính tổng /55 và xếp lớp chính thức.';
  box.append(info);addTable(box,[['0–18/55','TOEIC 400'],['19–21/55','TOEIC 550 khi đúng ít nhất 4/6 câu ngữ pháp nền; nếu không: TOEIC 400'],['22–30/55','TOEIC 550'],['31–55/55','Vượt mục tiêu TOEIC 550; tư vấn khóa cao hơn / luyện đề']]);
 }else if(kind==='ielts'){
  const l=records.slice(0,20).filter(x=>x.pass).length,r=records.slice(20).filter(x=>x.pass).length;
  const tiers=[['Foundation / Pre-IELTS',0,5,0,3,'0–29'],['IELTS Ignite',6,9,4,6,'30–49'],['IELTS Elevate',10,13,7,9,'50–64'],['IELTS Breakthrough',14,16,10,11,'65–79'],['IELTS Mastery',17,18,12,12,'80–89']];
  const matching=tiers.filter(x=>l>=x[1]&&l<=x[2]&&r>=x[3]&&r<=x[4]);
  info.textContent='Listening '+l+'/20 · Reading '+r+'/13 · Writing chưa được giáo viên chấm /100. '+(matching.length?'Hai kỹ năng tự chấm cùng khớp ngưỡng '+matching[0][0]+'. Đây là định hướng TẠM THỜI, chưa phải kết quả xếp lớp.':'Điểm Listening và Reading chưa cùng khớp một hàng xếp lớp trong tài liệu; cần giáo viên đánh giá tổng hợp.')+' Không quy đổi thành IELTS band score chính thức.';
  box.append(info);addTable(box,tiers.map(x=>[x[0],x[1]+'–'+x[2]+'/20 · '+x[3]+'–'+x[4]+'/13','Writing '+x[5]+'/100']));
  box.append(node('p','ali-feedback-muted','Bảng gốc không bao trùm một số điểm cao (19–20 Listening, 13 Reading, 90–100 Writing). Những trường hợp này cần giáo viên đánh giá riêng; không tự suy diễn.'));
 }else{
  info.textContent='Grammar '+records.filter(x=>x.pass).length+'/15 đã chấm tự động. Theo thang B1 /60, cần thêm Reading /10, Writing /15 và Listening /10 để định hướng xếp lớp đáng tin cậy.';
  box.append(info);addTable(box,[['0–29/60','A2 / cần củng cố nền tảng'],['30–41/60','A2+ / tiệm cận B1'],['42–51/60','B1'],['52–60/60','B1 vững / cân nhắc kiểm tra B2']]);
 }
 box.append(node('p','ali-feedback-muted','Bảng trên là thang xếp lớp nội bộ ALI theo tài liệu đã cung cấp, không phải chứng chỉ ngoại ngữ chính thức.'));
 parent.append(box);
}
function addTable(parent,rows){const table=node('table','ali-feedback-table');const body=node('tbody');rows.forEach(r=>{const tr=node('tr');r.forEach(c=>tr.append(node('td','',c)));body.append(tr);});table.append(body);parent.append(table);}
function mount(data){
 const kind=path==='toeic.html'?'toeic':path==='ielts.html'?'ielts':path==='b1.html'?'b1':null;
 if(!kind)return;
 const records=kind==='toeic'?reviewToeic():kind==='ielts'?reviewIELTS():reviewB1();
 const target=document.getElementById('aliUnifiedResult');if(!target)return;
 target.querySelector('.ali-feedback-details')?.remove();
 const wrap=node('div','ali-feedback-details');
 thresholds(wrap,kind,records,data);
 const details=node('details','ali-feedback-review');details.open=true;
 const total=records.filter(x=>x.pass).length;
 details.append(node('summary','','Chữa chi tiết từng câu · '+total+'/'+records.length+' câu đúng'));
 const filters=node('div','ali-feedback-filter');
 const shown=node('div','ali-feedback-items');
 const choices=[['all','Tất cả'],['wrong','Sai / bỏ trống'],['right','Đúng']];
 let selected='all';
 function paint(){shown.replaceChildren();for(const x of records.filter(x=>selected==='all'||(selected==='right'?x.pass:!x.pass))){const item=node('article','ali-feedback-item '+(x.pass?'ali-feedback-correct':'ali-feedback-incorrect'));item.append(node('strong','',x.type+' · Câu '+x.id+' · '+(x.pass?'✓ Đúng':'✕ Sai / chưa trả lời')));item.append(node('p','','Bạn chọn: '+x.answer+' · Đáp án: '+x.expected));item.append(node('p','ali-feedback-explain',x.reason));shown.append(item);} }
 choices.forEach(([id,label])=>{const b=node('button','ali-feedback-filter-btn',label);b.type='button';b.addEventListener('click',()=>{selected=id;filters.querySelectorAll('button').forEach(y=>y.setAttribute('aria-pressed',String(y===b)));paint();});b.setAttribute('aria-pressed',String(id===selected));filters.append(b);});
 details.append(filters,shown);wrap.append(details);
 if(kind==='toeic')wrap.append(node('p','ali-feedback-muted','Câu Listening 1–25 chưa có key/audio xác thực nên không hiển thị đúng/sai. Cần giáo viên đối chiếu trực tiếp.')); 
 if(kind==='b1')wrap.append(node('p','ali-feedback-muted','Reading và Writing là tự luận: hệ thống chưa có đánh giá giáo viên nên không đánh dấu đúng/sai hoặc gợi ý xếp lớp từ riêng Grammar.'));
 if(kind==='ielts')wrap.append(node('p','ali-feedback-muted','Phần Writing cần giáo viên chấm theo 4 tiêu chí, mỗi tiêu chí tối đa 25 điểm.'));
 target.append(wrap);paint();
}
function patch(){if(!window.ALIResults||window.ALIResults._feedbackPatched)return;const original=window.ALIResults.render;window.ALIResults.render=function(id,data){const result=original.call(this,id,data);mount(data);return result;};window.ALIResults._feedbackPatched=true;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();
})();
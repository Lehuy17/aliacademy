/* ALI English unified results — score only sections with verified marking. */
(function(global){
'use strict';
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;}
function fmt(n){return Number(n).toLocaleString('vi-VN',{maximumFractionDigits:1});}
function render(targetId,data){
 const target=document.getElementById(targetId);
 if(!target)throw Error('Missing ALI results container: '+targetId);
 const parts=Array.isArray(data.breakdown)?data.breakdown:[];
 const known=parts.filter(p=>Number.isFinite(p.score)&&Number.isFinite(p.max)&&p.max>0&&p.score>=0&&p.score<=p.max);
 const calculated=known.reduce((a,p)=>a+p.score,0);
 const possible=known.reduce((a,p)=>a+p.max,0);
 const total=Number.isFinite(data.total)?data.total:calculated;
 const max=Number.isFinite(data.max)&&data.max>0?data.max:possible;
 const pct=max>0?Math.max(0,Math.min(100,total/max*100)):0;
 target.replaceChildren();target.hidden=false;target.classList.remove('ali-hidden');
 const heading=el('div','ali-result-title');heading.append(el('div','ali-result-eyebrow',data.eyebrow||'ALI ENGLISH · TEST RESULT'),el('h2','',data.heading||'Kết quả bài kiểm tra'),el('p','',data.subtitle||'Đánh giá những phần đã có đáp án hợp lệ.'));target.append(heading);
 const summary=el('div','ali-result-head');
 const ring=el('div','ali-result-ring');ring.style.setProperty('--ali-result-percent',pct+'%');
 const ringInner=el('div','ali-result-ring-inner');ringInner.append(el('strong','',fmt(total)+'/'+fmt(max)),el('span','',data.ringLabel||'ĐIỂM ĐÃ CHẤM'));ring.append(ringInner);
 const card=el('div','ali-result-summary');card.append(el('div','ali-result-eyebrow',data.eyebrow||'NHẬN ĐỊNH BAN ĐẦU'),el('h3','',data.title||'Đã hoàn thành phần tự chấm'),el('p','',data.description||''));summary.append(ring,card);target.append(summary);
 const breakdown=el('div','ali-result-breakdown');breakdown.append(el('h3','',data.breakdownTitle||'Chi tiết theo kỹ năng'));
 for(const p of parts){
  const row=el('div','ali-skill-row'),name=el('strong','',p.label);
  const track=el('div','ali-bar');track.setAttribute('role','progressbar');
  const scored=Number.isFinite(p.score)&&Number.isFinite(p.max)&&p.max>0;
  const width=scored?Math.max(0,Math.min(100,p.score/p.max*100)):0;
  track.setAttribute('aria-label',p.label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(p.max));if(scored)track.setAttribute('aria-valuenow',String(p.score));
  const fill=el('span');fill.style.width=width+'%';track.append(fill);
  const number=el('b','ali-score',scored?fmt(p.score)+'/'+fmt(p.max):(Number.isFinite(p.max)&&p.max>0?'Chưa chấm /'+fmt(p.max):'Chưa chấm'));
  if(!scored)row.classList.add('ali-ungraded');
  row.append(name,track,number);breakdown.append(row);
 }target.append(breakdown);
 if(data.note)target.append(el('div','ali-result-note',data.note));
 const actions=el('div','ali-result-actions');
 const back=el('a','ali-result-btn ali-result-secondary','← Chọn bài test khác');back.href='/tests/?step=choose';actions.append(back);
 const retry=el('button','ali-result-btn ali-result-primary','Làm lại bài');retry.type='button';retry.addEventListener('click',()=>location.reload());actions.append(retry);
 target.append(actions);
 // Guest mode: preserve a minimal score receipt locally; no Firebase login or server sync.
 const receipt={test:(location.pathname.replace(/\/+$/, '').split('/').pop()||'').replace('.html',''),
   date:new Date().toISOString(),total,max,
   breakdown:parts.map(p=>({name:p.label,score:p.score,max:p.max}))};
 try{
   const registration=JSON.parse(sessionStorage.getItem('ALI_TEST_REGISTRATION')||'null');
   if(registration&&registration.consent===true)receipt.studentName=String(registration.name||'').slice(0,120);
   const key='ALI_LOCAL_TEST_RESULTS';
   const old=JSON.parse(localStorage.getItem(key)||'[]');
   const history=Array.isArray(old)?old:[];
   history.unshift(receipt);
   localStorage.setItem(key,JSON.stringify(history.slice(0,30)));
   target.append(el('p','ali-result-note','Đã lưu bản tóm tắt điểm trên trình duyệt này. Kết quả B1/TOEIC/IELTS chưa tự động gửi về giáo viên hoặc Google Sheets.'));
 }catch(err){target.append(el('p','ali-result-note','Không lưu được vào bộ nhớ trình duyệt. Bạn có thể tải phiếu điểm để giữ lại.'));}
 const download=el('button','ali-result-btn ali-result-secondary','↓ Tải phiếu điểm');
 download.type='button';
 download.addEventListener('click',()=>{
   const lines=['ALI ACADEMY · PHIẾU KẾT QUẢ BÀI TEST',
     'Bài test: '+receipt.test.toUpperCase(),
     'Học viên: '+(receipt.studentName||'Chưa cung cấp'),
     'Ngày: '+new Date(receipt.date).toLocaleString('vi-VN'),
     'Điểm phần tự chấm: '+fmt(receipt.total)+'/'+fmt(receipt.max),
     ...receipt.breakdown.map(p=>p.name+': '+(typeof p.score==='number'?fmt(p.score)+'/'+fmt(p.max):'Chưa chấm')),
     'Kết quả lưu cá nhân, không thay thế phiếu xác nhận của giáo viên.'];
   const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='ALI-ket-qua-'+receipt.test+'-'+receipt.date.slice(0,10)+'.txt';
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
 target.append(download);
 target.scrollIntoView({behavior:'smooth',block:'start'});
}
global.ALIResults={render};
})(window);

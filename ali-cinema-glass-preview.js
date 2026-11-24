/* ALI GLASS LAB: isolated prototype only; no changes to player or quiz source files. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const player=$('aliVideoPlayer'),list=$('aliTranscriptList'),video=$('aliHtmlVideo'),quizShell=document.querySelector('.ali-movie-quiz-shell');
if(!player||!list||!video||!quizShell)return;
const h=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const lab=h('section','ali-learning-lab');lab.setAttribute('aria-label','Phòng luyện tập ALI Cinema');
lab.innerHTML='<div class="ali-learning-title"><h3>✦ Luyện nghe & tương tác</h3><span>GLASS LAB · BẢN THỬ NGHIỆM</span></div>'+
 '<div id="aliLabTabs" class="ali-lab-tabs" role="tablist" aria-label="Chế độ học qua phim">'+
 '<button type="button" data-mode="subtitles" role="tab" aria-selected="false">Phụ đề</button>'+
 '<button type="button" data-mode="dictation" role="tab" aria-selected="true">Chính tả</button>'+
 '<button type="button" data-mode="fill" role="tab" aria-selected="false">Điền từ</button>'+
 '<button type="button" data-mode="quiz" role="tab" aria-selected="false">Câu hỏi</button></div>'+
 '<section class="ali-lab-pane" data-mode="subtitles" hidden role="tabpanel"><h4>Phụ đề tương tác</h4><p class="ali-lab-help">Nhấn vào câu phụ đề để nghe lại đoạn đó. Chọn EN + VI, EN hoặc VI bên trên.</p></section>'+
 '<section class="ali-lab-pane" data-mode="dictation" role="tabpanel"><h4>Nghe và viết lại câu thoại</h4><p class="ali-lab-help">Chọn một câu trong phụ đề, nghe lại rồi nhập câu tiếng Anh bạn nghe được.</p>'+
 '<p id="aliLabCueTitle" class="ali-lab-cue muted">Mở phim để bắt đầu luyện chính tả.</p>'+
 '<textarea id="aliLabTyped" rows="3" placeholder="Nhập câu tiếng Anh bạn nghe được..." aria-label="Câu tiếng Anh bạn nghe được"></textarea>'+
 '<div class="ali-lab-actions"><button type="button" id="aliLabSelectNow">Lấy câu đang phát</button><button type="button" id="aliLabPlay">▶ Nghe lại câu</button><button type="button" class="primary" id="aliLabCheck">✓ Kiểm tra</button><button type="button" id="aliLabNext">Câu tiếp theo</button></div><p id="aliLabFeedback" class="ali-lab-feedback" aria-live="polite"></p></section>'+
 '<section class="ali-lab-pane" data-mode="fill" role="tabpanel" hidden><h4>Điền từ còn thiếu</h4><p class="ali-lab-help">Một từ trong câu tiếng Anh sẽ được ẩn đi. Hãy nghe và điền đúng từ đó.</p>'+
 '<p id="aliLabMasked" class="ali-lab-cue muted">Mở phim có phụ đề để bắt đầu.</p>'+
 '<input id="aliLabBlankAnswer" type="text" autocomplete="off" aria-label="Từ còn thiếu" placeholder="Nhập từ còn thiếu...">'+
 '<div class="ali-lab-actions"><button type="button" id="aliLabFillListen">▶ Nghe lại câu</button><button type="button" class="primary" id="aliLabFillCheck">✓ Kiểm tra</button><button type="button" id="aliLabFillNext">Câu tiếp theo</button></div><p id="aliLabFillFeedback" class="ali-lab-feedback" aria-live="polite"></p></section>'+
 '<section class="ali-lab-pane ali-lab-quiz-host" data-mode="quiz" role="tabpanel" hidden><div id="aliLabQuizMount"></div></section>';
quizShell.parentNode.insertBefore(lab,quizShell);
$('aliLabQuizMount').append(quizShell);
const tabs=[...lab.querySelectorAll('[role="tab"]')],panes=[...lab.querySelectorAll('[role="tabpanel"]')];
const initial=window.matchMedia('(max-width:700px)').matches?'subtitles':'dictation';
let selectedIndex=-1,missing='',lastListLength=-1;
const normalize=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s']/g,' ').replace(/\s+/g,' ').trim();
function allRows(){return [...list.querySelectorAll('.ali-cue[data-index]')]}
function pick(i,clear=true){
 const rows=allRows();if(!rows.length){selectedIndex=-1;setEmpty();return;}
 selectedIndex=Math.max(0,Math.min(rows.length-1,i));
 const row=rows[selectedIndex],en=row.querySelector('.ali-en')?.textContent?.trim()||'';
 $('aliLabCueTitle').textContent='Câu '+(selectedIndex+1)+' · '+(row.querySelector('.ali-stamp')?.textContent||'')+' · Nhấn Nghe lại để bắt đầu';
 const words=en.match(/[a-z]+(?:'[a-z]+)?/gi)||[];
 const usable=words.filter(w=>w.length>=3),chosen=usable[Math.floor(usable.length/2)]||words[Math.floor(words.length/2)]||'';
 missing=chosen;
 if(chosen){
   const start=en.toLowerCase().indexOf(chosen.toLowerCase());
   $('aliLabMasked').textContent=en.slice(0,start)+'_____ '+en.slice(start+chosen.length);
 }else $('aliLabMasked').textContent='Câu thoại chưa có từ phù hợp để điền.';
 if(clear){
  $('aliLabTyped').value='';$('aliLabBlankAnswer').value='';
  for(const id of ['aliLabFeedback','aliLabFillFeedback']){$(id).textContent='';$(id).className='ali-lab-feedback';}
 }
}
function setEmpty(){
 $('aliLabCueTitle').textContent='Phim chưa có phụ đề tiếng Anh khả dụng.';
 $('aliLabMasked').textContent='Chọn một phim có phụ đề để bắt đầu luyện tập.';
}
function playSelected(){
 const row=allRows()[selectedIndex];if(!row){return;}
 // Use the original cinema player's click-to-seek implementation.
 if(row.tagName==='BUTTON'){row.click();return;}
 $('aliLabFeedback').textContent='Nguồn video dự phòng không hỗ trợ tua theo câu. Hãy dùng trình phát đồng bộ.';
}
function currentIndex(){return Number(list.querySelector('.ali-cue.current')?.dataset.index)||0}
function modeSelect(mode){
 tabs.forEach(b=>{const yes=b.dataset.mode===mode;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
 panes.forEach(p=>p.hidden=p.dataset.mode!==mode);
}
tabs.forEach((b,i)=>{
 b.addEventListener('click',()=>modeSelect(b.dataset.mode));
 b.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const next=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];modeSelect(next.dataset.mode);next.focus()});
});
function compare(a,b){return normalize(a)===normalize(b)}
$('aliLabPlay').addEventListener('click',playSelected);
$('aliLabFillListen').addEventListener('click',playSelected);
$('aliLabSelectNow').addEventListener('click',()=>pick(currentIndex()));
$('aliLabNext').addEventListener('click',()=>pick(selectedIndex+1));
$('aliLabFillNext').addEventListener('click',()=>pick(selectedIndex+1));
$('aliLabCheck').addEventListener('click',()=>{
 const row=allRows()[selectedIndex],expected=row?.querySelector('.ali-en')?.textContent||'';
 const v=$('aliLabTyped').value,feedback=$('aliLabFeedback');
 if(!expected){feedback.textContent='Chưa có câu thoại để chấm.';return}
 const correct=compare(v,expected);
 feedback.className='ali-lab-feedback '+(correct?'good':'bad');
 feedback.textContent=(correct?'✓ Chính xác!':'Cần luyện thêm.')+'\nĐáp án: '+expected;
});
$('aliLabFillCheck').addEventListener('click',()=>{
 const feedback=$('aliLabFillFeedback'),v=$('aliLabBlankAnswer').value;
 const correct=compare(v,missing);
 feedback.className='ali-lab-feedback '+(correct?'good':'bad');
 feedback.textContent=!missing?'Chưa có từ cần điền.':correct?'✓ Chính xác!':'Đáp án đúng: '+missing;
});
const observer=new MutationObserver(()=>{
 const rows=allRows();
 if(rows.length===lastListLength)return;
 lastListLength=rows.length;
 if(rows.length){pick(0);modeSelect(window.matchMedia('(max-width:700px)').matches?'subtitles':'dictation');}
 else {selectedIndex=-1;setEmpty();}
});
observer.observe(list,{childList:true});
modeSelect(initial);
setEmpty();
})();

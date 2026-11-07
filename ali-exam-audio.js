/* ALI listening media: play on entering Listening section when browser permits. */
(() => {
 'use strict';
 const settings={
  b1:[
   {name:'Bài nghe 1 · Chọn đáp án (câu 1–7)',src:'https://englishpracticetest.net/wp-content/uploads/2022/11/b1-test-1-1.mp3'},
   {name:'Bài nghe 2 · Saturday course (câu 14–19)',src:'https://englishpracticetest.net/wp-content/uploads/2022/11/b1-test-1-3.mp3'}
  ],
  ielts:[
   {name:'Part 1 · Steynford College (câu 1–10)',src:'https://ieltstrainingonline.com/wp-content/uploads/2026/07/cam21-test2-part1.MP3'},
   {name:'Part 2 · Coastal Walk và Coal Mine (câu 11–20)',src:'https://ieltstrainingonline.com/wp-content/uploads/2026/07/cam21-test2-part2.MP3'}
  ]
 };
 const page=location.pathname.split('/').pop().replace('.html','');
 const playlist=settings[page];if(!playlist)return;
 const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content)n.textContent=content;return n};
 function init(){
  const main=document.querySelector('main.ali-exam-page');
  if(!main)return;
  const target=[...main.querySelectorAll('section')].find(section=>/listening/i.test(section.querySelector('h2')?.textContent||''));
  if(!target)return;
  const box=el('div','ali-audio-box');
  const top=el('div','ali-audio-top'),tag=el('span','ali-audio-label','ALI ACADEMY · LISTENING'),state=el('span','ali-audio-state','Sẵn sàng');
  top.append(tag,state);box.append(top);
  const heading=el('div','ali-audio-heading',playlist[0].name);box.append(heading);
  const buttons=el('div','ali-audio-controls ali-audio-part-tabs');
  const audio=el('audio','ali-audio-player');audio.controls=true;audio.preload='metadata';audio.setAttribute('aria-label','Audio bài kiểm tra Listening');
  audio.controlsList='nodownload';
  let current=0,attempted=false;
  const partButtons=playlist.map((item,i)=>{
   const button=el('button','',String(i+1).padStart(2,'0')+' · '+item.name.split(' · ')[0]);
   button.type='button';button.setAttribute('aria-pressed',String(i===0));
   button.addEventListener('click',()=>switchPart(i,true));buttons.append(button);return button;
  });
  box.append(buttons,audio);
  const controls=el('div','ali-audio-controls');
  const play=el('button','ali-audio-primary','▶ Phát bài nghe');
  const replay=el('button','','↺ Nghe lại');
  play.type=replay.type='button';controls.append(play,replay);box.append(controls);
  const help=el('p','ali-audio-helper','Bài nghe sẽ được đề nghị phát khi bạn mở phần Listening. Nếu trình duyệt chặn tự phát, nhấn “Phát bài nghe”. Không hiển thị trang nguồn hoặc đáp án.');
  box.append(help);
  const error=el('div','ali-audio-error');error.setAttribute('role','status');box.append(error);
  const stopOthers=()=>document.querySelectorAll('.ali-audio-player').forEach(a=>{if(a!==audio)a.pause()});
  function tryPlay(){
   stopOthers();
   state.textContent='Đang yêu cầu phát…';
   const result=audio.play();
   if(result && typeof result.then==='function')result.then(()=>{state.textContent='Đang phát';error.textContent='';}).catch(()=>{state.textContent='Nhấn phát để nghe';});
  }
  function switchPart(i,shouldPlay){
   current=i;audio.pause();audio.src=playlist[i].src;audio.load();
   heading.textContent=playlist[i].name;
   partButtons.forEach((btn,index)=>btn.setAttribute('aria-pressed',String(index===i)));
   state.textContent='Sẵn sàng';error.textContent='';
   if(shouldPlay)tryPlay();
  }
  play.addEventListener('click',()=>{if(audio.paused)tryPlay();else audio.pause()});
  replay.addEventListener('click',()=>{audio.currentTime=0;tryPlay()});
  audio.addEventListener('play',()=>{state.textContent='Đang phát';play.textContent='Ⅱ Tạm dừng'});
  audio.addEventListener('pause',()=>{state.textContent=audio.ended?'Đã hoàn thành':'Đang tạm dừng';play.textContent='▶ Phát bài nghe'});
  audio.addEventListener('ended',()=>{if(current+1<playlist.length)switchPart(current+1,true);else state.textContent='Đã hoàn thành bài nghe'});
  audio.addEventListener('error',()=>{state.textContent='Không tải được audio';error.textContent='Nguồn âm thanh chưa phát được trên trình duyệt này. Vui lòng thông báo quản lý ALI để kiểm tra nguồn audio.'});
  target.insertBefore(box,target.querySelector('h2')?.nextSibling||target.firstChild);
  switchPart(0,false);
  const observer=new MutationObserver(()=>{
   if(target.hidden||!target.classList.contains('ali-part-active')){if(!audio.paused)audio.pause();attempted=false;return;}
   if(!attempted){attempted=true;tryPlay();}
  });
  observer.observe(target,{attributes:true,attributeFilter:['hidden','class']});
  if(!target.hidden && target.classList.contains('ali-part-active')){attempted=true;tryPlay();}
  window.addEventListener('pagehide',()=>audio.pause());
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

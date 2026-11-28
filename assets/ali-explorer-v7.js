/* ALI Explorer V7 · three demo mini-quests and a local, privacy-conscious
 * Explorer Passport. No account, grades, tracking, or server-side saves. */
(function(){
 'use strict';
 var engine=window.ALIStreetDemo;
 if(!engine){console.warn('[ALI Explorer V7] Town engine unavailable');return;}
function installV7Dom(){
 var section=document.getElementById('map');
 var tabs=document.querySelector('.street-tabs');
 var top=document.querySelector('.street-topbar');
 var stage=document.getElementById('street-world');
 var viewport=document.getElementById('street-viewport');
 var area=document.querySelector('.street-score-area');
 if(!section||!tabs||!top||!stage||!viewport||!area)throw new Error('Missing English Street UI');
 tabs.insertAdjacentHTML('afterbegin',"<button class=\"street-tab\" role=\"tab\" type=\"button\" id=\"street-tab-explore\" data-street-mode=\"explore\" aria-controls=\"street-score-panel\" aria-selected=\"false\">🏙️ Khám phá</button>");
 top.insertAdjacentHTML('beforeend',"<button type=\"button\" class=\"street-v7-passport-trigger\" id=\"street-v7-passport-trigger\" aria-label=\"Mở hộ chiếu khám phá\"><span aria-hidden=\"true\">📔</span> Passport <strong id=\"street-v7-passport-count\">0/3</strong></button>");
 stage.insertAdjacentHTML('beforeend',"<button type=\"button\" class=\"street-v7-hotspot\" data-place=\"bookstore\" aria-label=\"Khám phá ALI Bookstore\"><span class=\"v7-pin-icon\" aria-hidden=\"true\">📚</span><span class=\"v7-pin-title\">ALI Bookstore</span><span class=\"v7-pin-sub\">Học từ vựng</span><span class=\"v7-stamp-dot\" hidden aria-hidden=\"true\">✓</span></button><button type=\"button\" class=\"street-v7-hotspot\" data-place=\"cafe\" aria-label=\"Khám phá English Café\"><span class=\"v7-pin-icon\" aria-hidden=\"true\">☕</span><span class=\"v7-pin-title\">English Café</span><span class=\"v7-pin-sub\">Luyện giao tiếp</span><span class=\"v7-stamp-dot\" hidden aria-hidden=\"true\">✓</span></button><button type=\"button\" class=\"street-v7-hotspot\" data-place=\"cinema\" aria-label=\"Khám phá ALI Cinema\"><span class=\"v7-pin-icon\" aria-hidden=\"true\">🎬</span><span class=\"v7-pin-title\">ALI Cinema</span><span class=\"v7-pin-sub\">Phim song ngữ</span><span class=\"v7-stamp-dot\" hidden aria-hidden=\"true\">✓</span></button>");
 viewport.insertAdjacentHTML('beforeend',"<div class=\"street-v7-location-info\" id=\"street-v7-world-info\">✨ <strong id=\"street-v7-world-status\">Chọn một tòa nhà để khám phá!</strong></div>");
 area.insertAdjacentHTML('afterbegin',"<div class=\"street-v7-missions\" id=\"street-v7-explore-panel\" hidden>\n  <div class=\"street-v7-firstline\"><span>✦ MINI QUESTS · 3 ĐỊA ĐIỂM</span><button class=\"street-v7-start\" type=\"button\" id=\"street-v7-start\">Bắt đầu từ cửa hàng ↗</button></div>\n  <div class=\"street-v7-mission-head\"><span>Hộ chiếu khám phá của bạn</span><b id=\"street-v7-progress-count\">0/3</b></div>\n  <div class=\"street-v7-meter\" aria-hidden=\"true\"><span id=\"street-v7-meter-fill\"></span></div>\n  <div class=\"street-v7-mission-items\"><button type=\"button\" id=\"street-v7-mission-bookstore\"><b>📚</b> Bookstore</button><button type=\"button\" id=\"street-v7-mission-cafe\"><b>☕</b> Café</button><button type=\"button\" id=\"street-v7-mission-cinema\"><b>🎬</b> Cinema</button><button type=\"button\" id=\"street-v7-mission-passport\"><b>📔</b> Passport</button></div>\n  <div class=\"street-v7-mission-note\">Trả lời đúng để nhận dấu hoàn thành. Mỗi hoạt động chỉ mất khoảng một phút.</div>\n </div>");
 section.insertAdjacentHTML('beforeend',"<div class=\"street-v7-overlay\" id=\"street-v7-activity-overlay\" hidden aria-hidden=\"true\">\n <div class=\"street-v7-backdrop\" data-v7-close=\"activity\" aria-hidden=\"true\"></div>\n <section class=\"street-v7-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"street-v7-activity-title\">\n  <div class=\"street-v7-dialog-head\">\n   <div class=\"street-v7-dialog-icon\" id=\"street-v7-activity-icon\">📚</div>\n   <div><div class=\"street-v7-dialog-kicker\">ALI ENGLISH · MINI QUEST</div><h3 id=\"street-v7-activity-title\">ALI Bookstore</h3><p id=\"street-v7-activity-sub\">Nhiệm vụ từ vựng</p></div>\n   <button class=\"street-v7-close\" type=\"button\" id=\"street-v7-activity-close\" aria-label=\"Đóng hoạt động\">×</button>\n  </div>\n  <div class=\"street-v7-dialog-content\">\n   <div class=\"street-v7-scene\"><span class=\"scene-emoji\" id=\"street-v7-scene-icon\">🧳</span><div><b id=\"street-v7-scene-title\">Một từ để bắt đầu chuyến đi</b><small id=\"street-v7-scene-detail\">Nhiệm vụ ngắn.</small></div></div>\n   <div class=\"street-v7-film\" id=\"street-v7-film\" hidden><img src=\"/media/kung-fu-panda-po-vs-tai-lung-final-battle/poster.jpg\" alt=\"Poster clip Kung Fu Panda trong thư viện ALI\" loading=\"lazy\"><div><b>Kung Fu Panda · Final Battle</b><p>Mini-quiz dựa trên tiêu đề phim, không dựa trên lời thoại chưa xác minh.</p></div></div>\n   <p class=\"street-v7-question\" id=\"street-v7-question\"></p>\n   <div class=\"street-v7-options\" id=\"street-v7-options\"></div>\n   <div class=\"street-v7-feedback\" id=\"street-v7-feedback\" role=\"status\" hidden></div>\n   <p class=\"street-v7-stamp\" id=\"street-v7-stamp\" hidden></p>\n   <div class=\"street-v7-actions\"><button class=\"primary\" type=\"button\" id=\"street-v7-next\" hidden>Khám phá trạm tiếp theo →</button><a href=\"/movies/\" id=\"street-v7-real-link\">Khám phá thêm ↗</a></div>\n  </div>\n </section>\n</div><div class=\"street-v7-overlay\" id=\"street-v7-passport-overlay\" hidden aria-hidden=\"true\">\n <div class=\"street-v7-backdrop\" data-v7-close=\"passport\" aria-hidden=\"true\"></div>\n <section class=\"street-v7-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"street-v7-passport-title\">\n  <div class=\"street-v7-dialog-head\">\n   <div class=\"street-v7-dialog-icon\">📔</div>\n   <div><div class=\"street-v7-dialog-kicker\">ALI EXPLORER · MY PASSPORT</div><h3 id=\"street-v7-passport-title\">Hộ chiếu khám phá</h3><p id=\"street-v7-passport-save\">Tiến trình lưu trên trình duyệt hiện tại.</p></div>\n   <button class=\"street-v7-close\" type=\"button\" id=\"street-v7-passport-close\" aria-label=\"Đóng hộ chiếu\">×</button>\n  </div>\n  <div class=\"street-v7-dialog-content\">\n   <div class=\"street-v7-mission-head\"><span>Dấu khám phá đã nhận</span><b id=\"street-v7-passport-total\">0/3 nhiệm vụ</b></div>\n   <div class=\"street-v7-passport-meter\"><span id=\"street-v7-passport-fill\"></span></div>\n   <div class=\"street-v7-passport-list\">\n    <div class=\"street-v7-passport-item\" id=\"street-v7-passport-bookstore\"><div class=\"passport-ico\">📚</div><div><b>Word Explorer</b><small class=\"v7-passport-status\">Chưa khám phá</small></div></div>\n    <div class=\"street-v7-passport-item\" id=\"street-v7-passport-cafe\"><div class=\"passport-ico\">☕</div><div><b>Conversation Starter</b><small class=\"v7-passport-status\">Chưa khám phá</small></div></div>\n    <div class=\"street-v7-passport-item\" id=\"street-v7-passport-cinema\"><div class=\"passport-ico\">🎬</div><div><b>Cinema Explorer</b><small class=\"v7-passport-status\">Chưa khám phá</small></div></div>\n   </div>\n   <p class=\"street-v7-mission-note\" id=\"street-v7-passport-next\">Hãy thử ba hoạt động.</p>\n   <div class=\"street-v7-actions\"><a href=\"/tests/\" class=\"primary\">Kiểm tra trình độ thật ↗</a><button type=\"button\" id=\"street-v7-passport-reset\" class=\"street-v7-reset\">Đặt lại tiến trình demo</button></div>\n  </div>\n </section>\n</div>");
 document.querySelector('#map .street-intro p').textContent='Một con phố, nhiều hành trình. Bấm các tòa nhà để làm 3 mini-quest, gặp gỡ ALI Explorer và nhận dấu khám phá. CEFR, IELTS và TOEIC vẫn có chế độ riêng.';
 document.querySelector('#map .street-hint span').textContent='🏙️ Khám phá: chọn các địa điểm trên bản đồ. CEFR, IELTS và TOEIC: dùng tab ở phía trên.';
 document.querySelector('#map .street-hint span:last-child').textContent='Các nhiệm vụ chỉ là bản demo học thử, không phải bài thi hay chứng nhận trình độ.';
}
installV7Dom();
 var keys=['bookstore','cafe','cinema'];
 var places={
  bookstore:{
   label:'ALI Bookstore',sub:'Cửa hàng từ vựng',icon:'📚',
   x:244,y:644,sceneIcon:'🧳',sceneTitle:'Một từ để bắt đầu chuyến đi',
   sceneDetail:'Học từ qua một ngữ cảnh ngắn, như khi chuẩn bị đi du lịch.',
   question:'Trong câu “London is my destination.”, “destination” có nghĩa là gì?',
   answers:['Hộ chiếu','Điểm đến','Khách sạn'],correct:1,
   explain:'Destination = điểm đến. Ví dụ: “Our destination is London.”',
   badge:'Word Explorer',cta:'Luyện thêm từ vựng',url:'/tests/'
  },
  cafe:{
   label:'English Café',sub:'Quán giao tiếp',icon:'☕',
   x:690,y:481,sceneIcon:'🥤',sceneTitle:'Bạn đang gọi nước ở English Café',
   sceneDetail:'Hãy lựa chọn câu nói lịch sự và tự nhiên nhất.',
   question:'Bạn muốn gọi một ly cà phê. Bạn sẽ nói câu nào?',
   answers:['Give me coffee.','Could I have a coffee, please?','You must coffee.'],
   correct:1,explain:'“Could I have a coffee, please?” là lời yêu cầu lịch sự, phù hợp khi gọi đồ uống.',
   badge:'Conversation Starter',cta:'Luyện Speaking',url:'/speaking/'
  },
  cinema:{
   label:'ALI Cinema',sub:'Rạp phim song ngữ',icon:'🎬',
   x:454,y:572,sceneIcon:'🍿',sceneTitle:'Học qua tiêu đề một trích đoạn phim',
   sceneDetail:'Luyện hiểu một cụm từ có trong tiêu đề phim tại thư viện ALI.',
   question:'Trong tiêu đề “Po vs. Tai Lung: The FINAL BATTLE!”, “final battle” có nghĩa là gì?',
   answers:['Trận chiến cuối cùng','Cuộc hẹn đầu tiên','Lời chúc may mắn'],correct:0,
   explain:'Final = cuối cùng; battle = trận chiến. Hãy thử nghe ngữ cảnh trong thư viện phim ALI.',
   badge:'Cinema Explorer',cta:'Vào thư viện phim song ngữ',url:'/movies/'
  }
 };
 var $=function(id){return document.getElementById(id);};
 var storageKey='ali.home-demo.v7.passport';
 var completed=new Set(),persistOk=true,active=null,lastFocus=null;
 function loadProgress(){
  try{
   var obj=JSON.parse(localStorage.getItem(storageKey)||'{}');
   var arr=Array.isArray(obj.completed)?obj.completed:[];
   completed=new Set(arr.filter(function(k){return Object.prototype.hasOwnProperty.call(places,k);}));
  }catch(_){persistOk=false;completed=new Set();}
 }
 function saveProgress(){
  try{localStorage.setItem(storageKey,JSON.stringify({version:1,completed:Array.from(completed)}));persistOk=true;}
  catch(_){persistOk=false;}
 }
 function questCount(){return completed.size;}
 function updateProgress(){
  var total=questCount(),percent=total/keys.length*100;
  $('street-v7-progress-count').textContent=total+'/3';
  $('street-v7-passport-count').textContent=total+'/3';
  $('street-v7-meter-fill').style.width=percent+'%';
  $('street-v7-passport-fill').style.width=percent+'%';
  $('street-v7-passport-total').textContent=total+'/3 nhiệm vụ';
  $('street-v7-passport-save').textContent=persistOk?
   'Tiến trình thử nghiệm lưu trên trình duyệt hiện tại.':'Không thể lưu trên thiết bị; tiến trình tạm thời của phiên này vẫn được giữ.';
  keys.forEach(function(id){
   var done=completed.has(id);
   var mission=$('street-v7-mission-'+id),pin=document.querySelector('[data-place="'+id+'"]');
   var stamp=pin&&pin.querySelector('.v7-stamp-dot');
   if(mission){mission.classList.toggle('done',done);mission.setAttribute('aria-label',(done?'Đã hoàn thành ':'Chưa hoàn thành ')+places[id].label);}
   if(stamp)stamp.hidden=!done;
   var passport=$('street-v7-passport-'+id);
   if(passport){
    passport.classList.toggle('is-done',done);
    passport.querySelector('.v7-passport-status').textContent=done?'Đã nhận dấu khám phá ✓':'Chưa khám phá';
   }
  });
  $('street-v7-passport-next').textContent=total===3?
   'Bạn đã hoàn thành cả 3 trạm. Hãy thử bài kiểm tra trình độ thật!':
   'Còn '+(3-total)+' trạm để hoàn thành hành trình thử nghiệm.';
 }
 function restoreFocus(){
  if(lastFocus&&document.contains(lastFocus)&&typeof lastFocus.focus==='function')lastFocus.focus();
  lastFocus=null;
 }
 function closeOverlay(overlay,restore){
  if(!overlay||overlay.hidden)return;
  overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
  if($('street-v7-activity-overlay').hidden&&$('street-v7-passport-overlay').hidden){
   document.body.classList.remove('street-v7-modal-open');
  }
  if(restore!==false)restoreFocus();
 }
 function closeAll(){
  closeOverlay($('street-v7-activity-overlay'),false);
  closeOverlay($('street-v7-passport-overlay'),false);
  document.querySelectorAll('.street-v7-hotspot.is-targeted').forEach(function(node){node.classList.remove('is-targeted');});
  restoreFocus();
 }
 function openOverlay(overlay,focusTarget){
  closeOverlay($('street-v7-activity-overlay'),false);
  closeOverlay($('street-v7-passport-overlay'),false);
  overlay.hidden=false;overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('street-v7-modal-open');
  (focusTarget||overlay.querySelector('.street-v7-close')).focus();
 }
 function renderFilm(key){
  $('street-v7-film').hidden=key!=='cinema';
 }
 function renderActivity(key){
  var p=places[key];if(!p)return;
  active=key;
  $('street-v7-activity-icon').textContent=p.icon;
  $('street-v7-activity-title').textContent=p.label;
  $('street-v7-activity-sub').textContent=p.sub+' · Mini Quest';
  $('street-v7-scene-icon').textContent=p.sceneIcon;
  $('street-v7-scene-title').textContent=p.sceneTitle;
  $('street-v7-scene-detail').textContent=p.sceneDetail;
  $('street-v7-question').textContent=p.question;
  $('street-v7-feedback').hidden=true;
  $('street-v7-feedback').classList.remove('ok');
  $('street-v7-stamp').hidden=!completed.has(key);
  $('street-v7-stamp').textContent=completed.has(key)?'✓ Đã có dấu '+p.badge:'';
  $('street-v7-next').hidden=true;
  $('street-v7-real-link').textContent=p.cta+' ↗';
  $('street-v7-real-link').href=p.url;
  renderFilm(key);
  var container=$('street-v7-options');container.replaceChildren();
  p.answers.forEach(function(answer,i){
   var button=document.createElement('button');button.type='button';
   button.className='street-v7-option';button.setAttribute('data-answer',String(i));
   var marker=document.createElement('span');marker.className='opt-letter';marker.textContent=String.fromCharCode(65+i);
   var content=document.createElement('span');content.textContent=answer;
   button.append(marker,content);
   button.addEventListener('click',function(){answerQuestion(key,i,button);});
   container.appendChild(button);
  });
 }
 function answerQuestion(key,index,button){
  if(active!==key)return;
  var p=places[key],feedback=$('street-v7-feedback');
  feedback.hidden=false;
  if(index===p.correct){
   document.querySelectorAll('#street-v7-options .street-v7-option').forEach(function(opt){
    opt.disabled=true;
    if(Number(opt.getAttribute('data-answer'))===p.correct)opt.classList.add('correct');
   });
   feedback.classList.add('ok');
   feedback.textContent='Chính xác! '+p.explain;
   completed.add(key);saveProgress();updateProgress();
   $('street-v7-stamp').hidden=false;
   $('street-v7-stamp').textContent='✦ Dấu khám phá đã nhận: '+p.badge;
   $('street-v7-next').hidden=false;
  }else{
   button.classList.add('incorrect');button.disabled=true;
   feedback.classList.remove('ok');
   feedback.textContent='Chưa đúng rồi. Hãy thử một lựa chọn khác nhé!';
  }
 }
 function travelTo(key,trigger){
  if(!Object.prototype.hasOwnProperty.call(places,key))return;
  lastFocus=trigger||document.activeElement;
  closeOverlay($('street-v7-activity-overlay'),false);
  closeOverlay($('street-v7-passport-overlay'),false);
  var p=places[key];
  document.querySelectorAll('.street-v7-hotspot').forEach(function(pin){pin.classList.toggle('is-targeted',pin.dataset.place===key);});
  $('street-v7-world-status').textContent='ALI Explorer đang đến '+p.label+'…';
  if(engine.getMode()!=='explore')engine.setMode('explore');
  engine.travelTo(p.x,p.y,function(){
   if(engine.getMode()!=='explore')return;
   $('street-v7-world-status').textContent='Đã tới '+p.label+'!';
   renderActivity(key);
   openOverlay($('street-v7-activity-overlay'),$('street-v7-activity-close'));
  });
 }
 function openPassport(trigger){
  lastFocus=trigger||document.activeElement;
  updateProgress();
  openOverlay($('street-v7-passport-overlay'),$('street-v7-passport-close'));
 }
 function nextPlace(){
  var index=keys.indexOf(active),next=keys[(index+1)%keys.length];
  closeOverlay($('street-v7-activity-overlay'),false);
  travelTo(next,lastFocus||$('street-v7-mission-'+next));
 }
 document.querySelectorAll('[data-place]').forEach(function(pin){
  pin.addEventListener('click',function(){travelTo(pin.dataset.place,pin);});
 });
 keys.forEach(function(id){
  var el=$('street-v7-mission-'+id);
  if(el)el.addEventListener('click',function(){travelTo(id,el);});
 });
 $('street-v7-passport-trigger').addEventListener('click',function(){openPassport(this);});
 $('street-v7-start').addEventListener('click',function(){travelTo('bookstore',this);});
 $('street-v7-mission-passport').addEventListener('click',function(){openPassport(this);});
 $('street-v7-activity-close').addEventListener('click',function(){closeAll();});
 $('street-v7-passport-close').addEventListener('click',function(){closeAll();});
 $('street-v7-next').addEventListener('click',nextPlace);
 document.querySelectorAll('[data-v7-close]').forEach(function(backdrop){
  backdrop.addEventListener('click',closeAll);
 });
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&(!$('street-v7-activity-overlay').hidden||!$('street-v7-passport-overlay').hidden)){
   e.preventDefault();closeAll();
  }
 });
 $('street-v7-passport-reset').addEventListener('click',function(){
  if(!window.confirm('Xóa 3 dấu khám phá trong bản demo trên trình duyệt này?'))return;
  completed.clear();saveProgress();updateProgress();
 });
 $('street-v7-next').hidden=true;
 var exploreTab=$('street-tab-explore');
 exploreTab.addEventListener('click',function(){engine.setMode('explore');});
 exploreTab.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
   e.preventDefault();
   var tabs=[].slice.call(document.querySelectorAll('[data-street-mode]'));
   var next=tabs[(tabs.indexOf(exploreTab)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
   next.focus();engine.setMode(next.dataset.streetMode);
  }
 });
 window.ALIExplorerV7={
  onModeChange:function(mode){
   var activeExplore=mode==='explore';
   exploreTab.setAttribute('aria-selected',String(activeExplore));
   exploreTab.tabIndex=activeExplore?0:-1;
   $('street-v7-explore-panel').hidden=!activeExplore;
   $('street-v7-world-info').hidden=!activeExplore;
   document.querySelectorAll('.street-v7-hotspot').forEach(function(pin){pin.disabled=!activeExplore;});
   if(!activeExplore)closeAll();
   else $('street-v7-world-status').textContent='Chọn một tòa nhà để khám phá!';
  }
 };
 loadProgress();updateProgress();
 engine.setMode('explore');
})();

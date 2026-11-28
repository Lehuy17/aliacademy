/* ALI English Village V8 — isolated demo.
 * No auth, analytics, external model calls, background collection or grading.
 * State is local to the visitor's browser. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const by=sel=>Array.from(document.querySelectorAll(sel));
const root=$("world-view"),stage=$("world-stage"),avatar=$("world-avatar"),route=$("walk-trace");
const panel=$("modal-content"),overlay=$("village-overlay"),modal=$("village-modal");
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
const key="ali.village.v8.demo.progress";
const core=["bookstore","cafe","cinema"];
const venues={
 plaza:{x:772,y:735,name:"Quảng trường ALI",icon:"🌳",desc:"Nơi ALI Explorer bắt đầu hành trình. Gặp người hướng dẫn, nhận câu chuyện đầu tiên và mở hộ chiếu."},
 bookstore:{x:355,y:684,name:"ALI Bookstore",icon:"📚",desc:"Từ vựng theo ngữ cảnh, ghép câu và sưu tầm những từ mới hữu ích."},
 cafe:{x:1030,y:735,name:"English Café",icon:"☕",desc:"Trò chuyện với Emma. Những lựa chọn khác nhau sẽ dẫn tới phản hồi khác nhau."},
 cinema:{x:540,y:565,name:"ALI Cinema",icon:"🎬",desc:"Khám phá từ vựng qua tiêu đề phim trong thư viện song ngữ ALI."},
 market:{x:235,y:820,name:"Village Market",icon:"🍎",desc:"Tìm đúng đồ vật trong khu chợ dựa trên gợi ý tiếng Anh."},
 travel:{x:1210,y:835,name:"Travel Corner",icon:"🧳",desc:"Tập đọc thông báo, chỉ dẫn và làm quen tiếng Anh du lịch."},
 community:{x:706,y:554,name:"Community House",icon:"🏡",desc:"Góc kể chuyện về lớp học, nhân sự, giáo viên và các hoạt động cộng đồng ALI."},
 academy:{x:1130,y:407,name:"ALI Academy",icon:"🎓",desc:"Khám phá các thang CEFR, IELTS, TOEIC bên trong học viện, hoặc làm bài test thật."},
 gate:{x:1320,y:260,name:"World Gate",icon:"🌍",desc:"Cánh cổng tới những chân trời mới. Hoàn thành ba nhiệm vụ đầu tiên để mở."},
 cat:{x:177,y:852,name:"Chú mèo bí mật",icon:"🐈",desc:"Một vị khách nhỏ lẩn trốn trong ngôi làng. Bạn tìm ra nó rồi!"}
};
const navigation={
 plaza:[[772,735]],
 bookstore:[[772,735],[628,738],[485,788],[355,684]],
 cafe:[[772,735],[935,737],[1030,735]],
 cinema:[[772,735],[776,646],[695,593],[540,565]],
 market:[[772,735],[638,756],[448,826],[235,820]],
 travel:[[772,735],[931,736],[1074,785],[1210,835]],
 community:[[772,735],[776,646],[706,554]],
 academy:[[772,735],[861,563],[1039,492],[1130,407]],
 gate:[[772,735],[861,563],[1039,492],[1130,407],[1236,333],[1320,260]],
 cat:[[772,735],[635,751],[438,847],[177,852]]
};
const vocabulary={
 bookstore:[
  {word:"destination",ipa:"/ˌdes.tɪˈneɪ.ʃən/",meaning:"điểm đến",sentence:"London is our destination.",question:"What does “destination” mean?",choices:["Điểm đến","Hộ chiếu","Đường phố"],answer:0},
  {word:"luggage",ipa:"/ˈlʌɡ.ɪdʒ/",meaning:"hành lý",sentence:"Where is my luggage?",question:"What is “luggage”?",choices:["Hành lý","Vé tàu","Bản đồ"],answer:0},
  {word:"curious",ipa:"/ˈkjʊə.ri.əs/",meaning:"tò mò",sentence:"I'm curious about this town.",question:"“Curious” means…",choices:["Mệt mỏi","Tò mò","Lo lắng"],answer:1},
  {word:"explore",ipa:"/ɪkˈsplɔːr/",meaning:"khám phá",sentence:"Let's explore the village.",question:"“Explore” nghĩa là gì?",choices:["Nghỉ ngơi","Khám phá","Lãng quên"],answer:1}
 ],
 cinema:[
  {title:"Kung Fu Panda · Final Battle",poster:"/media/kung-fu-panda-po-vs-tai-lung-final-battle/poster.jpg",question:"Trong tiêu đề “Final Battle”, từ “final” có nghĩa là gì?",choices:["Cuối cùng","Bí mật","Đầu tiên"],answer:0,term:"final",meaning:"cuối cùng",example:"This is the final round."},
  {title:"Tangled · Rapunzel & Flynn",poster:"/media/tangled-rapunzel-flynn-rider-2010/poster.jpg",question:"Trong tên phim “Tangled”, từ “tangled” gợi ý điều gì?",choices:["Bị rối, vướng vào nhau","Bay lên cao","Đã hoàn thành"],answer:0,term:"tangled",meaning:"rối, vướng",example:"My hair is tangled."},
  {title:"Big Hero 6 · MicroBots",poster:"/media/big-hero-6-microbots-2014/poster.jpg",question:"Tiền tố “micro-” trong “MicroBots” thường có nghĩa là gì?",choices:["Rất lớn","Rất nhỏ","Rất nhanh"],answer:1,term:"micro",meaning:"rất nhỏ",example:"A microscope helps us see tiny things."}
 ],
 market:[
  {name:"apple",emoji:"🍎",meaning:"quả táo"},
  {name:"book",emoji:"📘",meaning:"quyển sách"},
  {name:"umbrella",emoji:"☂️",meaning:"chiếc ô"},
  {name:"ticket",emoji:"🎟️",meaning:"vé"},
  {name:"camera",emoji:"📷",meaning:"máy ảnh"}
 ],
 travel:[
  {question:"Which sign means “lối ra”?",choices:["Entrance","Exit","Platform"],answer:1,term:"exit",meaning:"lối ra",example:"Where is the exit?"},
  {question:"Which word means “sân ga”?",choices:["Platform","Passport","Window"],answer:0,term:"platform",meaning:"sân ga",example:"The train leaves from platform 3."},
  {question:"“Boarding” means…",choices:["Lên máy bay / phương tiện","Đợi ở nhà","Mua hành lý"],answer:0,term:"boarding",meaning:"lên phương tiện",example:"Boarding starts at 8 a.m."}
 ]
};
const cafeRounds=[
 {speaker:"Emma",text:"Hi! Welcome to English Café. What would you like to drink?",choices:[
  {text:"I'd like a coffee, please.",ok:true,reply:"Of course! One coffee coming right up.",learn:"I’d like… = Tôi muốn…"},
  {text:"Could I have some tea, please?",ok:true,reply:"Certainly! I'll make you a cup of tea.",learn:"Could I have…? = Tôi có thể gọi…?"},
  {text:"Give me coffee now!",ok:false,reply:"That sounds a little demanding. Try making a polite request.",learn:"Dùng 'please' và cách yêu cầu lịch sự."}
 ]},
 {speaker:"Emma",text:"Would you like anything else?",choices:[
  {text:"No, thank you. That's all.",ok:true,reply:"No problem! I'll get your order ready.",learn:"That’s all. = Thế là đủ rồi."},
  {text:"Yes, a slice of cake, please.",ok:true,reply:"Great choice! One slice of cake too.",learn:"A slice of cake = Một lát bánh."},
  {text:"I'm from Hanoi.",ok:false,reply:"Nice to meet you! But I was asking about your order.",learn:"Anything else? = Có muốn thêm gì không?"}
 ]},
 {speaker:"Emma",text:"Is that for here or to go?",choices:[
  {text:"For here, please.",ok:true,reply:"Perfect. Have a seat and enjoy!",learn:"For here = Dùng tại quán."},
  {text:"To go, please.",ok:true,reply:"Sure! I'll pack it for you.",learn:"To go = Mang đi."},
  {text:"Yesterday morning.",ok:false,reply:"You can answer 'for here' or 'to go'.",learn:"For here or to go? = Dùng tại đây hay mang đi?"}
 ]}
];

/* Replay variety: three independent NPC storylines, with branching replies. */
const cafeScenarios=[cafeRounds,
 [
  {speaker:"Emma",text:"Are you looking for somewhere in our village?",choices:[
   {text:"Yes, where is the library?",ok:true,reply:"It's just past the big tree!",learn:"Where is…? = … ở đâu?"},
   {text:"Could you tell me the way to the station?",ok:true,reply:"Sure! Follow the path to the right.",learn:"Could you tell me the way…? = Bạn có thể chỉ đường…?"},
   {text:"I am yellow paper.",ok:false,reply:"Try asking me about a place you want to visit.",learn:"Hỏi đường với “Where is…?” hoặc “Could you tell me…?”"}
  ]},
  {speaker:"Emma",text:"Would you like me to show you the way?",choices:[
   {text:"Yes, please. That would be great!",ok:true,reply:"Happy to help. Let's look at the map!",learn:"That would be great! = Thế thì tốt quá!"},
   {text:"No, thanks. I can find it.",ok:true,reply:"All right! Enjoy exploring!",learn:"I can find it. = Tôi tự tìm được."},
   {text:"Tomorrow blue quickly.",ok:false,reply:"You can say yes or politely decline.",learn:"No, thanks = Không, cảm ơn."}
  ]},
  {speaker:"Emma",text:"Enjoy your adventure!",choices:[
   {text:"Thank you for your help!",ok:true,reply:"You're welcome. See you!",learn:"Thank you for your help! = Cảm ơn vì đã giúp đỡ."},
   {text:"See you later!",ok:true,reply:"See you soon, explorer!",learn:"See you later! = Hẹn gặp lại!"},
   {text:"The car is in pencil.",ok:false,reply:"Try thanking me or saying goodbye.",learn:"You're welcome = Không có gì."}
  ]}
 ],
 [
  {speaker:"Emma",text:"Hey, explorer! How is your day going?",choices:[
   {text:"It's going well, thanks!",ok:true,reply:"Glad to hear that!",learn:"It's going well. = Mọi chuyện đang diễn ra tốt đẹp."},
   {text:"Not bad! How about yours?",ok:true,reply:"Mine is going well, too. Thank you!",learn:"How about yours? = Còn bạn thì sao?"},
   {text:"I blue a banana.",ok:false,reply:"Try answering how you feel today.",learn:"How is your day going? = Hôm nay bạn thế nào?"}
  ]},
  {speaker:"Emma",text:"What do you enjoy doing after class?",choices:[
   {text:"I like reading books.",ok:true,reply:"That's lovely! I like books too.",learn:"I like reading books. = Tôi thích đọc sách."},
   {text:"I enjoy watching movies.",ok:true,reply:"Me too! Have you visited ALI Cinema?",learn:"I enjoy… = Tôi thích…"},
   {text:"I am at three oranges.",ok:false,reply:"Tell me about a hobby you enjoy.",learn:"What do you enjoy doing? = Bạn thích làm gì?"}
  ]},
  {speaker:"Emma",text:"Would you like to meet again tomorrow?",choices:[
   {text:"Yes, I'd love to!",ok:true,reply:"Wonderful. See you tomorrow!",learn:"I'd love to! = Rất sẵn lòng!"},
   {text:"Sorry, I can't tomorrow.",ok:true,reply:"No problem. See you another time!",learn:"Sorry, I can't… = Xin lỗi, tôi không thể…"},
   {text:"My school is spaghetti.",ok:false,reply:"You can accept or decline the invitation.",learn:"Would you like to…? = Bạn có muốn…?"}
  ]}
 ]
];

const blank=()=>({completed:[],history:{},learned:[],foundCat:false,gateOpened:false,visited:[]});
let data=blank(),storageAvailable=true;
try{const old=JSON.parse(localStorage.getItem(key)||"null");if(old&&typeof old==="object"){
 data.completed=Array.isArray(old.completed)?old.completed.filter(k=>core.includes(k)||["market","travel"].includes(k)):[];
 data.history=old.history&&typeof old.history==="object"?old.history:{};
 data.learned=Array.isArray(old.learned)?old.learned.filter(x=>x&&typeof x.term==="string"&&x.term.length<100).slice(0,80):[];
 data.foundCat=!!old.foundCat;data.gateOpened=!!old.gateOpened;
 data.visited=Array.isArray(old.visited)?old.visited.filter(x=>typeof x==="string"&&venues[x]).slice(-25):[];
}}catch(_){storageAvailable=false;}
function save(){try{localStorage.setItem(key,JSON.stringify(data));storageAvailable=true;}catch(_){storageAvailable=false;}}
function count(){return core.filter(k=>data.completed.includes(k)).length;}
function complete(id,terms=[]){
 if(!data.completed.includes(id))data.completed.push(id);
 data.history[id]=(Number(data.history[id])||0)+1;
 terms.forEach(t=>{if(t&&t.term&&!data.learned.some(x=>x.term===t.term)){data.learned.push({term:t.term,meaning:t.meaning||"",example:t.example||""});}});
 save();updateUI();avatar.classList.add("is-dancing");setTimeout(()=>avatar.classList.remove("is-dancing"),510);
}
function updateUI(){
 const n=count();
 $("quest-count").textContent=n+"/3";$("nav-stamps").textContent=n+"/3";$("world-progress-label").textContent=n+"/3 nhiệm vụ";
 $("quest-meter").style.width=(n/3*100)+"%";
 core.forEach(id=>{
  const done=data.completed.includes(id);
  const el=$("quest-"+id);el.textContent=(done?"✓ ":"")+({bookstore:"Bookstore",cafe:"Café",cinema:"Cinema"}[id]);
  el.closest("button").classList.toggle("completed",done);
  const stamp=document.querySelector('[data-stamp="'+id+'"]');if(stamp)stamp.hidden=!done;
 });
 $("gate-lock").textContent=n>=3?"✨":"🔒";
}
const state={position:{x:772,y:735},destination:"plaza",frame:null,travelDone:null,modalFocus:null,modalType:"",variant:null,dialogStep:0,bookOrder:[],cafeAnswers:[],marketTarget:null,travelVariant:null,academyScale:"CEFR",activeAnswer:-1,questionDone:false,scale:1,base:1,panX:0,panY:0,drag:null};
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function routePath(points){
 let d="M"+points[0].x+" "+points[0].y;
 for(let i=1;i<points.length;i++){
  const p=points[i];d+=" L"+p.x+" "+p.y;
 }return d;
}
function camera(focus=true){
 const w=root.clientWidth,h=root.clientHeight;
 if(!w||!h)return;
 const mobile=w<820;
 state.base=mobile?Math.max(.66,Math.min(.86,w/530)):Math.min(w/1400,h/940);
 if(!state.scale)state.scale=state.base;
 if(!state.userZoom)state.scale=state.base;
 const sw=1400*state.scale,sh=940*state.scale;
 if(mobile){
  const fx=focus?state.position.x*state.scale:w*.48-state.panX;
  const fy=focus?state.position.y*state.scale:h*.61-state.panY;
  if(focus){
   state.panX=w*.50-fx;
   state.panY=h*.62-fy;
  }
 }else{
  if(sw<=w)state.panX=(w-sw)/2;
  if(sh<=h)state.panY=(h-sh)/2;
 }
 const minX=Math.min(0,w-sw),maxX=Math.max(0,w-sw);
 const minY=Math.min(0,h-sh),maxY=Math.max(0,h-sh);
 state.panX=Math.min(maxX,Math.max(minX,state.panX));
 state.panY=Math.min(maxY,Math.max(minY,state.panY));
 stage.style.transform="translate3d("+state.panX.toFixed(1)+"px,"+state.panY.toFixed(1)+"px,0) scale("+state.scale.toFixed(4)+")";
}
function draw(x,y,walking){state.position={x,y};avatar.setAttribute("transform","translate("+x.toFixed(1)+" "+y.toFixed(1)+")");avatar.classList.toggle("is-walking",walking);camera(!state.drag);}
function animateTravel(place,onArrival){
 if(!venues[place])return;
 if(state.frame!=null)cancelAnimationFrame(state.frame);
 state.frame=null;state.travelDone=onArrival;state.destination=place;
 const start={...state.position};
 const points=[start];
 // Travel via town square whenever moving between distant areas.
 if(d2(start,{x:772,y:735})>80 && d2(venues[place],{x:772,y:735})>80)points.push({x:772,y:735});
 navigation[place].slice(1).forEach(([x,y])=>points.push({x,y}));
 const target=venues[place];
 if(d2(points[points.length-1],target)>1)points.push({x:target.x,y:target.y});
 const d=routePath(points);
 route.setAttribute("d",d);
 const length=Math.max(1,route.getTotalLength());
 route.style.strokeDasharray=length+" "+length;
 route.style.strokeDashoffset=String(length);
 const dist=d2(start,target);
 const duration=reduce.matches?0:Math.max(500,Math.min(2700,length*1.55+270));
 const finish=()=>{draw(target.x,target.y,false);route.style.strokeDashoffset="0";state.frame=null;const callback=state.travelDone;state.travelDone=null;if(callback)callback();};
 if(duration===0||dist<4){finish();return;}
 let t0=null;
 function step(t){
  if(t0===null)t0=t;
  const p=Math.min(1,(t-t0)/duration);
  const smooth=p*p*(3-2*p);
  const at=route.getPointAtLength(length*smooth);
  route.style.strokeDashoffset=String(length*(1-smooth));
  draw(at.x,at.y,p<1);
  if(p<1)state.frame=requestAnimationFrame(step);else finish();
 }
 state.frame=requestAnimationFrame(step);
}
function setCurrent(id){
 const v=venues[id];if(!v)return;
 $("current-icon").textContent=v.icon;
 $("current-title").textContent=v.name;
 $("current-description").textContent=v.desc;
 by(".place").forEach(el=>el.classList.toggle("active",el.dataset.place===id));
 $("world-help").textContent="🧭 ALI Explorer đang tới "+v.name+"…";
 if(!data.visited.includes(id))data.visited.push(id);data.visited=data.visited.slice(-25);save();
}
function visit(id,trigger){
 if(!venues[id])return;
 closeModal(false);
 state.modalFocus=trigger||document.activeElement;
 setCurrent(id);
 animateTravel(id,()=>{
  $("world-help").textContent="✨ Bạn đã đến "+venues[id].name+"!";
  showLocation(id);
 });
}
function setModal(title,subtitle,icon,kicker="ALI EXPLORER · MINI ADVENTURE"){
 $("modal-title").textContent=title;$("modal-subtitle").textContent=subtitle;$("modal-icon").textContent=icon;$("modal-kicker").textContent=kicker;
}
function showModal(){
 overlay.hidden=false;document.body.style.overflow="hidden";
 $("village-modal").focus({preventScroll:true});
}
function closeModal(restore=true){
 if(overlay.hidden)return;
 overlay.hidden=true;document.body.style.overflow="";
 if(restore&&state.modalFocus&&document.contains(state.modalFocus))state.modalFocus.focus({preventScroll:true});
}
function actions(items){
 return '<div class="dialog-actions">'+items.map(x=>x.url?'<a href="'+x.url+'" class="'+(x.primary?"primary":"")+'">'+x.label+'</a>':
  '<button type="button" class="'+(x.primary?"primary":"")+'" data-action="'+x.action+'"'+(x.target?' data-target="'+x.target+'"':'')+'>'+x.label+'</button>').join("")+'</div>';
}
function scene(icon,title,desc){
 return '<div class="dialog-scene"><span class="scene-emoji">'+icon+'</span><div><b>'+title+'</b><p>'+desc+'</p></div></div>';
}
function feedback(txt,good){const node=panel.querySelector("#activity-feedback");if(!node)return;node.textContent=txt;node.classList.toggle("success",!!good);node.hidden=false;}
function successText(label,next){
 return '<div class="dialog-scene"><span class="scene-emoji">🏅</span><div><b>'+label+'</b><p>Đã lưu dấu hoàn thành vào Explorer Passport. Bài học được bổ sung vào Nhật ký.</p></div></div>'+
 '<div class="dialog-note">Bạn đã hoàn thành '+count()+'/3 nhiệm vụ câu chuyện đầu tiên. Hãy chọn địa điểm tiếp theo hoặc khám phá tự do.</div>'+
 actions([{action:"go",target:next,label:"Tiếp tục hành trình →",primary:true},{action:"passport",label:"📔 Mở Passport"},{action:"journal",label:"📖 Xem từ vừa học"}]);
}
function nextVariant(id,bank){
 const n=Number(data.history[id])||0;return bank[n%bank.length];
}
function showLocation(id){
 state.modalType=id;state.activeAnswer=-1;state.questionDone=false;state.dialogStep=0;state.bookOrder=[];state.cafeAnswers=[];
 const v=venues[id];setModal(v.name,v.desc,v.icon);
 if(id==="plaza"){state.modalType="plaza";renderPlaza();}
 else if(id==="bookstore"){state.variant=nextVariant(id,vocabulary.bookstore);renderBookstore();}
 else if(id==="cafe")renderCafe();
 else if(id==="cinema"){state.variant=nextVariant(id,vocabulary.cinema);renderCinema();}
 else if(id==="market"){state.marketTarget=nextVariant(id,vocabulary.market);renderMarket();}
 else if(id==="travel"){state.travelVariant=nextVariant(id,vocabulary.travel);renderTravel();}
 else if(id==="academy")renderAcademy();
 else if(id==="community")renderCommunity();
 else if(id==="gate")renderGate();
 else if(id==="cat")renderCat();
 showModal();
}
function renderPlaza(){
 setModal("Welcome to ALI Village!","Meet ALI Explorer · Your journey begins here","🌳","WELCOME · DISCOVER THE WORLD");
 panel.innerHTML=scene("👋","Hello, explorer!","Một ngôi làng đầy những câu chuyện đang chờ bạn khám phá.")+
 '<p class="dialog-story">Bạn muốn bắt đầu tự do, hay tham gia câu chuyện <strong>“The Lost Travel Postcard”</strong> — tìm hiểu từ vựng, gọi đồ uống và khám phá phim song ngữ để nhận đủ ba dấu mở Cánh cổng Thế giới?</p>'+
 actions([{action:"story",label:"Theo câu chuyện 3 trạm ↗",primary:true},{action:"go",target:"bookstore",label:"Ghé ALI Bookstore"},{action:"close",label:"Khám phá tự do"}]);
}
function renderStory(){
 state.modalType="story";
 setModal("The Lost Travel Postcard","Một hành trình nhỏ qua ba địa điểm","✉️","STORY QUEST · 3 CHAPTERS");
 panel.innerHTML=scene("📮","Bạn nhận một tấm bưu thiếp chưa ghi đủ địa chỉ","Giúp ALI Explorer chuẩn bị hành trình: tìm từ vựng, nói chuyện tại Café rồi tìm manh mối trong Cinema.")+
 '<div class="passport-list">'+[
 ["📚","Chapter 1 · ALI Bookstore","Học một từ mới để hiểu điểm đến."],
 ["☕","Chapter 2 · English Café","Trò chuyện lịch sự để được giúp đỡ."],
 ["🎬","Chapter 3 · ALI Cinema","Hoàn thành thử thách phim và mở cánh cổng."]
 ].map(x=>'<div class="passport-item done"><span class="stamp">'+x[0]+'</span><div><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div></div>').join("")+'</div>'+
 actions([{action:"go",target:core.find(x=>!data.completed.includes(x))||"gate",label:"Bắt đầu / Tiếp tục câu chuyện →",primary:true},{action:"close",label:"Tôi muốn khám phá tự do"}]);
 showModal();
}
function renderBookstore(){
 const v=state.variant;
 setModal("ALI Bookstore","Mia · Bookstore Keeper","📚","CHAPTER 01 · KNOWLEDGE");
 const n=Number(data.history.bookstore)||0;
 const orderMode=n%2===1;
 if(state.questionDone){panel.innerHTML=successText("✦ Word Explorer unlocked!","cafe");return;}
 if(!orderMode){
 panel.innerHTML=scene("👩‍🏫","Mia: “Let's learn something new!”","Khám phá nghĩa của từ rồi dùng nó trong một câu.")+
 '<div class="dialog-note"><b>'+v.word+'</b> · '+v.ipa+'<br>'+v.sentence+'<br><button type="button" class="small-action" data-action="speak" data-target="'+v.word+'">🔊 Nghe phát âm</button></div>'+
 '<p class="dialog-question">'+v.question+'</p><div class="dialog-options" id="book-options">'+v.choices.map((x,i)=>'<button type="button" data-action="book-answer" data-index="'+i+'" class="choice"><span class="letter">'+String.fromCharCode(65+i)+'</span>'+x+'</button>').join("")+'</div>'+
 '<div class="dialog-feedback" id="activity-feedback" hidden></div>'+
 actions([{action:"replay",label:"↻ Đổi hoạt động lần sau"},{action:"close",label:"Quay lại bản đồ"}]);
 }else{
 const parts=["Could","I","have","a","coffee,","please?"];
 state.bookOrder=[];
 panel.innerHTML=scene("👩‍🏫","Mia: “Let's build a sentence!”","Chạm các từ theo đúng thứ tự để tạo một lời yêu cầu lịch sự.")+
 '<div class="dialog-note">Mục tiêu: <strong>“Tôi có thể gọi một ly cà phê được không?”</strong></div>'+
 '<p class="dialog-question">Arrange the words</p><div class="sentence-line" id="book-sentence">Tap words to build your sentence…</div>'+
 '<div class="word-chips">'+[2,0,4,1,5,3].map(i=>'<button type="button" data-action="book-word" data-word="'+i+'">'+parts[i]+'</button>').join("")+'</div>'+
 '<div class="dialog-feedback" id="activity-feedback" hidden></div>'+
 actions([{action:"book-reset",label:"↻ Bắt đầu lại"},{action:"close",label:"Quay lại bản đồ"}]);
 }
}
function bookAnswer(idx,button){
 const v=state.variant;if(state.questionDone)return;
 if(idx===v.answer){
  state.questionDone=true;
  complete("bookstore",[{term:v.word,meaning:v.meaning,example:v.sentence}]);
  renderBookstore();
 }else{button.classList.add("wrong");button.disabled=true;feedback("Mia: “Not quite! Look at the example and try another answer.”",false);}
}
function bookWord(idx,button){
 if(state.questionDone)return;
 state.bookOrder.push(idx);button.disabled=true;
 const parts=["Could","I","have","a","coffee,","please?"];
 const content=state.bookOrder.map(i=>parts[i]).join(" ");
 $("book-sentence").textContent=content;
 if(state.bookOrder.length===6){
  if(state.bookOrder.join(",")==="0,1,2,3,4,5"){
   state.questionDone=true;complete("bookstore",[{term:"Could I have…?",meaning:"Lời yêu cầu lịch sự",example:"Could I have a coffee, please?"}]);renderBookstore();
  }else feedback("Chưa đúng thứ tự. Bạn có thể bắt đầu lại để sắp xếp câu.",false);
 }
}
function renderCafe(){
 setModal("English Café","Emma · Your conversation partner","☕","CHAPTER 02 · CONFIDENCE");
 if(state.questionDone){panel.innerHTML=successText("✦ Conversation Starter unlocked!","cinema");return;}
 const round=cafeScenarios[(Number(data.history.cafe)||0)%cafeScenarios.length][state.dialogStep];
 if(!round){state.questionDone=true;complete("cafe",state.cafeAnswers);renderCafe();return;}
 panel.innerHTML=scene("👩🏻‍🍳",round.speaker+' says:',"Bạn đang nói chuyện tại quán cà phê. Chọn lời đáp để cuộc trò chuyện tiếp tục.")+
 '<div class="dialog-note"><strong>Emma:</strong> '+round.text+'</div>'+
 '<div class="dialog-progress"><span>Hội thoại '+(state.dialogStep+1)+'/3</span><span>Chọn một lời đáp</span></div>'+
 '<div class="dialog-options">'+round.choices.map((v,i)=>'<button type="button" data-action="cafe-answer" data-index="'+i+'" class="choice"><span class="letter">'+String.fromCharCode(65+i)+'</span>'+v.text+'</button>').join("")+'</div>'+
 '<div class="dialog-feedback" id="activity-feedback" hidden></div>'+
 actions([{action:"close",label:"Dừng hội thoại"}]);
}
function cafeAnswer(idx,button){
 const option=cafeScenarios[(Number(data.history.cafe)||0)%cafeScenarios.length][state.dialogStep].choices[idx];if(!option)return;
 if(!option.ok){button.classList.add("wrong");button.disabled=true;feedback('Emma: “'+option.reply+'” '+option.learn,false);return;}
 by(".dialog-options .choice").forEach(b=>b.disabled=true);button.classList.add("correct");
 state.cafeAnswers.push({term:option.text,meaning:option.learn,example:option.reply});
 feedback("Emma: “"+option.reply+"” · "+option.learn,true);
 const box=panel.querySelector(".dialog-actions");
 box.innerHTML='<button type="button" class="primary" data-action="cafe-next">'+(state.dialogStep===2?"Hoàn thành hội thoại ✓":"Tiếp tục hội thoại →")+'</button>';
}
function renderCinema(){
 const v=state.variant;
 setModal("ALI Cinema","A movie title challenge","🎬","CHAPTER 03 · STORIES");
 if(state.questionDone){panel.innerHTML=successText("✦ Cinema Explorer unlocked!","gate");return;}
 panel.innerHTML=scene("🍿","Welcome to ALI Cinema!","Mini-game dựa trên <b>tiêu đề</b> phim hiện có trong thư viện ALI, không giả định lời thoại trong video.")+
 '<div class="dialog-film"><img src="'+v.poster+'" alt="Poster của '+v.title+'"><div><b>'+v.title+'</b><p>Chọn nghĩa của một từ trong tiêu đề. Sau đó có thể chuyển đến thư viện phim song ngữ.</p></div></div>'+
 '<p class="dialog-question">'+v.question+'</p><div class="dialog-options">'+v.choices.map((c,i)=>'<button class="choice" type="button" data-action="cinema-answer" data-index="'+i+'"><span class="letter">'+String.fromCharCode(65+i)+'</span>'+c+'</button>').join("")+'</div>'+
 '<div class="dialog-feedback" id="activity-feedback" hidden></div>'+
 actions([{url:"/movies/",label:"Xem phim song ngữ ALI ↗"},{action:"close",label:"Quay lại bản đồ"}]);
}
function cinemaAnswer(idx,button){
 const v=state.variant;
 if(idx===v.answer){state.questionDone=true;complete("cinema",[{term:v.term,meaning:v.meaning,example:v.example}]);renderCinema();}
 else{button.classList.add("wrong");button.disabled=true;feedback("Hãy đọc lại tiêu đề và chọn đáp án khác nhé.",false);}
}
function renderMarket(){
 const v=state.marketTarget;
 setModal("Village Market","Find & Discover · Tìm đồ vật","🍎","BONUS QUEST · DISCOVERY");
 if(state.questionDone){panel.innerHTML=successText("✦ Market Finder complete!","travel");return;}
 const options=[{name:"apple",emoji:"🍎"},{name:"camera",emoji:"📷"},{name:"ticket",emoji:"🎟️"},{name:"umbrella",emoji:"☂️"},{name:"book",emoji:"📘"},{name:"cake",emoji:"🍰"},{name:"bag",emoji:"👜"},{name:"keys",emoji:"🔑"},{name:"hat",emoji:"🎩"}];
 panel.innerHTML=scene("🛍️","Can you find it?","Hãy tìm vật phẩm phù hợp với từ tiếng Anh trong chợ.")+
 '<p class="dialog-question">Find the “'+v.name+'”</p><div class="dialog-grid">'+options.map(x=>'<button class="item-button" type="button" data-action="market-item" data-item="'+x.name+'"><span>'+x.emoji+'</span>'+x.name+'</button>').join("")+'</div>'+
 '<div class="dialog-feedback" id="activity-feedback" hidden></div>'+
 actions([{action:"close",label:"Quay lại làng"}]);
}
function marketAnswer(item,button){
 const v=state.marketTarget;
 if(item===v.name){state.questionDone=true;complete("market",[{term:v.name,meaning:v.meaning,example:"I found a "+v.name+"!"}]);renderMarket();}
 else{button.disabled=true;feedback("Chưa phải đồ vật được yêu cầu. Hãy tìm lại nhé.",false);}
}
function renderTravel(){
 setModal("Travel Corner","Train & Airport English","🧳","BONUS QUEST · TRAVEL");
 const v=state.travelVariant;
 if(state.questionDone){panel.innerHTML=successText("✦ Travel Rookie unlocked!","academy");return;}
 panel.innerHTML=scene("🚉","Next stop: Global Station!","Đọc biển chỉ dẫn và chọn cách hiểu phù hợp.")+
 '<p class="dialog-question">'+v.question+'</p><div class="dialog-options">'+v.choices.map((t,i)=>'<button type="button" class="choice" data-action="travel-answer" data-index="'+i+'"><span class="letter">'+String.fromCharCode(65+i)+'</span>'+t+'</button>').join("")+'</div>'+
 '<div class="dialog-feedback" id="activity-feedback" hidden></div>'+
 actions([{action:"close",label:"Quay lại làng"}]);
}
function travelAnswer(i,button){
 const v=state.travelVariant;
 if(i===v.answer){state.questionDone=true;complete("travel",[{term:v.term,meaning:v.meaning,example:v.example}]);renderTravel();}
 else{button.classList.add("wrong");button.disabled=true;feedback("Hãy xem lại từ khóa trên biển chỉ dẫn.",false);}
}
function renderAcademy(){
 setModal("ALI Academy","Your level, your learning journey","🎓","EDUCATION · CEFR · IELTS · TOEIC");
 const names=["CEFR","IELTS","TOEIC L&R","TOEIC Speaking","TOEIC Writing"];
 const mode=state.academyScale;
 const selected='<div class="academy-pills">'+names.map(n=>'<button type="button" class="'+(mode===n?"active":"")+'" data-action="academy-scale" data-scale="'+n+'">'+n+'</button>').join("")+'</div>';
 let html=scene("🎓","Hi! You are at ALI Academy.","Trình độ thực tế cần được đánh giá bằng bài kiểm tra phù hợp; bản đồ chỉ giới thiệu các thang điểm.")+selected;
 if(mode==="CEFR"){
  html+='<p class="dialog-question">CEFR từ bắt đầu đến thành thạo</p><div class="word-chips">'+["Pre-A1","A1","A2","B1","B2","C1","C2"].map(n=>'<button type="button" data-action="academy-cefr" data-scale="'+n+'">'+n+'</button>').join("")+'</div><div class="scale-result" id="academy-result">Chọn một mốc để đọc mô tả tham khảo.</div>';
 }else{
  const ielts=mode==="IELTS",lr=mode==="TOEIC L&R",min=ielts?0:lr?10:0,max=ielts?9:lr?990:200,step=ielts?.5:lr?5:10,val=ielts?5:lr?450:100;
  html+='<div class="scale-result"><b id="academy-range-value">'+(ielts?val.toFixed(1):val)+'</b> · '+mode+'<input class="scale-range" type="range" id="academy-range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'" aria-label="Chọn điểm '+mode+'"><div class="dialog-progress"><span>'+min+'</span><span>'+max+'</span></div><small>Điểm bạn chọn chỉ để tìm hiểu thang đánh giá, không phải điểm bài test của bạn.</small></div>';
 }
 html+='<p class="dialog-small">Các thang điểm không được quy đổi tự động với nhau. Kết quả thực tế phụ thuộc vào từng bài thi và kỹ năng được đánh giá.</p>'+
 actions([{url:"/tests/",label:"Kiểm tra trình độ thật ↗",primary:true},{action:"close",label:"Quay về làng"}]);
 panel.innerHTML=html;
}
function renderCommunity(){
 setModal("Community House","The people behind ALI English","🏡","LIFE AT ALI · COMMUNITY");
 panel.innerHTML=scene("🤝","Learn together, grow together","Nơi giới thiệu hoạt động lớp học, giáo viên quốc tế, đội ngũ và các sự kiện cùng sinh viên.")+
 '<div class="dialog-note"><b>Góc triển khai nội dung thực tế:</b> Ảnh giảng viên – hoạt động tài trợ – hình ảnh học viên và nhân viên ALI. Đây mới là bố cục gợi ý, không giả mạo ảnh sự kiện.</div>'+
 actions([{url:"/",label:"Khám phá ALI English ↗",primary:true},{action:"go",target:"plaza",label:"Về quảng trường"}]);
}
function renderGate(){
 setModal("The World Gate","A new chapter begins","🌍","WORLD GATE · EXPLORER ADVENTURE");
 const n=count();
 if(n<3){
  panel.innerHTML='<div class="lock-state"><div class="lock-icon">🔒</div><h3>World Gate is waiting for you</h3><p>Hãy hoàn thành các nhiệm vụ tại <b>Bookstore, Café và Cinema</b> để thu thập đủ ba dấu và mở Cánh cổng Thế giới.</p></div>'+
  '<div class="dialog-progress"><span>Huy hiệu đầu tiên</span><span>'+n+'/3</span></div>'+
  actions([{action:"go",target:core.find(k=>!data.completed.includes(k)),label:"Đến nhiệm vụ tiếp theo →",primary:true},{action:"passport",label:"Mở Passport"}]);
 }else{
  data.gateOpened=true;save();
  panel.innerHTML='<div class="lock-state"><span class="confetti">🌍✨✈️</span><h3>WORLD GATE UNLOCKED!</h3><p>Knowledge, Confidence, Stories: bạn đã khám phá đủ ba chương đầu tiên. Cánh cổng mở ra những tình huống tiếng Anh quốc tế.</p></div>'+
  '<div class="dialog-note">Bản V8 mới giới thiệu cánh cổng và sự kiện mở khóa. Bản đồ quốc tế tiếp theo chưa được xây dựng, nên chưa có khu vực mới để bước vào.</div>'+
  actions([{action:"passport",label:"Xem thành tựu 📔",primary:true},{url:"/tests/",label:"Khám phá trình độ thật ↗"}]);
 }
}
function renderCat(){
 setModal("Village Secret","A surprise in the village","🐈","HIDDEN DISCOVERY");
 if(!data.foundCat){data.foundCat=true;data.learned.push({term:"hide and seek",meaning:"trò trốn tìm",example:"The cat is playing hide and seek."});save();}
 panel.innerHTML=scene("🐈","Meow! You found the village cat!","A secret discovery for curious explorers.")+
 '<div class="dialog-note"><b>Hide and seek</b> = Trò trốn tìm.<br>“The cat is hiding near the market.”</div>'+
 actions([{action:"journal",label:"Lưu vào Nhật ký ↗",primary:true},{action:"close",label:"Tiếp tục khám phá"}]);
}
function renderPassport(){
 state.modalType="passport";
 setModal("Explorer Passport","Hộ chiếu khám phá của bạn","📔","MY ALI EXPLORER PASSPORT");
 const badges=[
 ["bookstore","📚","Word Explorer","Knowledge"],
 ["cafe","☕","Conversation Starter","Confidence"],
 ["cinema","🎬","Cinema Explorer","Stories"],
 ["market","🍎","Market Finder","Bonus"],
 ["travel","🧳","Travel Rookie","Bonus"]
 ];
 panel.innerHTML=scene("🧳","Your English, Your Future","Đã nhận "+count()+"/3 dấu chương đầu và khám phá "+data.visited.length+" địa điểm.")+
 '<div class="passport-list">'+badges.map(([k,icon,name,tag])=>'<div class="passport-item '+(data.completed.includes(k)?"done":"")+'"><span class="stamp">'+icon+'</span><div><strong>'+name+'</strong><small>'+(data.completed.includes(k)?"✓ Đã hoàn thành · "+tag:"Chưa khám phá · "+tag)+'</small></div></div>').join("")+'</div>'+
 (data.foundCat?'<div class="dialog-note">🐈 Bạn còn tìm thấy chú mèo bí mật!</div>':'')+
 '<p class="dialog-small">'+(storageAvailable?"Dữ liệu lưu cục bộ trên thiết bị này, không đồng bộ tài khoản.":"Trình duyệt không lưu được dữ liệu, tiến trình chỉ tồn tại trong phiên.")+'</p>'+
 actions([{action:"journal",label:"📖 Nhật ký học tập",primary:true},{action:"story",label:"Trở lại câu chuyện"},{action:"reset-confirm",label:"Đặt lại demo"}]);
 showModal();
}
function renderJournal(){
 state.modalType="journal";
 setModal("Learning Journal","Nhật ký điều bạn đã thực sự học","📖","MY ENGLISH NOTES");
 const list=data.learned.slice().reverse();
 panel.innerHTML=scene("📝","Your little discoveries","Không chỉ huy hiệu — những từ và câu đã học cũng được lưu lại để bạn ôn tập.")+
 (list.length?'<div class="journal-list">'+list.map(item=>'<div class="journal-item"><strong>'+escapeHTML(item.term)+'</strong><small>'+escapeHTML(item.meaning||"")+'</small><small>'+escapeHTML(item.example||"")+'</small></div>').join("")+'</div>':
 '<p class="journal-empty">Chưa có kiến thức nào được lưu. Thử bắt đầu tại ALI Bookstore hoặc English Café nhé.</p>')+
 actions([{action:"go",target:"bookstore",label:"Học một từ mới ↗",primary:true},{action:"passport",label:"Xem Passport"}]);
 showModal();
}
function escapeHTML(t){return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function showGlobalModal(type){
 state.modalFocus=document.activeElement;
 if(type==="passport")renderPassport();
 else if(type==="journal")renderJournal();
 else if(type==="story"){renderStory();}
 else if(type==="reset-confirm"){
  state.modalType="reset-confirm";
  setModal("Đặt lại bản demo?","Hành động này chỉ xóa tiến trình trên thiết bị","🗑️","DEMO SETTINGS");
  panel.innerHTML='<p class="dialog-story">Xóa các dấu hoàn thành, nhật ký và lịch sử câu hỏi đã gặp trong bản demo V8 trên trình duyệt này?</p>'+
  actions([{action:"reset",label:"Xóa và bắt đầu lại",primary:true},{action:"passport",label:"Hủy"}]);
  showModal();
 }
}
function enterLocation(id){state.modalFocus=document.activeElement;visit(id,document.activeElement);}
by(".place").forEach(btn=>btn.addEventListener("click",()=>enterLocation(btn.dataset.place)));
by("[data-jump]").forEach(btn=>btn.addEventListener("click",()=>enterLocation(btn.dataset.jump)));
$("world-home").addEventListener("click",()=>enterLocation("plaza"));
$("hero-story").addEventListener("click",()=>{
 $("world").scrollIntoView({behavior:reduce.matches?"auto":"smooth",block:"start"});
 showGlobalModal("story");
});
$("story-button").addEventListener("click",()=>showGlobalModal("story"));
$("journal-button").addEventListener("click",()=>showGlobalModal("journal"));
$("nav-passport").addEventListener("click",()=>showGlobalModal("passport"));
$("modal-close").addEventListener("click",()=>closeModal());
$("overlay-backdrop").addEventListener("click",()=>closeModal());
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&!overlay.hidden){e.preventDefault();closeModal();}
 if(e.key==="Tab"&&!overlay.hidden){
  const items=by("#village-modal button:not([disabled]),#village-modal a[href],#village-modal input:not([disabled])").filter(x=>x.offsetParent!==null);
  if(!items.length)return;
  const first=items[0],last=items[items.length-1];
  if(!modal.contains(document.activeElement)||document.activeElement===modal){e.preventDefault();(e.shiftKey?last:first).focus();return;}
  if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}
  else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}
 }
});
panel.addEventListener("click",e=>{
 const btn=e.target.closest("button[data-action]");if(!btn)return;
 const action=btn.dataset.action;
 const id=Number(btn.dataset.index);
 if(action==="close"){closeModal();return;}
 if(action==="go"){const target=btn.dataset.target;closeModal(false);visit(target,state.modalFocus);return;}
 if(["passport","journal","story","reset-confirm"].includes(action)){showGlobalModal(action);return;}
 if(action==="reset"){data=blank();save();updateUI();showGlobalModal("passport");return;}
 if(action==="book-answer"){bookAnswer(id,btn);return;}
 if(action==="book-word"){bookWord(Number(btn.dataset.word),btn);return;}
 if(action==="book-reset"){renderBookstore();return;}
 if(action==="replay"){feedback("Mia: “You'll discover another word on your next completed visit.”",true);return;}
 if(action==="cafe-answer"){cafeAnswer(id,btn);return;}
 if(action==="cafe-next"){state.dialogStep++;renderCafe();return;}
 if(action==="cinema-answer"){cinemaAnswer(id,btn);return;}
 if(action==="market-item"){marketAnswer(btn.dataset.item,btn);return;}
 if(action==="travel-answer"){travelAnswer(id,btn);return;}
 if(action==="academy-scale"){state.academyScale=btn.dataset.scale;renderAcademy();return;}
 if(action==="academy-cefr"){
  const info={"Pre-A1":"Làm quen trước cấp A1.","A1":"Sử dụng các câu đơn giản trong tình huống quen thuộc.","A2":"Trao đổi về chủ đề hằng ngày.","B1":"Giao tiếp độc lập trong tình huống quen thuộc.","B2":"Hiểu và diễn đạt các ý tưởng tương đối phức tạp.","C1":"Sử dụng tiếng Anh linh hoạt trong công việc và học thuật.","C2":"Sử dụng ngôn ngữ ở mức rất thành thạo."};
  $("academy-result").textContent=btn.dataset.scale+" · "+info[btn.dataset.scale];return;
 }
 if(action==="speak"){
  if(!("speechSynthesis" in window)){feedback("Thiết bị của bạn chưa hỗ trợ phát âm bằng giọng nói.",false);return;}
  const u=new SpeechSynthesisUtterance(btn.dataset.target);u.lang="en-GB";u.rate=.82;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);return;
 }
});
panel.addEventListener("input",e=>{
 if(e.target.id==="academy-range"){
  const val=Number(e.target.value);
  $("academy-range-value").textContent=state.academyScale==="IELTS"?val.toFixed(1):String(val);
 }
});
const viewSize=()=>{state.userZoom=false;camera(true);};
window.addEventListener("resize",viewSize,{passive:true});
const pointer={down:false,x:0,y:0,x0:0,y0:0};
root.addEventListener("pointerdown",e=>{
 if(e.target.closest("button"))return;
 pointer.down=true;pointer.x=e.clientX;pointer.y=e.clientY;pointer.x0=state.panX;pointer.y0=state.panY;
 state.drag={active:true};
});
root.addEventListener("pointermove",e=>{
 if(!pointer.down)return;
 const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
 if(Math.abs(dx)<5&&Math.abs(dy)<5)return;
 if(e.pointerType==="touch"&&Math.abs(dy)>Math.abs(dx))return;
 const sw=1400*state.scale,sh=940*state.scale,w=root.clientWidth,h=root.clientHeight;
 state.panX=Math.min(Math.max(0,w-sw),Math.max(Math.min(0,w-sw),pointer.x0+dx));
 state.panY=Math.min(Math.max(0,h-sh),Math.max(Math.min(0,h-sh),pointer.y0+dy));
 camera(false);
});
function endDrag(){pointer.down=false;state.drag=null;}
root.addEventListener("pointerup",endDrag);root.addEventListener("pointercancel",endDrag);root.addEventListener("pointerleave",endDrag);
function zoom(n){
 state.userZoom=true;
 const w=root.clientWidth,h=root.clientHeight;
 const old=state.scale||state.base;
 state.scale=Math.max(state.base*.85,Math.min(state.base*1.6,old*n));
 if(w>=820&&state.scale===state.base){state.panX=0;state.panY=0;}
 camera(true);
}
$("zoom-in").addEventListener("click",()=>zoom(1.16));
$("zoom-out").addEventListener("click",()=>zoom(1/1.16));
const observer=("IntersectionObserver" in window)?new IntersectionObserver(entries=>{
 entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target);}});
},{threshold:.1}):null;
by(".feature-grid article").forEach(node=>observer?observer.observe(node):node.classList.add("visible"));
// Start at the central plaza, not an auto-playing game or forced overlay.
updateUI();
requestAnimationFrame(()=>{state.scale=0;camera(true);draw(772,735,false);});
})();
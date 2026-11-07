/* Shared exam shell for B1, TOEIC, IELTS, Speaking. Preserve original questions and graders. */
(() => {
 'use strict';
 const name = location.pathname.split('/').pop().replace(/\.html$/,'');
 const config = {
  b1:{title:'B1 Placement',minutes:50,sections:['Grammar & Vocabulary','Reading','Writing','Listening'],scores:['Tự chấm /15','Giáo viên chấm','Giáo viên chấm','Chưa tự chấm'],kind:'practice'},
  toeic:{title:'TOEIC Practice',minutes:30,sections:['Grammar & Vocabulary','Listening'],scores:['Tự chấm /15','Chưa có audio'],kind:'practice'},
  ielts:{title:'IELTS Practice',minutes:50,sections:['Listening','Reading','Writing'],scores:['Tự chấm /20','Tự chấm /13','Giáo viên chấm'],kind:'practice'},
  speaking:{title:'Speaking A1–B2',minutes:18,sections:['Introduction','Long Turn','Discussion','Situational Task','Phiếu chấm giáo viên'],scores:['Giáo viên đánh giá','Giáo viên đánh giá','Giáo viên đánh giá','Giáo viên đánh giá','Rubric /25'],kind:'teacher'}
 }[name];
 if(!config)return;
 const $=id=>document.getElementById(id);
 const regKey='ALI_TEST_REGISTRATION';
 function profile(){try{return JSON.parse(sessionStorage.getItem(regKey)||'null')}catch{return null}}
 function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
 function boot(){
  const main=document.querySelector('main.ali-exam-page');
  if(!main)return;
  const user=profile();
  if(!user || !user.name?.trim() || user.consent!==true){location.replace('./tests.html');return}
  document.body.classList.add('ali-shell-ready');
  const heading=main.querySelector(':scope > h1');
  const intro=main.querySelector(':scope > p');
  if(!heading)return;
  const allSections=[...main.querySelectorAll(':scope > section')].filter(s=>s.id!=='aliUnifiedResult');
  const result=main.querySelector('#aliUnifiedResult');
  const submit=main.querySelector('#grade,#calc');
  if(!allSections.length)return;
  const hero=el('div','ali-shell-hero');
  const titleArea=el('div','ali-shell-hero-title');
  titleArea.append(el('div','ali-shell-eyebrow','ALI ACADEMY / PLACEMENT TEST'));
  titleArea.append(heading);
  if(intro){intro.classList.add('ali-shell-description');titleArea.append(intro)}
  const clock=el('div','ali-shell-clock');
  clock.setAttribute('role','timer');
  const clockLabel=el('small','',name==='speaking'?'THỜI GIAN THAM KHẢO':'THỜI GIAN LUYỆN TẬP');
  const clockValue=el('strong','ali-shell-timer');
  clock.append(clockLabel,clockValue);hero.append(titleArea,clock);
  const grid=el('div','ali-shell-grid');
  const primary=el('div','ali-shell-primary');
  const tabs=el('nav','ali-shell-tabs');tabs.setAttribute('aria-label','Chọn phần bài kiểm tra');tabs.setAttribute('role','tablist');
  const pane=el('div','ali-shell-pane');
  const sidebar=el('aside','ali-shell-aside');
  const summary=el('div','ali-shell-summary');summary.append(el('h3','', 'Thông tin bài thi'));
  const candidate=el('div','ali-shell-user');
  const avatar=el('div','ali-shell-avatar',(user.name.trim().charAt(0)||'A').toUpperCase());
  const candidateDetails=el('div');candidateDetails.append(el('strong','',user.name));candidateDetails.append(el('small','',user.school||config.title));candidate.append(avatar,candidateDetails);summary.append(candidate);
  const counters=el('div','ali-shell-counters');
  config.sections.forEach((label,i)=>{
    const row=el('div','ali-shell-score-row');
    row.append(el('span','',label),el('strong','',config.scores[i]||'Chưa chấm'));
    counters.append(row);
  });
  summary.append(counters);
  const note=el('div','ali-shell-note');
  const noteBold=el('b','',name==='speaking'?'Lưu ý: ':'Gợi ý: ');
  note.append(noteBold,document.createTextNode(name==='speaking'
   ? 'Đây là phiếu hướng dẫn và đánh giá của giáo viên, không phải bài tự chấm phát âm. Thời gian chỉ mang tính tham khảo.'
   : 'Di chuyển giữa các phần bằng thanh tab. Bài được lưu tạm trên thiết bị. Chỉ các phần có đáp án xác minh mới được tự chấm.'));
  summary.append(note);sidebar.append(summary);
  const progress=el('div','ali-flow-bar');
  progress.setAttribute('aria-label','Tiến độ bài thi');
  progress.innerHTML='<div class="ali-flow-top"><span class="ali-flow-eyebrow">TIẾN ĐỘ HOÀN THÀNH</span><strong class="ali-flow-count" aria-live="polite"></strong></div><div class="ali-flow-track" role="progressbar" aria-label="Tiến độ trả lời" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><p class="ali-flow-help">Đáp án được lưu tạm trong phiên trình duyệt; kết quả luyện tập chưa tự động gửi về ALI.</p>';
  primary.append(progress,tabs,pane);
  const actions=el('div','ali-shell-actions');
  const prev=el('button','ali-shell-prev','← Phần trước');
  const next=el('button','ali-shell-next','Phần tiếp theo →');
  prev.type='button';next.type='button';
  const actionsRight=el('div','ali-shell-actions-right');
  if(submit){
    submit.classList.add('ali-shell-submit');
    submit.textContent=name==='speaking'?'Hoàn thành đánh giá →':'Nộp bài & xem kết quả →';
    actionsRight.append(submit);
  }
  actions.append(prev,next,actionsRight);primary.append(actions);
  const resultsWrap=el('div','ali-shell-results');
  if(result){resultsWrap.append(result);primary.append(resultsWrap)}
  grid.append(primary,sidebar);
  main.prepend(hero,grid);
  let active=0,submitted=false;
  const sectionFields=s=>[...s.querySelectorAll('input[type=radio],input[type=text],textarea')].filter(f=>!f.disabled);
  const fields=()=>allSections.flatMap(sectionFields);
  function counts(){
    const inputs=fields(),groups=new Map(),other=[];
    for(const f of inputs){
      if(f.type==='radio'){if(!groups.has(f.name))groups.set(f.name,false);if(f.checked)groups.set(f.name,true)}
      else other.push(f);
    }
    return {done:[...groups.values()].filter(Boolean).length+other.filter(f=>f.value.trim().length>0).length,total:groups.size+other.length};
  }
  const draftKey='ALI_TEST_DRAFT_'+name;
  function serialize(){
    const data={};
    fields().forEach((f,i)=>{
      if(f.type==='radio'){if(f.checked)data['radio:'+f.name]=f.value}
      else data['field:'+(f.id||i)]=f.value;
    });
    return data;
  }
  try{
    const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');
    if(saved?.owner===user.name && saved.values){
      fields().forEach((f,i)=>{
        if(f.type==='radio')f.checked=saved.values['radio:'+f.name]===f.value;
        else if(Object.prototype.hasOwnProperty.call(saved.values,'field:'+(f.id||i)))f.value=saved.values['field:'+(f.id||i)];
      });
    }
  }catch{}
  function progressUpdate(){
    const {done,total}=counts();
    progress.querySelector('.ali-flow-count').textContent=name==='speaking'?'ĐÁNH GIÁ CÙNG GIÁO VIÊN':done+' / '+total+' câu tự trả lời';
    const percent=total?Math.round(done/total*100):0;
    const track=progress.querySelector('.ali-flow-track');
    track.setAttribute('aria-valuenow',String(percent));track.querySelector('span').style.width=percent+'%';
    if(!submitted){try{sessionStorage.setItem(draftKey,JSON.stringify({owner:user.name,values:serialize()}))}catch{}}
    return {done,total};
  }
  allSections.forEach((section,i)=>{
    section.classList.add('ali-shell-part');
    section.id='ali-shell-part-'+i;
    section.setAttribute('role','tabpanel');
    section.setAttribute('aria-labelledby','ali-shell-tab-'+i);
    const h2=section.querySelector('h2');
    if(h2){const marker=el('span','ali-flow-section-num','PART '+String(i+1).padStart(2,'0'));h2.before(marker)}
    pane.append(section);
    const tab=el('button','ali-shell-tab',String(i+1).padStart(2,'0')+' · '+config.sections[i] || 'Phần '+(i+1));
    tab.type='button';tab.id='ali-shell-tab-'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',section.id);
    tab.addEventListener('click',()=>activate(i));tabs.append(tab);
  });
  function activate(i){
    active=Math.max(0,Math.min(allSections.length-1,i));
    allSections.forEach((section,k)=>{const show=k===active;section.classList.toggle('ali-part-active',show);section.hidden=!show;section.setAttribute('aria-hidden',String(!show))});
    [...tabs.children].forEach((tab,k)=>{tab.setAttribute('aria-selected',String(k===active));tab.tabIndex=k===active?0:-1});
    prev.disabled=active===0;next.disabled=active===allSections.length-1;
    if(!submitted)progressUpdate();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  prev.addEventListener('click',()=>activate(active-1));next.addEventListener('click',()=>activate(active+1));
  tabs.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();activate(active+(event.key==='ArrowRight'?1:-1));tabs.children[active].focus();
  });
  const isTeacher=name==='speaking';
  let remaining=config.minutes*60;
  const timeKey='ALI_TEST_START_'+name;
  try{
    const stored=JSON.parse(sessionStorage.getItem(timeKey)||'null');
    const startTime=stored?.owner===user.name && typeof stored.started==='number'?stored.started:Date.now();
    if(!stored||stored.owner!==user.name)sessionStorage.setItem(timeKey,JSON.stringify({owner:user.name,started:startTime}));
    const updateClock=()=>{
      if(submitted)return;
      remaining=Math.max(0,config.minutes*60-Math.floor((Date.now()-startTime)/1000));
      clockValue.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
      clock.classList.toggle('ali-clock-low',remaining<=300);
      if(remaining===0){clockLabel.textContent='HẾT THỜI GIAN THAM KHẢO';window.clearInterval(timer)}
    };
    updateClock();
    var timer=window.setInterval(updateClock,1000);
  }catch{clockValue.textContent=config.minutes+':00'}
  if(isTeacher){
    progress.querySelector('.ali-flow-help').textContent='Bài Speaking cần giáo viên trực tiếp đánh giá và nhập điểm; không tự động chấm kỹ năng nói.';
  }
  main.addEventListener('input',progressUpdate);main.addEventListener('change',progressUpdate);
  if(submit){
    submit.addEventListener('click',event=>{
      if(submitted)return;
      const {done,total}=progressUpdate();
      const msg=isTeacher
        ? 'Xác nhận kết thúc phiếu đánh giá Speaking của giáo viên?'
        : (total>done?'Bạn còn '+(total-done)+' mục chưa trả lời. ':'')+'Nộp bài để xem kết quả những phần có thể tự chấm? Các kỹ năng chưa có dữ liệu chấm sẽ được ghi rõ.';
      if(!window.confirm(msg)){event.preventDefault();event.stopImmediatePropagation();return}
      submitted=true;
      submit.disabled=true;submit.textContent='Đã nộp bài';
      window.clearInterval(timer);
      try{sessionStorage.removeItem(draftKey);sessionStorage.removeItem(timeKey)}catch{}
      actions.querySelectorAll('.ali-shell-prev,.ali-shell-next').forEach(x=>x.disabled=true);
      allSections.forEach(s=>s.querySelectorAll('input,textarea,select').forEach(x=>x.disabled=true));
      if(result){result.hidden=false;result.classList.remove('ali-hidden')}
      requestAnimationFrame(()=>result?.scrollIntoView({behavior:'smooth',block:'start'}));
    },true);
  }
  activate(0);progressUpdate();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
 else boot();
})();

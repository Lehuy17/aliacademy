/* ALI English — common placement-test experience for practice pages */
(() => {
  'use strict';
  const key = 'ALI_TEST_REGISTRATION';
  const page = location.pathname.split('/').pop().replace('.html','');
  const names = {b1:'B1 Placement',toeic:'TOEIC Practice',ielts:'IELTS Practice',speaking:'Speaking A1–B2'};
  const name = names[page];
  if (!name) return;
  function registration() {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
  }
  function start() {
    const main = document.querySelector('main.ali-exam-page');
    if (!main) return;
    const profile = registration();
    // Direct links may be shared: redirect to the central registration/selection flow.
    if (!profile || typeof profile.name !== 'string' || !profile.name.trim() || profile.consent !== true) {
      location.replace('./tests.html');
      return;
    }
    const firstSection = main.querySelector('section');
    const bar = document.createElement('div');
    bar.className = 'ali-flow-bar';
    bar.setAttribute('aria-label','Tiến độ bài kiểm tra');
    bar.innerHTML = '<div class="ali-flow-top"><div><span class="ali-flow-eyebrow">BƯỚC 3 / 3 · ĐANG LÀM BÀI</span><strong class="ali-flow-name"></strong><small class="ali-flow-type"></small></div><div class="ali-flow-count" aria-live="polite"></div></div><div class="ali-flow-track" role="progressbar" aria-label="Tiến độ trả lời" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><p class="ali-flow-help">Câu trả lời được lưu tạm trong phiên trình duyệt này. Kết quả luyện tập không tự động gửi về ALI.</p>';
    bar.querySelector('.ali-flow-name').textContent = profile.name;
    bar.querySelector('.ali-flow-type').textContent = name;
    main.insertBefore(bar, firstSection);
    const sections = [...main.querySelectorAll('section')].filter(s => !s.id || s.id !== 'aliUnifiedResult');
    sections.forEach((section,i)=>{
      const title = section.querySelector('h2');
      if (!title) return;
      const chip = document.createElement('span');
      chip.className = 'ali-flow-section-num';
      chip.textContent = 'PHẦN '+(i+1);
      section.insertBefore(chip,title);
    });
    const fields = () => [...main.querySelectorAll('input[type="radio"],input[type="text"],textarea')].filter(x=>!x.disabled);
    const snapshot = () => {
      const values = {};
      fields().forEach((x,i)=>{
        if (x.type === 'radio') { if(x.checked) values['radio:'+x.name]=x.value; }
        else values['field:'+ (x.id || i)]=x.value;
      });
      return values;
    };
    const draftKey='ALI_TEST_DRAFT_'+page;
    try {
      const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');
      if(saved && saved.owner===profile.name && saved.values) {
        fields().forEach((x,i)=>{
          if(x.type==='radio')x.checked=saved.values['radio:'+x.name]===x.value;
          else if(Object.hasOwn(saved.values,'field:'+(x.id||i)))x.value=saved.values['field:'+(x.id||i)];
        });
      }
    } catch {}
    let finished=false;
    function update(){
      const items = fields();
      const radios = new Map();
      const nonRadio = [];
      for(const field of items) {
        if(field.type==='radio') {
          if(!radios.has(field.name))radios.set(field.name,false);
          if(field.checked)radios.set(field.name,true);
        } else nonRadio.push(field);
      }
      const total=radios.size+nonRadio.length;
      const done=[...radios.values()].filter(Boolean).length+nonRadio.filter(x=>x.value.trim()!=='').length;
      const percent=total?Math.round(done/total*100):0;
      bar.querySelector('.ali-flow-count').textContent=total?done+'/'+total+' mục đã trả lời':'Đánh giá cùng giáo viên';
      const track=bar.querySelector('.ali-flow-track');
      track.setAttribute('aria-valuenow',String(percent));
      track.querySelector('span').style.width=percent+'%';
      if(!finished) {
        try { sessionStorage.setItem(draftKey,JSON.stringify({owner:profile.name,values:snapshot()})); } catch {}
      }
      return {total,done};
    }
    main.addEventListener('input',update);
    main.addEventListener('change',update);
    const submit=main.querySelector('#grade, #calc');
    if(submit){
      submit.textContent=page==='speaking'?'Hoàn thành đánh giá Speaking →':'Nộp bài & xem kết quả →';
      submit.addEventListener('click',event=>{
        if(finished)return;
        const {total,done}=update();
        const message=total && done<total
          ? 'Bạn còn '+(total-done)+' mục chưa trả lời. Những phần tự luận vẫn cần giáo viên chấm. Bạn muốn xem kết quả phần có thể tự chấm?'
          : 'Bạn muốn nộp bài và xem kết quả hiện có? Các phần chưa được chấm sẽ được ghi rõ.';
        if(!window.confirm(message)){event.preventDefault();event.stopImmediatePropagation();return;}
        finished=true;
        submit.disabled=true;
        submit.textContent='Đã nộp bài';
        try { sessionStorage.removeItem(draftKey); } catch {}
      },true);
    }
    const footer=document.createElement('nav');
    footer.className='ali-flow-footer';
    footer.setAttribute('aria-label','Điều hướng bài kiểm tra');
    const back=document.createElement('a');
    back.href='./tests.html?step=choose';
    back.textContent='← Danh sách bài test';
    const top=document.createElement('button');
    top.type='button';top.textContent='↑ Lên đầu trang';top.className='ali-flow-top-button';
    top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    footer.append(back,top);
    main.append(footer);
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();

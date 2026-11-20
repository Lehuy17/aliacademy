/* ALI Academy — student-facing, source-keyed answer review.
   Use only verified automatically scored questions. No login required. */
(function(global){
 'use strict';
 const mk=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node;};
 const clean=v=>String(v??'').trim();
 function render(container,report){
  if(!container||!report)return;
  container.querySelectorAll('.ali-review-panel').forEach(node=>node.remove());
  const rows=Array.isArray(report.items)?report.items.filter(x=>x&&typeof x.correct==='boolean'):[];
  const box=mk('section','ali-review-panel');box.setAttribute('aria-label','Báo cáo trình độ và chữa bài chi tiết');
  if(report.level){
   const intro=mk('div','ali-review-level');
   intro.append(mk('span','ali-review-kicker','TRÌNH ĐỘ THAM KHẢO · ALI ENGLISH'));
   intro.append(mk('h3','',report.level.title||'Cần đánh giá bổ sung'));
   if(report.level.detail)intro.append(mk('p','',report.level.detail));
   box.append(intro);
  }
  if(rows.length){
   const right=rows.filter(r=>r.correct).length, wrong=rows.length-right,unanswered=rows.filter(r=>!clean(r.answer)).length;
   const heading=mk('div','ali-review-head');
   heading.append(mk('h3','','Chữa bài chi tiết theo từng câu'));
   heading.append(mk('p','',right+'/'+rows.length+' đúng · '+wrong+' sai hoặc chưa trả lời'+(unanswered?' · '+unanswered+' bỏ trống':'')));
   box.append(heading);
   const weak=[...new Set(rows.filter(r=>!r.correct).map(r=>clean(r.topic)).filter(Boolean))].slice(0,6);
   if(weak.length)box.append(mk('p','ali-review-focus','Chủ điểm nên ôn tập: '+weak.join(' · ')+'.'));
   const filters=mk('div','ali-review-filters');
   let mode='wrong',section='all';
   const cardList=mk('div','ali-review-list');
   const sections=[...new Set(rows.map(r=>clean(r.section)||'Khác'))];
   const select=mk('select','ali-review-select');select.setAttribute('aria-label','Chọn kỹ năng cần chữa');
   const all=mk('option','','Tất cả kỹ năng');all.value='all';select.append(all);
   for(const sect of sections){const option=mk('option','',sect);option.value=sect;select.append(option);}
   select.addEventListener('change',()=>{section=select.value;paint()});
   filters.append(select);
   const buttons=mk('div','ali-review-buttons');
   for(const [id,label] of [['wrong','Sai / bỏ trống'],['all','Tất cả'],['right','Đúng']]){
    const button=mk('button','ali-review-filter',label);
    button.type='button';button.dataset.mode=id;button.setAttribute('aria-pressed',String(id===mode));
    button.addEventListener('click',()=>{mode=id;buttons.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));paint();});
    buttons.append(button);
   }
   filters.append(buttons);box.append(filters,cardList);
   function info(item,label,value,cls){
    const p=mk('p',cls||'ali-review-info');
    p.append(mk('strong','',label+' '),mk('span','',clean(value)||'Chưa trả lời'));item.append(p);
   }
   function paint(){
    cardList.replaceChildren();
    const filtered=rows.filter(r=>(section==='all'||(clean(r.section)||'Khác')===section)&&(mode==='all'||(mode==='right'?r.correct:!r.correct)));
    for(const r of filtered){
     const article=mk('article','ali-review-item '+(r.correct?'ali-review-correct':'ali-review-wrong'));
     const title=mk('div','ali-review-item-head');
     title.append(mk('strong','',clean(r.section||'Bài thi')+' · Câu '+clean(r.number||'')));
     title.append(mk('span','ali-review-status',r.correct?'✓ Đúng':clean(r.answer)?'✕ Sai':'○ Bỏ trống'));
     article.append(title);
     if(r.question)article.append(mk('p','ali-review-question',r.question));
     info(article,'Bạn chọn:',r.answer);
     info(article,'Đáp án:',r.expected||'Đối chiếu theo đáp án ALI');
     if(r.topic)info(article,'Chủ điểm:',r.topic,'ali-review-topic');
     if(r.explanation)article.append(mk('p','ali-review-explanation','Giải thích: '+r.explanation));
     cardList.append(article);
    }
    if(!filtered.length)cardList.append(mk('p','ali-review-empty','Không có câu nào phù hợp với bộ lọc.'));
   }
   paint();
  }
  if(report.note)box.append(mk('p','ali-review-disclaimer',report.note));
  container.append(box);
 }
 global.ALIReview={render};
})(window);

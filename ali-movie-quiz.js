/* ALI-CINEMA-QUIZ-01 — five questions under each movie, independent of playback. */
const host=document.getElementById('aliMovieQuiz');
const typeLabels={vocabulary:'Từ vựng · Vocabulary',grammar:'Ngữ pháp · Grammar',comprehension:'Nội dung phim · Comprehension'};
let catalogPromise=null,requestSequence=0;
const el=(tag,klass,text)=>{const x=document.createElement(tag);if(klass)x.className=klass;if(text!==undefined)x.textContent=text;return x;};
function loadCatalog(){
 if(!catalogPromise)catalogPromise=fetch('./ali-movie-quizzes.json?v=1',{cache:'no-store'})
   .then(res=>{if(!res.ok)throw Error('Không tải được dữ liệu câu hỏi');return res.json();})
   .then(data=>data&&typeof data.quizzes==='object'?data.quizzes:{})
   .catch(err=>{console.warn('ALI quiz catalog unavailable',err);return {};});
 return catalogPromise;
}
const dictionary=[
 ['help','giúp đỡ'],['trust','tin tưởng'],['secret','bí mật'],['family','gia đình'],
 ['friend','bạn bè'],['dangerous','nguy hiểm'],['problem','vấn đề'],['promise','lời hứa'],
 ['school','trường học'],['work','làm việc'],['sorry','xin lỗi'],['future','tương lai'],
 ['today','hôm nay'],['tomorrow','ngày mai'],['important','quan trọng'],
 ['remember','nhớ'],['forget','quên'],['protect','bảo vệ'],['fight','chiến đấu'],
 ['ready','sẵn sàng'],['alone','một mình'],['together','cùng nhau'],
 ['happy','vui vẻ'],['afraid','sợ hãi'],['believe','tin rằng'],['money','tiền'],
 ['home','nhà'],['change','thay đổi'],['understand','hiểu'],['question','câu hỏi'],
 ['decision','quyết định'],['chance','cơ hội'],['answer','câu trả lời'],
 ['strong','mạnh mẽ'],['leave','rời đi'],['wait','chờ đợi'],['lost','bị mất'],
 ['save','cứu'],['thank','cảm ơn'],['need','cần'],['want','muốn']
];
function chooseOptions(correct,others,index){
 const unique=[correct,...others.filter(x=>x!==correct)];
 for(const extra of ['Quên lời thoại','Tìm hiểu','Chờ đợi','Giải thích'])if(unique.length<4&&!unique.includes(extra))unique.push(extra);
 const offset=index%4;
 const choices=unique.slice(0,4);
 return {options:[...choices.slice(offset),...choices.slice(0,offset)],answer:(4-offset)%4};
}
function autoQuiz(cues){
 const lines=(Array.isArray(cues)?cues:[])
  .map(x=>typeof x.en==='string'?x.en.trim():'')
  .filter(x=>x.length>=8 && x.length<=190);
 if(lines.length<3)return [];
 const full=lines.join(' ').toLowerCase();
 const found=dictionary.filter(([w])=>new RegExp('\\b'+w+'\\b','i').test(full)).slice(0,2);
 const output=[];
 for(let i=0;i<2;i++){
  if(found[i]){
   const [word,meaning]=found[i];
   const distractors=['bảo vệ','gia đình','thay đổi','nguy hiểm','tương lai','nghỉ ngơi','bí mật','thành công'].filter(x=>x!==meaning).slice(i,i+3);
   const v=chooseOptions(meaning,distractors,i+1);
   output.push({type:'vocabulary',question:'Từ “'+word+'” xuất hiện trong lời thoại có nghĩa là gì?',...v,explanation:'“'+word+'” có nghĩa là “'+meaning+'”.'});
  }else{
   const sentence=lines[i]||lines[0];
   const tokens=sentence.match(/[A-Za-z]{4,}/g)||[];
   const word=tokens[Math.floor(tokens.length/2)]||'English';
   const v=chooseOptions(word,['Garden','Winter','Painting','Laptop'],i+1);
   output.push({type:'vocabulary',question:'Từ nào xuất hiện trong câu lời thoại: “'+sentence.slice(0,90)+'”?',...v,explanation:'Từ “'+word+'” xuất hiện nguyên văn trong câu được trích.'});
  }
 }
 const patterns=[/\\bI (am)\\b/i,/\\b(?:he|she|it) (is)\\b/i,/\\b(?:we|they|you) (are)\\b/i,/\\bI (was)\\b/i,/\\b(?:he|she|it) (was)\\b/i,/\\b(?:we|they|you) (were)\\b/i];
 let syntax=null;
 for(const line of lines){for(const re of patterns){const m=re.exec(line);if(m){syntax={line,verb:m[1],index:m.index+m[0].lastIndexOf(m[1])};break;}}if(syntax)break;}
 if(syntax){
  const blank=syntax.line.slice(0,syntax.index)+'___'+syntax.line.slice(syntax.index+syntax.verb.length);
  const choices=['am','is','are','was','were'].filter(x=>x!==syntax.verb.toLowerCase()).slice(0,3);
  const opts=chooseOptions(syntax.verb.toLowerCase(),choices,2);
  output.push({type:'grammar',question:'Điền từ đúng theo lời thoại: “'+blank.slice(0,110)+'”',...opts,explanation:'Lời thoại gốc sử dụng “'+syntax.verb+'”.'});
 }else{
  output.push({type:'grammar',question:'Chọn câu tiếng Anh đúng ngữ pháp.',options:['She are ready.','She is ready.','She am ready.','She be ready.'],answer:1,explanation:'Chủ ngữ She đi với is ở hiện tại đơn.'});
 }
 const stable=lines.filter(x=>x.length>=16&&x.length<=100);
 const sampled=[stable[Math.floor(stable.length*.25)]||lines[0],stable[Math.floor(stable.length*.75)]||lines[lines.length-1]];
 sampled.forEach((source,i)=>{
  const distractors=['We are sailing to the moon.','The train leaves from Paris tomorrow.','The blue elephant is teaching science.','There is a bakery on the mountain.'];
  const opts=chooseOptions(source,distractors.slice(i,i+3),i+1);
  output.push({type:'comprehension',question:'Câu nào thực sự được nói trong đoạn phim?',...opts,explanation:'Trong phụ đề của phim có câu: “'+source+'”.'});
 });
 return output;
}
function isValid(data){
 return Array.isArray(data)&&data.length===5&&data.every(q=>
  q&&typeLabels[q.type]&&typeof q.question==='string'&&Array.isArray(q.options)&&q.options.length===4&&
  Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&typeof q.explanation==='string');
}
function render(movie,questions,autoGenerated){
 if(!host)return;
 let idx=0,score=0,chosen=-1;
 function renderQuestion(){
  host.replaceChildren();
  const wrap=el('div','ali-quiz-card');
  const top=el('div','ali-quiz-top');
  top.append(el('span','ali-quiz-kicker','ALI MOVIE QUIZ'),el('span','ali-quiz-count','Câu '+(idx+1)+' / '+questions.length));
  const bar=el('div','ali-quiz-track');const fill=el('div','ali-quiz-fill');fill.style.width=((idx+1)/questions.length*100)+'%';bar.append(fill);
  wrap.append(top,el('h3','ali-quiz-heading','Luyện tập sau khi xem phim'),bar,
   el('p','ali-quiz-type',typeLabels[questions[idx].type]),
   el('h4','ali-quiz-question',questions[idx].question));
  const options=el('div','ali-quiz-options');
  const feedback=el('div','ali-quiz-feedback');
  const action=el('button','ali-quiz-action','Câu tiếp theo →');action.type='button';action.hidden=true;
  questions[idx].options.forEach((s,k)=>{
   const b=el('button','ali-quiz-option',String.fromCharCode(65+k)+'.  '+s);
   b.type='button';
   b.addEventListener('click',()=>{
    if(chosen!==-1)return;
    chosen=k;
    if(k===questions[idx].answer)score++;
    for(const [n,node] of [...options.children].entries()){
     node.disabled=true;
     if(n===questions[idx].answer)node.classList.add('is-correct');
     if(n===k&&k!==questions[idx].answer)node.classList.add('is-incorrect');
    }
    feedback.classList.add('is-visible');
    const correct=k===questions[idx].answer;
    feedback.replaceChildren(el('strong','',correct?'Chính xác!':'Đáp án đúng: '+String.fromCharCode(65+questions[idx].answer)),el('p','',questions[idx].explanation));
    action.textContent=idx===questions.length-1?'Xem kết quả →':'Câu tiếp theo →';
    action.hidden=false;
   });
   options.append(b);
  });
  action.addEventListener('click',()=>{idx++;chosen=-1;if(idx>=questions.length)renderResult();else renderQuestion();});
  wrap.append(options,feedback,action);
  if(autoGenerated)wrap.append(el('p','ali-quiz-auto-note','Bài tập nhận diện tự động từ phụ đề, cần giáo viên ALI kiểm duyệt.'));
  host.append(wrap);
 }
 function renderResult(){
  host.replaceChildren();
  const wrap=el('div','ali-quiz-card ali-quiz-result');
  wrap.append(el('span','ali-quiz-kicker','ALI MOVIE QUIZ · HOÀN THÀNH'),
   el('h3','ali-quiz-heading','Kết quả luyện tập'),
   el('div','ali-quiz-score',score+' / '+questions.length),
   el('p','',`Bạn trả lời đúng ${score} câu trên ${questions.length} câu (${Math.round(score/questions.length*100)}%).`));
  const redo=el('button','ali-quiz-action','↻ Làm lại 5 câu hỏi');
  redo.type='button';
  redo.addEventListener('click',()=>{idx=0;score=0;chosen=-1;renderQuestion();});
  wrap.append(redo);
  if(autoGenerated)wrap.append(el('p','ali-quiz-auto-note','Bài tập được tạo tự động từ phụ đề, chưa được kiểm duyệt bởi giáo viên.'));
  host.append(wrap);
 }
 renderQuestion();
}
export async function showMovieQuiz(movie,cues){
 if(!host||!movie)return;
 const request=++requestSequence;
 host.replaceChildren(el('div','ali-quiz-loading','Đang chuẩn bị 5 câu hỏi luyện tập cho phim…'));
 const catalog=await loadCatalog();
 if(request!==requestSequence)return;
 const curated=catalog[movie.id];
 const fallback=autoQuiz(cues);
 if(isValid(curated))render(movie,curated,false);
 else if(isValid(fallback))render(movie,fallback,true);
 else host.replaceChildren(el('div','ali-quiz-loading','Phụ đề chưa đủ để tạo câu hỏi. ALI sẽ bổ sung nội dung sau.'));
}
export function clearMovieQuiz(){
 requestSequence++;
 if(host)host.replaceChildren();
}

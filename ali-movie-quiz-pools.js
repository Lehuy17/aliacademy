/* ALI movie quiz backup bank builder v2.
   Builds three distinct five-question sets from the *selected film's own*
   bilingual cues; labels generated content for teacher review. */
const meanings=[
 ['help','giúp đỡ'],['trust','tin tưởng'],['secret','bí mật'],['family','gia đình'],
 ['friend','bạn bè'],['dangerous','nguy hiểm'],['problem','vấn đề'],['promise','lời hứa'],
 ['school','trường học'],['work','làm việc'],['sorry','xin lỗi'],['future','tương lai'],
 ['today','hôm nay'],['tomorrow','ngày mai'],['important','quan trọng'],
 ['remember','nhớ'],['forget','quên'],['protect','bảo vệ'],['fight','chiến đấu'],
 ['ready','sẵn sàng'],['alone','một mình'],['together','cùng nhau'],
 ['happy','vui vẻ'],['afraid','sợ hãi'],['believe','tin tưởng'],['money','tiền'],
 ['home','nhà'],['change','thay đổi'],['understand','hiểu'],['question','câu hỏi'],
 ['decision','quyết định'],['chance','cơ hội'],['answer','câu trả lời'],
 ['strong','mạnh mẽ'],['leave','rời đi'],['wait','chờ đợi'],['lost','bị mất'],
 ['save','cứu'],['thank','cảm ơn'],['need','cần'],['want','muốn'],
 ['challenge','thử thách'],['defeat','đánh bại'],['battle','trận chiến'],
 ['peace','hòa bình'],['believes','tin tưởng'],['dream','giấc mơ'],
 ['dreams','những giấc mơ'],['oath','lời thề'],['guardian','người bảo hộ'],
 ['fear','nỗi sợ'],['children','trẻ em'],['team','đội nhóm'],
 ['together','cùng nhau'],['protecting','đang bảo vệ'],['strength','sức mạnh'],
 ['defeated','đã đánh bại'],['fight','chiến đấu'],['weapon','vũ khí'],
 ['power','sức mạnh'],['stronger','mạnh hơn'],['truth','sự thật'],
 ['confident','tự tin'],['nervous','lo lắng'],['opportunity','cơ hội'],
 ['interview','buổi phỏng vấn'],['interviewer','người phỏng vấn'],
 ['salary','lương'],['contract','hợp đồng'],['offer','lời đề nghị'],
 ['position','vị trí công việc'],['company','công ty'],['manager','quản lý'],
 ['business','kinh doanh'],['meeting','cuộc họp'],['resume','sơ yếu lý lịch'],
 ['job','công việc'],['office','văn phòng'],['apply','nộp đơn'],
 ['applied','đã ứng tuyển'],['professional','chuyên nghiệp'],
 ['country','đất nước'],['president','tổng thống'],['queen','nữ hoàng'],
 ['minister','bộ trưởng'],['political','thuộc chính trị'],['government','chính phủ'],
 ['loyalty','lòng trung thành'],['loyal','trung thành'],['election','cuộc bầu cử'],
 ['public','công chúng'],['secret','bí mật'],['power','quyền lực'],
 ['protect','bảo vệ'],['truth','sự thật'],['evidence','bằng chứng'],
 ['witness','nhân chứng'],['court','tòa án'],['judge','thẩm phán'],
 ['poison','chất độc'],['medical','thuộc y tế'],['doctor','bác sĩ'],
 ['death','cái chết'],['patient','bệnh nhân'],['report','bản báo cáo'],
 ['concerned','lo ngại'],['serious','nghiêm trọng'],['hospital','bệnh viện'],
 ['toxic','độc hại'],['symptoms','triệu chứng'],['heart','trái tim'],
 ['running','đang chạy'],['road','con đường'],['travel','du lịch'],
 ['journey','chuyến hành trình'],['trip','chuyến đi'],['flight','chuyến bay'],
 ['restroom','nhà vệ sinh'],['lavatory','nhà vệ sinh'],['purse','túi xách'],
 ['bag','cái túi'],['family','gia đình'],['daughter','con gái'],
 ['son','con trai'],['father','bố'],['mother','mẹ'],
 ['wedding','đám cưới'],['married','đã kết hôn'],['marry','kết hôn'],
 ['love','tình yêu'],['loved','đã yêu'],['relationship','mối quan hệ'],
 ['feelings','cảm xúc'],['honest','thành thật'],['honesty','sự trung thực'],
 ['honor','danh dự'],['respect','sự tôn trọng'],['respectful','lễ phép'],
 ['beautiful','đẹp'],['angry','tức giận'],['confused','bối rối'],
 ['hungry','đói'],['food','đồ ăn'],['music','âm nhạc'],
 ['dance','nhảy múa'],['song','bài hát'],['playing','đang chơi'],
 ['positive','tích cực'],['energy','năng lượng'],['evil','độc ác'],
 ['monster','quái vật'],['monsters','các quái vật'],['smile','nụ cười'],
 ['world','thế giới'],['island','hòn đảo'],['islands','các hòn đảo'],
 ['destroy','phá hủy'],['destruction','sự phá hủy'],['delete','xóa'],
 ['deleted','đã bị xóa'],['phone','điện thoại'],['message','tin nhắn'],
 ['text','tin nhắn'],['computer','máy tính'],['software','phần mềm'],
 ['machine','máy móc'],['technology','công nghệ'],['control','kiểm soát'],
 ['remember','ghi nhớ'],['memories','những ký ức'],['lost','đã mất'],
 ['mind','tâm trí'],['heart','trái tim'],['brave','dũng cảm'],
 ['bravery','lòng dũng cảm'],['smart','thông minh'],['clever','lanh lợi'],
 ['hero','anh hùng'],['heroes','các anh hùng'],['villain','kẻ phản diện'],
 ['safe','an toàn'],['safety','sự an toàn'],['danger','mối nguy hiểm'],
 ['escape','trốn thoát'],['attack','tấn công'],['protect','bảo vệ'],
 ['explain','giải thích'],['explanation','lời giải thích'],
 ['belong','thuộc về'],['forgive','tha thứ'],['forgiveness','sự tha thứ'],
 ['mistake','lỗi sai'],['accident','tai nạn'],['happened','đã xảy ra'],
 ['happen','xảy ra'],['happening','đang xảy ra'],
 ['suddenly','đột nhiên'],['finally','cuối cùng'],['always','luôn luôn'],
 ['never','không bao giờ'],['usually','thường xuyên'],
 ['maybe','có lẽ'],['probably','có lẽ'],['exactly','chính xác'],
 ['really','thực sự'],['seriously','nghiêm túc'],
 ['possible','có thể xảy ra'],['impossible','không thể'],
 ['completely','hoàn toàn'],['certainly','chắc chắn'],
 ['actually','thực ra'],['instead','thay vào đó'],
 ['luck','may mắn'],['lucky','may mắn'],['success','thành công'],
 ['successful','thành công'],['failure','thất bại'],['believe','tin tưởng'],
 ['practice','luyện tập'],['training','đào tạo'],['lesson','bài học'],
 ['learn','học'],['learned','đã học'],['teach','dạy'],
 ['teacher','giáo viên'],['student','học sinh'],
 ['students','các học sinh'],['class','lớp học'],
 ['classroom','phòng học'],['homework','bài tập về nhà'],
 ['journal','nhật ký'],['book','cuốn sách'],
 ['letter','bức thư'],['send','gửi'],['sent','đã gửi'],
 ['receive','nhận'],['received','đã nhận'],
 ['bring','mang đến'],['brought','đã mang đến'],
 ['follow','đi theo'],['following','đang đi theo'],
 ['found','đã tìm thấy'],['finding','đang tìm kiếm'],
 ['choose','lựa chọn'],['choice','lựa chọn'],
 ['decide','quyết định'],['decided','đã quyết định'],
 ['plan','kế hoạch'],['planning','đang lên kế hoạch'],
 ['finish','hoàn thành'],['finished','đã hoàn thành'],
 ['start','bắt đầu'],['started','đã bắt đầu'],
 ['stopped','đã dừng lại'],['continue','tiếp tục'],
 ['return','trở lại'],['back','trở lại'],
 ['leave','rời đi'],['left','đã rời đi'],
 ['arrive','đến nơi'],['arrived','đã đến'],
 ['listen','lắng nghe'],['hear','nghe thấy'],
 ['heard','đã nghe thấy'],['watch','xem'],['watching','đang xem'],
 ['look','nhìn'],['looking','đang nhìn'],
 ['speak','nói'],['talk','nói chuyện'],
 ['talking','đang nói chuyện'],['tell','kể'],['telling','đang kể'],
 ['understood','đã hiểu'],['understanding','sự thấu hiểu']
];
const badLanguage=/\b(?:fuck|fucking|fucked|shit|shitty|asshole|bitch|nigg[aer]|dick|penis|crap|piss|pee|sodomiz|suicide|kill yourself)\b/i;
const normalized=text=>String(text||'').replace(/\s+/g,' ').trim();
const safeCue=c=>c&&typeof c.en==='string'&&typeof c.vi==='string'
 &&normalized(c.en).length>=17&&normalized(c.en).length<=135
 &&normalized(c.vi).length>=9&&normalized(c.vi).length<=170
 &&/[a-z]{3}/i.test(c.en)&&!badLanguage.test(c.en);
function rotateChoices(correct,others,shift){
 const unique=[correct,...others.filter(x=>x!==correct)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4);
 if(unique.length!==4)return null;
 const offset=(shift%4+4)%4;
 const options=[...unique.slice(offset),...unique.slice(0,offset)];
 return {options,answer:options.indexOf(correct)};
}
function spread(items,count){
 if(items.length<=count)return items.slice();
 return Array.from({length:count},(_,i)=>items[Math.floor((i+.5)*items.length/count)]);
}
function grammarCandidate(pair){
 const line=normalized(pair.en);
 const match=/\b(I|he|she|it|we|they|you)\s+(am|is|are|was|were|have|has|had|do|does|did|can|could|will|would|should|must|don't|doesn't|didn't|can't|won't)\b/i.exec(line)
   ||/\b(there)\s+(is|are|was|were)\b/i.exec(line);
 if(!match)return null;
 const verb=match[2].toLowerCase();
 const family=({
  am:['am','is','are','be'],is:['is','am','are','be'],are:['are','is','am','be'],
  was:['was','were','is','are'],were:['were','was','is','are'],
  have:['have','has','had','having'],has:['has','have','had','having'],
  had:['had','have','has','having'],
  do:['do','does','did','doing'],does:['does','do','did','doing'],
  did:['did','do','does','doing'],
  can:['can','could','should','must'],could:['could','can','would','should'],
  will:['will','would','can','should'],would:['would','will','could','can'],
  should:['should','could','can','would'],must:['must','should','can','could'],
  "don't":["don't","doesn't","didn't","can't"],
  "doesn't":["doesn't","don't","didn't","can't"],
  "didn't":["didn't","don't","doesn't","can't"],
  "can't":["can't","couldn't","don't","won't"],
  "won't":["won't","can't","don't","wouldn't"]
 })[verb];
 if(!family)return null;
 const start=match.index+match[0].lastIndexOf(match[2]);
 const question='Theo cấu trúc lời thoại, điền từ phù hợp: “'+line.slice(0,start)+'___'+line.slice(start+match[2].length)+'”';
 return {type:'grammar',question,correct:verb,others:family.slice(1).filter(x=>x!==verb).concat(family.filter(x=>x!==verb)).slice(0,3),
  explanation:'Trong lời thoại gốc, người nói sử dụng “'+match[0]+'”. Hãy chú ý chủ ngữ, trợ động từ và bối cảnh của câu.'};
}
function vocabularyCandidates(pairs){
 const found=new Map();
 const wordBank=meanings.filter(([word],i)=>meanings.findIndex(v=>v[0]===word)===i);
 for(let pi=0;pi<pairs.length;pi++){
  const line=pairs[pi].en;
  for(const [word,meaning] of wordBank){
   if(found.has(word))continue;
   if(new RegExp('\\b'+word+'\\b','i').test(line)){
    const others=[...new Set(wordBank.map(x=>x[1]))].filter(x=>x!==meaning);
    const start=(pi*3+word.length)%Math.max(1,others.length-3);
    const distractors=others.slice(start,start+3);
    found.set(word,{type:'vocabulary',question:'Trong đoạn phim, từ “'+word+'” có nghĩa là gì?',
      correct:meaning,others:distractors,explanation:'“'+word+'” có nghĩa là “'+meaning+'” trong ngữ cảnh tiếng Anh thông dụng.'});
   }
  }
 }
 return [...found.values()];
}
function vocabClozeCandidates(pairs){
 const pool=[];const used=new Set();
 const tokens=pairs.flatMap(x=>(x.en.match(/\b[a-z]{5,13}\b/gi)||[]).map(x=>x.toLowerCase()));
 const words=[...new Set(tokens)].filter(x=>!['their','there','where','these','those','about','would','should','could','which','because','before','after','being','going','thing','things','really'].includes(x));
 for(const pair of pairs){
  const source=normalized(pair.en);
  const terms=source.match(/\b[a-z]{5,13}\b/gi)||[];
  const chosen=terms.find(x=>!used.has(x.toLowerCase())&&words.length>=5);
  if(!chosen)continue;
  used.add(chosen.toLowerCase());
  const idx=source.toLowerCase().indexOf(chosen.toLowerCase());
  if(idx<0)continue;
  const question='Điền từ vựng đúng như câu thoại trong phim: “'+source.slice(0,idx)+'___'+source.slice(idx+chosen.length)+'”';
  const other=words.filter(x=>x!==chosen.toLowerCase()&&!source.toLowerCase().includes(x));
  if(other.length<3)continue;
  const offset=(pool.length*7)%Math.max(1,other.length-3);
  pool.push({type:'vocabulary',question,correct:chosen,others:other.slice(offset,offset+3),
    explanation:'Lời thoại sử dụng từ “'+chosen+'”: “'+source+'”.'});
 }
 return pool;
}
function comprehensionCandidates(pairs){
 const strong=pairs.filter(x=>x.en.length>=28&&x.vi.length>=15);
 const list=strong.length>=8?strong:pairs;
 const out=[];
 for(let i=0;i<list.length;i++){
  const pair=list[i];
  const choices=[];
  for(let j=1;j<list.length&&choices.length<3;j++){
   const neighbor=list[(i+j)%list.length];
   if(neighbor===pair)continue;
   const o=normalized(neighbor.en);
   if(o!==pair.en&&!choices.includes(o)&&o.length>=18)choices.push(o);
  }
  if(choices.length<3)continue;
  out.push({type:'comprehension',
   question:'Câu tiếng Anh nào tương ứng với phụ đề: “'+pair.vi+'”?',
   correct:pair.en,others:choices,
   explanation:'Trong phim, câu thoại “'+pair.en+'” được ghép với phụ đề “'+pair.vi+'”.'});
 }
 return out;
}
function toQuestion(proto,shift){
 const opts=rotateChoices(proto.correct,proto.others,shift);
 return opts?{type:proto.type,question:proto.question,options:opts.options,answer:opts.answer,explanation:proto.explanation}:null;
}
export function buildBackupSets(cues,count=3){
 const seen=new Set();
 const pairs=(Array.isArray(cues)?cues:[]).filter(safeCue).map(x=>({en:normalized(x.en),vi:normalized(x.vi)}))
  .filter(x=>{const key=x.en.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
 if(pairs.length<9)return [];
 const vocab=vocabularyCandidates(pairs);
 const clozes=vocabClozeCandidates(pairs);
 const vocabPool=[...vocab,...clozes.filter(x=>!vocab.some(v=>v.question===x.question))];
 const grammar=pairs.map(grammarCandidate).filter(Boolean);
 // Prefer grammar items grounded in actual lines over generic textbook fillers.
 if(grammar.length<count){
  const prepositions=['to','with','for','from','in','on','at','by'];
  for(const pair of pairs){
   if(grammar.length>=count)break;
   const line=normalized(pair.en);
   const match=/\b(to|with|for|from|in|on|at|by)\b/i.exec(line);
   if(!match)continue;
   const prep=match[1].toLowerCase();
   const blank=line.slice(0,match.index)+'___'+line.slice(match.index+match[0].length);
   const question='Chọn giới từ được sử dụng trong câu thoại: “'+blank+'”';
   if(grammar.some(q=>q.question===question))continue;
   grammar.push({type:'grammar',question,correct:prep,
    others:prepositions.filter(x=>x!==prep).slice(0,3),
    explanation:'Trong lời thoại gốc, từ được dùng là “'+prep+'”: “'+line+'”.'});
  }
 }
 if(grammar.length<3){
  const additions=[
   {type:'grammar',question:'Chọn dạng đúng: “She ___ ready.”',correct:'is',others:['am','are','be'],explanation:'He/She/It đi với is ở hiện tại đơn.'},
   {type:'grammar',question:'Chọn dạng đúng: “They ___ ready.”',correct:'are',others:['is','am','be'],explanation:'We/You/They đi với are ở hiện tại đơn.'},
   {type:'grammar',question:'Chọn dạng quá khứ: “Yesterday, I ___ home.”',correct:'went',others:['go','goes','going'],explanation:'Yesterday là dấu hiệu quá khứ, nên dùng went.'}
  ];
  for(const g of additions)if(grammar.length<count)grammar.push(g);
 }
 const comprehension=comprehensionCandidates(pairs);
 if(vocabPool.length<count*2||grammar.length<count||comprehension.length<count*2)return [];
 const vs=spread(vocabPool,count*2);
 const gs=spread(grammar,count);
 const cs=spread(comprehension,count*2);
 const packs=[];
 for(let i=0;i<count;i++){
  const templates=[vs[i*2],vs[i*2+1],gs[i],cs[i*2],cs[i*2+1]];
  const items=templates.map((x,j)=>toQuestion(x,i*3+j));
  if(items.some(x=>!x))return [];
  packs.push(items);
 }
 return packs;
}

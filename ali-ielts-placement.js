(function bootIELTS(source){
 'use strict';
 const $=id=>document.getElementById(id);
 const escapeHTML=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const q=(n,id,placeholder)=>'<span class="ali-ielts-q"><b>'+n+'</b><input type="text" id="'+id+'" aria-label="Câu '+n+'" placeholder="'+(placeholder||'Điền đáp án')+'" autocomplete="off" spellcheck="false"></span>';
 const letterSelect=(id,choices)=>'<select id="'+id+'" aria-label="Câu '+(Number(id.replace(/\D/g,''))+1)+'"><option value="">Chọn đáp án</option>'+choices.map(c=>'<option value="'+c+'">'+c+'</option>').join('')+'</select>';
 const listenRows=[
  ['Vietnamese food',q(1,'listen0'),'£59','It provides information on the use of herbs.<br>There are no places at present.'],
  ['Bread making','20 March','£ '+q(2,'listen1'),'There is also an extra charge for ingredients.<br>Participants make white bread, sourdough and '+q(3,'listen2')+'.'],
  ['Face massage','23 February','£35','The teacher trained in '+q(4,'listen3')+'.<br>Bring a '+q(5,'listen4')+'.'],
  ['Candle making',q(6,'listen5'),'£52','Only '+q(7,'listen6')+' ingredients are used.<br>The candles can be used as presents.'],
  ['Silk painting','18 May','£ '+q(8,'listen7'),'Bring an apron or old '+q(9,'listen8')+'.'],
  ['DIY for beginners','24 February','£125','Learn how to:<br>• use a drill, saw and '+q(10,'listen9')+'.<br>• put up a shelf.']
 ];
 const t='<div class="ali-ielts-scroll"><table class="ali-ielts-table"><thead><tr><th>Course</th><th>Date</th><th>Cost</th><th>Notes</th></tr></thead><tbody>'+
   listenRows.map(r=>'<tr><th>'+r[0]+'</th>'+r.slice(1).map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 const options=(arr)=>'<ol class="ali-ielts-options" type="A">'+arr.map(s=>'<li>'+escapeHTML(s.replace(/^[A-E]\s+/,''))+'</li>').join('')+'</ol>';
 const pair=(first,second)=>'<div class="ali-ielts-answer-row"><label>Câu '+first+' '+letterSelect('listen'+(first-1),['A','B','C','D','E'])+'</label><label>Câu '+second+' '+letterSelect('listen'+(second-1),['A','B','C','D','E'])+'</label></div>';
 const features=['Exhibition','Baths','Tools','Vehicles','Ponies','Education centre'];
 $('listen').innerHTML=
  '<div class="ali-ielts-block"><h3>PART 1 · Questions 1–10</h3><p>Complete the table below. <strong>Write ONE WORD AND/OR A NUMBER</strong> for each answer.</p><h4>One-day classes at Steynford College</h4>'+t+'</div>'+
  '<div class="ali-ielts-block"><h3>PART 2 · Questions 11–14</h3><p><strong>Questions 11 and 12.</strong> Choose TWO letters, A–E.</p><p>Which TWO pieces of advice are given about the Marsden Coastal Walk?</p>'+options(source.marsden)+pair(11,12)+
  '<p><strong>Questions 13 and 14.</strong> Choose TWO letters, A–E.</p><p>Which TWO things are said about the Melby Heritage Walk?</p>'+options(source.melby)+pair(13,14)+'</div>'+
  '<div class="ali-ielts-block"><h3>PART 2 · Questions 15–20</h3><p>Label the map below. Write the correct letter, A–I, next to Questions 15–20.</p><h4>Melby Coal Mine</h4><img class="ali-ielts-map-img" src="./ielts-melby-map.svg" alt="Sơ đồ Melby Coal Mine với các vị trí A đến I và lối đi có mái che" loading="lazy">'+
  '<div class="ali-ielts-map-answers">'+features.map((name,i)=>'<div class="ali-ielts-map-answer"><label for="listen'+(i+14)+'">Câu '+(i+15)+' · '+name+'</label>'+letterSelect('listen'+(i+14),['A','B','C','D','E','F','G','H','I'])+'</div>').join('')+'</div></div>';
 const passageText=source.passage.map((s,i)=>'<p'+(i===0?' style="font-weight:bold"':'')+'>'+escapeHTML(s)+'</p>').join('');
 const headingNotes=new Set(['Family and early life','The sisters as art collectors','Impact of First World War','Opinions about the sisters as art collectors']);
 const noteText=source.notes.map(s=>{
   if(headingNotes.has(s))return '<h4>'+escapeHTML(s)+'</h4>';
   const clean=s.replace(/^•\s*/,'');
   const match=clean.match(/([1-7])\.{4,}/);
   if(!match)return '<p>• '+escapeHTML(clean)+'</p>';
   const split=clean.split(match[0]);
   const id=Number(match[1])-1;
   return '<p>• '+escapeHTML(split[0])+q(match[1],'read'+id,'ONE WORD ONLY')+escapeHTML(split.slice(1).join(match[0]))+'</p>';
 }).join('');
 const tf=source.statements.map((s,i)=>'<label><b>'+(i+8)+'</b><span>'+escapeHTML(s)+'</span><select id="read'+(i+7)+'" aria-label="Reading câu '+(i+8)+'"><option value="">Chọn</option><option value="TRUE">TRUE</option><option value="FALSE">FALSE</option><option value="NOT GIVEN">NOT GIVEN</option></select></label>').join('');
 $('read').innerHTML='<div class="ali-ielts-block"><h3>Reading Passage 1 · The Davies Sisters</h3><p>Thời gian tham khảo: <strong>20 phút</strong> cho Questions 1–13.</p><div class="ali-ielts-passage">'+passageText+'</div></div>'+
  '<div class="ali-ielts-block"><h3>Questions 1–7 · Note Completion</h3><p>Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p><div class="ali-ielts-notes"><h4>Gwendoline and Margaret Davies</h4>'+noteText+'</div></div>'+
  '<div class="ali-ielts-block"><h3>Questions 8–13 · TRUE / FALSE / NOT GIVEN</h3><p>TRUE if the statement agrees with the text; FALSE if it contradicts the text; NOT GIVEN if the passage does not contain the information.</p><div class="ali-ielts-tfn">'+tf+'</div></div>';
 const answersL=[
  ['(the) 13(th) (of) January','13 January','13th January','the 13th January','the 13th of January','the 13 of January','13.01','13.1'],
  ['48','forty-eight'],['pizza'],['India'],['mirror'],
  ['(the) 6(th) (of) April','6 April','6th April','the 6th April','the 6th of April','the 6 of April','06.04','6.4'],
  ['natural'],['67.50','sixty-seven fifty'],['shirt'],['hammer']
 ];
 const answerMap=['F','B','D','A','H','E'];
 const answersR=['mining','education','notes','journals','Venice','canteen','friends','TRUE','NOT GIVEN','FALSE','NOT GIVEN','TRUE','TRUE'];
 const normal=s=>String(s||'').trim().toLowerCase().replace(/[\u2010-\u2015-]/g,' ').replace(/[^a-z0-9. ]+/g,'').replace(/\s+/g,' ');
 answersL[0].push('13th of january');answersL[5].push('6th of april');
 $('writingPrompt').textContent=source.writing.join(' ');
 const words=()=>($('writing').value.match(/\b[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*\b/gu)||[]).length;
 $('writing').addEventListener('input',()=>$('aliIeltsWords').textContent=words()+' từ');
 const tableRows=[
  ['Foundation / Pre-IELTS','0–5','0–3','0–29','Củng cố ngữ pháp, từ vựng, phát âm và 4 kỹ năng cơ bản'],
  ['IELTS Ignite','6–9','4–6','30–49','Xây dựng nền tảng IELTS, làm quen dạng bài'],
  ['IELTS Elevate','10–13','7–9','50–64','Phát triển kỹ năng làm bài, hướng đến band 4.0–5.0'],
  ['IELTS Breakthrough','14–16','10–11','65–79','Nâng cao kỹ năng, hướng đến band 5.5–6.0'],
  ['IELTS Mastery','17–18','12','80–89','Phát triển kỹ năng nâng cao, hướng đến band 6.5–7.0']
 ];
 const gradeBtn=$('grade');
 gradeBtn.addEventListener('click',function(){
   let ls=0,rs=0;
   for(let i=0;i<10;i++){
    const value=normal($('listen'+i).value);
    if(value && answersL[i].some(v=>normal(v)===value))ls++;
   }
   for(const [a,b,expected] of [[10,11,['B','E']],[12,13,['C','D']]]){
    const va=$('listen'+a).value,vb=$('listen'+b).value;
    const seen=new Set();
    for(const v of [va,vb]){if(v && !seen.has(v)&&expected.includes(v)){ls++;seen.add(v)}}
   }
   for(let i=14;i<20;i++)if($('listen'+i).value===answerMap[i-14])ls++;
   for(let i=0;i<13;i++)if(normal($('read'+i).value)===normal(answersR[i]))rs++;
   const review=[];
   const listeningPrompts=[
    'Vietnamese food · Course date','Bread making · Course fee','Bread making · Another type of bread',
    'Face massage · Country of training','Face massage · Thing to bring',
    'Candle making · Course date','Candle making · Ingredients','Silk painting · Course fee',
    'Silk painting · Thing to bring','DIY for beginners · Tool name'
   ];
   const listeningHints=[
    'Nghe ngày tháng; có thể viết 13 January hoặc các dạng ngày được KEY chấp nhận.',
    'Nghe số và ghi đúng chi phí £48; kiểm tra con số, không tự thêm tiền tệ.',
    'Nghe danh từ chỉ món ăn “pizza”; tuân thủ yêu cầu ONE WORD.',
    'Tên quốc gia cần được nghe và viết đúng chính tả: India.',
    'Từ vựng đồ vật: mirror (gương).',
    'Nghe ngày tháng 6 April; các cách viết ngày trong KEY đều được chấp nhận.',
    'Natural là tính từ đứng trước ingredients, diễn tả nguyên liệu tự nhiên.',
    'Chú ý cách đọc số thập phân 67.50 và yêu cầu số tiền.',
    'Shirt là danh từ chỉ áo; đoạn nghe nói mang theo tạp dề hoặc áo cũ.',
    'Hammer là danh từ công cụ; học cùng drill, saw và hammer.'
   ];
   for(let i=0;i<10;i++){
    const value=$('listen'+i).value.trim();
    const ok=value&&answersL[i].some(v=>normal(v)===normal(value));
    const answer=i===0?'13 January':i===5?'6 April':answersL[i].find(x=>!x.includes('('))||answersL[i][0];
    review.push({section:'IELTS Listening · Part 1',number:i+1,question:listeningPrompts[i],answer:value,
     expected:answer,correct:!!ok,topic:i===0||i===5?'Ngày tháng và chính tả':i===1||i===7?'Nghe số và giá tiền':'Nghe từ khóa',explanation:listeningHints[i]});
   }
   for(const [start,accepted,label] of [[10,['B','E'],'Marsden Coastal Walk'],[12,['C','D'],'Melby Heritage Walk']]){
    const seen=new Set();
    for(let i=start;i<start+2;i++){
     const value=$('listen'+i).value;
     const correct=!!value&&accepted.includes(value)&&!seen.has(value);
     if(correct)seen.add(value);
     review.push({section:'IELTS Listening · Part 2',number:i+1,question:label+' · Chọn HAI phương án (không lặp)',
      answer:value,expected:accepted.join(' và ')+' (không xét thứ tự)',correct,
      topic:'Multiple choice · Choose TWO',explanation:'Hai lựa chọn hợp lệ theo KEY là '+accepted.join(' và ')+'. Mỗi đáp án chỉ tính một lần; chọn lặp không được cộng điểm.'});
    }
   }
   const mapFeatures=['Exhibition','Baths','Tools','Vehicles','Ponies','Education centre'];
   for(let i=14;i<20;i++){
    const value=$('listen'+i).value,correct=value===answerMap[i-14];
    review.push({section:'IELTS Listening · Map',number:i+1,question:'Melby Coal Mine · '+mapFeatures[i-14],
     answer:value,expected:answerMap[i-14],correct,topic:'Map labelling',
     explanation:'Xác định vị trí '+mapFeatures[i-14]+' trên sơ đồ Melby Coal Mine và đối chiếu chữ cái '+answerMap[i-14]+' từ KEY.'});
   }
   const readingNotes=['Ngành nghề tạo nên tài sản gia đình','Học vấn và định hướng văn hóa','Ghi chú khi đi tham quan bảo tàng',
    'Nhật ký thể hiện sở thích hội họa','Tranh Monet mô tả thành phố',
    'Thông tin từ bài đọc về hoạt động và địa điểm','Thông tin về những người bạn của hai chị em'];
   for(let i=0;i<13;i++){
    const value=$('read'+i).value.trim(),expected=answersR[i];
    const correct=!!value&&normal(value)===normal(expected);
    const statement=i>=7?source.statements[i-7]:'The Davies Sisters · '+readingNotes[i];
    review.push({section:i<7?'IELTS Reading · Note Completion':'IELTS Reading · TRUE/FALSE/NOT GIVEN',
     number:i+1,question:statement,answer:value,expected,correct,
     topic:i<7?'One word only · Tìm từ trong bài':'TRUE / FALSE / NOT GIVEN',
     explanation:i<7?'Đáp án theo KEY là “'+expected+'”. Đọc lại đoạn văn The Davies Sisters, định vị từ khóa được diễn đạt lại và lấy đúng MỘT từ trong bài.':
      expected==='NOT GIVEN'?'NOT GIVEN: bài đọc không xác nhận hoặc phủ nhận đủ thông tin trong phát biểu. Không suy luận từ kiến thức ngoài bài.':
      expected==='TRUE'?'TRUE: phát biểu phù hợp với thông tin được nêu trong bài đọc; hãy tìm câu chứa bằng chứng tương đương.':
      'FALSE: phát biểu mâu thuẫn với thông tin được nêu trong bài đọc; tìm câu bác bỏ thay vì đoán.'});
   }
   const ranges=[['Foundation / Pre-IELTS',0,5,0,3],['IELTS Ignite',6,9,4,6],['IELTS Elevate',10,13,7,9],['IELTS Breakthrough',14,16,10,11],['IELTS Mastery',17,18,12,12]];
   const listenTier=ranges.find(t=>ls>=t[1]&&ls<=t[2]);
   const readTier=ranges.find(t=>rs>=t[3]&&rs<=t[4]);
   const sameTier=ranges.find(t=>ls>=t[1]&&ls<=t[2]&&rs>=t[3]&&rs<=t[4]);
   const level=sameTier?{
    title:sameTier[0]+' · Listening/Reading (tạm tính)',
    detail:'Listening '+ls+'/20 và Reading '+rs+'/13 cùng thuộc mức '+sameTier[0]+' trong bảng xếp lớp nội bộ ALI. Writing /100 chưa được chấm, nên đây chưa phải lớp được xác nhận.'}
    :{title:'Cần đánh giá thêm để xếp lớp IELTS',
      detail:'Listening '+ls+'/20 '+(listenTier?'(tham chiếu '+listenTier[0]+')':'(ngoài ngưỡng bảng ALI)')+
      '; Reading '+rs+'/13 '+(readTier?'(tham chiếu '+readTier[0]+')':'(ngoài ngưỡng bảng ALI)')+
      '. Hai kỹ năng chưa đồng nhất một hàng, hoặc có điểm vượt bảng; cần giáo viên chấm Writing và xét tổng thể.'};
   if(window.ALIResults?.render){
    window.ALIResults.render('aliUnifiedResult',{total:ls+rs,max:33,eyebrow:'ALI IELTS PLACEMENT · KẾT QUẢ',heading:'Đã hoàn thành Listening & Reading',ringLabel:'CÂU ĐÚNG',title:'Kết quả phần tự chấm',description:'Hệ thống đã chấm Listening và Reading theo file KEY của ALI. Writing chờ giáo viên chấm theo 4 tiêu chí, tối đa 100 điểm.',breakdown:[{label:'Listening',score:ls,max:20},{label:'Reading',score:rs,max:13},{label:'Writing (giáo viên)',score:null,max:100}],note:'Điểm '+(ls+rs)+'/33 là điểm kiểm tra xếp lớp nội bộ, KHÔNG phải IELTS band score. Chưa thể xếp lớp chính thức khi thiếu điểm Writing và đánh giá giáo viên.',level,review,reviewNote:'Bảng nội bộ ALI chỉ liệt kê đến Listening 18/20, Reading 12/13 và Writing 89/100. Mức tham khảo không phải IELTS band hoặc chứng chỉ IELTS. Phần Writing cần giáo viên chấm.'});
   }else{
    $('aliUnifiedResult').hidden=false;$('aliUnifiedResult').textContent='Listening: '+ls+'/20 · Reading: '+rs+'/13 · Writing: chờ giáo viên chấm.';
   }
   const wrap=$('aliUnifiedResult');
   const guidance=document.createElement('p');guidance.className='ali-ielts-guidance';guidance.textContent='Chi tiết Listening/Reading và mức tham khảo ở trên đã đối chiếu KEY nội bộ. Writing vẫn cần giáo viên chấm để xếp lớp chính thức.';wrap.querySelectorAll('.ali-ielts-guidance').forEach(n=>n.remove());wrap.append(guidance);
 });
})({"passage":["Between 1908 and 1924, Gwendoline and Margaret Davies amassed one of the largest collections of late-nineteenth and early-twentieth-century French paintings in Britain","Gwendoline (1882-1951) and Margaret (1884-1963) Davies were the granddaughters of David Davies, a Welshman who amassed a fortune in the shipping and mining industries. In 1907, when Gwendoline came into her inheritance (Margaret would follow in 1909), the sisters were said to be the wealthiest unmarried women in Britain. Their religious upbringing in rural Wales gave them a deep sense of social responsibility and they chose to use their inheritance for cultural and philanthropic* purposes.","While there was no real family history of art collecting, the sisters' education was rigorously geared toward such pursuits. Their London school focused on cultural rather than academic study, and they travelled extensively with their governess, Jane Blaker, visiting art galleries and making extensive notes on the collections there.","The sisters began to make regular art purchases from 1908, which roughly coincided with the dates of their inheritance. They took advice from various people, including the art dealer Hugh Blaker (the brother of Jane Blaker) and David Croal Thompson, who was also an art dealer. While it was long assumed that these men were largely responsible for the nature of the sisters' collection, it has recently been accepted that Gwendoline and Margaret retained a far more active role in the process.","The sisters' journals reveal their preference for Old Master** paintings. Yet they initially made very few attempts to secure any such works. While the sisters were wealthy in relative terms, their income was nothing compared to the fortunes of American art collectors of this period, such as J. Pierpont Morgan. Quite simply, high quality Old Master works were, if not beyond their means, then beyond what they were willing to pay for them. Instead, their early purchases were of the fashionable, safe variety, and included, for example, paintings by the French artist Jean-Baptiste-Camille Corot.","However, it was only a few years before their collecting took a new direction and they turned to the work of the French Impressionists***. We know that Hugh Blaker, as a champion of contemporary French art had a hand in the decision, and we know also that they would have seen examples on their various trips to Paris. Whatever the precise reason for this change, their first purchases of Impressionist art, made in October 1912, were scenes of Venice by the French artist Claude Monet. Over the next 12 years, the sisters amassed the bulk of their Impressionist collection, including six further works by Monet, two more by Manet, and three by Renoir, including his well-known painting La Parisienne.","The First World War (1914-1918) played a part in the development of the sisters' collection. Their initial response to the war effort was to finance the safe passage of artists from occupied Belgium to Wales, as a humanitarian act, but also with the hope of establishing a vibrant artists' community in the area. Later in the conflict, both sisters decided to volunteer at a canteen for troops at Troyes, in northern France; Gwendoline in 1916, followed by Margaret in 1917.","It was tedious and distressing work, which would have a permanent effect on Gwendoline's health. Yet on one of numerous trips to nearby Paris, she visited the Bernheim-Jeune Gallery. Here she acquired two works by Cézanne – Provençal Landscape and The François Zola Dam. The paintings were shipped directly to Bath, England, where they became the first works by Cézanne to go on display in a public gallery in Britain.","Commentators have often described the sisters as unlikely pioneer collectors. Much is made of their isolation in rural Wales and the fact that they didn't make friends with artists or gallery owners. Yet they didn't feel obliged to follow fashionable tastes and were free to pursue their own preferences. Although they relied on a trusted circle of advisers, they made frequent trips to London and Paris, and also regularly had paintings sent to their home for consideration.","By the early 1920s, Gwendoline felt increasingly uncomfortable buying art works when faced with the poverty and social upheaval created by the First World War. Her philanthropic pursuits then became focused almost exclusively on social causes and the development of the sisters' home at Gregynog Hall into a conference center and venue for the Gregynog Festival of Music and Poetry. Gwendoline made her final art purchase in March 1926. Margaret also stopped collecting around this time, but started again in the 1930s acquiring, on a relatively small scale, work by contemporary British artists.","The sisters collected French Impressionist paintings at a time when such art was routinely ignored by individuals and institutions alike. The Gwendoline and Margaret Davies collection, donated in 1951 and 1963 respectively to the National Museum Wales, contains major examples of work by leading French Impressionists. In collecting paintings that they loved, the sisters created a lasting and meaningful cultural legacy for the people of Wales and beyond.","* philanthropic: seeking to promote the welfare of others, often by charitable funding","** Old Master: a highly respected artist of great skill who worked in Europe before about 1800","*** Impressionist: an artist with a style of painting that developed in France in the late 1800s by Renoir, including his well-known painting La Parisienne"],"notes":["Family and early life","•   their grandfather's wealth came from 1.................. and transportation businesses","•   their upbringing gave them a sense of social responsibility","•   their 2.................. was designed to give them an interest in activities such as collecting art","•   their governess took them on trips to art galleries","•   they took lengthy 3.................. about the things they saw in art galleries","The sisters as art collectors","•   their 4.................. showed they liked Old Master paintings, but they were expensive to buy","•   their early purchases were safe, popular paintings","•   the first Impressionist paintings they bought showed places in 5.................. .","Impact of First World War","•   they helped bring artists from Belgium to Wales","•   they worked in a 6.................. for soldiers in France","Opinions about the sisters as art collectors","•   were not considered typical collectors - they lived in isolation in the countryside and did not have any 7.................. who were artists"],"statements":["The Davies sisters' childhood influenced the way they decided to use their wealth.","The Jean-Baptiste-Camille Corot paintings in the Davies sisters' collection were purchased from a gallery in France.","Hugh Blaker opposed the Davies sisters' decision to buy art by French Impressionists.","The exhibition of Cezanne paintings at the Bath gallery was very popular with the public.","The impact of the First World War encouraged Gwendoline to reconsider her interest in collecting art.","The Davies sisters bought French Impressionist art during a period when very few people were doing so."],"writing":["People living in large cites today face many problems in their everyday life. What are these problems? Should governments encourage people to move to smaller regional towns?","Give reasons for your answer and include any relevant examples from your own knowledge or experience.","Write at least 100 words."],"marsden":["A   Stop for lunch in an ancient town.","B   Don't miss the ruins of a certain building.","C   Catch a boat to the start of this walk.","D   Be careful of the steep and rocky paths.","E   Don't worry about getting lost."],"melby":["A   This walk is mostly downhill.","B   The paths can get busy during the day.","C   This is a circular walk.","D   A tower stands on the site of an older structure.","E   There are far-reaching views the whole way."]});
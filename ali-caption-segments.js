/* ALI English Cinema: non-destructive preview segments for long caption cues.
   Original timestamps, English and Vietnamese remain intact in transcript/quiz.
   These estimated sub-timings are not word-level speech alignment. */
function wordsOf(text){
 return String(text||'').trim().split(/\s+/u).filter(Boolean);
}
function balancedText(text,count){
 const words=wordsOf(text);
 if(count<=1||words.length<=1)return [words.join(' ')];
 const pieces=[];let start=0;
 for(let group=0;group<count-1;group++){
  const remaining=count-group;
  const maxEnd=words.length-(remaining-1);
  const rest=words.slice(start).join(' ');
  const desired=rest.length/remaining;
  let best=start+1,bestScore=Infinity;
  for(let end=start+1;end<=maxEnd;end++){
   const sample=words.slice(start,end).join(' ');
   const boundary=/[,;:.!?…—]$/u.test(words[end-1]);
   const penalty=boundary&&sample.length>=desired*.58?Math.min(10,desired*.16):0;
   const score=Math.abs(sample.length-desired)-penalty;
   if(score<bestScore){bestScore=score;best=end;}
   if(sample.length>desired*1.7&&end>start+1)break;
  }
  pieces.push(words.slice(start,best).join(' '));start=best;
 }
 pieces.push(words.slice(start).join(' '));
 return pieces;
}
export function buildCompactCaptionSegments(cue){
 const en=String(cue?.en||'').trim(),vi=String(cue?.vi||'').trim();
 const englishCount=wordsOf(en).length,vietnameseCount=wordsOf(vi).length;
 const ideal=Math.max(1,Math.ceil(en.length/64),Math.ceil(vi.length/68));
 const count=Math.min(7,ideal,englishCount||1,vietnameseCount||1);
 const enParts=balancedText(en,count),viParts=balancedText(vi,count);
 const start=Number(cue?.start)||0;
 const duration=Math.max(.01,(Number(cue?.end)||start)-start);
 const weights=enParts.map((part,i)=>Math.max(1,part.length+viParts[i].length));
 const total=weights.reduce((a,b)=>a+b,0);
 let completed=0;
 return weights.map((w,i)=>{
  const from=start+duration*completed/total;
  completed+=w;
  const to=i===count-1?start+duration:start+duration*completed/total;
  return {start:from,end:to,en:enParts[i],vi:viParts[i]};
 });
}

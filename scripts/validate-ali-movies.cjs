#!/usr/bin/env node
'use strict';
/* ALI-CINEMA-STD-01 — checks every catalog entry; new films require complete QA.
   Existing IDs are grandfathered for migrations only and marked as unreviewed. */
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const errors=[],warnings=[];
const fail=(id,msg)=>errors.push(id+': '+msg);
const warn=(id,msg)=>warnings.push(id+': '+msg);
function read(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'))}
function present(s){return typeof s==='string'&&s.trim().length>0}
function resolveLocal(url,folder,id,label){
 if(!present(url)||!url.startsWith('./'+folder+'/')||url.includes('..')||url.includes('://')||url.includes('#')){
  fail(id,label+' must be local ./'+folder+'/ path');return null;
 }
 const clean=url.split('?')[0];
 const absolute=path.resolve(root,clean);
 if(!absolute.startsWith(root+path.sep)){fail(id,'Invalid path '+url);return null}
 if(!fs.existsSync(absolute)){fail(id,'Missing '+label+': '+clean);return null}
 return absolute;
}
function checkCaption(id,movie,strict){
 const file=resolveLocal(movie.captions,'captions',id,'caption');
 if(!file)return;
 let d;try{d=JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){fail(id,'Bad caption JSON: '+e.message);return}
 if(!Array.isArray(d.cues)||!d.cues.length){fail(id,'Missing subtitle cues');return}
 if(strict&&d.status!=='reviewed')fail(id,'Captions require editorial status=reviewed');
 if(!strict&&d.status!=='reviewed')warn(id,'Subtitles are not human-reviewed; editorial approval pending');
 if(Number.isFinite(d.duration)&&Number.isFinite(movie.durationSeconds)&&Math.abs(d.duration-movie.durationSeconds)>1)fail(id,'Subtitle length mismatch');
 let prev=-1,overlaps=0;
 for(let n=0;n<d.cues.length;n++){
  const c=d.cues[n];
  if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>(movie.durationSeconds||d.duration||1e6)+1){fail(id,'Invalid subtitle time at cue '+(n+1));break}
  if(c.start<prev){fail(id,'Captions not sorted at cue '+(n+1));break}
  if(!present(c.en)||!present(c.vi)){fail(id,'Missing EN/VI at cue '+(n+1));break}
  if(c.end-c.start<0.15)warn(id,'Cue '+(n+1)+' is very short');
  if(n>0&&d.cues[n-1].end>c.start+0.3)overlaps++;
  prev=c.start;
 }
 if(overlaps)warn(id,overlaps+' subtitle overlaps need checking');
}
function checkMedia(id,movie){
 const video=resolveLocal(movie.source.url,'media',id,'MP4');
 if(!video)return;
 if(!video.endsWith('.mp4'))fail(id,'Source must be MP4');
 const size=fs.statSync(video).size;
 if(size>=90*1024*1024)fail(id,'MP4 is >= 90 MiB (GitHub Pages limit)');
 let info;
 try{info=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,pix_fmt,width,height','-of','json',video],{encoding:'utf8',timeout:20000}))}
 catch(e){fail(id,'ffprobe failed: '+e.message);return}
 const streams=info.streams||[];
 const v=streams.find(s=>s.codec_type==='video'),a=streams.find(s=>s.codec_type==='audio');
 if(!v||v.codec_name!=='h264'||v.pix_fmt!=='yuv420p')fail(id,'Video must be H.264 yuv420p');
 if(!a||a.codec_name!=='aac')fail(id,'Audio must be AAC');
 if(v&&(v.width>1280||v.height>720))fail(id,'Video must be 720p or smaller');
 if(Number.isFinite(movie.durationSeconds)&&Math.abs(Number(info.format?.duration)-movie.durationSeconds)>2)fail(id,'MP4 duration mismatch');
 const buf=Buffer.alloc(Math.min(262144,size));
 const fd=fs.openSync(video,'r');
 try{const count=fs.readSync(fd,buf,0,buf.length,0);if(!buf.subarray(0,count).includes(Buffer.from('moov')))warn(id,'MP4 moov metadata not at start; use +faststart')}
 finally{fs.closeSync(fd)}
}
let catalog,baseline;
try{catalog=read('ali-movies.json');baseline=read('docs/ALI_MOVIE_LEGACY_BASELINE.json')}
catch(e){console.error('FAIL: Cannot load catalog/baseline',e.message);process.exit(1)}
if(!Array.isArray(catalog.movies)||!Array.isArray(baseline.movies)){console.error('FAIL: Invalid catalog');process.exit(1)}
const legacyIds=new Set(baseline.movies.map(m=>m.id));
const seen=new Set();
let newCount=0,oldCount=0;
for(const m of catalog.movies){
 const id=m?.id||'UNKNOWN';
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))fail(id,'Invalid slug');
 if(seen.has(id))fail(id,'Duplicate film ID');
 seen.add(id);
 const legacy=legacyIds.has(id);
 if(legacy)oldCount++;else newCount++;
 const strict=!legacy;
 for(const f of ['title','description','category','duration'])if(!present(m[f]))fail(id,'Missing '+f);
 const p=m.presentation||{};
 if(!legacy&&(p.hideSourceLink!==true||p.background!=='film-blur'||p.layout!=='video-left-captions-right'))fail(id,'Must use default ALI presentation');
 const duration=/^(\d{2,}):([0-5]\d)$/.exec(m.duration||'');
 if(!duration)fail(id,'duration must be mm:ss');
 if(!legacy&&!Number.isFinite(m.durationSeconds))fail(id,'durationSeconds required');
 if(duration&&Number.isFinite(m.durationSeconds)&&Math.abs(+duration[1]*60 + +duration[2]-m.durationSeconds)>1)fail(id,'Duration label mismatch');
 if(legacy&&m.source?.type==='drive'){
  warn(id,'Legacy Drive iframe cannot synchronize. Upgrade to HTML5 before claiming standard compliance');
  continue;
 }
 if(legacy&&m.source?.type==='chunked'){
  warn(id,'Legacy chunked source; not a template for new entries');
  continue;
 }
 if(m.source?.type!=='url'){fail(id,'New/synchronized movies must use HTML5 source.type=url');continue}
 if(strict){
  // Every NEW movie uses its own source, image and caption paths; no cross-film reuse.
  if(m.source.url!=='./media/'+id+'/video.mp4')
   fail(id,'Source must equal ./media/'+id+'/video.mp4');
  if(!/^\.\/media\/[a-z0-9-]+\/poster\.(jpg|jpeg|png|webp)$/.test(m.poster||'')||
     !m.poster.startsWith('./media/'+id+'/'))
   fail(id,'Poster must be a real frame in ./media/'+id+'/poster.*');
  if(m.captions!=='./captions/'+id+'.json')
   fail(id,'Caption path must equal ./captions/'+id+'.json');
  if(m.driveId)fail(id,'Do not publish source Drive ID');
  const qa=m.qa||{};
  for(const field of ['rightsConfirmed','englishReviewed','vietnameseReviewed','timingsReviewed','desktopMobileTested'])if(qa[field]!==true)fail(id,'QA approval missing: '+field);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(qa.approvedAt||''))fail(id,'QA date missing');
 }
 resolveLocal(m.poster,'media',id,'poster');
 checkMedia(id,m);
 checkCaption(id,m,strict);
 if(legacy&&!m.qa?.approvedAt)warn(id,'Migrated legacy entry: human editorial and device QA still required');
}
for(const w of warnings)console.warn('WARN',w);
for(const e of errors)console.error('FAIL',e);
console.log('ALI-CINEMA-STD-01:',catalog.movies.length,'movies,',newCount,'new,',oldCount,'legacy,',errors.length,'errors,',warnings.length,'warnings');
if(errors.length)process.exitCode=1;

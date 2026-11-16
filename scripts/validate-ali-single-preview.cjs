#!/usr/bin/env node
'use strict';
// Validate one newly processed ALI lesson independently of other in-progress previews.
const fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), id=process.argv[2];
assert.match(id||'',/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'ali-movies.json'),'utf8'));
const hits=catalog.movies.filter(m=>m.id===id);
assert.equal(hits.length,1,'Video must appear once in catalog');
const m=hits[0], media=path.join(root,'media',id), mp4=path.join(media,'video.mp4'), poster=path.join(media,'poster.jpg'), caption=path.join(root,'captions',id+'.json');
assert.equal(m.source?.type,'url');
assert.equal(m.source.url,'./media/'+id+'/video.mp4');
assert.equal(m.poster,'./media/'+id+'/poster.jpg');
assert.equal(m.captions,'./captions/'+id+'.json');
assert.equal(m.presentation?.hideSourceLink,true);
assert.equal(m.presentation?.background,'film-blur');
assert.equal(m.presentation?.layout,'video-left-captions-right');
assert.equal(m.qa?.stage,'public_preview_pending_editorial_review');
assert.equal(m.qa?.videoTechnicalChecked,true);
assert.equal(m.qa?.rightsConfirmed,false);
for(const p of [mp4,poster,caption])assert.ok(fs.statSync(p).isFile(),p);
const size=fs.statSync(mp4).size;
assert.ok(size>1000000 && size<90*1024*1024,'MP4 must be less than 90MiB');
assert.ok(fs.statSync(poster).size>2000,'Poster missing or too small');
const info=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate','-of','json',mp4],{encoding:'utf8'}));
const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
assert.equal(v?.codec_name,'h264');assert.equal(v?.pix_fmt,'yuv420p');assert.equal(a?.codec_name,'aac');
assert.ok([[1920,1080],[1280,720]].some(([w,h])=>v.width===w&&v.height===h),'Native HD or FHD expected');
assert.equal(v.avg_frame_rate,'30/1');
const dur=Number(info.format.duration);
assert.ok(Number.isFinite(dur)&&dur>30&&dur<1500);
assert.ok(Math.abs(dur-m.durationSeconds)<1,'durationSeconds mismatch');
const label=String(Math.floor(dur+0.5)/60); // duration formatted separately below
const mm=Math.floor(Math.floor(dur+0.5)/60),ss=Math.floor(dur+0.5)%60;
assert.equal(m.duration,String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0'));
const fd=fs.openSync(mp4,'r');const header=Buffer.alloc(262144);fs.readSync(fd,header,0,header.length,0);fs.closeSync(fd);
assert.ok(header.includes(Buffer.from('moov')),'MP4 must be faststart');
const data=JSON.parse(fs.readFileSync(caption,'utf8'));
assert.equal(data.movieId,id);assert.equal(data.status,'machine_transcript_bilingual_unreviewed');
assert.ok(Math.abs(data.duration-dur)<1);
assert.ok(Array.isArray(data.cues)&&data.cues.length>=10);
let last=-1;
for(const [i,c] of data.cues.entries()){
 assert.ok(Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=last&&c.end>c.start&&c.end<=dur+0.5,'Invalid cue times '+i);
 assert.ok(typeof c.en==='string'&&c.en.trim()&&typeof c.vi==='string'&&c.vi.trim(),'Missing caption text at '+i);
 last=c.start;
}
console.log('ALI video preview QC PASS',id,'cues=',data.cues.length,'duration=',dur,'size=',size);
console.log('Editorial approval, rights, and device QA remain pending.');

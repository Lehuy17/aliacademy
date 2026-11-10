#!/usr/bin/env node
"use strict";
/* Static integration checks for ALI Teacher Dashboard.
 * This does NOT certify Firebase deployment, live permissions, uploads or legal rights.
 */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=require("node:path").resolve(__dirname,"..");
const load=p=>fs.readFileSync(require("node:path").join(root,p),"utf8");
const teacher=load("teacher.html"),script=load("ali-teacher.js"),css=load("ali-teacher.css");
const cinema=load("ali-cinema-player.js"),movies=load("movies.html");
const login=load("ali-members.js"),server=load("functions/index.js");
const firestore=load("firestore-rules-teacher.txt"),storage=load("storage-rules-teacher.txt");
const movieIds=[...teacher.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(movieIds).size,movieIds.length,"Duplicate IDs in teacher HTML");
const referenced=[...script.matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]);
const missing=[...new Set(referenced)].filter(id=>!movieIds.includes(id));
assert.deepEqual(missing,[],"Teacher JS refers to missing IDs");
const stripImport=code=>code.replace(/^import\s+\{[^\n]+\}\s+from\s+['"][^'"]+['"];?\s*/,"");
new vm.Script(stripImport(script),{filename:"ali-teacher.js"});
new vm.Script(stripImport(cinema),{filename:"ali-cinema-player.js"});
new vm.Script(stripImport(login),{filename:"ali-members.js"});
new vm.Script(server,{filename:"functions/index.js"});
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"Unbalanced teacher CSS");
assert.match(teacher,/id="teacherMovieForm"/);
assert.match(teacher,/id="teacherCreateStudent"/);
assert.match(script,/httpsCallable\(functions,"teacherPublishMovie"\)/);
assert.match(script,/httpsCallable\(functions,"teacherCreateStudent"\)/);
assert.match(script,/httpsCallable\(functions,"teacherSetStudentStatus"\)/);
assert.match(script,/teacher_movies\\//);
assert.match(script,/uploadFile\\(dir\\+"video\\.mp4"/);
assert.match(script,/parseBilingualSubtitles/);
assert.match(script,/probeMovie/);
assert.match(server,/verifyStaff\(request\)/);
assert.match(server,/getAuth\(\)\.createUser/);
assert.match(server,/ffprobe\.path/);
assert.match(server,/teacherMovieCaptions/);
assert.match(server,/status:"published"/);
assert.match(cinema,/teacherPublishedMovies/);
assert.match(cinema,/firebaseManaged:true/);
assert.match(cinema,/captionsInline/);
assert.match(login,/staff\?'\.\/teacher\.html':'\.\/movies\.html'/);
assert.match(movies,/id="aliTeacherNavLink"/);
assert.match(firestore,/allow create, update, delete: if false/);
assert.match(storage,/request\.auth\.token\.role == 'teacher'/);
assert.doesNotMatch(script,/AIzaSy[A-Za-z0-9_-]{25,}/,"No hard-coded Firebase keys in teacher JS");
assert.doesNotMatch(server,/private_key|serviceAccountKey\.json/,"Do not bundle service keys");
console.log("PASS ALI Teacher Dashboard: HTML bindings, JS syntax, roles, upload workflow, cinema integration, rules and no private credentials");

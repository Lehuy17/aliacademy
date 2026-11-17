"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const js=fs.readFileSync(path.join(root,"ALI_Spark_Sheets.gs"),"utf8");
const html=fs.readFileSync(path.join(root,"ALI_Admin_Passwords.html"),"utf8");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"appsscript.json"),"utf8"));
assert(!js.includes("Session.getEffectiveUser()"));
assert(/aliSparkPasswordExecute/.test(js));
assert(html.includes("google.script.run"));
assert(html.includes("google.script.host.close()"));
assert(manifest.oauthScopes.includes("https://www.googleapis.com/auth/cloud-platform"));
assert(manifest.oauthScopes.includes("https://www.googleapis.com/auth/script.container.ui"));
const rows=[
  ["Email","Họ tên","Lớp học","Vai trò","Yêu cầu","Trạng thái","UID","Lỗi","Cập nhật","Giao tài khoản","Mật khẩu đăng nhập"],
  ["student01@example.com","Nguyễn Văn A","TOEIC","student","CHO_TAO","","","","","",""],
  ["student02@example.com","Trần Thị B","IELTS","student","CHO_TAO","","","","","",""]
];
const accounts=new Map(),documents=new Map(),requests=[];
let selectedRow=2,serial=0,uuid=0;
const sheet={
 getSheetId:()=>42,
 getLastRow:()=>rows.length,
 getRange:(r,c,n=1,m=1)=>({
  getDisplayValues:()=>Array.from({length:n},(_,j)=>rows[r-1+j].slice(c-1,c-1+m).map(x=>String(x??""))),
  getDisplayValue:()=>String(rows[r-1][c-1]??""),
  setNumberFormat:()=>{},
  setValue:value=>{rows[r-1][c-1]=value;},
  setValues:values=>{for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++)rows[r-1+i][c-1+j]=values[i][j];}
 })
};
const reply=(code,body)=>({getResponseCode:()=>code,getContentText:()=>JSON.stringify(body||{})});
const env={
 SpreadsheetApp:{
  getActiveSpreadsheet:()=>({
   getSheetByName:name=>name==="Học viên"?sheet:null,
   getActiveSheet:()=>sheet
  }),
  getUi:()=>({createMenu:()=>({addItem(){return this;},addSeparator(){return this;},addToUi(){}}),alert:()=>{}}),
  flush:()=>{}
 },
 LockService:{getDocumentLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
 ScriptApp:{getOAuthToken:()=> "fake-admin-oauth-token"},
 Utilities:{getUuid:()=>(++uuid).toString(16).padStart(8,"0")+"-ddec-4fee-acde-bcba12345678",sleep:()=>{}},
 UrlFetchApp:{
  fetch:(url,opts)=>{
   assert.equal(opts.headers.Authorization,"Bearer fake-admin-oauth-token");
   const body=JSON.parse(opts.payload||"{}");
   requests.push({url,body});
   if(url.endsWith("/accounts")){
    if(accounts.has(body.email))return reply(400,{error:{message:"EMAIL_EXISTS"}});
    const localId="uid-"+(++serial);
    accounts.set(body.email,{localId,email:body.email,password:body.password});
    return reply(200,{localId,email:body.email});
   }
   if(url.endsWith("/accounts:lookup")){
    const user=accounts.get(body.email[0]);
    return reply(200,{users:user?[user]:[]});
   }
   if(url.endsWith("/accounts:update")){
    const user=[...accounts.values()].find(x=>x.localId===body.localId);
    if(!user)return reply(404,{error:{message:"USER_NOT_FOUND"}});
    user.password=body.password;
    return reply(200,{localId:user.localId});
   }
   if(url.endsWith("/accounts:delete")){
    for(const [email,u] of accounts)if(u.localId===body.localId)accounts.delete(email);
    return reply(200,{});
   }
   if(url.includes("documents/users?documentId=")){
    const uid=decodeURIComponent(url.split("documentId=")[1]);
    documents.set(uid,body);
    return reply(200,{name:uid,fields:body.fields});
   }
   if(url.includes("/documents/users/")){
    const uid=decodeURIComponent(url.split("/documents/users/")[1]);
    const doc=documents.get(uid);
    return doc?reply(200,doc):reply(404,{error:{message:"NOT_FOUND"}});
   }
   throw Error("Unexpected fake URL "+url);
  }
 }
};
vm.createContext(env);
vm.runInContext(js,env,{filename:"ALI_Spark_Sheets.gs"});
// Initial batch creates two password-protected students; no passwords stored in Sheet.
let preview=env.aliSparkPasswordPreview("create2");
assert.equal(preview.rows.length,2);
let out=env.aliSparkPasswordExecute("create2",preview.rows.map(x=>({row:x.row,email:x.email})));
assert.deepEqual([...out.results.map(x=>x.status)],["DA_TAO","DA_TAO"]);
for(let i=0;i<2;i++){
 const entry=out.results[i],email=entry.email;
 assert(entry.password.length>40);
 assert.equal(accounts.get(email).password,entry.password);
 assert.equal(rows[i+1][5],"DA_TAO");
 assert.equal(rows[i+1][9],"CAP_TAY");
 assert.equal(rows[i+1][10],entry.password,"Permanent password should be stored in column K");
 assert.equal(documents.get(accounts.get(email).localId).fields.role.stringValue,"student");
}
// A duplicate entry must never reset password implicitly.
const oldPass=accounts.get("student02@example.com").password;
rows[2][5]="";rows[2][6]="";
preview=env.aliSparkPasswordPreview("create2");
assert.equal(preview.rows.length,1);
out=env.aliSparkPasswordExecute("create2",preview.rows.map(x=>({row:x.row,email:x.email})));
assert.equal(out.results[0].status,"DA_TON_TAI");
assert.equal(out.results[0].password,"");
assert.equal(accounts.get("student02@example.com").password,oldPass);
// Reset requires a real Firestore student profile matching identity.
selectedRow=2;
env.SpreadsheetApp.getActiveSpreadsheet=()=>({
 getSheetByName:n=>n==="Học viên"?sheet:null,
 getActiveSheet:()=>({...sheet,getActiveRange:()=>({getRow:()=>selectedRow,getNumRows:()=>1})})
});
preview=env.aliSparkPasswordPreview("reset");
assert.equal(preview.rows[0].email,"student01@example.com");
// Regression: a modal might change active selection; original preview row still
// must be honored, and JSON property order must not affect identity checking.
selectedRow=3;
out=env.aliSparkPasswordExecute("reset",preview.rows.map(x=>({email:x.email,row:x.row})));
selectedRow=2;
assert.equal(out.results[0].status,"DA_CAP_LAI");
assert.notEqual(out.results[0].password,oldPass);
assert.equal(accounts.get("student01@example.com").password,out.results[0].password);
assert.equal(rows[1][9],"CAP_LAI_TAY");
assert.equal(rows[1][10],out.results[0].password);
// Guard: an email edited in the Sheet between preview and execute must fail.
preview=env.aliSparkPasswordPreview("reset");
const originalEmail=rows[1][0];
rows[1][0]="changed.student@example.com";
const changeCalls=requests.filter(x=>x.url.endsWith("/accounts:update")).length;
assert.throws(()=>env.aliSparkPasswordExecute("reset",preview.rows.map(x=>({row:x.row,email:x.email}))),/Email hoặc dòng học viên đã thay đổi/);
assert.equal(requests.filter(x=>x.url.endsWith("/accounts:update")).length,changeCalls);
rows[1][0]=originalEmail;
// A privileged profile cannot have its password reset through a student row.
const uid=accounts.get("student01@example.com").localId;
documents.get(uid).fields.role.stringValue="admin";
const updatesBefore=requests.filter(x=>x.url.endsWith("/accounts:update")).length;
preview=env.aliSparkPasswordPreview("reset");
out=env.aliSparkPasswordExecute("reset",preview.rows.map(x=>({row:x.row,email:x.email})));
assert.equal(out.results[0].status,"LOI");
assert.equal(out.results[0].password,"");
assert.equal(requests.filter(x=>x.url.endsWith("/accounts:update")).length,updatesBefore);
assert(!js.includes("PropertiesService.getScriptProperties().setProperty"));
console.log("PASS: persistent passwords, creation, duplicate safeguard, explicit reset, admin protection");

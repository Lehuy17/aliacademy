#!/usr/bin/env node
"use strict";
/* ALI Academy Spark local importer. Default mode only checks data; --apply creates accounts. */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const ExcelJS=require("exceljs");
const {parse}=require("csv-parse/sync");
const PROJECT="ali-english",MAX_ROWS=100,args=process.argv.slice(2),apply=args.includes("--apply");
const input=args.find(s=>!s.startsWith("--"));
const str=v=>String(v??"").trim();
const key=v=>str(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]/g,"");
const synonyms={name:["hoten","hovaten","tenhocvien","name","fullname"],email:["email","emailhocvien","diachiemail"],studentCode:["mahocvien","mahv","studentcode","studentid"],className:["lophoc","lop","classname","class"],action:["yeucau","action"]};
const fail=msg=>{throw Error(msg);};
function textOf(v,line){
 if(v==null)return "";
 if(v instanceof Date)fail("Dòng "+line+": ô ngày tháng không hợp lệ.");
 if(typeof v==="object"){
  if("formula" in v||"sharedFormula" in v)fail("Dòng "+line+": không dùng công thức Excel.");
  if(Array.isArray(v.richText))return v.richText.map(x=>x.text||"").join("").trim();
  if(typeof v.text==="string")return v.text.trim();
  fail("Dòng "+line+": kiểu ô Excel không được hỗ trợ.");
 }
 return str(v);
}
function check(matrix){
 if(!matrix.length)fail("File trống.");
 const cols=matrix[0].values.map(key),idx={};
 for(const [field,names] of Object.entries(synonyms))idx[field]=cols.findIndex(c=>names.includes(c));
 if(idx.name<0||idx.email<0)fail("Dòng 1 cần có 2 cột Họ tên và Email.");
 const used=matrix.slice(1).filter(r=>r.values.some(x=>str(x)!==""));
 if(used.length>MAX_ROWS)fail("Có "+used.length+" dòng. Tối đa "+MAX_ROWS+" học viên mỗi lượt.");
 const emails=new Set(),codes=new Set(),items=[],errors=[];
 for(const r of used){
  try{
   const get=field=>idx[field]<0?"":textOf(r.values[idx[field]],r.line);
   const x={line:r.line,name:get("name"),email:get("email").toLowerCase(),studentCode:get("studentCode"),className:get("className"),action:get("action").toUpperCase()};
   if(x.action==="BO_QUA")continue;
   if(x.action&&x.action!=="CHO_TAO")fail("Yêu cầu phải trống, CHO_TAO hoặc BO_QUA.");
   if(!x.name||x.name.length>100)fail("Họ tên phải có 1–100 ký tự.");
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email)||x.email.length>180)fail("Email không hợp lệ.");
   if(x.studentCode.length>40||x.className.length>100||!/^[\p{L}\p{N} _.-]*$/u.test(x.studentCode))fail("Mã học viên hoặc lớp không hợp lệ.");
   if(emails.has(x.email))fail("Email trùng trong file.");
   if(x.studentCode&&codes.has(x.studentCode.toLowerCase()))fail("Mã học viên trùng trong file.");
   emails.add(x.email);
   if(x.studentCode)codes.add(x.studentCode.toLowerCase());
   items.push(x);
  }catch(e){errors.push("Dòng "+r.line+": "+e.message);}
 }
 if(errors.length)fail("Có lỗi dữ liệu:\n"+errors.slice(0,20).join("\n")+(errors.length>20?"\n... và "+(errors.length-20)+" lỗi khác":""));
 if(!items.length)fail("Không có học viên hợp lệ.");
 return items;
}
async function readInput(file){
 if(!fs.existsSync(file))fail("Không tìm thấy: "+file);
 if(fs.statSync(file).size>5*1024*1024)fail("Tệp vượt 5 MB.");
 const ext=path.extname(file).toLowerCase();
 let matrix;
 if(ext===".csv"){
  const src=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"");
  const first=src.split(/\r?\n/,1)[0],delim=first.includes(";")&&!first.includes(",")?";":",";
  matrix=parse(src,{bom:true,skip_empty_lines:true,delimiter:delim,relax_quotes:false}).map((values,i)=>({line:i+1,values}));
 }else if(ext===".xlsx"){
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws=wb.worksheets[0];if(!ws)fail("Không có sheet Excel.");
  matrix=[];
  for(let r=1;r<=ws.rowCount;r++){
   const values=[];
   for(let c=1;c<=Math.max(ws.columnCount,4);c++)values.push(ws.getRow(r).getCell(c).value);
   matrix.push({line:r,values});
  }
 }else fail("Chỉ chấp nhận .xlsx hoặc .csv (hãy lưu .xls thành .xlsx).");
 return check(matrix);
}
async function templateFile(output){
 const wb=new ExcelJS.Workbook();
 const ws=wb.addWorksheet("Hoc vien",{views:[{state:"frozen",ySplit:1}]});
 ws.addRow(["Họ tên","Email","Mã học viên","Lớp học","Yêu cầu"]);
 [28,35,20,26,18].forEach((w,i)=>{ws.getColumn(i+1).width=w;});
 ws.getRow(1).height=32;
 ws.getRow(1).eachCell(c=>{c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFF691E"}};c.font={bold:true,color:{argb:"FFFFFFFF"},size:11};c.alignment={vertical:"middle"};});
 for(let r=2;r<=101;r++){ws.getRow(r).height=22;for(let c=1;c<=5;c++){
  const cell=ws.getRow(r).getCell(c);cell.numFmt="@";
  cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:r%2?"FFFFFFFF":"FFFFF8F2"}};
  cell.border={bottom:{style:"hair",color:{argb:"FFEAD9CA"}}};
 }}
 ws.autoFilter="A1:E101";
 const help=wb.addWorksheet("Huong dan");help.getColumn(1).width=105;
 ["ALI Academy — Nhập 100 tài khoản trên Firebase Spark","Chỉ nhập vào sheet Hoc vien, từ dòng 2 đến dòng 101.","Họ tên và Email bắt buộc; mã học viên, lớp học tùy chọn.","Yêu cầu để trống hoặc CHO_TAO, BO_QUA để bỏ qua.","Chạy nhap-hoc-vien.bat để kiểm tra trước khi tạo. Không đưa khóa Firebase lên GitHub."].forEach(v=>help.addRow([v]));
 await wb.xlsx.writeFile(output);console.log("Đã tạo file mẫu: "+output);
}
function cellCSV(v){
 let s=String(v??"");
 if(/^[=+\-@\t\r]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
const csvRow=a=>a.map(cellCSV).join(",")+"\r\n";
function outputFiles(){
 const dir=path.join(__dirname,"private-output");fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const stamp=new Date().toISOString().replace(/[:.]/g,"-")+"-"+crypto.randomBytes(3).toString("hex");
 const report=path.join(dir,"bao-cao-"+stamp+".csv"),creds=path.join(dir,"mat-khau-tam-"+stamp+".csv");
 fs.writeFileSync(report,"\uFEFF"+csvRow(["Dòng","Họ tên","Email","Mã học viên","Lớp học","Trạng thái","UID","Lỗi"]),{flag:"wx",mode:0o600});
 fs.writeFileSync(creds,"\uFEFF"+csvRow(["Họ tên","Email","Mật khẩu tạm"]),{flag:"wx",mode:0o600});
 return {report,creds};
}
async function createAccounts(items){
 const secretFile=path.join(__dirname,"firebase-service-account.json");
 if(!fs.existsSync(secretFile))fail("Thiếu firebase-service-account.json tại thư mục spark-local. Giữ khóa chỉ trên máy quản trị.");
 const secret=JSON.parse(fs.readFileSync(secretFile,"utf8"));
 if(secret.project_id!==PROJECT||secret.type!=="service_account")fail("Khóa JSON không thuộc dự án ali-english.");
 const admin=require("firebase-admin");
 admin.initializeApp({credential:admin.credential.cert(secret),projectId:PROJECT});
 const auth=admin.auth(),db=admin.firestore(),files=outputFiles();
 let created=0,existing=0,failed=0;
 for(const item of items){
  const result={...item,uid:"",status:"",error:""};
  try{
   let existingUser;
   try{existingUser=await auth.getUserByEmail(item.email);}
   catch(e){if(e.code!=="auth/user-not-found")throw e;}
   if(existingUser){result.uid=existingUser.uid;result.status="DA_TON_TAI";existing++;}
   else{
    const password=crypto.randomBytes(24).toString("base64url")+"!A1";
    const user=await auth.createUser({email:item.email,displayName:item.name,password,emailVerified:false,disabled:false});
    result.uid=user.uid;
    try{
     await db.collection("users").doc(user.uid).create({
      name:item.name,email:item.email,studentCode:item.studentCode,className:item.className,
      role:"student",status:"active",createdAt:admin.firestore.FieldValue.serverTimestamp(),createdBy:"spark-local-import"
     });
     fs.appendFileSync(files.creds,csvRow([item.name,item.email,password]),"utf8");
     result.status="DA_TAO";created++;
    }catch(err){
     try{
      await auth.deleteUser(user.uid);
      await db.collection("users").doc(user.uid).delete();
      result.uid="";
     }catch(rollbackErr){result.status="CAN_KIEM_TRA_THU_CONG";result.error="Rollback thất bại: "+String(rollbackErr.code||rollbackErr.message).slice(0,100);}
     throw err;
    }
    await new Promise(resolve=>setTimeout(resolve,350));
   }
  }catch(e){if(!result.status)result.status="LOI";result.error+=(result.error?"; ":"")+String(e.code||e.message).slice(0,140);failed++;}
  fs.appendFileSync(files.report,csvRow([item.line,item.name,item.email,item.studentCode,item.className,result.status,result.uid,result.error]),"utf8");
  console.log("Dòng "+item.line+": "+item.email+" → "+result.status);
 }
 console.log("\nHOÀN TẤT: "+created+" tạo mới | "+existing+" đã tồn tại (không đổi) | "+failed+" lỗi.");
 console.log("Báo cáo: "+files.report);
 console.log("Mật khẩu tạm: "+files.creds);
 console.log("Gửi riêng mật khẩu cho từng học viên và yêu cầu đổi mật khẩu sau lần đăng nhập đầu.");
 if(failed)process.exitCode=2;
}
async function main(){
 if(args.includes("--template"))return templateFile(path.resolve(input||path.join(__dirname,"ALI_Mau_100_Hoc_Vien.xlsx")));
 if(!input||args.includes("--help")){
  console.log("Cách chạy: node create-students.cjs --template | node create-students.cjs danhsach.xlsx [--apply]");
  if(!input)process.exitCode=1;return;
 }
 const items=await readInput(path.resolve(input));
 console.log("Firebase: "+PROJECT+" | "+items.length+" học viên hợp lệ | "+(apply?"TẠO THẬT":"CHỈ KIỂM TRA"));
 console.table(items.slice(0,10).map(x=>({Dòng:x.line,Tên:x.name,Email:x.email,Lớp:x.className})));
 if(items.length>10)console.log("... và "+(items.length-10)+" học viên khác.");
 if(!apply){console.log("CHƯA tạo tài khoản nào. Đối chiếu file rồi chạy lại với --apply.");return;}
 await createAccounts(items);
}
if(require.main===module)main().catch(e=>{console.error("DỪNG: "+e.message);process.exitCode=1;});
module.exports={readInput,check,key,csvRow};

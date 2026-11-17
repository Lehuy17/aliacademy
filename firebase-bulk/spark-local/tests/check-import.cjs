"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawnSync}=require("node:child_process"),ExcelJS=require("exceljs");
const script=path.resolve(__dirname,"../create-students.cjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ali-spark-test-"));
function run(args){const r=spawnSync(process.execPath,[script,...args],{encoding:"utf8"});return {code:r.status,output:r.stdout+"\n"+r.stderr};}
(async()=>{
 const example=path.join(tmp,"template.xlsx");
 let r=run(["--template",example]);assert.equal(r.code,0,r.output);
 const wb=new ExcelJS.Workbook();await wb.xlsx.readFile(example);
 const sheet=wb.worksheets[0];
 assert.equal(sheet.getCell("A1").value,"Họ tên");
 sheet.getCell("A2").value="Nguyễn Văn A";sheet.getCell("B2").value="student01@example.com";
 sheet.getCell("C2").value="ALI01";sheet.getCell("D2").value="TOEIC";
 sheet.getCell("A3").value="Trần Thị B";sheet.getCell("B3").value="student02@example.com";
 let file=path.join(tmp,"valid.xlsx");await wb.xlsx.writeFile(file);
 r=run([file]);assert.equal(r.code,0,r.output);assert.match(r.output,/2 học viên hợp lệ/);
 assert.match(r.output,/CHƯA tạo tài khoản nào/);
 sheet.getCell("B3").value="STUDENT01@example.com";
 file=path.join(tmp,"duplicate.xlsx");await wb.xlsx.writeFile(file);
 r=run([file]);assert.notEqual(r.code,0);assert.match(r.output,/Email trùng/);
 sheet.getCell("B3").value="student02@example.com";
 for(let i=4;i<=102;i++){sheet.getCell("A"+i).value="Học viên "+i;sheet.getCell("B"+i).value="student"+i+"@example.com";}
 file=path.join(tmp,"101.xlsx");await wb.xlsx.writeFile(file);
 r=run([file]);assert.notEqual(r.code,0);assert.match(r.output,/Tối đa 100/);
 const csv=path.join(tmp,"valid.csv");
 fs.writeFileSync(csv,"\uFEFFHọ tên,Email,Mã học viên,Lớp học\nLê Minh C,c@example.com,ALI3,IELTS\n");
 r=run([csv]);assert.equal(r.code,0,r.output);assert.match(r.output,/1 học viên hợp lệ/);
 console.log("PASS: Excel, CSV, dry run, 100-row limit, template, duplicate detection");
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>fs.rmSync(tmp,{recursive:true,force:true}));

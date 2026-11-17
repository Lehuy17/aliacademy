import {firebaseConfig} from "./firebase-config.js";
const $=id=>document.getElementById(id);
const SDK="https://www.gstatic.com/firebasejs/13.2.0/";
let records=[],results=null,run=false,functions=null;
const safe=s=>String(s??"").trim();
const emailOK=s=>/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(s);
function csvCell(v){const s=String(v??"");return /[",\\r\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function download(name,table){const csv="\\uFEFF"+table.map(row=>row.map(csvCell).join(",")).join("\\r\\n");
 const link=document.createElement("a"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function message(s){$("aliBulkSummary").textContent=s;}
function paint(){
 const body=$("aliBulkRows");body.replaceChildren();$("aliBulkPreview").hidden=!records.length;
 const seen=new Set();let valid=0;
 records.forEach((r,i)=>{
  const error=!r.name||r.name.length>100?"Thiếu/sai họ tên":!emailOK(r.email)||r.email.length>180?"Email không hợp lệ":seen.has(r.email.toLowerCase())?"Email trùng":r.studentCode.length>40||r.className.length>100?"Mã/lớp quá dài":"";
  seen.add(r.email.toLowerCase());if(!error)valid++;
  const tr=document.createElement("tr");
  [i+2,r.name,r.email,r.studentCode,r.className,error||"Hợp lệ"].forEach(value=>{
   const td=document.createElement("td");td.textContent=value;tr.append(td);
  });body.append(tr);
 });
 const ok=records.length>0&&records.length<=100&&valid===records.length;
 $("aliBulkSubmit").disabled=!ok||run;
 message(records.length+" dòng · "+valid+" hợp lệ · "+(records.length-valid)+" cần sửa"+(records.length>100?" · Vượt giới hạn 100 dòng":""));
}
function normalize(row){
 const byKey={};Object.keys(row).forEach(k=>byKey[safe(k).normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")]=safe(row[k]));
 return {name:byKey.hoten||byKey.name||byKey.fullname||"",
  email:(byKey.email||byKey.emailhocvien||"").toLowerCase(),
  studentCode:byKey.mahocvien||byKey.studentcode||"",
  className:byKey.lophoc||byKey.class||byKey.classname||""};
}
async function excel(){
 if(window.XLSX)return window.XLSX;
 await new Promise((resolve,reject)=>{
  const sc=document.createElement("script");
  sc.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
  sc.onload=resolve;sc.onerror=()=>reject(Error("Không tải được thư viện Excel; hãy kiểm tra mạng hoặc dùng CSV."));document.head.append(sc);
 });if(!window.XLSX)throw Error("Không đọc được Excel.");return window.XLSX;
}
$("aliBulkTemplate").addEventListener("click",()=>download("ALI_mau_nhap_hoc_vien.csv",[
 ["Họ tên","Email","Mã học viên","Lớp học"],
 ["Nguyễn Văn A","nguyenvana@example.com","ALI001","Giao tiếp A1"],
 ["Trần Thị B","tranthib@example.com","ALI002","TOEIC 400"]
]));
$("aliBulkFile").addEventListener("change",async e=>{
 results=null;$("aliBulkDownload").hidden=true;records=[];
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>2*1024*1024)throw Error("Tệp Excel quá 2 MB.");
  const XLSX=await excel(),workbook=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:false});
  const sheet=workbook.Sheets[workbook.SheetNames[0]];
  if(!sheet)throw Error("Tệp không có trang tính.");
  const raw=XLSX.utils.sheet_to_json(sheet,{defval:"",raw:false});
  records=raw.filter(row=>Object.values(row).some(x=>safe(x))).map(normalize);
  if(!records.length)throw Error("Không tìm thấy học viên. Kiểm tra dòng tiêu đề.");
  paint();
 }catch(err){records=[];paint();message("Không đọc được tệp: "+err.message);}
});
$("aliBulkSubmit").addEventListener("click",async()=>{
 if(run||!records.length||records.length>100)return;
 if(!confirm("Bạn chắc chắn tạo "+records.length+" tài khoản học viên mới? Email đã tồn tại sẽ được bỏ qua."))return;
 run=true;$("aliBulkSubmit").disabled=true;$("aliBulkFile").disabled=true;$("aliBulkDownload").hidden=true;
 try{
  message("Đang gửi danh sách đến Firebase. Không đóng trang trong khi tạo tài khoản.");
  const {httpsCallable}=await import(SDK+"firebase-functions.js");
  const response=await httpsCallable(functions,"adminImportStudents",{timeout:330000})({students:records});
  results=response.data.results;
  message("Hoàn tất: "+response.data.created+" tạo mới · "+response.data.existing+" đã tồn tại · "+response.data.failed+" lỗi. Hãy tải kết quả để bàn giao tài khoản.");
  $("aliBulkDownload").hidden=false;
 }catch(err){message("Không thể tạo tài khoản: "+(err.message||String(err)));}
 finally{run=false;$("aliBulkFile").disabled=false;paint();if(results)message("Hoàn tất: "+results.filter(x=>x.status==="created").length+" tạo mới · "+results.filter(x=>x.status==="existing").length+" trùng email · "+results.filter(x=>x.status==="failed").length+" lỗi.");}
});
$("aliBulkDownload").addEventListener("click",()=>{
 if(!results)return;
 download("ALI_ket_qua_tao_tai_khoan.csv",[
 ["Dòng","Họ tên","Email","Mã học viên","Lớp học","Trạng thái","Mật khẩu tạm","Lý do"],
 ...results.map(r=>[r.row,r.name,r.email,r.studentCode,r.className,r.status,r.temporaryPassword||"",r.message||""])
 ]);
});
(async()=>{
 const [{initializeApp,getApps,getApp},{getAuth,onAuthStateChanged,getIdTokenResult},{getFunctions}]=await Promise.all([
  import(SDK+"firebase-app.js"),import(SDK+"firebase-auth.js"),import(SDK+"firebase-functions.js")]);
 const app=getApps().length?getApp():initializeApp(firebaseConfig);functions=getFunctions(app,"asia-southeast1");
 onAuthStateChanged(getAuth(app),async user=>{
  if(!user){$("aliBulkPanel").hidden=true;return;}
  const token=await getIdTokenResult(user,true);
  $("aliBulkPanel").hidden=token.claims.role!=="admin";
 });
})().catch(err=>message("Không xác minh được quyền Admin: "+err.message));

/**
 * ALI Academy - Firebase Spark + Google Sheets (admin's own OAuth token)
 *
 * IMPORTANT: This is NOT firebase-bulk/ALI_Bulk_Sheets.gs (that version uses Blaze Functions).
 * No Firebase service-account private keys in Sheets or Script Properties.
 * The signed-in Google administrator must have Firebase Authentication Admin
 * and Cloud Datastore User roles for project ali-english.
 *
 * The bound Google Sheets format is:
 * A Email; B Họ tên; C Lớp học; D Vai trò; E Yêu cầu;
 * F Trạng thái; G UID; H Lỗi; I Cập nhật; J Email kích hoạt.
 */
const ALI_SPARK={
  projectId:"ali-english",
  webApiKey:"AIzaSyC2C4wYUyAs2FS5-fhV7eM422POZC3nccw",
  tab:"Học viên",
  maxRows:100,
  perRun:20
};
function onOpen(){
  SpreadsheetApp.getUi().createMenu("ALI Academy · Spark")
    .addItem("1. Kiểm tra danh sách", "aliSparkCheck")
    .addItem("2. Tạo 2 tài khoản thử", "aliSparkPilot")
    .addItem("3. Tạo tối đa 20 tài khoản tiếp theo", "aliSparkCreateNext")
    .addToUi();
}
function aliSparkSheet_(){
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ALI_SPARK.tab);
  if(!sheet)throw Error('Không tìm thấy tab "Học viên". Hãy tạo hoặc đổi tên tab.');
  const heads=["Email","Họ tên","Lớp học","Vai trò","Yêu cầu","Trạng thái","UID","Lỗi","Cập nhật","Email kích hoạt"];
  if(sheet.getLastRow()===0){
    sheet.getRange(1,1,1,heads.length).setValues([heads]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function aliSparkRows_(sheet){
  const last=sheet.getLastRow();
  if(last<2)return {pending:[],invalid:[],skipped:0};
  const matrix=sheet.getRange(2,1,last-1,10).getDisplayValues();
  const filled=matrix.map((values,i)=>({values,row:i+2})).filter(x=>x.values.slice(0,5).some(v=>String(v).trim()));
  if(filled.length>ALI_SPARK.maxRows)throw Error("Tối đa 100 dòng học viên mỗi đợt. Bảng hiện có "+filled.length+" dòng dữ liệu.");
  const seen=new Set(),pending=[],invalid=[];
  let skipped=0;
  filled.forEach(x=>{
    const v=x.values;
    const email=String(v[0]||"").trim().toLowerCase();
    const name=String(v[1]||"").trim();
    const school=String(v[2]||"").trim();
    const role=String(v[3]||"").trim().toLowerCase();
    const action=String(v[4]||"").trim().toUpperCase();
    const state=String(v[5]||"").trim().toUpperCase();
    if(action==="BO_QUA"||["DA_TAO","DA_TON_TAI","CAN_KIEM_TRA_THU_CONG"].includes(state)){skipped++;return;}
    const problems=[];
    if(!email||email.length>180||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))problems.push("Email chưa hợp lệ");
    if(!name||name.length>100)problems.push("Họ tên bắt buộc (tối đa 100 ký tự)");
    if(school.length>100)problems.push("Tên lớp quá dài");
    if(role&&role!=="student"&&role!=="hoc vien"&&role!=="học viên")problems.push('Vai trò chỉ được là "student"');
    if(action&&action!=="CHO_TAO")problems.push('Yêu cầu chỉ được là "CHO_TAO" hoặc "BO_QUA"');
    if(seen.has(email))problems.push("Email trùng trong bảng");
    seen.add(email);
    if(problems.length)invalid.push({row:x.row,message:problems.join("; ")});
    else pending.push({row:x.row,email,name,school});
  });
  return {pending,invalid,skipped};
}
function aliSparkCheck(){
  const sheet=aliSparkSheet_(),data=aliSparkRows_(sheet);
  data.invalid.forEach(x=>sheet.getRange(x.row,8).setValue(x.message));
  SpreadsheetApp.getUi().alert("ALI Spark - Kết quả kiểm tra",
    "Chờ tạo: "+data.pending.length+
    "\nBỏ qua / đã xử lý: "+data.skipped+
    "\nLỗi dữ liệu: "+data.invalid.length+
    (data.invalid.length?"\nHãy xem cột H ở các dòng lỗi.":"\nCó thể chạy thử 2 tài khoản."),
    SpreadsheetApp.getUi().ButtonSet.OK);
}
function aliSparkPilot(){aliSparkRun_(2);}
function aliSparkCreateNext(){aliSparkRun_(ALI_SPARK.perRun);}
function aliSparkRequest_(url,method,token,body){
  const options={
    method:method,
    headers:{"Authorization":"Bearer "+token},
    contentType:"application/json",
    muteHttpExceptions:true
  };
  if(body!==undefined)options.payload=JSON.stringify(body);
  const response=UrlFetchApp.fetch(url,options);
  const code=response.getResponseCode();
  let json={};
  try{json=JSON.parse(response.getContentText());}catch(e){}
  if(code<200||code>=300){
    const detail=json.error&&json.error.message?String(json.error.message):"HTTP "+code;
    const error=new Error("HTTP "+code+": "+detail.substring(0,180));
    error.status=code;
    error.apiCode=detail;
    throw error;
  }
  return json;
}
function aliSparkProfile_(row,uid,token){
  const fields={
    email:{stringValue:row.email},
    name:{stringValue:row.name},
    school:{stringValue:row.school||"ALI English"},
    role:{stringValue:"student"},
    status:{stringValue:"active"},
    createdBy:{stringValue:Session.getEffectiveUser().getEmail()||"ali-spark-sheets"},
    createdAt:{timestampValue:new Date().toISOString()}
  };
  const url="https://firestore.googleapis.com/v1/projects/"+ALI_SPARK.projectId+
    "/databases/(default)/documents/users?documentId="+encodeURIComponent(uid);
  aliSparkRequest_(url,"post",token,{fields});
}
function aliSparkInvite_(email){
  // Firebase's own email template sends a password-reset link; no passwords in Sheets.
  const url="https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key="+encodeURIComponent(ALI_SPARK.webApiKey);
  const response=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",
    payload:JSON.stringify({requestType:"PASSWORD_RESET",email}),muteHttpExceptions:true});
  return response.getResponseCode()===200?"DA_GUI":"CHUA_GUI";
}
function aliSparkRun_(limit){
  const lock=LockService.getDocumentLock()||LockService.getScriptLock();
  if(!lock.tryLock(1500))throw Error("Một quản trị viên đang chạy chức năng nhập. Hãy thử lại.");
  try{
    const sheet=aliSparkSheet_(),parsed=aliSparkRows_(sheet);
    parsed.invalid.forEach(x=>sheet.getRange(x.row,8).setValue(x.message));
    if(parsed.invalid.length)throw Error("Có "+parsed.invalid.length+" dòng sai dữ liệu. Chạy 'Kiểm tra danh sách' trước.");
    const batch=parsed.pending.slice(0,limit);
    if(!batch.length){SpreadsheetApp.getUi().alert("Không còn học viên chờ tạo.");return;}
    const ui=SpreadsheetApp.getUi();
    const confirm=ui.alert("Xác nhận tạo tài khoản thực",
      "Sẽ tạo tối đa "+batch.length+" học viên mới trong dự án Firebase "+ALI_SPARK.projectId+
      ". Email đã tồn tại sẽ không bị thay đổi.\nTiếp tục?",ui.ButtonSet.YES_NO);
    if(confirm!==ui.Button.YES)return;
    // The OAuth token is for the CURRENT Google account, not a shared private key.
    // Required Apps Script scope: https://www.googleapis.com/auth/cloud-platform
    const token=ScriptApp.getOAuthToken();
    const authUrl="https://identitytoolkit.googleapis.com/v1/projects/"+ALI_SPARK.projectId+
      "/accounts?key="+encodeURIComponent(ALI_SPARK.webApiKey);
    const deleteUrl="https://identitytoolkit.googleapis.com/v1/projects/"+ALI_SPARK.projectId+
      "/accounts:delete?key="+encodeURIComponent(ALI_SPARK.webApiKey);
    let created=0,exists=0,errors=0;
    for(const row of batch){
      let uid="",status="",error="",invited="";
      try{
        // UUID-based, nonreused initial password; it is never returned to or stored in the Sheet.
        const password=Utilities.getUuid().replace(/-/g,"")+Utilities.getUuid().replace(/-/g,"")+"!aA1";
        let user=null;
        try{
          user=aliSparkRequest_(authUrl,"post",token,{
            email:row.email,displayName:row.name,password,emailVerified:false,disabled:false
          });
        }catch(e){
          const msg=String(e.apiCode||e.message);
          if(/EMAIL_EXISTS|EMAIL_ALREADY_EXISTS|email.already.exists/i.test(msg)){
            status="DA_TON_TAI";exists++;
          }else throw e;
        }
        if(user){
          uid=String(user.localId||"");
          if(!uid)throw Error("Firebase không trả về UID, phải kiểm tra thủ công.");
          try{
            aliSparkProfile_(row,uid,token);
          }catch(profileError){
            // Prevent orphan accounts if possible. Do not modify old users.
            try{
              aliSparkRequest_(deleteUrl,"post",token,{localId:uid});
              uid="";
              throw Error("Đã hoàn tác tạo tài khoản vì Firestore lỗi: "+profileError.message);
            }catch(rollbackError){
              if(uid)throw Error("CAN_KIEM_TRA_THU_CONG: Firestore lỗi; UID="+uid+
                "; kiểm tra Auth và Firestore trước khi chạy lại. "+profileError.message);
              throw rollbackError;
            }
          }
          try{invited=aliSparkInvite_(row.email);}
          catch(inviteError){invited="CHUA_GUI";}
          status="DA_TAO";created++;
        }
      }catch(e){
        status=/CAN_KIEM_TRA_THU_CONG/.test(String(e.message))?"CAN_KIEM_TRA_THU_CONG":"LOI";
        error=String(e.message||e).substring(0,210);
        errors++;
      }
      sheet.getRange(row.row,6,1,5).setValues([[status,uid,error,new Date(),invited||"CHUA_GUI"]]);
      SpreadsheetApp.flush();
      if(status==="LOI"&&/HTTP 403|PERMISSION_DENIED|insufficient|not enabled|API_KEY_INVALID/i.test(error)){
        ui.alert("Dừng vì thiếu quyền Firebase/Google Cloud.\n"+error);break;
      }
      Utilities.sleep(350);
    }
    ui.alert("Đợt xử lý hoàn thành",
      "Đã tạo: "+created+"\nĐã tồn tại (bỏ qua): "+exists+
      "\nLỗi: "+errors+"\nKiểm tra cột F–J và Firebase Console.",
      ui.ButtonSet.OK);
  }finally{lock.releaseLock();}
}

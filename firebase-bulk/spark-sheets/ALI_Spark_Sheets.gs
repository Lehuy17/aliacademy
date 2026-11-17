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
 * F Trạng thái; G UID; H Lỗi; I Cập nhật; J Giao tài khoản; K Mật khẩu đăng nhập.
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
    .addItem("2. Tạo 2 tài khoản + mật khẩu chính thức", "aliSparkPilot")
    .addItem("3. Tạo tối đa 20 tài khoản + mật khẩu", "aliSparkCreateNext")
    .addSeparator()
    .addItem("4. Đổi mật khẩu khi học viên quên", "aliSparkResetSelected")
    .addToUi();
}
function aliSparkSheet_(){
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ALI_SPARK.tab);
  if(!sheet)throw Error('Không tìm thấy tab "Học viên". Hãy tạo hoặc đổi tên tab.');
  const heads=["Email","Họ tên","Lớp học","Vai trò","Yêu cầu","Trạng thái","UID","Lỗi","Cập nhật","Giao tài khoản","Mật khẩu đăng nhập"];
  if(sheet.getLastRow()===0){
    sheet.getRange(1,1,1,heads.length).setValues([heads]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function aliSparkRows_(sheet){
  const last=sheet.getLastRow();
  if(last<2)return {pending:[],invalid:[],skipped:0};
  const matrix=sheet.getRange(2,1,last-1,11).getDisplayValues();
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
    const chosenPassword=String(v[10]||"");
    const state=String(v[5]||"").trim().toUpperCase();
    if(action==="BO_QUA"||["DA_TAO","DA_TON_TAI","CAN_KIEM_TRA_THU_CONG"].includes(state)){skipped++;return;}
    const problems=[];
    if(!email||email.length>180||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))problems.push("Email chưa hợp lệ");
    if(!name||name.length>100)problems.push("Họ tên bắt buộc (tối đa 100 ký tự)");
    if(school.length>100)problems.push("Tên lớp quá dài");
    if(role&&role!=="student"&&role!=="hoc vien"&&role!=="học viên")problems.push('Vai trò chỉ được là "student"');
    if(action&&action!=="CHO_TAO")problems.push('Yêu cầu chỉ được là "CHO_TAO" hoặc "BO_QUA"');
    if(chosenPassword){try{aliSparkValidatePassword_(chosenPassword);}catch(e){problems.push("Mật khẩu cột K không đạt yêu cầu");}}
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

/* Column K intentionally holds readable ALI-issued login passwords.
 * Protect this Sheet, its version history and all copies from unauthorized access.
 * Passwords remain valid until explicitly changed; editing K alone does not sync Firebase.
 */
function aliSparkPilot(){aliSparkOpenCredentialDialog_("create2");}
function aliSparkCreateNext(){aliSparkOpenCredentialDialog_("create20");}
function aliSparkResetSelected(){aliSparkOpenCredentialDialog_("reset");}

function aliSparkOpenCredentialDialog_(mode){
  if(!["create2","create20","reset"].includes(mode))throw Error("Chế độ không hợp lệ");
  const t=HtmlService.createTemplateFromFile("ALI_Admin_Passwords");
  t.mode=mode;
  const label=mode==="reset"?"ALI · Đổi mật khẩu học viên":"ALI · Tạo tài khoản có mật khẩu chính thức";
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(950).setHeight(620),label);
}
function aliSparkRequest_(url,method,token,body){
  const options={method,headers:{"Authorization":"Bearer "+token},
    contentType:"application/json",muteHttpExceptions:true};
  if(body!==undefined)options.payload=JSON.stringify(body);
  const response=UrlFetchApp.fetch(url,options);
  const status=response.getResponseCode();
  let json={};
  try{json=JSON.parse(response.getContentText());}catch(e){}
  if(status<200||status>=300){
    const detail=json.error&&json.error.message?String(json.error.message):"API_ERROR";
    const error=new Error("HTTP "+status+": "+detail.substring(0,160));
    error.httpStatus=status;
    error.apiCode=detail;
    throw error;
  }
  return json;
}
function aliSparkAuthUrl_(suffix){
  return "https://identitytoolkit.googleapis.com/v1/projects/"+ALI_SPARK.projectId+"/accounts"+suffix;
}
function aliSparkFirestoreUrl_(uid){
  return "https://firestore.googleapis.com/v1/projects/"+ALI_SPARK.projectId+
    "/databases/(default)/documents/users/"+encodeURIComponent(uid);
}
function aliSparkValidatePassword_(password){
  const p=String(password||"");
  if(p.length<12||p.length>72||!/[A-Z]/.test(p)||!/[a-z]/.test(p)||!/[0-9]/.test(p)||!/[^A-Za-z0-9]/.test(p)||/[\r\n]/.test(p))
    throw Error("Mật khẩu cần 12–72 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.");
  return p;
}
function aliSparkSavedPassword_(sheet,row){
  return String(sheet.getRange(row,11).getDisplayValue()||"");
}
function aliSparkStorePassword_(sheet,row,password){
  sheet.getRange(row,11).setNumberFormat("@");
  sheet.getRange(row,11).setValue(password);
}
function aliSparkPassword_(){
  // Two independent UUIDs. Generated on the server; never persist the password.
  return Utilities.getUuid().replace(/-/g,"")+
    Utilities.getUuid().replace(/-/g,"")+"!Aa9";
}
function aliSparkProfileCreate_(row,uid,token){
  const fields={
    email:{stringValue:row.email},
    name:{stringValue:row.name},
    school:{stringValue:row.school||"ALI English"},
    role:{stringValue:"student"},
    status:{stringValue:"active"},
    createdBy:{stringValue:"ali-spark-sheets"},
    createdAt:{timestampValue:new Date().toISOString()}
  };
  const url="https://firestore.googleapis.com/v1/projects/"+ALI_SPARK.projectId+
    "/databases/(default)/documents/users?documentId="+encodeURIComponent(uid);
  return aliSparkRequest_(url,"post",token,{fields});
}
function aliSparkSelectedStudent_(sheet){
  const active=SpreadsheetApp.getActiveSpreadsheet();
  const selected=active.getActiveSheet(),range=selected.getActiveRange();
  if(selected.getSheetId()!==sheet.getSheetId()||!range)
    throw Error('Vui lòng chọn một ô trên dòng học viên trong tab "Học viên".');
  const row=range.getRow();
  if(row<2||row>sheet.getLastRow()||range.getNumRows()!==1)
    throw Error("Chỉ chọn một ô trên đúng một dòng học viên.");
  const v=sheet.getRange(row,1,1,11).getDisplayValues()[0];
  const email=String(v[0]||"").trim().toLowerCase();
  const name=String(v[1]||"").trim();
  const role=String(v[3]||"").trim().toLowerCase();
  const status=String(v[5]||"").trim().toUpperCase();
  const uid=String(v[6]||"").trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error("Email của dòng đang chọn không hợp lệ.");
  if(role&&role!=="student"&&role!=="học viên"&&role!=="hoc vien")
    throw Error("Chỉ hỗ trợ học viên; không được cấp lại mật khẩu giáo viên/Admin.");
  if(!["DA_TAO","DA_TON_TAI"].includes(status))
    throw Error("Dòng này chưa có trạng thái DA_TAO/DA_TON_TAI. Hãy kiểm tra và đối chiếu trước.");
  return {row,email,name,uid,status};
}
function aliSparkPasswordPreview(mode){
  const sheet=aliSparkSheet_();
  if(mode==="reset"){
    const student=aliSparkSelectedStudent_(sheet);
    return {mode,rows:[student],remaining:1};
  }
  if(mode!=="create2"&&mode!=="create20")throw Error("Chế độ không hợp lệ.");
  const parsed=aliSparkRows_(sheet);
  if(parsed.invalid.length)throw Error("Có "+parsed.invalid.length+" dòng sai dữ liệu. Hãy chạy 'Kiểm tra danh sách' và sửa cột H.");
  const limit=mode==="create2"?2:ALI_SPARK.perRun;
  return {mode,rows:parsed.pending.slice(0,limit).map(x=>({
    row:x.row,email:x.email,name:x.name,school:x.school
  })),remaining:parsed.pending.length};
}
function aliSparkSafeError_(error){
  return String(error&&error.message||error||"Không xác định").substring(0,160);
}
function aliSparkWriteResult_(sheet,row,status,uid,error,delivery){
  // Never write a password in any Sheet cell.
  sheet.getRange(row,6,1,5).setValues([[status,uid,error||"",new Date(),delivery||"CHUA_GUI"]]);
}
function aliSparkGetUser_(email,token){
  const data=aliSparkRequest_(aliSparkAuthUrl_(":lookup"),"post",token,{email:[email]});
  const matching=(data.users||[]).filter(u=>String(u.email||"").toLowerCase()===email);
  if(matching.length!==1)throw Error("Không tìm thấy đúng một tài khoản Firebase theo email.");
  return matching[0];
}
function aliSparkRequireStudent_(user,email,uid,token){
  if(!user||String(user.localId||"")!==uid||
     String(user.email||"").toLowerCase()!==email)throw Error("UID/email Firebase không khớp.");
  if(user.disabled)throw Error("Tài khoản Firebase đang bị khóa.");
  if(user.customAttributes){
    let claims;
    try{claims=JSON.parse(user.customAttributes);}catch(e){throw Error("Custom Claims không hợp lệ, từ chối để bảo vệ tài khoản.");}
    if(claims.role&&claims.role!=="student")throw Error("Từ chối: Firebase Custom Claims là giáo viên/Admin.");
  }
  // Must verify the REAL Firestore profile, not an editable Sheet role.
  const doc=aliSparkRequest_(aliSparkFirestoreUrl_(uid),"get",token);
  const fields=doc.fields||{},val=k=>String(fields[k]&&fields[k].stringValue||"");
  if(val("role")!=="student"||val("status")!=="active"||val("email").toLowerCase()!==email)
    throw Error("Hồ sơ Firestore không phải học viên đang hoạt động hoặc email không khớp.");
}
function aliSparkPasswordExecute(mode,expected,chosenNewPassword){
  if(!["create2","create20","reset"].includes(mode)||!Array.isArray(expected)||expected.length<1)
    throw Error("Yêu cầu không hợp lệ.");
  const lock=LockService.getDocumentLock()||LockService.getScriptLock();
  if(!lock.tryLock(5000))throw Error("Một quản trị viên khác đang thao tác. Hãy thử lại.");
  try{
    // Prevent changing target rows between preview and confirmation.
    const fresh=aliSparkPasswordPreview(mode);
    const selected=fresh.rows.map(x=>({row:x.row,email:x.email}));
    if(JSON.stringify(selected)!==JSON.stringify(expected)||
       (mode==="reset"&&selected.length!==1))
      throw Error("Danh sách hoặc dòng đã chọn thay đổi. Đóng cửa sổ và kiểm tra lại.");
    const token=ScriptApp.getOAuthToken();
    const sheet=aliSparkSheet_();
    const results=[];
    if(mode==="reset"){
      const row=fresh.rows[0];
      const result={row:row.row,email:row.email,name:row.name,status:"",password:"",message:""};
      try{
        const user=aliSparkGetUser_(row.email,token),uid=String(user.localId||"");
        if(row.uid&&row.uid!==uid)throw Error("UID trong Sheet khác Firebase. Không đặt lại mật khẩu.");
        aliSparkRequireStudent_(user,row.email,uid,token);
        const password=aliSparkValidatePassword_(chosenNewPassword||aliSparkPassword_());
        aliSparkRequest_(aliSparkAuthUrl_(":update"),"post",token,{localId:uid,password});
        try{aliSparkStorePassword_(sheet,row.row,password);}
        catch(e){result.message="Firebase đã đổi mật khẩu, nhưng chưa lưu được ở K; hãy sao chép mật khẩu trong cửa sổ. ";}
        result.password=password;
        result.status="DA_CAP_LAI";
        try{
          aliSparkWriteResult_(sheet,row.row,row.status,uid,"","CAP_LAI_TAY");
        }catch(e){result.message+="Không thể cập nhật trạng thái Sheet.";}
      }catch(e){result.status="LOI";result.message=aliSparkSafeError_(e);}
      results.push(result);
    }else{
      for(const row of fresh.rows){
        const result={row:row.row,email:row.email,name:row.name,status:"",password:"",message:""};
        let uid="";
        try{
          const password=aliSparkValidatePassword_(aliSparkSavedPassword_(sheet,row.row)||aliSparkPassword_());
          let user=null;
          try{
            user=aliSparkRequest_(aliSparkAuthUrl_(""),"post",token,{
              email:row.email,displayName:row.name,password,emailVerified:false,disabled:false
            });
          }catch(e){
            if(/EMAIL_EXISTS|EMAIL_ALREADY_EXISTS|email.already.exists/i.test(String(e.apiCode||e.message))){
              result.status="DA_TON_TAI";
              result.message="Đã có tài khoản. Không thay đổi mật khẩu cũ; chọn dòng rồi sử dụng mục cấp lại nếu cần.";
              try{aliSparkWriteResult_(sheet,row.row,result.status,"","","CHUA_GUI");}catch(e){}
            }else throw e;
          }
          if(user){
            uid=String(user.localId||"");
            if(!uid)throw Error("Firebase không trả UID; cần kiểm tra thủ công.");
            try{
              aliSparkProfileCreate_(row,uid,token);
            }catch(profileError){
              let deleted=false;
              try{
                aliSparkRequest_(aliSparkAuthUrl_(":delete"),"post",token,{localId:uid});
                deleted=true;
              }catch(e){}
              if(!deleted){
                result.status="CAN_KIEM_TRA_THU_CONG";
                result.message="Firestore lỗi và không thể hoàn tác Auth. Kiểm tra UID "+uid+" trong Firebase.";
                try{aliSparkWriteResult_(sheet,row.row,result.status,uid,result.message,"CHUA_GUI");}catch(e){}
              }else{
                uid="";
                throw Error("Đã hoàn tác tài khoản mới do lỗi Firestore: "+aliSparkSafeError_(profileError));
              }
            }
            if(!result.status){
              result.status="DA_TAO";
              result.password=password;
              result.message="Mật khẩu chính thức; chỉ đổi khi có yêu cầu. "; 
              try{aliSparkStorePassword_(sheet,row.row,password);result.message+="Đã lưu ở cột K.";}catch(e){result.message+="Không lưu được cột K; hãy sao chép trong cửa sổ.";}
              try{aliSparkWriteResult_(sheet,row.row,result.status,uid,"","CAP_TAY");}
              catch(e){result.message+=" Không cập nhật được cột trạng thái; kiểm tra UID trong Firebase.";}
            }
          }
        }catch(e){
          if(!result.status)result.status="LOI";
          result.message=result.message||aliSparkSafeError_(e);
          try{aliSparkWriteResult_(sheet,row.row,result.status,uid,result.message,"CHUA_GUI");}catch(e){}
        }
        results.push(result);
        Utilities.sleep(350);
      }
    }
    SpreadsheetApp.flush();
    return {mode,results};
  }finally{lock.releaseLock();}
}

/* ALI English unified results — score only sections with verified marking. */
(function(global){
'use strict';
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;}
function fmt(n){return Number(n).toLocaleString('vi-VN',{maximumFractionDigits:1});}
function render(targetId,data){
 const target=document.getElementById(targetId);
 if(!target)throw Error('Missing ALI results container: '+targetId);
 target.replaceChildren();target.hidden=false;target.classList.remove('ali-hidden');
 target.append(el('div','ali-result-eyebrow','ALI ACADEMY · BÀI KIỂM TRA'));
 target.append(el('h2','','Đã hoàn thành bài kiểm tra'));
 target.append(el('p','','Kết quả, đáp án chi tiết và gợi ý xếp lớp chỉ dành cho giáo viên ALI. Học viên sẽ được giáo viên phản hồi sau khi bài nộp được ghi nhận.'));
 target.append(el('p','ali-result-note','Với các kỹ năng tự luận, nói hoặc viết, giáo viên cần chấm bổ sung trước khi xác nhận trình độ.'));
 const back=el('a','ali-result-btn ali-result-secondary','← Danh sách bài test');
 back.href='./tests.html?step=choose';target.append(back);
 document.dispatchEvent(new CustomEvent('ali:placement-graded',{detail:{test:location.pathname.split('/').pop()}}));
 target.scrollIntoView({behavior:'smooth',block:'start'});
}
global.ALIResults={render};
})(window);

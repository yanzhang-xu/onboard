const INSTALLED_BANK=window.QuestionBankAPI?.getInstalled(),BANK=INSTALLED_BANK?.manifest||window.PDF_BANK,CARDS=INSTALLED_BANK?.cards||window.CARD_BANK,KEY=`dataAnalysisQuiz.${BANK.version}`,state=JSON.parse(localStorage.getItem(KEY)||'{"days":{},"wrong":[]}'),$=s=>document.querySelector(s),letters='ABCD',dayKey=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()),FIRST_DAY='2026-09-09';let mode='today',historyDate=null,calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
const FIXED_GROUP_ORDER=shuffle(BANK.groups.map(g=>g.id),`${BANK.version}:fixed-schedule-v1`);
const DAILY_MOTTOS=['先估后算，速度翻倍','简算一步，领先一路','数字再多，也有捷径','把复杂拆小，把速度练快','先找关系，再动笔计算','巧算靠方法，提速靠积累','每天十题，稳步提速','看准基期，算得更快','少算一步，多赢一分','练的是简算，涨的是分数','先判断量级，再精确计算','今天的熟练，换考场的从容'];
function dailyMotto(date){const random=rng(hash(`${date}:motto-v1`));return DAILY_MOTTOS[Math.floor(random()*DAILY_MOTTOS.length)]}
if(!state.notes||typeof state.notes!=='object')state.notes={};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}function hash(t){let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}function shuffle(a,s){const o=[...a],r=rng(hash(s));for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}return o}function getGroup(id){return BANK.groups.find(g=>g.id===id)}function assignedGroups(){return new Set(Object.values(state.days).flatMap(d=>d.groupIds||[]))}
function scheduleOffset(date){const [y,m,d]=date.split('-').map(Number),[fy,fm,fd]=FIRST_DAY.split('-').map(Number);return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(fy,fm-1,fd))/86400000)}
function scheduledGroups(date){const offset=scheduleOffset(date);return offset<0?[]:FIXED_GROUP_ORDER.slice(offset*2,offset*2+2)}
function ensureDate(date){if(date<FIRST_DAY||date>dayKey)return null;const fixedIds=scheduledGroups(date);if(!state.days[date]){state.days[date]={groupIds:fixedIds,answers:{},submitted:[],complete:false,timer:{elapsedMs:0,runningSince:null,started:false,finishedAt:null}};save()}else{const record=state.days[date],hasWork=record.complete||record.timer?.started||Object.values(record.answers||{}).some(a=>a.some(Boolean));if(!hasWork&&JSON.stringify(record.groupIds)!==JSON.stringify(fixedIds)){record.groupIds=fixedIds;record.answers={};record.submitted=[];save()}}if(!state.days[date].timer){const hasWork=Object.values(state.days[date].answers||{}).some(a=>a.some(Boolean));state.days[date].timer={elapsedMs:0,runningSince:null,started:hasWork,finishedAt:null}}return state.days[date]}
function ensureToday(){return ensureDate(dayKey)}
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),2200)}function setWrong(g,i,w){state.wrong=state.wrong.filter(x=>!(x.groupId===g&&x.index===i));if(w)state.wrong.push({groupId:g,index:i})}function getCard(id){return CARDS.cards.find(c=>c.id===id)}
function groupCard(g,n,d=null,review=false){const card=getCard(g.id),fallback=CARDS.parseFailures.includes(g.id),c=document.createElement('article');c.className='material-card card';const chosen=d?.answers[g.id]||Array(5).fill(''),submitted=review||d?.submitted.includes(g.id);c.innerHTML=`<div class="material-head"><div><span class="q-no">材料 ${n}</span><strong>${g.title}</strong></div><span class="page-chip">题本 ${g.startPage}–${g.endPage} 页</span></div><div class="content-mode ${fallback?'image':'text'}">${fallback?'复杂版式 · 精准原图':'文字题面 · 图表保留原图'}</div><div class="material-content"></div><div class="answer-sheet"><h3>答题卡 <small>按题面出现顺序填写</small></h3><div class="answer-grid"></div></div><div class="material-actions"><span class="group-result"></span>${review?'':'<button class="primary submit-group">提交本组</button>'}</div>`;const content=c.querySelector('.material-content');if(!fallback&&card.materialText){const h=document.createElement('h3');h.textContent='资料';const p=document.createElement('div');p.className='material-text';p.textContent=card.materialText;content.append(h,p)}if(card.visuals.length){const stack=document.createElement('div');stack.className='visual-stack';card.visuals.forEach((src,i)=>{const img=document.createElement('img');img.src=src;img.loading=i?'lazy':'eager';img.alt=`${g.title} ${fallback?'题面':'图表'} ${i+1}`;stack.appendChild(img)});content.appendChild(stack)}if(!fallback){const wrap=document.createElement('div');wrap.className='question-text-list';card.questions.forEach(q=>{const section=document.createElement('section');section.className='question-text';const label=document.createElement('span');label.textContent=`第 ${q.label} 题`;const text=document.createElement('p');text.textContent=q.text;section.append(label,text);wrap.appendChild(section)});content.appendChild(wrap)}else{const tip=document.createElement('p');tip.className='crop-tip';tip.textContent='该材料包含复杂表格或跨页图形，已从原题本精准裁出；下方答题卡按图片中题目顺序填写。';content.appendChild(tip)}const grid=c.querySelector('.answer-grid');for(let i=0;i<5;i++){const row=document.createElement('div');row.className='answer-row';row.innerHTML=`<b>本组第 ${i+1} 题</b><div></div>`;for(const l of letters){const b=document.createElement('button');b.textContent=l;b.className='answer-choice';if(chosen[i]===l)b.classList.add('selected');if(submitted&&g.answers[i]===l)b.classList.add('correct');if(submitted&&chosen[i]===l&&chosen[i]!==g.answers[i])b.classList.add('wrong');b.disabled=submitted||review;b.onclick=()=>{const a=d.answers[g.id]||Array(5).fill('');a[i]=l;d.answers[g.id]=a;save();render()};row.querySelector('div').appendChild(b)}grid.appendChild(row)}const score=chosen.filter((a,i)=>a===g.answers[i]).length;if(submitted)c.querySelector('.group-result').textContent=`本组 ${score} / 5`;const submit=c.querySelector('.submit-group');if(submit){submit.disabled=chosen.some(a=>!a);submit.onclick=()=>{if(chosen.some(a=>!a)){toast('请先完成本组 5 道题');return}d.submitted.push(g.id);chosen.forEach((a,i)=>setWrong(g.id,i,a!==g.answers[i]));d.complete=d.groupIds.every(id=>d.submitted.includes(id));save();render();toast(`本组答对 ${score} 题`)}}return c}
function allStats(){let total=0,correct=0;for(const d of Object.values(state.days))for(const id of d.submitted||[]){const g=getGroup(id),a=d.answers[id]||[];g.answers.forEach((x,i)=>{total++;if(a[i]===x)correct++})}return{total,correct}}function completeDates(){return Object.entries(state.days).filter(([,d])=>d.complete).map(([k])=>k)}function streak(){let n=0,d=new Date(dayKey+'T12:00:00'),done=new Set(completeDates());while(done.has(new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(d))){n++;d.setDate(d.getDate()-1)}return n}
function renderCalendar(){const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth(),first=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),box=$('#calendar'),done=new Set(completeDates());$('#calendarMonth').textContent=`${year} 年 ${month+1} 月`;box.innerHTML='';['一','二','三','四','五','六','日'].forEach(x=>{const s=document.createElement('span');s.textContent=x;box.appendChild(s)});for(let i=0;i<(first.getDay()+6)%7;i++)box.appendChild(document.createElement('span'));for(let n=1;n<=days;n++){const date=`${year}-${String(month+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`,s=document.createElement('span');s.textContent=n;if(done.has(date))s.classList.add('done');if(date===dayKey)s.classList.add('today');if(date===historyDate)s.classList.add('selected');if(date>=FIRST_DAY&&date<=dayKey){s.classList.add('clickable');s.onclick=()=>{if(date===dayKey){selectMode('today')}else{ensureDate(date);mode='history';historyDate=date;for(const id of ['todayBtn','mistakesBtn'])$('#'+id).classList.remove('active');render();updateTimer();scrollTo({top:0,behavior:'smooth'})}}}else s.classList.add('unavailable');box.appendChild(s)}const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1),firstMonth=new Date(2026,8,1);$('#calendarNextBtn').disabled=calendarCursor>=currentMonth;$('#calendarPrevBtn').disabled=calendarCursor<=firstMonth}
function render(){const d=ensureToday(),stats=allStats(),assigned=assignedGroups().size*5;$('#startQuizBtn').hidden=mode!=='today'||d.timer.started;$('#bankCount').textContent=BANK.totalQuestions;$('#streakCount').textContent=streak();$('#accuracyCount').textContent=stats.total?Math.round(stats.correct/stats.total*100)+'%':'--';$('#roundText').textContent=`${assigned} / ${BANK.totalQuestions}`;$('#roundBar').style.width=`${assigned/BANK.totalQuestions*100}%`;renderCalendar();const list=$('#quizList');list.innerHTML='';$('#resultCard').hidden=true;if(mode==='history'){const past=Object.entries(state.days).filter(([date,record])=>date<dayKey&&record?.groupIds?.length).sort(([a],[b])=>b.localeCompare(a));$('#pageTitle').textContent='往日试题';$('#progressBar').style.width='100%';if(historyDate&&past.some(([date])=>date===historyDate)){const record=state.days[historyDate],used=formatTimer(record.timer?.elapsedMs||0);$('#dateText').textContent=`${historyDate} · ${record.complete?'已完成':'未完成'} · 用时 ${used}`;$('#progressText').textContent=`${record.groupIds.length*5} 题`;const bar=document.createElement('article');bar.className='history-toolbar card';bar.innerHTML=`<button class="history-back">← 返回日期列表</button><strong>${historyDate}</strong>`;bar.querySelector('button').onclick=()=>{historyDate=null;render()};list.appendChild(bar);record.groupIds.forEach((id,i)=>{const group=getGroup(id);if(group)list.appendChild(groupCard(group,i+1,record,true))})}else{$('#dateText').textContent='只显示今天以前已经生成过的试题';$('#progressText').textContent=`${past.length} 天`;if(!past.length)list.innerHTML='<article class="empty card"><h2>还没有往日试题</h2><p>完成今天的题目后，明天可以在这里回看。</p></article>';else for(const [date,record] of past){const card=document.createElement('article'),answered=record.groupIds.reduce((n,id)=>n+(record.answers?.[id]||[]).filter(Boolean).length,0);card.className='history-card card';card.innerHTML=`<div class="history-date"><strong>${date.slice(5).replace('-','月')}日</strong><span>${record.complete?'已完成':'未完成'}</span></div><div class="history-summary">${answered} / ${record.groupIds.length*5} 题 · 用时 ${formatTimer(record.timer?.elapsedMs||0)}</div><button>查看试题</button>`;card.querySelector('button').onclick=()=>{historyDate=date;render();scrollTo({top:0,behavior:'smooth'})};list.appendChild(card)}}return}if(mode==='review'){renderReview(list);return}$('#pageTitle').textContent='今日资料分析 10 题 🔥';$('#dateText').textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date())+' · 每篇材料完整保留图表与表格';if(!d.groupIds.length){$('#startQuizBtn').hidden=true;list.innerHTML='<article class="empty card"><div class="empty-icon">✓</div><h2>整本题库已经刷完</h2><p>1015 道题全部出现过，没有重复抽题。</p></article>';return}const answered=d.groupIds.reduce((n,id)=>n+(d.answers[id]||[]).filter(Boolean).length,0),total=d.groupIds.length*5;$('#progressText').textContent=`${answered} / ${total}`;$('#progressBar').style.width=`${answered/total*100}%`;$('#taskQuiz').checked=answered===total;$('#taskReview').checked=d.complete;if(!d.timer.started){list.innerHTML='<article class="empty card"><div class="empty-icon">10</div><h2>今日 10 题已准备好</h2><p>点击“开始答题”后显示题目并开始计时。</p></article>';return}d.groupIds.forEach((id,i)=>list.appendChild(groupCard(getGroup(id),i+1,d)));if(d.complete){const correct=d.groupIds.reduce((n,id)=>{const g=getGroup(id),a=d.answers[id]||[];return n+a.filter((x,i)=>x===g.answers[i]).length},0);$('#resultCard').hidden=false;$('#scoreText').textContent=`${correct} / ${total}`;$('#resultTitle').textContent=correct===total?'漂亮，全对！':'完成今日打卡';$('#resultDetail').textContent=`答对 ${correct} 题 · 用时 ${formatTimer(d.timer.elapsedMs)}，错题已自动收录。`}}
function selectMode(next){mode=next;historyDate=null;for(const id of ['todayBtn','mistakesBtn'])$('#'+id).classList.toggle('active',id===`${next==='review'?'mistakes':next}Btn`);render();updateTimer()}
$('#todayBtn').onclick=()=>selectMode('today');$('#mistakesBtn').onclick=()=>selectMode('review');$('#reviewBtn').onclick=()=>{selectMode('review');scrollTo({top:0,behavior:'smooth'})};
$('#calendarPrevBtn').onclick=()=>{const firstMonth=new Date(2026,8,1);if(calendarCursor>firstMonth){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()}};
$('#calendarNextBtn').onclick=()=>{const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);if(calendarCursor<currentMonth){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()}};

function exportQuizData(){
  const backup={app:'每日资料分析',version:BANK.version,exportedAt:new Date().toISOString(),data:state};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`资料分析答题记录-${dayKey}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('答题记录已导出');
}
function normalizeImportedData(backup){
  if(!backup||backup.version!==BANK.version||!backup.data||typeof backup.data!=='object')throw new Error('这不是当前题库的备份文件');
  const source=backup.data,validIds=new Set(BANK.groups.map(g=>g.id)),days={};
  if(!source.days||typeof source.days!=='object'||Array.isArray(source.days))throw new Error('备份中的每日记录格式不正确');
  for(const [date,record] of Object.entries(source.days)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!record||typeof record!=='object')continue;
    const groupIds=[...new Set(Array.isArray(record.groupIds)?record.groupIds.filter(id=>validIds.has(id)):[])].slice(0,2),answers={};
    for(const id of groupIds){const raw=record.answers?.[id];answers[id]=Array.from({length:5},(_,i)=>letters.includes(raw?.[i])?raw[i]:'')}
    const submitted=[...new Set(Array.isArray(record.submitted)?record.submitted.filter(id=>groupIds.includes(id)):[])];
    const elapsedMs=Number.isFinite(record.timer?.elapsedMs)&&record.timer.elapsedMs>=0?Math.floor(record.timer.elapsedMs):0,started=Boolean(record.timer?.started||elapsedMs||Object.values(answers).some(a=>a.some(Boolean))),finishedAt=Number.isFinite(record.timer?.finishedAt)?record.timer.finishedAt:null;
    days[date]={groupIds,answers,submitted,complete:groupIds.length>0&&groupIds.every(id=>submitted.includes(id)),timer:{elapsedMs,runningSince:null,started,finishedAt}};
  }
  const wrong=Array.isArray(source.wrong)?source.wrong.filter(x=>x&&validIds.has(x.groupId)&&Number.isInteger(x.index)&&x.index>=0&&x.index<5).map(x=>({groupId:x.groupId,index:x.index})):[],notes={};
  if(source.notes&&typeof source.notes==='object'&&!Array.isArray(source.notes))for(const [key,value] of Object.entries(source.notes)){const match=/^(material-\d+):(\d)$/.exec(key);if(match&&validIds.has(match[1])&&Number(match[2])<5&&typeof value==='string')notes[key]=value.slice(0,5000)}
  return{days,wrong,notes};
}
async function importQuizData(file){
  if(!file)return;
  if(file.size>2*1024*1024){toast('备份文件过大');return}
  try{
    const imported=normalizeImportedData(JSON.parse(await file.text()));
    if(!confirm('导入将覆盖当前浏览器中的答题记录，是否继续？'))return;
    localStorage.setItem(KEY,JSON.stringify(imported));location.reload();
  }catch(error){toast(error.message||'导入失败，请检查文件')}
}
$('#exportDataBtn').onclick=exportQuizData;
$('#importDataBtn').onclick=()=>$('#importDataFile').click();
$('#importDataFile').onchange=e=>{importQuizData(e.target.files[0]);e.target.value=''};

function reminderMessage(){const url=location.href.split('?')[0].split('#')[0];return`今天的资料分析 10 题还没完成，记得抽时间刷题。\n${dailyMotto(dayKey)}\n${url}`}
$('#emailReminderBtn').onclick=()=>{const subject=encodeURIComponent('每日资料分析刷题提醒'),body=encodeURIComponent(reminderMessage());location.href=`mailto:?subject=${subject}&body=${body}`};

function timerElapsed(timer){return Math.max(0,timer.elapsedMs+(timer.runningSince?Date.now()-timer.runningSince:0))}
function formatTimer(ms){const seconds=Math.floor(ms/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return[h,m,s].map(x=>String(x).padStart(2,'0')).join(':')}
function activeDatedRecord(){return mode==='history'&&historyDate&&state.days[historyDate]?{date:historyDate,record:state.days[historyDate]}:{date:dayKey,record:ensureToday()}}
function updateTimer(){const display=$('#timerDisplay');if(!display)return;const active=activeDatedRecord(),timer=active.record.timer;display.textContent=formatTimer(timerElapsed(timer))}
function stopTimer(d){const timer=d.timer;if(timer.runningSince)timer.elapsedMs=timerElapsed(timer);timer.runningSince=null;timer.finishedAt=Date.now()}
$('#startQuizBtn').onclick=()=>{const active=activeDatedRecord(),now=Date.now();for(const record of Object.values(state.days)){const other=record.timer;if(other?.runningSince&&other!==active.record.timer){other.elapsedMs=timerElapsed(other);other.runningSince=null}}const timer=active.record.timer;if(!timer.started){timer.started=true;timer.runningSince=now;timer.finishedAt=null;save()}render();updateTimer()};
setInterval(updateTimer,500);updateTimer();

$('#currentBankName').textContent=`当前：${BANK.source||BANK.name||'已导入题库'}`;
$('#restoreBuiltinBankBtn').hidden=!INSTALLED_BANK;
$('#bankImportStatus').textContent=window.QUIZ_CONFIG?.pdfImportEndpoint?'可上传 PDF 并生成新题库':'已预留 PDF 处理接口';
$('#importPdfBankBtn').onclick=()=>{
  if(!window.QUIZ_CONFIG?.pdfImportEndpoint){toast('PDF 导入接口已预留，配置处理服务后即可使用');return}
  $('#pdfBankFile').click();
};
$('#pdfBankFile').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  $('#bankImportStatus').textContent='正在处理题库，请稍候…';
  try{await window.QuestionBankAPI.importPdf(file);location.reload()}catch(error){$('#bankImportStatus').textContent='导入失败';toast(error.message||'PDF 题库导入失败')}
};
$('#restoreBuiltinBankBtn').onclick=()=>{if(confirm('恢复内置题库？已导入题库的本地答题记录不会被删除。')){window.QuestionBankAPI.restoreBuiltin();location.reload()}};

function cropGroupCard(g,n,d=null,review=false){
  const card=getCard(g.id),c=document.createElement('article');
  const mistakeReview=review&&mode==='review',wrongIndexes=new Set(mistakeReview?state.wrong.filter(x=>x.groupId===g.id).map(x=>x.index):[]);
  const historyAnswers=review&&!d?Object.entries(state.days).sort(([a],[b])=>b.localeCompare(a)).map(([,day])=>day.answers?.[g.id]).find(Boolean):null;
  const chosen=d?.answers[g.id]||historyAnswers||Array(5).fill(''),submitted=review||d?.submitted.includes(g.id);
  c.className='material-card card';
  c.innerHTML=`<div class="material-head"><div><span class="q-no">${mistakeReview?'错题材料':'材料'} ${n}</span><strong>${g.title}</strong></div><span class="page-chip">${mistakeReview?wrongIndexes.size+' 道错题':'5 题'}</span></div><div class="material-content"><div class="visual-stack crop-stack"></div></div><div class="answer-sheet"><h3>${mistakeReview?'错题答案':'答题卡'} <small>${review?'红色是你的答案，绿色是正确答案':'按图片中题目顺序填写'}</small></h3><div class="answer-grid"></div></div><div class="material-actions"><span class="group-result"></span>${review?'':'<button class="primary submit-group">提交本组</button>'}</div>`;
  const stack=c.querySelector('.crop-stack');
  const materialSources=mistakeReview&&card.visuals?.length?card.visuals:card.fullVisuals;
  materialSources.forEach((src,i)=>{const img=document.createElement('img');img.src=src;img.loading=i?'lazy':'eager';img.alt=`${g.title} ${mistakeReview?'材料与图表':'原题裁剪'} ${i+1}`;stack.appendChild(img)});
  const grid=c.querySelector('.answer-grid'),rows=[];
  for(let i=0;i<5;i++){
    const row=document.createElement('div');row.className='answer-row';row.innerHTML=`<b>本组第 ${i+1} 题</b><div></div>`;
    if(mistakeReview&&wrongIndexes.has(i))row.classList.add('wrong-review-row');
    for(const l of letters){const b=document.createElement('button');b.textContent=l;b.className='answer-choice';if(chosen[i]===l)b.classList.add('selected');if(submitted&&g.answers[i]===l)b.classList.add('correct');if(submitted&&chosen[i]===l&&chosen[i]!==g.answers[i])b.classList.add('wrong');b.disabled=submitted||review;b.onclick=()=>{const a=d.answers[g.id]||Array(5).fill('');a[i]=l;d.answers[g.id]=a;save();render()};row.querySelector('div').appendChild(b)}
    rows[i]=row;if(!mistakeReview)grid.appendChild(row);
  }
  if(mistakeReview){
    const panel=document.createElement('section');panel.className='material-review-notes';panel.innerHTML=`<div class="material-review-head"><div><span>本材料错题</span><strong>${wrongIndexes.size} 道</strong></div><small>逐题复盘 · 自动保存</small></div>`;
    [...wrongIndexes].sort((a,b)=>a-b).forEach(i=>{const key=`${g.id}:${i}`,questionNo=card.questions?.[i]?.label||i+1,item=document.createElement('div'),head=document.createElement('div'),title=document.createElement('strong'),answerTitle=document.createElement('div'),noteHead=document.createElement('div'),label=document.createElement('label'),status=document.createElement('span'),note=document.createElement('textarea'),noteId=`note-${g.id}-${i}`;item.className='material-note-item';head.className='material-question-title';title.textContent=`第 ${questionNo} 题`;head.appendChild(title);item.appendChild(head);const crops=card.questionCrops?.[i]||[];if(crops.length){const cropStack=document.createElement('div');cropStack.className='wrong-question-crops';crops.forEach((src,cropIndex)=>{const img=document.createElement('img');img.src=src;img.loading='lazy';img.alt=`${g.title} 第 ${questionNo} 题原题裁剪 ${cropIndex+1}`;cropStack.appendChild(img)});item.appendChild(cropStack)}answerTitle.className='mistake-answer-title';answerTitle.innerHTML='<strong>错题答案</strong><small>红色是你的答案，绿色是正确答案</small>';item.append(answerTitle,rows[i]);noteHead.className='material-note-title';label.htmlFor=noteId;label.textContent='我的错题解析';status.textContent='自动保存';noteHead.append(label,status);item.appendChild(noteHead);note.id=noteId;note.maxLength=5000;note.rows=4;note.placeholder=`写下第 ${questionNo} 题的错误原因、关键公式、简算方法或注意事项…`;note.value=state.notes[key]||'';note.oninput=()=>{state.notes[key]=note.value;save();status.textContent='已保存';clearTimeout(note.savedTimer);note.savedTimer=setTimeout(()=>status.textContent='自动保存',1200)};item.appendChild(note);panel.appendChild(item)});
    c.querySelector('.answer-sheet').remove();c.querySelector('.material-content').after(panel);
  }
  const score=chosen.filter((a,i)=>a===g.answers[i]).length;
  if(submitted)c.querySelector('.group-result').textContent=`本组 ${score} / 5`;
  const submit=c.querySelector('.submit-group');
  if(submit){submit.disabled=chosen.some(a=>!a);submit.onclick=()=>{if(chosen.some(a=>!a)){toast('请先完成本组 5 道题');return}d.submitted.push(g.id);chosen.forEach((a,i)=>setWrong(g.id,i,a!==g.answers[i]));d.complete=d.groupIds.every(id=>d.submitted.includes(id));if(d.complete)stopTimer(d);save();render();updateTimer();toast(d.complete?`答题完成，用时 ${formatTimer(d.timer.elapsedMs)}`:`本组答对 ${score} 题`)}}
  return c;
}

function wrongDate(groupId){return Object.entries(state.days).filter(([,day])=>day.groupIds?.includes(groupId)).sort(([a],[b])=>b.localeCompare(a))[0]?.[0]||'未标记日期'}
function buildReviewEntries(){return state.wrong.map(item=>{const group=getGroup(item.groupId),date=wrongDate(item.groupId),chosen=state.days[date]?.answers?.[item.groupId]?.[item.index]||'';return{...item,key:`${item.groupId}:${item.index}`,date,group,chosen,correct:group?.answers?.[item.index]||''}}).filter(item=>item.group).sort((a,b)=>b.date.localeCompare(a.date)||a.group.id.localeCompare(b.group.id)||a.index-b.index)}
function renderReview(list){
  const reviewEntries=buildReviewEntries();
  $('#pageTitle').textContent='错题复盘';$('#dateText').textContent=`共 ${reviewEntries.length} 道错题，按日期回看原题并记录解析`;$('#progressText').textContent=`${reviewEntries.length} 道`;$('#progressBar').style.width='100%';
  if(!reviewEntries.length){list.innerHTML='<article class="empty card"><h2>错题本还是空的</h2><p>提交答题卡后，做错的题会自动收录。</p></article>';return}
  const dates=[...new Set(reviewEntries.map(item=>item.date))];
  dates.forEach(date=>{const dayEntries=reviewEntries.filter(item=>item.date===date),heading=document.createElement('div');heading.className='review-date-divider';heading.innerHTML=`<strong>${date}</strong><span>${dayEntries.length} 道错题</span>`;list.appendChild(heading);const ids=[...new Set(dayEntries.map(item=>item.groupId))];ids.forEach((id,i)=>list.appendChild(cropGroupCard(getGroup(id),i+1,null,true)))});
}

const renderDefault=render;
function showReadyCover(list,isPast=false){
  list.innerHTML=`<article class="ready-card card"><div class="ready-number"><strong>10</strong><small>题</small></div><div class="ready-copy"><span class="ready-kicker">${isPast?'往期补练':'今日挑战'}</span><h2>${isPast?'补上这一天，进度不断档':'两篇材料，十道题'}</h2><p>固定题序 · 完成后自动保存答题记录与用时</p></div><button class="primary cover-start">${isPast?'开始补题':'开始答题'}<span>→</span></button></article>`;
  list.querySelector('.cover-start').onclick=()=>$('#startQuizBtn').click();
}
render=function(){
  renderDefault();
  document.body.classList.toggle('review-mode',mode==='review');
  if(mode==='today')$('#dateText').textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date())+` · ${dailyMotto(dayKey)}`;
  const start=$('#startQuizBtn');
  start.textContent='开始答题';
  if(mode==='today'&&!ensureToday().timer.started){showReadyCover($('#quizList'));return}
  if(mode!=='history'||!historyDate)return;
  const record=state.days[historyDate];
  if(!record||historyDate<FIRST_DAY||historyDate>=dayKey)return;
  const list=$('#quizList'),total=record.groupIds.length*5,answered=record.groupIds.reduce((n,id)=>n+(record.answers?.[id]||[]).filter(Boolean).length,0);
  $('#pageTitle').textContent=`${historyDate} 往期试题`;
  $('#dateText').textContent=`固定顺序第 ${scheduleOffset(historyDate)+1} 天 · ${record.complete?'已完成':'可补做'}`;
  $('#progressText').textContent=`${answered} / ${total}`;
  $('#progressBar').style.width=`${total?answered/total*100:0}%`;
  start.textContent='开始补题';
  start.hidden=record.complete||record.timer.started||!record.groupIds.length;
  list.innerHTML='';
  if(!record.timer.started){
    showReadyCover(list,true);
    return;
  }
  const bar=document.createElement('article');
  bar.className='history-toolbar card';
  bar.innerHTML=`<button class="history-back">← 返回日期列表</button><strong>${historyDate} · 用时 ${formatTimer(record.timer.elapsedMs||0)}</strong>`;
  bar.querySelector('button').onclick=()=>{historyDate=null;render();updateTimer()};
  list.appendChild(bar);
  record.groupIds.forEach((id,i)=>{const group=getGroup(id);if(group)list.appendChild(groupCard(group,i+1,record,record.complete))});
  if(record.complete){
    const correct=record.groupIds.reduce((n,id)=>{const group=getGroup(id),answers=record.answers[id]||[];return n+answers.filter((x,i)=>x===group.answers[i]).length},0);
    $('#resultCard').hidden=false;$('#scoreText').textContent=`${correct} / ${total}`;$('#resultTitle').textContent='往期补题完成';$('#resultDetail').textContent=`用时 ${formatTimer(record.timer.elapsedMs||0)}，记录已保存。`;
  }
};

groupCard=cropGroupCard;
render();

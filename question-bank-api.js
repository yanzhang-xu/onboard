(function(){
  const STORAGE_KEY='dataAnalysisQuiz.importedBank.v1';
  function validate(payload){
    const bank=payload?.bank||payload,manifest=bank?.manifest,cards=bank?.cards;
    if(!manifest||!cards||!Array.isArray(manifest.groups)||!Array.isArray(cards.cards))throw new Error('接口返回的题库格式不正确');
    if(!manifest.version||!manifest.groups.length)throw new Error('题库缺少版本或题组');
    const cardIds=new Set(cards.cards.map(c=>c.id));
    for(const group of manifest.groups){
      if(!group.id||!cardIds.has(group.id)||!Array.isArray(group.answers)||group.answers.length!==5||group.answers.some(x=>!['A','B','C','D'].includes(x)))throw new Error('题组或答案格式不正确');
    }
    for(const card of cards.cards){if(!Array.isArray(card.fullVisuals)||!card.fullVisuals.length)throw new Error('题组缺少题面图片')}
    manifest.totalQuestions=manifest.groups.length*5;
    return{manifest,cards};
  }
  function getInstalled(){
    try{return validate(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}catch(_){return null}
  }
  async function importPdf(file){
    if(!file||file.type!=='application/pdf')throw new Error('请选择 PDF 文件');
    const endpoint=window.QUIZ_CONFIG?.pdfImportEndpoint;
    if(!endpoint)throw new Error('PDF 导入接口已预留，配置处理服务后即可使用');
    const body=new FormData();body.append('file',file,file.name);
    const response=await fetch(endpoint,{method:'POST',body});
    if(!response.ok)throw new Error(`题库处理失败（${response.status}）`);
    const bank=validate(await response.json());
    localStorage.setItem(STORAGE_KEY,JSON.stringify(bank));
    return bank;
  }
  function restoreBuiltin(){localStorage.removeItem(STORAGE_KEY)}
  window.QuestionBankAPI={getInstalled,importPdf,restoreBuiltin,validate};
})();

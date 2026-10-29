/* Local UI translations. Project names and unknown technical diagnostics stay verbatim. */
(function(root) {
  'use strict';
  const messages = [
    ['QuietCut · Tutorial Audio Editor','QuietCut · Éditeur audio pour tutoriels','QuietCut · 教程视频音频编辑器'],
    ['QuietCut home','Accueil QuietCut','QuietCut 主页'],
    ['Language','Langue','语言'],
    ['LOCAL','LOCAL','本地'],
    ['YOUR WORKSPACE','VOTRE ESPACE','工作区'],
    ['＋ Import a video','＋ Importer une vidéo','＋ 导入视频'],
    ['Use browser file picker','Choisir via le navigateur','使用浏览器选择文件'],
    ['RECENT PROJECTS','PROJETS RÉCENTS','最近的项目'],
    ['Saved projects','Projets enregistrés','已保存的项目'],
    ['Processing stays on this computer','Le traitement reste sur cet ordinateur','所有处理均在本机完成'],
    ['Made for a clearer tutorial.','Pour des tutoriels plus clairs.','让教程讲解更清晰。'],
    ['TUTORIAL AUDIO EDITOR','ÉDITEUR AUDIO POUR TUTORIELS','教程视频音频编辑器'],
    ['A little less noise.','Un peu moins de bruit.','少一点噪声，'],
    ['A lot more clarity.','Beaucoup plus de clarté.','多一份清晰。'],
    ['A little less noise. A lot more clarity.','Un peu moins de bruit. Beaucoup plus de clarté.','少一点噪声，多一份清晰。'],
    ['Ready to import','Prêt à importer','可以导入视频'],
    ['Export video ↗','Exporter la vidéo ↗','导出视频 ↗'],
    ['Let your voice come through.','Faites entendre votre voix.','让你的声音更清晰。'],
    ['Bring in a tutorial, soften background noise,','Importez un tutoriel, atténuez le bruit de fond,','导入教程视频，降低背景噪声，'],
    ['and turn down distracting breaths.','et réduisez les respirations gênantes.','减轻干扰听感的呼吸声。'],
    ['Choose your video','Choisir une vidéo','选择视频'],
    ['MP4, MOV, MKV, WebM & more · Local processing','MP4, MOV, MKV, WebM et plus · Traitement local','支持 MP4、MOV、MKV、WebM 等 · 本地处理'],
    ['Audio track','Piste audio','音轨'],
    ['Prepare selected track','Préparer la piste choisie','准备所选音轨'],
    ['VIDEO PREVIEW','APERÇU VIDÉO','视频预览'],
    ['Audio comparison','Comparaison audio','音频对比'],
    ['Original','Original','原始音频'],
    ['Cleaned','Nettoyé','处理后音频'],
    ['Your preview will appear here','Votre aperçu apparaîtra ici','预览将在此显示'],
    ['ORIGINAL AUDIO','AUDIO ORIGINAL','原始音频'],
    ['CLEANED AUDIO','AUDIO NETTOYÉ','处理后音频'],
    ['AUDIO TIMELINE','CHRONOLOGIE AUDIO','音频时间轴'],
    ['Audio waveform: drag to select a breath, click to seek','Forme d’onde : faites glisser pour sélectionner une respiration, cliquez pour naviguer','音频波形：拖动选择呼吸声，点击跳转'],
    ['Breath reduction','Réduction des respirations','呼吸声减弱'],
    ['Click to seek · Drag to select','Cliquer pour naviguer · Glisser pour sélectionner','点击跳转 · 拖动选择'],
    ['BREATH REGIONS','ZONES DE RESPIRATION','呼吸声区间'],
    ['Delete project','Supprimer le projet','删除项目'],
    ['Select a breath in the waveform, then add a region.','Sélectionnez une respiration dans la forme d’onde, puis ajoutez une zone.','在波形中选中呼吸声，然后添加区间。'],
    ['Background noise','Bruit de fond','背景噪声'],
    ['Soften steady hiss, hum, and fan noise.','Atténuez les souffles, bourdonnements et bruits de ventilation constants.','减轻持续的嘶声、嗡鸣和风扇噪声。'],
    ['REDUCTION STRENGTH','INTENSITÉ DE RÉDUCTION','降噪强度'],
    ['Off · Keep original','Désactivée · Garder l’original','关闭 · 保留原音'],
    ['Gentle · Natural voice','Douce · Voix naturelle','轻度 · 自然人声'],
    ['Medium · Noisy room','Moyenne · Pièce bruyante','中度 · 嘈杂房间'],
    ['Strong · More reduction','Forte · Réduction accrue','强力 · 更强降噪'],
    ['Use selection as noise sample','Utiliser la sélection comme échantillon de bruit','将所选区间用作噪声样本'],
    ['Clear','Effacer','清除'],
    ['Optional: select a moment with only background noise.','Facultatif : sélectionnez un passage contenant uniquement du bruit de fond.','可选：选择一段只有背景噪声的音频。'],
    ['Lower a selected breath with a smooth fade.','Atténuez une respiration sélectionnée avec un fondu progressif.','平滑降低所选呼吸声的音量。'],
    ['START (SECONDS)','DÉBUT (SECONDES)','开始（秒）'],
    ['END (SECONDS)','FIN (SECONDES)','结束（秒）'],
    ['REDUCTION','RÉDUCTION','减弱幅度'],
    ['Subtle','Légère','轻微'],
    ['Quieter','Plus discrète','更安静'],
    ['＋ Add breath region','＋ Ajouter une zone de respiration','＋ 添加呼吸声区间'],
    ['Update selected region','Mettre à jour la zone sélectionnée','更新所选区间'],
    ['Timing stays intact. Your words and screen stay in sync.','La durée reste intacte. La voix et l’image restent synchronisées.','保持原有时长，让语音与画面同步。'],
    ['✧ Generate cleaned preview','✧ Générer l’aperçu nettoyé','✧ 生成处理后预览'],
    ['Prepare your video to begin.','Préparez votre vidéo pour commencer.','请先准备视频。'],
    ['Cancel','Annuler','取消'],
    ['↓ Download cleaned MP4','↓ Télécharger le MP4 nettoyé','↓ 下载处理后 MP4'],
    ['Import a tutorial video','Importer un tutoriel vidéo','导入教程视频'],
    ['Paste the full path to your video. In Windows Explorer, right-click the file and choose','Collez le chemin complet de votre vidéo. Dans l’Explorateur Windows, faites un clic droit sur le fichier et choisissez','粘贴视频的完整路径。在 Windows 文件资源管理器中，右键点击文件，然后选择'],
    ['Copy as path','Copier en tant que chemin d’accès','复制文件地址'],
    ['VIDEO FILE PATH','CHEMIN DU FICHIER VIDÉO','视频文件路径'],
    ['This copies the selected video into your local editor project.','La vidéo sélectionnée sera copiée dans votre projet local.','这会将所选视频复制到本地编辑项目中。'],
    ['Import video','Importer la vidéo','导入视频'],
    ['Export your cleaned tutorial','Exporter votre tutoriel nettoyé','导出处理后的教程'],
    ['The MP4 will contain the video and your selected, cleaned audio track. Other audio tracks and subtitles are excluded.','Le MP4 contiendra la vidéo et la piste audio sélectionnée et nettoyée. Les autres pistes audio et sous-titres seront exclus.','导出的 MP4 将包含视频和所选的处理后音轨，不包含其他音轨和字幕。'],
    ['Back to editor','Retour à l’éditeur','返回编辑器'],
    ['Export MP4','Exporter le MP4','导出 MP4'],
    ['Processing locally','Traitement local en cours','正在本地处理'],
    ['Saving edits…','Enregistrement…','正在保存修改…'],
    ['Edits saved locally','Modifications enregistrées localement','修改已保存在本地'],
    ['Prepare your video','Préparez votre vidéo','准备视频'],
    ['Preview is up to date. Compare above.','L’aperçu est à jour. Comparez les versions ci-dessus.','预览已更新，可在上方对比。'],
    ['Generate a preview to hear your latest edits.','Générez un aperçu pour écouter vos dernières modifications.','生成预览以试听最新修改。'],
    ['Pending','En attente','等待中'],
    ['ready','prêt','就绪'],['uploaded','importé','已导入'],['uploading','importation','导入中'],
    ['preparing','préparation','准备中'],['failed','échec','失败'],['queued','en attente','排队中'],
    ['running','en cours','处理中'],['completed','terminé','已完成'],['cancelled','annulé','已取消'],
    ['Wait for the current job or cancel it first.','Attendez la fin du traitement ou annulez-le d’abord.','请等待当前任务完成，或先取消任务。'],
    ['Preparation failed. Try preparing the track again.','La préparation a échoué. Réessayez de préparer la piste.','准备失败，请重新准备音轨。'],
    ['Noise sample: {start} – {end}. Keep speech out of this selection.','Échantillon de bruit : {start} – {end}. Évitez toute parole dans cette sélection.','噪声样本：{start} – {end}。请确保所选区间不含语音。'],
    ['Delete breath region {index}','Supprimer la zone de respiration {index}','删除呼吸声区间 {index}'],
    ['Track {index} · {codec} · {channels} channel(s){language}','Piste {index} · {codec} · {channels} canal/canaux{language}','音轨 {index} · {codec} · {channels} 声道{language}'],
    ['Choose a start and end inside the video, with end after start.','Choisissez un début et une fin dans la vidéo, avec la fin après le début.','请在视频范围内设置起止时间，结束时间须晚于开始时间。'],
    ['Press play to hear the preview.','Appuyez sur Lecture pour écouter l’aperçu.','点击播放以试听预览。'],
    ['Audio is still loading. Press play again shortly.','L’audio est en cours de chargement. Relancez la lecture dans un instant.','音频仍在加载，请稍后再次点击播放。'],
    ['Could not load comparison audio. Regenerate the preview or reload the project.','Impossible de charger l’audio de comparaison. Régénérez l’aperçu ou rechargez le projet.','无法加载对比音频，请重新生成预览或重新打开项目。'],
    ['Your MP4 is ready to download.','Votre MP4 est prêt à être téléchargé.','MP4 已准备好，可以下载。'],
    ['Cleaned preview ready. Use Original / Cleaned to compare.','L’aperçu nettoyé est prêt. Comparez Original / Nettoyé.','处理后预览已就绪，点击“原始音频 / 处理后音频”进行对比。'],
    ['Video prepared. Drag across the waveform to select a breath.','La vidéo est prête. Faites glisser sur la forme d’onde pour sélectionner une respiration.','视频已准备好，拖动波形以选择呼吸声。'],
    ['Importing video…','Importation de la vidéo…','正在导入视频…'],
    ['Importing video… {percent}%','Importation de la vidéo… {percent}%','正在导入视频… {percent}%'],
    ['Import failed. Check the server window.','L’importation a échoué. Consultez la fenêtre du serveur.','导入失败，请查看服务器窗口。'],
    ['Cannot reach the local server.','Impossible de joindre le serveur local.','无法连接本地服务器。'],
    ['Video imported. Preparing its audio track…','Vidéo importée. Préparation de sa piste audio…','视频已导入，正在准备音轨…'],
    ['Choose the audio track you want to clean.','Choisissez la piste audio à nettoyer.','请选择要处理的音轨。'],
    ['Paste the full path to your video first.','Collez d’abord le chemin complet de votre vidéo.','请先粘贴视频的完整路径。'],
    ['Importing your local video…','Importation de votre vidéo locale…','正在导入本地视频…'],
    ['Select at least 0.1 seconds of background noise.','Sélectionnez au moins 0,1 seconde de bruit de fond.','请选择至少 0.1 秒的背景噪声。'],
    ['Delete this editor project and its generated files? The original video is kept.','Supprimer ce projet et ses fichiers générés ? La vidéo originale sera conservée.','删除此编辑项目及其生成的文件？原始视频将予以保留。'],
    ['Project deleted.','Projet supprimé.','项目已删除。'],
    ['Request failed.','La requête a échoué.','请求失败。'],
    ['Could not save edits: {error}','Impossible d’enregistrer les modifications : {error}','无法保存修改：{error}'],
    ['Waiting','En attente','等待中'],['Done','Terminé','已完成'],
    ['Cancelled; incomplete output is unavailable.','Annulé ; le résultat incomplet est indisponible.','已取消；未完成的输出不可用。'],
    ['Preparing aligned audio','Préparation de l’audio synchronisé','正在准备同步音频'],
    ['Preparing original comparison','Préparation de la comparaison originale','正在准备原始音频对比'],
    ['Preparing video preview','Préparation de l’aperçu vidéo','正在准备视频预览'],
    ['Converting video to H.264 for browser playback','Conversion vidéo en H.264 pour le navigateur','正在将视频转换为 H.264 以便浏览器播放'],
    ['Reducing background noise','Réduction du bruit de fond','正在降低背景噪声'],
    ['Applying breath edits','Application des modifications des respirations','正在处理呼吸声区间'],
    ['Exporting MP4','Exportation du MP4','正在导出 MP4'],
    ['Open the editor using its 127.0.0.1 address.','Ouvrez l’éditeur à son adresse 127.0.0.1.','请通过 127.0.0.1 地址打开编辑器。'],
    ['Only the local editor may access this service.','Seul l’éditeur local peut accéder à ce service.','只有本地编辑器可以访问此服务。'],
    ['Cross-site requests are not allowed.','Les requêtes intersites ne sont pas autorisées.','不允许跨站请求。'],
    ['Reload the editor to restore its local session.','Rechargez l’éditeur pour rétablir la session locale.','请刷新编辑器以恢复本地会话。'],
    ['Invalid request size.','Taille de requête incorrecte.','请求大小无效。'],
    ['Expected a JSON object.','Un objet JSON est attendu.','需要 JSON 对象。'],
    ['Invalid Host.','Hôte incorrect.','主机无效。'],
    ['Invalid session origin.','Origine de session incorrecte.','会话来源无效。'],
    ['Media is not ready or not accessible.','Le média n’est pas prêt ou n’est pas accessible.','媒体尚未准备好或无法访问。'],
    ['Unknown endpoint.','Point d’accès inconnu.','未知接口。'],
    ['Another video is being imported. Wait for it to finish.','Une autre vidéo est en cours d’importation. Attendez la fin.','另一个视频正在导入，请等待完成。'],
    ['Paste a full local video path, such as D:\\Videos\\tutorial.mp4. Network paths are not supported.','Collez un chemin local complet, par exemple D:\\Videos\\tutorial.mp4. Les chemins réseau ne sont pas pris en charge.','请粘贴完整的本地视频路径，例如 D:\\Videos\\tutorial.mp4。不支持网络路径。'],
    ['Choose a video file such as MP4, MOV, MKV, or WebM.','Choisissez un fichier vidéo MP4, MOV, MKV ou WebM, par exemple.','请选择 MP4、MOV、MKV 或 WebM 等视频文件。'],
    ['Choose a nonempty video smaller than 50 GB.','Choisissez une vidéo non vide de moins de 50 Go.','请选择非空且小于 50 GB 的视频。'],
    ['This video is still being prepared.','Cette vidéo est encore en cours de préparation.','此视频仍在准备中。'],
    ['Invalid audio track.','Piste audio incorrecte.','音轨无效。'],
    ['Prepare the video first.','Préparez d’abord la vidéo.','请先准备视频。'],
    ['Generate a current cleaned preview before exporting.','Générez un aperçu nettoyé à jour avant l’exportation.','导出前请生成最新的处理后预览。'],
    ['Unknown project action.','Action de projet inconnue.','未知项目操作。'],
    ['Upload was interrupted.','L’importation a été interrompue.','上传已中断。'],
    ['Media processing failed.','Le traitement du média a échoué.','媒体处理失败。'],
    ['This project already has a job. Wait or cancel it first.','Ce projet a déjà un traitement en cours. Attendez ou annulez-le.','此项目已有任务，请等待或先取消。'],
    ['Settings changed during processing. Generate a new preview.','Les réglages ont changé pendant le traitement. Générez un nouvel aperçu.','处理过程中设置已更改，请生成新的预览。'],
    ['Unknown job.','Traitement inconnu.','未知任务。'],
    ['Cancellation is still finishing. Try deleting again shortly.','L’annulation est en cours. Réessayez de supprimer dans un instant.','正在完成取消操作，请稍后重试删除。'],
    ['Times and levels must be finite numbers.','Les durées et niveaux doivent être des nombres finis.','时间和音量必须为有限数值。'],
    ['Choose a supported noise preset.','Choisissez un préréglage de réduction du bruit pris en charge.','请选择支持的降噪预设。'],
    ['Use at most 2000 breath regions.','Utilisez au maximum 2 000 zones de respiration.','最多可添加 2000 个呼吸声区间。'],
    ['Breath regions must be inside the video; reduction must be 0–36 dB.','Les zones doivent être dans la vidéo ; la réduction doit être comprise entre 0 et 36 dB.','呼吸声区间须在视频范围内，减弱幅度须为 0–36 dB。'],
    ['Select at least 0.1 seconds containing noise only.','Sélectionnez au moins 0,1 seconde contenant uniquement du bruit.','请选择至少 0.1 秒且仅含噪声的音频。'],
    ['Preparation was interrupted. Import again.','La préparation a été interrompue. Importez à nouveau.','准备已中断，请重新导入。'],
    ['Unknown project.','Projet inconnu.','未知项目。'],
    ['Invalid project path.','Chemin de projet incorrect.','项目路径无效。'],
    ['Wait for video preparation to finish.','Attendez la fin de la préparation de la vidéo.','请等待视频准备完成。'],
    ['Invalid media path.','Chemin de média incorrect.','媒体路径无效。'],
    ['Cannot read this video. Choose a valid video file.','Impossible de lire cette vidéo. Choisissez un fichier vidéo valide.','无法读取此视频，请选择有效的视频文件。'],
    ['The file needs a video stream and an audio track.','Le fichier doit contenir une piste vidéo et une piste audio.','文件必须包含视频流和音轨。'],
    ['Could not determine the video duration.','Impossible de déterminer la durée de la vidéo.','无法确定视频时长。'],
    ['Select an audio track from this video.','Sélectionnez une piste audio de cette vidéo.','请从此视频中选择音轨。'],
    ['Generate a cleaned preview before exporting.','Générez un aperçu nettoyé avant l’exportation.','导出前请生成处理后预览。'],
    ['Export duration did not match the source; output was not published.','La durée exportée ne correspond pas à la source ; le résultat n’a pas été publié.','导出时长与源视频不符，未发布输出文件。'],
    ['Export start times did not match; output was not published.','Les débuts des pistes exportées ne correspondent pas ; le résultat n’a pas été publié.','导出轨道起始时间不匹配，未发布输出文件。'],
    ['Audio processing: {rate} Hz, {channels} channel(s). Original H.264 video preserved.','Traitement audio : {rate} Hz, {channels} canal/canaux. Vidéo H.264 originale conservée.','音频处理：{rate} Hz，{channels} 声道。保留原始 H.264 视频。'],
    ['Audio processing: {rate} Hz, {channels} channel(s). Video converted to H.264 for preview and export.','Traitement audio : {rate} Hz, {channels} canal/canaux. Vidéo convertie en H.264 pour l’aperçu et l’exportation.','音频处理：{rate} Hz，{channels} 声道。视频已转换为 H.264，用于预览和导出。'],
    ['Breath edits preserve your timeline.','Les modifications des respirations préservent la chronologie.','呼吸声编辑保持原有时间轴。']
  ];
  const chooseLanguage = value => /^fr(?:-|$)/i.test(value||'')?'fr':/^zh(?:-|$)/i.test(value||'')?'zh-CN':'en';
  const exact = new Map(messages.filter(r=>!r[0].includes('{')).map(r=>[r[0],r]));
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const templates = messages.filter(r=>r[0].includes('{')).map(row=>{
    const names=[];let pattern='',last=0;
    for(const match of row[0].matchAll(/\{(\w+)\}/g)){pattern+=escape(row[0].slice(last,match.index))+'(.*?)';names.push(match[1]);last=match.index+match[0].length;}
    return {row,names,regex:new RegExp('^'+pattern+escape(row[0].slice(last))+'$','s')};
  });
  function translate(text, language) {
    const index=chooseLanguage(language)==='fr'?1:chooseLanguage(language)==='zh-CN'?2:0;
    if(!index||!text)return text;
    const row=exact.get(text);if(row)return row[index];
    for(const item of templates){const match=item.regex.exec(text);if(match)return item.row[index].replace(/\{(\w+)\}/g,(_,key)=>translate(match[item.names.indexOf(key)+1],language));}
    const status=/^(\d{2,}:\d{2}\.\d{2}|Pending) · (ready|uploaded|uploading|preparing|failed|queued|running|completed|cancelled)$/.exec(text);
    if(status)return `${translate(status[1],language)} · ${translate(status[2],language)}`;
    if(text.includes(' · Breath edits preserve your timeline.'))return text.split(' · ').map(part=>translate(part,language)).join(' · ');
    return text;
  }
  const api = {translate,chooseLanguage,messages};
  if(typeof module!=='undefined')module.exports=api;
  root.QCI18n=api;
  if(typeof document==='undefined')return;
  let language='en';
  try{language=chooseLanguage(localStorage.getItem('quietcut.language')||navigator.language);}catch{}
  const originals=new WeakMap(),attributes=new WeakMap();
  function textNode(node){
    if(!node.parentElement||node.parentElement.closest('script,style,[data-no-translate]'))return;
    const value=node.nodeValue,previous=originals.get(node);
    const source=previous&&value===previous.output?previous.source:value;
    const trimmed=source.trim();if(!trimmed)return;
    const output=source.replace(trimmed,()=>translate(trimmed,language));
    originals.set(node,{source,output});if(value!==output)node.nodeValue=output;
  }
  function element(el){
    if(el.closest('[data-no-translate]'))return;
    let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}
    for(const name of ['aria-label','title','placeholder']){
      if(!el.hasAttribute(name))continue;
      const value=el.getAttribute(name),old=saved[name];const source=old&&value===old.output?old.source:value;
      const output=translate(source,language);saved[name]={source,output};if(value!==output)el.setAttribute(name,output);
    }
  }
  function apply(node){
    if(node.nodeType===3){textNode(node);return;}
    if(node.nodeType!==1&&node.nodeType!==9)return;
    if(node.nodeType===1)element(node);
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    while(walker.nextNode()){if(walker.currentNode.nodeType===3)textNode(walker.currentNode);else element(walker.currentNode);}
  }
  function setLanguage(value){
    language=chooseLanguage(value);document.documentElement.lang=language;
    try{localStorage.setItem('quietcut.language',language);}catch{}
    document.getElementById('language').value=language;
    apply(document.documentElement);
  }
  api.currentLanguage=()=>language;
  api.setLanguage=setLanguage;
  document.getElementById('language').addEventListener('change',event=>setLanguage(event.target.value));
  setLanguage(language);
  new MutationObserver(records=>{
    for(const r of records){if(r.type==='childList')for(const node of r.addedNodes)apply(node);else if(r.type==='characterData')textNode(r.target);else element(r.target);}
  }).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
})(typeof globalThis!=='undefined'?globalThis:this);

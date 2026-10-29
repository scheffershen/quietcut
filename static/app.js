'use strict';
const $ = id => document.getElementById(id);
const video = $('video'), audio = $('audio'), canvas = $('wave');
let token, project = null, settings = null, peaks = [], selection = {start:0,end:0};
let selected = -1, busy = false, jobId = null, mode = 'original', dirty = false;
let saving = Promise.resolve(), saveError = null, playbackSerial = 0;
const fmt = seconds => { const s = Math.max(0, seconds || 0); return `${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(2).padStart(5,'0')}`; };
function notice(message, error=false) { $('notice').textContent=message; $('notice').classList.toggle('error',error); $('notice').hidden=!message; }
async function api(path, data, method) {
  const response=await fetch(path,{method:method || (data===undefined?'GET':'POST'),headers:{'X-Session-Token':token,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const result=await response.json(); if(!response.ok)throw Error(result.error || 'Request failed.'); return result;
}
const mediaUrl = name => `/media/${project.id}/${name}`;
function validPreview() { return project && !dirty && project.rendered_revision===project.revision; }
function ready() { return project?.state==='ready'; }
function controls() {
  for(const id of ['noise','start','end','reduction','add','profile','clearProfile'])$(id).disabled=!ready();
  $('render').disabled=!ready()||busy;
  $('export').disabled=!validPreview()||busy;
  $('cleaned').disabled=!validPreview();
  $('prepare').disabled=busy;
  $('import').disabled=busy; $('emptyImport').disabled=busy;
  $('browserImport').disabled=busy;
  $('deleteProject').disabled=busy;
  $('update').disabled=!ready();
  $('saved').textContent=busy?'Processing locally':dirty?'Saving edits…':ready()?'Edits saved locally':project?'Prepare your video':'Ready to import';
  $('previewState').textContent=!ready()?'Prepare your video to begin.':validPreview()?'Preview is up to date. Compare above.':'Generate a preview to hear your latest edits.';
  const exported=project && !dirty && project.exported_revision===project.revision;
  $('download').hidden=!exported;
  if(exported)$('download').href=mediaUrl(`export-${project.revision}.mp4`);
}
async function refreshProjects() {
  const projects=await api('/api/projects'); $('projectCount').textContent=projects.length;
  $('projects').replaceChildren();
  for(const p of projects){ const b=document.createElement('button'); b.className='project-item'+(project?.id===p.id?' active':''); b.textContent=p.name;
    const small=document.createElement('small'); small.textContent=`${p.duration?fmt(p.duration):'Pending'} · ${p.state}`; b.append(small);
    b.onclick=()=>safe(async()=>{if(busy)throw Error('Wait for the current job or cancel it first.');await saving;await openProject(p.id);});$('projects').append(b); }
}
async function openProject(id) {
  video.pause(); audio.pause(); project=await api(`/api/project/${id}`); settings=structuredClone(project.settings);
  selected=-1;dirty=false;selection={start:0,end:0};peaks=[]; $('start').value=0;$('end').value=0;
  $('empty').hidden=true;$('editor').hidden=false;$('title').textContent=project.name;
  $('noise').value=settings.noise; $('track').replaceChildren();
  for(const track of project.audio_tracks || []){const option=document.createElement('option');option.value=track.index;option.textContent=`Track ${track.index} · ${track.codec_name} · ${track.channels} channel(s)${track.tags?.language?' · '+track.tags.language:''}`;$('track').append(option);}
  if(project.audio_index!==undefined)$('track').value=project.audio_index;
  $('trackPanel').hidden=ready() && (project.audio_tracks?.length || 0)<2;
  if(ready()){
    video.src=mediaUrl('video.mp4');video.muted=false;audio.muted=false;$('videoPlaceholder').hidden=true;
    peaks=await (await fetch(mediaUrl('waveform.json'))).json();
    $('mediaInfo').textContent=project.conversion+' · Breath edits preserve your timeline.';
    setMode('original');
  }else{video.removeAttribute('src');video.load();audio.removeAttribute('src');audio.load();$('videoPlaceholder').hidden=false;$('mediaInfo').textContent='';}
  renderRegions();profileInfo();controls();draw();await refreshProjects();
  if(project.state==='failed')notice(project.error || 'Preparation failed. Try preparing the track again.',true);
}
function profileInfo(){const p=settings?.profile;$('profileInfo').textContent=p?`Noise sample: ${fmt(p.start)} – ${fmt(p.end)}. Keep speech out of this selection.`:'Optional: select a moment with only background noise.';}
function changed(){
  dirty=true;saveError=null;notice('');controls();
  if(mode==='cleaned')setMode('original');
  const captured=structuredClone(settings), id=project.id;
  saving=saving.then(async()=>{
    try{const updated=await api(`/api/project/${id}/settings`,captured);if(project?.id===id){project=updated;dirty=JSON.stringify(settings)!==JSON.stringify(captured);controls();}}
    catch(error){saveError=error;notice('Could not save edits: '+error.message,true);dirty=true;controls();}
  });
}
function renderRegions(){
  $('regions').replaceChildren();$('regionCount').textContent=settings?.regions.length || 0;
  $('regions').className=settings?.regions.length?'':'regions-empty';
  if(!settings?.regions.length)$('regions').textContent='Select a breath in the waveform, then add a region.';
  for(const [i,r] of (settings?.regions || []).entries()){
    const row=document.createElement('div');row.className='region-row'+(selected===i?' selected':'');
    const b=document.createElement('button');b.className='region-select';b.textContent=`${String(i+1).padStart(2,'0')}   ${fmt(r.start)} → ${fmt(r.end)}`;
    b.onclick=()=>{selected=i;selection={start:r.start,end:r.end};syncSelection();$('reduction').value=r.reduction_db;reductionLabel();video.currentTime=r.start;renderRegions();draw();};
    const level=document.createElement('span');level.textContent=`−${r.reduction_db} dB`;
    const remove=document.createElement('button');remove.className='remove-region';remove.textContent='×';remove.setAttribute('aria-label',`Delete breath region ${i+1}`);
    remove.onclick=()=>{settings.regions.splice(i,1);selected=-1;renderRegions();draw();changed();};row.append(b,level,remove);$('regions').append(row);
  }
  $('update').hidden=selected<0;
}
function syncSelection(){$('start').value=selection.start.toFixed(2);$('end').value=selection.end.toFixed(2);}
function readSelection(){const start=Number($('start').value),end=Number($('end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>project.duration)throw Error('Choose a start and end inside the video, with end after start.');return {start,end};}
function reductionLabel(){$('reductionValue').textContent=`−${$('reduction').value} dB`;}
function draw(){
  const rect=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.round(132*dpr);
  const c=canvas.getContext('2d');c.scale(dpr,dpr);const w=rect.width,h=132,duration=project?.duration||1;
  c.clearRect(0,0,w,h);c.strokeStyle='#2c332d';c.lineWidth=1;c.beginPath();c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();
  for(let i=0;i<5;i++){const x=w*i/4;c.fillStyle='#586452';c.font='9px Segoe UI';c.fillText(fmt(duration*i/4),Math.min(x,w-44),12);}
  for(const r of settings?.regions || []){c.fillStyle='#779c4d25';c.fillRect(r.start/duration*w,20,(r.end-r.start)/duration*w,h-30);}
  if(selection.end>selection.start){c.fillStyle='#c3ef9b20';c.strokeStyle='#b6df85';const x=selection.start/duration*w,width=(selection.end-selection.start)/duration*w;c.fillRect(x,20,width,h-30);c.strokeRect(x+.5,20.5,Math.max(0,width-1),h-31);}
  const bars=Math.floor(w/3);const maxPeak=Math.max(.08,...peaks);c.fillStyle='#99b39b';
  for(let i=0;i<bars;i++){const a=Math.floor(i*peaks.length/bars),b=Math.max(a+1,Math.floor((i+1)*peaks.length/bars));let p=0;for(let j=a;j<b;j++)p=Math.max(p,peaks[j]||0);const height=Math.max(2,p/maxPeak*72);c.fillRect(i*3,h/2-height/2,1.6,height);}
  if(ready()){const x=video.currentTime/duration*w;c.fillStyle='#e2f5d0';c.fillRect(x,18,1,h-25);}
}
let down=null;
canvas.onpointerdown=e=>{if(!ready())return;const rect=canvas.getBoundingClientRect();down={x:e.clientX,time:Math.max(0,Math.min(project.duration,(e.clientX-rect.left)/rect.width*project.duration))};canvas.setPointerCapture(e.pointerId);selected=-1;};
canvas.onpointermove=e=>{if(!down)return;const rect=canvas.getBoundingClientRect();const time=Math.max(0,Math.min(project.duration,(e.clientX-rect.left)/rect.width*project.duration));selection={start:Math.min(down.time,time),end:Math.max(down.time,time)};syncSelection();draw();};
canvas.onpointerup=e=>{if(!down)return;if(Math.abs(e.clientX-down.x)<4){video.currentTime=down.time;selection={start:down.time,end:down.time};syncSelection();}down=null;renderRegions();draw();};
canvas.onpointercancel=()=>{down=null;};
for(const id of ['start','end'])$(id).oninput=()=>{selection={start:Number($('start').value),end:Number($('end').value)};draw();};
function setMode(next){
  if(next==='cleaned'&&!validPreview())return;
  mode=next;const serial=++playbackSerial;const wasPlaying=!video.paused;const position=video.currentTime;
  audio.pause();audio.src=mediaUrl(next==='original'?'original.wav':`clean-${project.revision}.wav`);
  audio.onloadedmetadata=()=>{if(serial!==playbackSerial)return;audio.currentTime=position;audio.playbackRate=video.playbackRate;if(wasPlaying)audio.play().catch(e=>notice('Press play to hear the preview.'));};audio.load();
  $('original').classList.toggle('active',next==='original');$('cleaned').classList.toggle('active',next==='cleaned');$('audioBadge').textContent=next==='original'?'ORIGINAL AUDIO':'CLEANED AUDIO';
}
video.onplay=()=>{if(audio.readyState>=1)audio.currentTime=video.currentTime;audio.play().catch(()=>{video.pause();notice('Audio is still loading. Press play again shortly.');});};
video.onpause=()=>audio.pause();video.onended=()=>audio.pause();
video.onseeking=()=>{if(audio.readyState>=1)audio.currentTime=video.currentTime;};
video.onratechange=()=>{audio.playbackRate=video.playbackRate;};
video.onvolumechange=()=>{audio.volume=video.volume;audio.muted=video.muted;};
video.ontimeupdate=()=>{$('time').textContent=`${fmt(video.currentTime)} / ${fmt(project?.duration)}`;if(!video.paused&&audio.readyState>=2&&Math.abs(audio.currentTime-video.currentTime)>.12)audio.currentTime=video.currentTime;draw();};
video.onwaiting=()=>audio.pause();video.onplaying=()=>{if(audio.paused)audio.play().catch(()=>{});};
audio.onerror=()=>{video.pause();notice('Could not load comparison audio. Regenerate the preview or reload the project.',true);};
async function trackJob(item, reopen=false){
  busy=true;jobId=item.id;$('jobPanel').hidden=false;notice('');controls();
  try{
    while(true){const state=await api(`/api/job/${item.id}`);$('jobMessage').textContent=state.message;
      if(state.progress>0)$('progress').value=state.progress;else $('progress').removeAttribute('value');
      if(state.state==='completed'){await saving;if(reopen)await openProject(project.id);else{project=await api(`/api/project/${project.id}`);controls();}notice(item.kind==='export'?'Your MP4 is ready to download.':item.kind==='render'?'Cleaned preview ready. Use Original / Cleaned to compare.':'Video prepared. Drag across the waveform to select a breath.');break;}
      if(state.state==='failed'||state.state==='cancelled'){if(item.kind==='prepare')await openProject(project.id);throw Error(state.message);}
      await new Promise(r=>setTimeout(r,500));
    }
  }finally{busy=false;jobId=null;$('jobPanel').hidden=true;controls();await refreshProjects();}
}
async function upload(file){
  if(!file)return;await saving;busy=true;controls();notice('Importing video…');
  try{
    const p=await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',`/api/projects?name=${encodeURIComponent(file.name)}`);xhr.setRequestHeader('X-Session-Token',token);xhr.upload.onprogress=e=>{if(e.lengthComputable)notice(`Importing video… ${Math.round(e.loaded/e.total*100)}%`);};xhr.onload=()=>{try{const data=JSON.parse(xhr.responseText);if(xhr.status>=400)reject(Error(data.error));else resolve(data);}catch{reject(Error('Import failed. Check the server window.'));}};xhr.onerror=()=>reject(Error('Cannot reach the local server.'));xhr.send(file);});
    busy=false;await openProject(p.id);notice('Video imported. Preparing its audio track…');
    if(p.audio_tracks.length===1)await prepareTrack();else notice('Choose the audio track you want to clean.');
  }finally{busy=false;controls();$('file').value='';}
}
async function importPath(){
  if(busy)return;
  const path=$('videoPath').value.trim();
  if(!path){$('importError').textContent='Paste the full path to your video first.';$('importError').hidden=false;return;}
  busy=true;controls();$('confirmImport').disabled=true;$('dismissImport').disabled=true;$('importError').hidden=true;notice('Importing your local video…');
  try{
    await saving;
    const p=await api('/api/import-path',{path});
    $('importDialog').close();
    busy=false;await openProject(p.id);
    if(p.audio_tracks.length===1)await prepareTrack();else notice('Choose the audio track you want to clean.');
  }catch(error){$('importError').textContent=error.message;$('importError').hidden=false;throw error;}
  finally{busy=false;controls();$('confirmImport').disabled=false;$('dismissImport').disabled=false;}
}
async function prepareTrack(){await saving;const item=await api(`/api/project/${project.id}/prepare`,{audio_index:Number($('track').value)});await trackJob(item,true);}
async function safe(fn){try{await fn();}catch(error){notice(error.message,true);}}
$('import').onclick=$('emptyImport').onclick=()=>{$('importError').hidden=true;$('importDialog').showModal();$('videoPath').focus();};
$('dismissImport').onclick=()=>$('importDialog').close();
$('confirmImport').onclick=()=>safe(importPath);
$('videoPath').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();safe(importPath);}};
$('browserImport').onclick=()=>$('file').click();$('file').onchange=()=>safe(()=>upload($('file').files[0]));
$('noise').onchange=()=>{settings.noise=$('noise').value;changed();};$('reduction').oninput=reductionLabel;
$('add').onclick=()=>safe(async()=>{const r=readSelection();settings.regions.push({...r,reduction_db:Number($('reduction').value)});selected=settings.regions.length-1;renderRegions();draw();changed();});
$('update').onclick=()=>safe(async()=>{if(selected<0)return;settings.regions[selected]={...readSelection(),reduction_db:Number($('reduction').value)};renderRegions();draw();changed();});
$('profile').onclick=()=>safe(async()=>{const p=readSelection();if(p.end-p.start<.1)throw Error('Select at least 0.1 seconds of background noise.');settings.profile=p;profileInfo();changed();});
$('clearProfile').onclick=()=>{settings.profile=null;profileInfo();changed();};
$('original').onclick=()=>setMode('original');$('cleaned').onclick=()=>setMode('cleaned');
$('prepare').onclick=()=>safe(prepareTrack);
$('render').onclick=()=>safe(async()=>{await saving;if(saveError)throw saveError;setMode('original');await trackJob(await api(`/api/project/${project.id}/render`,{}));setMode('cleaned');});
$('cancel').onclick=()=>safe(async()=>{if(jobId)await api(`/api/job/${jobId}/cancel`,{});});
$('export').onclick=()=>{$('exportConversion').textContent=project.conversion;$('exportDialog').showModal();};
$('dismissExport').onclick=()=>$('exportDialog').close();
$('confirmExport').onclick=()=>safe(async()=>{$('exportDialog').close();await saving;if(saveError)throw saveError;await trackJob(await api(`/api/project/${project.id}/export`,{}));});
$('deleteProject').onclick=()=>safe(async()=>{if(!confirm(QCI18n.translate('Delete this editor project and its generated files? The original video is kept.',QCI18n.currentLanguage())))return;await saving;video.pause();audio.pause();audio.onloadedmetadata=null;audio.onerror=null;video.removeAttribute('src');audio.removeAttribute('src');video.load();audio.load();await api(`/api/project/${project.id}/delete`,{});project=null;settings=null;peaks=[];$('empty').hidden=false;$('editor').hidden=true;$('title').textContent='A little less noise. A lot more clarity.';notice('Project deleted.');controls();await refreshProjects();});
new ResizeObserver(draw).observe(canvas);
safe(async()=>{const session=await (await fetch('/api/session')).json();token=session.token;await refreshProjects();controls();});

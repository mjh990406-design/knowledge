// 새 기록은 이 목록에 추가합니다. 분야별 목차와 검색에 함께 반영됩니다.
const notes=[{title:'일차함수, 기울기를 눈으로 이해하기',category:'수학',tags:['함수','그래프','SVG','인터랙티브'],description:'기울기와 절편을 바꿔 보며 그래프의 변화를 확인하는 예제입니다.',url:'notes/linear-function.html',type:'예제'}];
const subjects=[['수학','함수, 대수, 기하, 확률'],['컴퓨터','프로그래밍, 자료구조, 시스템'],['과학','물리, 화학, 생명과학'],['인문·사회','역사, 철학, 사회'],['기타','분야를 넘나드는 주제']];
const root=document.body.dataset.root||'./';
const isHome=document.body.dataset.page==='home';
const params=new URLSearchParams(location.search);
const category=subjects.some(([name])=>name===params.get('category'))?params.get('category'):'전체';
const sidebar=document.querySelector('#sidebar');
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function categoryURL(name){return root+'index.html'+(name==='전체'?'':'?category='+encodeURIComponent(name));}
if(sidebar){
 sidebar.replaceChildren();
 const tools=el('div','sidebar-tools'),form=el('form');form.action=root+'index.html';form.setAttribute('role','search');
 const search=el('input');search.id='search';search.name='q';search.type='search';search.placeholder='검색어를 입력하세요.';search.setAttribute('aria-label','공부 기록 검색');search.value=params.get('q')||'';
 const submit=el('button','tool-button','⌕');submit.type='submit';submit.setAttribute('aria-label','검색');
 const toggle=el('button','tool-button','☰');toggle.type='button';toggle.setAttribute('aria-label','목차 접기');toggle.setAttribute('aria-controls','sidebar');toggle.setAttribute('aria-expanded','true');
 const home=el('a','tool-button','⌂');home.href=root+'index.html';home.setAttribute('aria-label','전체 목차');form.append(search,submit);tools.append(form,toggle,home);
 const title=el('a','book-title','▤ knowledge · 공부 정리');title.href=root+'index.html';
 const nav=el('nav','book-toc');nav.setAttribute('aria-label','분야별 목차');
 const overview=el('a',isHome&&category==='전체'?'current':'','00. 전체 목차');overview.href=root+'index.html';if(isHome&&category==='전체')overview.setAttribute('aria-current','page');nav.append(overview);
 subjects.forEach(([name],index)=>{
  const active=isHome&&category===name;
  const link=el('a',active?'current':'',String(index+1).padStart(2,'0')+'. '+name);link.href=categoryURL(name);if(active)link.setAttribute('aria-current','page');nav.append(link);
  notes.filter(note=>note.category===name).forEach((note,n)=>{
   const selected=!isHome&&location.pathname.endsWith('/'+note.url);
   const noteLink=el('a','note-link'+(selected?' current':''),(index+1)+'.'+(n+1)+' '+note.title);noteLink.href=root+note.url;if(selected)noteLink.setAttribute('aria-current','page');nav.append(noteLink);
   if(selected){[['question','핵심 질문'],['experiment','직접 바꿔 보기'],['summary','내 말로 정리하기'],['review','복습 질문']].forEach(([id,text])=>{const anchor=el('a','section-link',text);anchor.href='#'+id;nav.append(anchor);});}
  });
 });
 sidebar.append(tools,title,nav,el('div','sidebar-foot','개인 공부 노트 · '+notes.length+'개의 기록'));
 const menu=document.querySelector('.mobile-menu');
 toggle.addEventListener('click',()=>{if(matchMedia('(max-width:700px)').matches){document.body.classList.remove('toc-open');}else{document.body.classList.add('toc-hidden');}menu.setAttribute('aria-expanded','false');menu.focus();});
 menu.addEventListener('click',()=>{if(matchMedia('(max-width:700px)').matches){document.body.classList.toggle('toc-open');menu.setAttribute('aria-expanded',String(document.body.classList.contains('toc-open')));}else{document.body.classList.remove('toc-hidden');menu.setAttribute('aria-expanded','true');toggle.focus();}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('toc-open')){document.body.classList.remove('toc-open');menu.setAttribute('aria-expanded','false');menu.focus();}});
 if(isHome){
  const grid=document.querySelector('#notes'),table=document.querySelector('#subject-list');
  subjects.forEach(([name,description],index)=>{const row=el('tr'),cell=el('td'),link=el('a','',String(index+1).padStart(2,'0')+'. '+name);link.href=categoryURL(name);cell.append(link);row.append(cell,el('td','',description),el('td','count',String(notes.filter(note=>note.category===name).length)));table.append(row);});
  if(category!=='전체'){
   document.querySelector('#page-title').textContent=String(subjects.findIndex(([name])=>name===category)+1).padStart(2,'0')+'. '+category;
   document.querySelector('#breadcrumb-current').textContent=category;document.querySelector('#page-description').textContent=category+' 분야의 공부 기록입니다.';document.querySelector('#subjects').hidden=true;document.querySelector('#page-outline a[href="#subjects"]').hidden=true;document.title=category+' - knowledge';
  }
  function render(){
   const query=search.value.trim().toLocaleLowerCase();
   const filtered=notes.filter(note=>(category==='전체'||note.category===category)&&[note.title,note.category,note.description,...note.tags].join(' ').toLocaleLowerCase().includes(query));grid.replaceChildren();
   filtered.forEach(note=>{const article=el('article','note-row'),heading=el('h3'),link=el('a','',note.title);link.href=root+note.url;heading.append(link);const meta=el('div','note-meta');meta.append(el('span','label',note.type),el('span','',note.category),el('span','',note.tags.map(tag=>'#'+tag).join(' ')));article.append(heading,el('p','',note.description),meta);grid.append(article);});
   if(!filtered.length){const empty=el('div','empty');empty.append(el('p','',query?'검색 결과가 없습니다.':'아직 등록된 기록이 없습니다.'));if(query){const clear=el('button','clear-search','검색 초기화');clear.type='button';clear.addEventListener('click',()=>{search.value='';render();search.focus();});empty.append(clear);}grid.append(empty);}
   document.querySelector('#results-count').textContent=(query?'“'+search.value.trim()+'” 검색 · ':'')+filtered.length+'개의 기록';document.querySelector('#records-title').textContent=query?'검색 결과':'공부 기록';
  }
  search.addEventListener('input',render);form.addEventListener('submit',event=>{event.preventDefault();render();document.querySelector('#records').scrollIntoView({behavior:'smooth'});});render();
 }
}
const outlineToggle=document.querySelector('.outline-toggle');if(outlineToggle){outlineToggle.addEventListener('click',()=>{const outline=document.querySelector('#page-outline');outline.hidden=!outline.hidden;outlineToggle.setAttribute('aria-expanded',String(!outline.hidden));});}
const slope=document.querySelector('#slope');
if(slope){
 const intercept=document.querySelector('#intercept');
 const play=document.querySelector('#motion-play');
 const position=document.querySelector('#motion-position');
 const speed=document.querySelector('#motion-speed');
 let progress=0,playing=false,frame=null,lastTime=null;
 function visibleRange(a,b){
  if(a===0)return[-5.5,5.5];
  const bounds=[(-4.5-b)/a,(4.5-b)/a].sort((x,y)=>x-y);
  return[Math.max(-5.5,bounds[0]),Math.min(5.5,bounds[1])];
 }
 function format(value){return(Math.abs(value)<0.005?0:value).toFixed(2);}
 function drawPoint(){
  if(!position)return;
  const a=Number(slope.value),b=Number(intercept.value);
  const [start,end]=visibleRange(a,b),x=start+(end-start)*progress,y=a*x+b;
  const px=250+30*x,py=180-30*y;
  document.querySelector('#motion-dot').setAttribute('cx',String(px));
  document.querySelector('#motion-dot').setAttribute('cy',String(py));
  document.querySelector('#motion-halo').setAttribute('cx',String(px));
  document.querySelector('#motion-halo').setAttribute('cy',String(py));
  document.querySelector('#motion-guides').setAttribute('d',`M ${px} 180 V ${py} H 250`);
  document.querySelector('#motion-trail').setAttribute('d',`M ${250+30*start} ${180-30*(a*start+b)} L ${px} ${py}`);
  position.value=String(Math.round(progress*1000));
  position.setAttribute('aria-valuetext',`x ${format(x)}, y ${format(y)}`);
  document.querySelector('#motion-x').value=format(x);
  document.querySelector('#motion-y').value=format(y);
 }
 function draw(){
  const a=Number(slope.value),b=Number(intercept.value);
  document.querySelector('#function-line').setAttribute('d',`M 70 ${180-30*(a*(-6)+b)} L 430 ${180-30*(a*6+b)}`);
  document.querySelector('#intercept-dot').setAttribute('cy',String(180-30*b));
  document.querySelector('#slope-value').value=String(a);document.querySelector('#intercept-value').value=String(b);
  document.querySelector('#equation').textContent=`y = ${a}x ${b<0?'−':'+'} ${Math.abs(b)}`;
  drawPoint();
 }
 function pause(){
  playing=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;lastTime=null;
  if(play){play.textContent='▶ 재생';play.setAttribute('aria-pressed','false');}
 }
 function tick(time){
  if(!playing)return;
  if(lastTime!==null)progress=Math.min(1,progress+(time-lastTime)/8000*Number(speed.value));
  lastTime=time;drawPoint();
  if(progress>=1){pause();return;}
  frame=requestAnimationFrame(tick);
 }
 if(play){
  play.addEventListener('click',()=>{
   if(playing){pause();return;}
   if(progress>=1)progress=0;
   playing=true;lastTime=null;play.textContent='Ⅱ 일시정지';play.setAttribute('aria-pressed','true');drawPoint();frame=requestAnimationFrame(tick);
  });
  document.querySelector('#motion-reset').addEventListener('click',()=>{pause();progress=0;drawPoint();});
  position.addEventListener('input',()=>{pause();progress=Number(position.value)/1000;drawPoint();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 }
 function changeGraph(){pause();progress=0;draw();}
 slope.addEventListener('input',changeGraph);intercept.addEventListener('input',changeGraph);draw();
}

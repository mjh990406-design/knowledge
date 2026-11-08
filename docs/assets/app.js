// 새 기록을 만들면 아래 목록에 제목, 분야, 태그, 경로를 추가합니다.
const notes=[{title:'일차함수, 기울기를 눈으로 이해하기',category:'수학',tags:['함수','그래프','SVG','인터랙티브'],description:'기울기와 절편을 바꿔 보며 그래프의 변화를 확인하는 예제입니다.',url:'notes/linear-function.html',visual:'y = ax + b',type:'예제 · HTML + SVG'}];
const grid=document.querySelector('#notes');
if(grid){
 let category='전체';
 const search=document.querySelector('#search');
 function render(){
  const query=search.value.trim().toLocaleLowerCase();
  const filtered=notes.filter(note=>(category==='전체'||note.category===category)&&[note.title,note.category,...note.tags,note.description].join(' ').toLocaleLowerCase().includes(query));
  grid.replaceChildren();
  for(const note of filtered){
   const card=document.createElement('article');card.className='card';
   const link=document.createElement('a');link.href=note.url;
   const visual=document.createElement('div');visual.className='card-visual';visual.textContent=note.visual;
   const body=document.createElement('div');body.className='card-body';
   for(const [tag,cls,text] of [['span','badge',note.category+' / '+note.type],['h3','',note.title],['p','',note.description],['div','tags',note.tags.map(t=>'#'+t).join(' ')]] ){
    const element=document.createElement(tag);element.className=cls;element.textContent=text;body.append(element);
   }
   link.append(visual,body);card.append(link);grid.append(card);
  }
  if(!filtered.length){const empty=document.createElement('p');empty.className='empty';empty.textContent=query?'검색 결과가 없어요. 다른 단어로 찾아보세요.':'이 분야의 기록은 아직 없어요. 첫 공부 내용을 함께 채워 보세요.';grid.append(empty);}
  document.querySelector('#results-count').textContent=filtered.length+'개의 기록 · 예제 포함';
 }
 search.addEventListener('input',render);
 document.querySelector('#filters').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;category=button.dataset.category;for(const item of document.querySelectorAll('#filters button')){const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));}render();});
 render();
}
const slope=document.querySelector('#slope');
if(slope){
 const intercept=document.querySelector('#intercept');
 function draw(){
  const a=Number(slope.value),b=Number(intercept.value);
  // x,y 모두 같은 배율(1단위 = 30px)을 사용합니다.
  document.querySelector('#function-line').setAttribute('d',`M 70 ${180-30*(a*(-6)+b)} L 430 ${180-30*(a*6+b)}`);
  document.querySelector('#intercept-dot').setAttribute('cy',String(180-30*b));
  document.querySelector('#slope-value').value=String(a);document.querySelector('#intercept-value').value=String(b);
  document.querySelector('#equation').textContent=`y = ${a}x ${b<0?'−':'+'} ${Math.abs(b)}`;
 }
 slope.addEventListener('input',draw);intercept.addEventListener('input',draw);draw();
}

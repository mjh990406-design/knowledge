(() => {
  'use strict';
  const registry = window.MemoryScenes || {};
  const labels = {map:'전체 지도',bits:'비트와 주소',cache:'CPU 캐시',dimm:'DDR5 모듈',chip:'DRAM 칩',bank:'뱅크',cell:'셀',ssd:'SSD',hbm:'HBM',performance:'성능·전력·신뢰성',compare:'메모리 비교'};
  const parent = {chip:'dimm',bank:'chip',cell:'bank'};
  const view = document.querySelector('#view');
  const crumb = document.querySelector('#crumb');
  const dialog = document.querySelector('#definition');
  const terms = {
    '리프레시':'DRAM에 남아 있는 신호를 감지해 원래 값에 맞게 셀의 전하를 다시 채우는 동작입니다.',
    '행 버퍼':'열어 둔 DRAM 행의 값을 감지 증폭기에 유지해 선택한 열을 읽거나 쓸 수 있게 합니다.',
    '뱅크':'DRAM 칩 안에서 행을 열고 열 주소로 데이터를 선택할 수 있는 저장 영역입니다.',
    '워드라인':'셀 배열에서 한 행의 접근 트랜지스터를 켜는 선택선입니다.',
    '비트라인':'선택한 셀을 읽거나 쓸 때 신호가 오가는 선입니다.',
    '캐시 라인':'캐시가 아래 메모리 계층에서 데이터를 가져와 보관하는 묶음입니다.',
    '문턱전압':'트랜지스터가 전류를 흘리기 시작하는 기준 전압입니다. NAND는 이 값의 범위로 데이터를 표현합니다.',
    '페이지':'NAND에서 데이터를 읽거나 프로그램하는 기본 단위입니다. 여러 페이지가 하나의 삭제 블록을 이룹니다.',
    '대역폭':'일정 시간에 옮길 수 있는 데이터의 양입니다.',
    'TSV':'실리콘 층을 관통하는 수직 전기 연결입니다. HBM의 적층 구조에서 층 사이 신호 전달에 쓰입니다.',
    'ECC':'데이터에 검사 비트를 더해 오류를 찾아내거나 정정하는 방법입니다. 처리 가능한 오류 수는 코드에 따라 다릅니다.'
  };
  function linkTerms(body) {
    const present = Object.keys(terms).filter(term => body.textContent.includes(term));
    if (!present.length) return;
    const group = document.createElement('details');
    group.innerHTML = '<summary>용어 누르기</summary><div class="controls"></div>';
    const controls = group.querySelector('.controls');
    present.forEach(term => {
      const button = document.createElement('button');
      button.textContent = term;
      button.onclick = () => {
        dialog.querySelector('h2').textContent = term;
        dialog.querySelector('p').textContent = terms[term];
        dialog.showModal();
      };
      controls.append(button);
    });
    body.append(group);
  }
  const hardware = [
    ['cache','cpu','CPU','캐시 · SRAM'],
    ['dimm','module','DDR5 DIMM','메인 메모리 · DRAM'],
    ['ssd','drive','SSD','저장장치 · NAND'],
    ['hbm','stack','HBM','가속기 · 적층 DRAM']
  ];
  const pathways = [
    ['bits','비트와 주소','8개의 스위치로 한 바이트 만들기'],
    ['compare','저장 방식 비교','전원을 끄면 어떤 값이 남을까?'],
    ['performance','성능·전력·신뢰성','전송 시간과 오류 정정 실험']
  ];

  function mapHtml() {
    return `<div class="hero"><h1 tabindex="-1">반도체 메모리 지도</h1>
      <p>보드에서 부품을 누르면 내부 구조와 실험이 열립니다.</p></div>
      <div class="atlas-layout"><div class="board" aria-label="컴퓨터 부품 지도">
      <i class="trace t1" aria-hidden="true"></i><i class="trace t2" aria-hidden="true"></i><i class="trace t3" aria-hidden="true"></i>
      <div class="board-hardware">${hardware.map(([id,shape,name,desc]) => `<a class="device device-${shape}" href="#${id}"><span class="package ${shape}" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="device-name">${name} <b aria-hidden="true">↗</b></span><span class="device-desc">${desc}</span></a>`).join('')}</div>
      <span class="edge" aria-hidden="true"></span></div>
      <aside class="map-side"><div class="first"><small>첫 실험</small><h2>RAM에서 데이터<br>하나 읽어 보기</h2><p>행을 열고 열을 선택해 저장된 값이 나오는 과정을 따라갑니다.</p><a class="start" href="#bank">뱅크에서 읽어 보기 <span aria-hidden="true">→</span></a></div>
      <nav class="extras" aria-label="주제별 실험">${pathways.map(([id,name,desc]) => `<a href="#${id}"><span><strong>${name}</strong><small>${desc}</small></span><b aria-hidden="true">↗</b></a>`).join('')}</nav></aside></div>
      <details class="map-note"><summary>지도 읽는 법</summary><p>각 부품은 대표적인 용도를 보여줍니다. 배치와 크기는 실제 제품과 다를 수 있습니다. 장면 위의 경로에서 상위 구조로 돌아갈 수 있습니다.</p></details>`;
  }

  const comparison = [
    {name:'SRAM',link:'cache',kind:'되먹임 회로의 두 안정 상태 중 하나',unit:'배열은 선택한 워드 단위로 접근하고, 캐시는 메인 메모리와 캐시 라인 단위로 데이터를 주고받습니다.',off:'전원이 끊겨 되먹임 회로가 상태를 유지할 수 없습니다.'},
    {name:'DRAM',link:'cell',kind:'작은 커패시터에 저장된 전하량',unit:'뱅크에서 행을 열고, 선택한 열의 데이터를 버스트로 전송합니다.',off:'전원을 끄면 리프레시가 멈춰 저장값을 보장할 수 없습니다.'},
    {name:'NAND',link:'ssd',kind:'셀의 문턱전압 범위. SLC에서는 두 범위로 1비트를 구분합니다.',unit:'페이지 단위로 읽고 프로그램하며 블록 단위로 지웁니다.',off:'기록을 마친 셀은 전원이 없어도 문턱전압 상태를 일정 기간 유지합니다.'}
  ];
  registry.compare = {
    title:'전원을 끄면 무엇이 남을까?',question:'세 메모리에 1을 기록했습니다. 전원을 끄고 다시 읽어 보세요.',
    html:'<div class="panel"><div class="controls"><button data-off>전원 끄기</button><button data-reset>처음부터</button></div><div class="compare-grid"></div><p class="readout" role="status"></p></div><details><summary>더 깊이 보기 · 보존 조건</summary><p>충분한 시간이 지난 뒤의 상태를 나타냅니다. NAND의 보존 기간은 온도와 사용 이력에 따라 달라집니다. 기록 중 정전과 SSD의 임시 버퍼는 이 실험에서 생략했습니다.</p><a href="https://www.micron.com/content/dam/micron/educatorhub/intro-to-memory/micron-intro-to-memory-presentation.pdf">Micron 메모리 입문 자료 ↗</a></details>',
    init(root) {
      const toggle=root.querySelector('[data-off]');
      let powered=true;
      function paint() {
        toggle.disabled=!powered;
        root.querySelector('.compare-grid').innerHTML=comparison.map((c,i)=>`<article><h3>${c.name}</h3><strong class="datum">${powered||i===2?'1':'?'}</strong><p>${powered?c.kind:c.off}</p><p>${c.unit}</p><a href="#${c.link}">${c.name} 내부 보기 →</a></article>`).join('');
        root.querySelector('.readout').textContent=powered?'전원이 켜져 있고 세 곳 모두 값 1을 저장하고 있습니다.':'전원 차단 후 보존 결과입니다. ?는 이전 값을 보장할 수 없다는 뜻입니다.';
      }
      toggle.onclick=()=>{powered=false;paint();};
      root.querySelector('[data-reset]').onclick=()=>{powered=true;paint();};
      paint();
    }
  };

  function render(moveFocus) {
    const requested=location.hash.slice(1);
    if (requested==='content') {document.querySelector('main').focus(); return;}
    const id=Object.hasOwn(labels,requested) ? requested : 'map';
    const scene=registry[id];
    const trail=[id];
    while(parent[trail[0]]) trail.unshift(parent[trail[0]]);
    if(id!=='map') trail.unshift('map');
    crumb.innerHTML=trail.map((key,i)=>i===trail.length-1?`<span aria-current="page">${labels[key]}</span>`:`<a href="#${key}">${labels[key]}</a><span aria-hidden="true">›</span>`).join('');
    if (id==='map') {
      view.innerHTML=mapHtml();
    } else {
      view.innerHTML=`<header class="scene-head"><h1 tabindex="-1"></h1><p></p></header><div class="scene-body"></div><nav class="return-links"><a href="#${parent[id]||'map'}">← ${labels[parent[id]||'map']}</a>${parent[id]?'<a href="#map">전체 지도</a>':''}</nav>`;
      view.querySelector('h1').textContent=scene?.title||labels[id];
      view.querySelector('.scene-head p').textContent=scene?.question||'페이지를 새로고침해 실험을 불러오세요.';
      const body=view.querySelector('.scene-body');
      if(scene){body.innerHTML=scene.html;scene.init?.(body);linkTerms(body);}
    }
    document.title= (id==='map'?'반도체 메모리 지도':labels[id]+' · 메모리 지도')+' · 공부 정리';
    if(moveFocus){view.querySelector('h1').focus({preventScroll:true});window.scrollTo(0,0);}
  }
  document.querySelector('.skip').onclick=e=>{e.preventDefault();document.querySelector('main').focus();};
  window.addEventListener('hashchange',()=>render(true));
  render(false);
})();

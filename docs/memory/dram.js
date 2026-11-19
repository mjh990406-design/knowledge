// Each visit starts a fresh experiment; no timers or global input handlers.
(() => {
  const circuitSource = '<a href="https://people.inf.ethz.ch/~omutlu/pub/CLR-DRAM_capacity-latency-reconfigurable-DRAM_isca20.pdf">ETH Zürich 외 연구진 · CLR-DRAM, §2 (PDF)</a>';
  const moduleSource = '<a href="https://www.rambus.com/blogs/complete-guide-to-ddr5-chipsets/">Rambus · DDR5 모듈 구성</a>';
  const css = `<style>
    .dram-lab{--trace:#08745a;--wash:#e5f4ee;--ink:#193834;color:var(--ink)}
    .dram-lab .d-controls,.dram-lab .d-rail,.dram-lab .d-flow{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
    .dram-lab button,.dram-lab select,.dram-lab .d-link{font:inherit;min-height:44px;line-height:1.4}
    .dram-lab button,.dram-lab select{padding:.55rem .85rem;color:var(--ink);border:1px solid #adbfba;border-radius:8px;background:#fff;cursor:pointer}
    .dram-lab button:focus-visible,.dram-lab select:focus-visible,.dram-lab a:focus-visible{outline:3px solid #155cb3;outline-offset:3px}
    .dram-lab button[aria-pressed="true"]{background:var(--wash);border:2px solid var(--trace);font-weight:700}
    .dram-lab button:disabled{cursor:default;opacity:.55}.dram-lab p{line-height:1.65}
    .dram-lab .d-board,.dram-lab .d-die{margin:12px 0;background:#e1eee7;color:#153e33;border:2px solid #6b9481;border-radius:12px;padding:16px}
    .dram-lab .d-board{border-bottom:7px dashed #b5a15e}.dram-lab .d-board button{border-radius:5px}
    .dram-lab .d-flow{padding:10px 0}.dram-lab .d-flow span{padding:.36rem .56rem;border:1px solid #a6c4b4;background:#f8fcf9;border-radius:5px}
    .dram-lab .d-flow b{color:var(--trace)}.dram-lab .d-out{min-height:2.8em;padding:12px 16px;border-left:4px solid var(--trace);background:#eff7f3;color:#183e32}
    .dram-lab .d-small{font-size:.88em;color:#47615b}.dram-lab details{margin:12px 0}
    .dram-lab summary{cursor:pointer;padding:8px 0}.dram-lab .d-link{display:inline-flex;align-items:center;margin:6px 12px 0 0;text-decoration:underline}
    .dram-lab .d-array{display:grid;grid-template-columns:minmax(44px,.95fr) repeat(4,minmax(44px,1fr));gap:4px;max-width:470px;align-items:center}
    .dram-lab .d-array>*{text-align:center}.dram-lab .d-array button{padding:3px}.dram-lab .d-array .d-open{background:#daebde;outline:1px solid #37865e}
    .dram-lab .d-ribbon{padding:9px 0;font-family:ui-monospace,monospace;font-weight:600}
    .dram-lab .d-banks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .dram-lab .d-banks button{display:grid;gap:6px;text-align:left;padding:14px;background:repeating-linear-gradient(90deg,#f8fcfa 0 6px,#dcebe4 7px 8px)}
    .dram-lab .d-banks small{background:#fff;padding:2px 4px;width:fit-content}
    .dram-lab .d-meter{display:flex;gap:3px;width:min(100%,260px);height:58px;border:2px solid #456d5e;border-radius:8px;padding:5px;box-sizing:border-box;background:#fff}
    .dram-lab .d-meter i{flex:1;background:#edf3ef;border-radius:2px}.dram-lab .d-meter i.charged{background:var(--trace)}
    .dram-lab .d-circuit{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;font-weight:600}
    .dram-lab .d-chip{border:1px solid #87a396;padding:6px;border-radius:5px;background:#fff}
  </style>`;
  const details = (terms, assumptions, sources) => `<details><summary>용어와 동작 원리</summary><p>${terms}</p></details><details><summary>모형의 가정과 출처</summary><p>${assumptions}</p><p>${sources}</p></details>`;
  const reset = '<button type="button" data-reset>처음으로 재설정</button>';
  const lab = content => css + '<div class="dram-lab">' + content + '</div>';
  const path = nodes => nodes.map(node => '<span>' + node + '</span>').join('<b aria-hidden="true">→</b>');
  const button = (attr, value, name) => `<button type="button" data-${attr}="${value}">${name}</button>`;
  const listen = (root, key, handler) => root.querySelectorAll('[data-' + key + ']').forEach(el => {
    el.addEventListener('click', () => handler(el.dataset[key], el));
  });
  const $ = (root, key) => root.querySelector('[data-' + key + ']');

  const modules = {
    CUDIMM: {clk:'CKD',ctrl:'',buf:'',label:'클라이언트용 클록 드라이버 모듈'},
    RDIMM: {clk:'RCD',ctrl:'RCD',buf:'',label:'서버용 등록형 모듈'},
    MRDIMM: {clk:'MRCD',ctrl:'MRCD',buf:'MDB',label:'여러 랭크의 데이터를 다중화하는 모듈'}
  };
  const routes = {data:'데이터 읽기',spd:'모듈 정보 읽기',ctrl:'명령 보내기',clk:'클록 분배',power:'전원 공급'};
  const dimm = {
    title:'DDR5 메모리 모듈', question:'주소와 데이터는 같은 칩을 지나갈까요?',
    html:lab(`<label>모듈 종류 <select data-module>${Object.entries(modules).map(([k,m]) => '<option value="'+k+'">'+k+' · '+m.label+'</option>').join('')}</select></label>
      <div class="d-board"><div class="d-small">모듈 위 부품을 눌러 연결 경로 보기</div><div class="d-rail" data-parts></div></div>
      <div class="d-controls">${Object.entries(routes).map(([key,label]) => button('route',key,label)).join('')}</div>
      <div class="d-flow" data-flow></div><p role="status" class="d-out" data-out></p>
      <div class="d-controls">${reset}<a class="d-link" href="#chip">DRAM 칩 내부 확대 →</a></div>
      ${details('채널은 컨트롤러와 메모리 사이의 통신 경로입니다. 랭크는 함께 선택되어 데이터 폭을 구성하는 DRAM 칩들의 묶음입니다. SPD Hub는 모듈 구성 정보를 제공하고 PMIC는 전원을 조절합니다.','대표 경로만 표시합니다. 부품의 수·위치, 전원 채널 수와 모듈별 배선은 실제 제품에 따라 다릅니다.',moduleSource+' · <a href="../notes/ddr5-dimm.html">DDR5 부품별 기존 공부 노트</a>')}`),
    init(root) {
      const selector=$(root,'module');
      let route='data';
      function render() {
        const m=modules[selector.value];
        const groups=[['DRAM','data'],['SPD Hub','spd'],['PMIC','power'],[m.clk,m.ctrl?'ctrl':'clk'],[m.buf,'data']].filter(([part])=>part);
        const partBox=$(root,'parts');
        // Build per-module components once, so a tapped component retains focus.
        if (partBox.dataset.kind!==selector.value) {
          partBox.dataset.kind=selector.value;
          partBox.innerHTML=groups.map(([part,key])=>button('part',key,part)).join('');
          listen(partBox,'part',key=>{route=key;render();});
        }
        const sequences={
          data:['DRAM',m.buf,'메모리 컨트롤러'], spd:['SPD Hub','관리 버스','호스트'],
          ctrl:['메모리 컨트롤러',m.ctrl,'DRAM'], clk:['클록 입력',m.clk,'DRAM'], power:['모듈 입력 전원','PMIC','DRAM 전원 레일']
        };
        const note={
          data:m.buf?'MDB가 여러 랭크의 읽기 데이터를 다중화해 호스트로 보냅니다.':'메모리 컨트롤러가 DQ 배선을 통해 DRAM의 읽기 데이터를 받습니다.',
          spd:'호스트가 관리 버스로 SPD Hub에 요청하면 Hub가 저장한 모듈 정보를 돌려줍니다. 화살표는 응답 방향입니다.',
          ctrl:m.ctrl?m.ctrl+'가 컨트롤러의 명령과 주소를 받아 DRAM 쪽으로 재구동합니다.':'메모리 컨트롤러가 명령과 주소를 DRAM에 보냅니다.',
          clk:m.clk+'가 입력 클록을 모듈 위 DRAM에 분배합니다.',
          power:'PMIC의 Buck 회로는 스위칭과 인덕터를 이용해 입력 전압을 낮추고, DRAM에 필요한 전압을 유지합니다.'
        };
        const seq=sequences[route].filter(Boolean);
        root.querySelectorAll('[data-route]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.route===route));
        partBox.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',seq.includes(el.textContent)));
        $(root,'flow').innerHTML=path(seq);
        $(root,'out').textContent=routes[route]+' · '+note[route];
      }
      selector.addEventListener('change',render);
      listen(root,'route',key=>{route=key;render();});
      listen(root,'reset',()=>{selector.value='CUDIMM';route='data';render();});
      render();
    }
  };
  const chip = {
    title:'DRAM 칩 속 뱅크',question:'서로 다른 뱅크에 행을 하나씩 열어 둘 수 있을까요?',
    html:lab(`<p>칩 그림에서 뱅크를 눌러 해당 뱅크의 0행을 여세요. 다시 누르면 그 행을 닫습니다.</p>
      <div class="d-die"><div class="d-small">DRAM 다이 · 뱅크 배열</div><div class="d-banks">${[0,1,2,3].map(b=>'<button type="button" aria-pressed="false" data-bank="'+b+'"><strong>뱅크 '+b+'</strong><small>닫힘</small></button>').join('')}</div></div>
      <p class="d-out" data-out role="status"></p><div class="d-controls">${reset}<a class="d-link" href="#bank">뱅크 한 개의 행·열 확대 →</a></div>
      ${details('뱅크는 행을 열고 닫는 상태를 따로 관리할 수 있는 단위입니다. DDR5에서는 여러 뱅크가 뱅크 그룹을 이룹니다.','배치는 네 뱅크로 축약했습니다. 서로 다른 뱅크도 명령·데이터 버스와 여러 타이밍 제약을 공유합니다.',circuitSource)}`),
    init(root) {
      const opened=new Set();
      function render(reason) {
        root.querySelectorAll('[data-bank]').forEach(el=>{
          const active=opened.has(el.dataset.bank);
          el.setAttribute('aria-pressed',active);
          el.querySelector('small').textContent=active?'0행 열림':'닫힘';
        });
        $(root,'out').textContent=reason+' · 열린 뱅크 '+opened.size+'개';
      }
      listen(root,'bank',bank=>{
        if(opened.delete(bank))render('뱅크 '+bank+'의 행을 닫고 비트라인을 다음 접근에 맞게 준비했습니다.');
        else {opened.add(bank);render('뱅크 '+bank+'의 0행을 열었습니다. 각 뱅크는 열린 행을 개별적으로 유지할 수 있습니다.');}
      });
      listen(root,'reset',()=>{opened.clear();render('모든 뱅크가 다음 요청을 기다립니다.');});
      render('모든 뱅크가 다음 요청을 기다립니다.');
    }
  };
  const values=[[1,0,0,1],[0,1,1,0]];
  const bank = {
    title:'행 버퍼와 읽기 타이밍',question:'같은 행의 옆칸을 읽을 때는 어떤 명령이 줄어들까요?',
    html:lab(`<p>행 이름을 눌러 열거나, 읽고 싶은 비트를 바로 누르세요. 같은 행의 다른 열을 읽은 뒤 다른 행으로 옮겨 보세요.</p>
      <div class="d-die"><div class="d-array"><span></span>${values[0].map((_,c)=>'<small>열 '+c+'</small>').join('')}
      ${values.map((row,r)=>button('row',r,r+'행 열기')+row.map((v,c)=>'<button type="button" aria-label="'+r+'행 '+c+'열 읽기" data-addr="'+r+','+c+'">'+v+'</button>').join('')).join('')}</div>
      <div class="d-ribbon" data-buffer></div></div><div class="d-flow" aria-label="명령 순서" data-flow></div>
      <p role="status" class="d-out" data-out></p><div class="d-controls">${reset}<a class="d-link" href="#cell">셀 하나의 축전기 확대 →</a></div>
      ${details('ACT는 행을 열고 감지 증폭기에 데이터를 잡아 둡니다. RD는 열린 행에서 열을 골라 데이터를 출력합니다. PRE는 행을 닫고 비트라인을 다음 ACT에 맞게 준비합니다. tRCD는 ACT에서 읽기 명령까지, tRP는 PRE에서 다음 ACT까지 기다리는 최소 시간입니다. CL은 RD에서 첫 읽기 데이터까지의 클록 지연입니다.','하나의 뱅크에서 행을 열린 채 유지하는 예입니다. 한 칸을 눌렀을 때 실제 버스트의 대표 비트 하나를 표시합니다. 명령 상자 길이는 시간이 아니며 다른 타이밍 제한과 명령 간 중첩은 생략했습니다.',circuitSource)}`),
    init(root) {
      let open=null;
      function access(row,column) {
        const hit=open===row;
        const seq=[];
        if (!hit) {
          if (open!==null) seq.push('PRE','tRP 대기');
          seq.push('ACT '+row+'행');
        }
        if(column!==null){
          if(!hit)seq.push('tRCD 대기');
          else if(lastAction==='activate')seq.push('tRCD 충족');
          seq.push('RD '+column+'열','CL 대기','값 '+values[row][column]);
        }
        const switched=open!==null&&!hit;
        open=row; lastAction=column===null?'activate':'read';
        $(root,'flow').innerHTML=path(seq.length?seq:['행 유지']);
        $(root,'out').textContent=column===null?(hit?'이미 열린 행이어서 같은 내용을 유지합니다.':row+'행을 열어 셀들의 값을 감지하고 행 버퍼에 유지합니다.'):(hit?'열린 행을 재사용해 추가 ACT를 생략합니다.':switched?'다른 행이 열려 있어 PRE 후 새 행을 활성화했습니다.':'행이 닫혀 있어 ACT로 연 다음 열을 읽었습니다.')+' 읽은 비트는 '+values[row][column]+'입니다.';
        $(root,'buffer').textContent='행 버퍼 · '+row+'행  [ '+values[row].join('  ')+' ]';
        root.querySelectorAll('[data-row]').forEach(el=>el.setAttribute('aria-pressed',+el.dataset.row===row));
        root.querySelectorAll('[data-addr]').forEach(el=>{
          el.classList.toggle('d-open',+el.dataset.addr[0]===row);
          el.setAttribute('aria-pressed',el.dataset.addr===row+','+column);
        });
      }
      let lastAction='';
      listen(root,'addr',key=>{const [r,c]=key.split(',').map(Number);access(r,c);});
      listen(root,'row',r=>access(+r,null));
      function clear(){
        open=null;lastAction='';$(root,'flow').innerHTML=path(['대기']);
        $(root,'buffer').textContent='행 버퍼 · 열린 행 없음';
        $(root,'out').textContent='읽을 비트의 위치를 고르면 필요한 명령 순서가 나타납니다.';
        root.querySelectorAll('[data-addr],[data-row]').forEach(el=>{el.setAttribute('aria-pressed',false);el.classList.remove('d-open');});
      }
      listen(root,'reset',clear);clear();
    }
  };
  const cell = {
    title:'DRAM 셀에 1비트 저장하기',question:'시간이 지나도 1을 다시 읽으려면 어떻게 해야 할까요?',
    html:lab(`<p>1을 쓴 뒤 시간을 한두 칸 보내고 리프레시해 보세요.</p>
      <div class="d-die"><div class="d-circuit"><span class="d-chip">비트라인</span> ↔ <span class="d-chip">스위치 트랜지스터</span> ↔ <span class="d-chip">축전기</span></div>
      <small>축전기의 저장 전하 · 상대량</small><div data-meter class="d-meter" aria-hidden="true">${'<i></i>'.repeat(8)}</div><div class="d-ribbon" data-state></div></div>
      <div class="d-controls">${[['one','1 쓰기'],['zero','0 쓰기'],['step','시간 보내기'],['refresh','새로 고침 (Refresh)'],['read','셀 읽기'],['power','전원 끄기']].map(([k,v])=>button('op',k,v)).join('')}${reset}</div>
      <p class="d-out" data-out role="status"></p>
      ${details('워드라인이 스위치 트랜지스터를 켜면 셀과 비트라인이 연결됩니다. 감지 증폭기는 작은 전압 차이를 키워 값을 판별하고 셀에 되씁니다. 리프레시도 행의 값을 감지해 복원합니다.','전하 막대는 1을 높은 전하, 0을 낮은 전하로 표현한 가상 셀입니다. 누설로 두 상태가 중간값에 접근하는 모습을 단순화했습니다. 칸 수·경계는 교육용이며 실제 시간이나 전압이 아닙니다. 전원을 끄면 보존 보장이 사라지는 결과를 즉시 표시합니다. 실제 동작은 여러 셀을 담은 행 단위입니다.',circuitSource)}`),
    init(root) {
      let charge=null,power=true;
      const powerButton=root.querySelector('[data-op="power"]');
      function render(reason) {
        powerButton.textContent=power?'전원 끄기':'전원 켜기';
        root.querySelectorAll('[data-op]').forEach(el=>{el.disabled=!power&&el!==powerButton;});
        $(root,'meter').querySelectorAll('i').forEach((el,i)=>el.classList.toggle('charged',charge!==null&&i<charge));
        const value=charge===null||charge===4?'미정':charge>4?'1':'0';
        $(root,'state').textContent=(power?'전원 켜짐':'전원 꺼짐')+' · 전하 '+(charge===null?'미정':charge+'/8')+' · 판별값 '+value;
        $(root,'out').textContent=reason;
      }
      listen(root,'op',op=>{
        if(op==='power'){power=!power;charge=null;return render(power?'전원을 켰습니다. 셀에 값을 써서 시작하세요.':'전력 공급을 끊어 저장값을 보장할 수 없습니다.');}
        if(!power)return;
        if(op==='one'||op==='zero'){charge=op==='one'?8:0;return render('워드라인으로 스위치를 열고 비트라인을 통해 '+(charge?'1':'0')+'을 썼습니다.');}
        if(charge===null)return render('아직 판별할 값이 없습니다. 먼저 0 또는 1을 쓰세요.');
        if(op==='step'){charge+=Math.sign(4-charge);return render(charge===4?'두 상태를 구분할 여유가 사라져 원래 값을 보장할 수 없습니다.':'누설 때문에 판별 경계에 한 칸 가까워졌습니다. 지금 리프레시하면 저장한 값을 복원합니다.');}
        if(charge===4)return render('판별 경계에 도달해 원래 비트를 복원할 수 없습니다. 값을 다시 쓰세요.');
        charge=charge>4?8:0;
        render(op==='read'?'읽은 값은 '+(charge?1:0)+'입니다. 행을 열 때 미세한 신호를 증폭해 셀의 전하도 복원했습니다.':'행의 값을 감지한 뒤 같은 값을 되써서 전하를 원래 수준으로 복원했습니다.');
      });
      function clear(){charge=null;power=true;render('축전기에 저장된 값은 미정입니다. 1 쓰기를 눌러 전하를 채우세요.');}
      listen(root,'reset',clear);clear();
    }
  };
  window.MemoryScenes = Object.assign(window.MemoryScenes || {}, {dimm,chip,bank,cell});
})();

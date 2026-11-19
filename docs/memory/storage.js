(() => {
  const styles = `<style>
    .memory-workbench { --wb-accent: #126853; --wb-line: #b6cdc6; --wb-soft: #eef6f1; }
    .memory-workbench .wb-row,.memory-workbench .wb-flow { display:flex;flex-wrap:wrap;gap:.5rem;align-items:stretch;margin:.7rem 0 }
    .memory-workbench button { min-height:44px;cursor:pointer }
    .memory-workbench button:focus-visible,.memory-workbench summary:focus-visible {outline:3px solid #cc642d;outline-offset:2px}
    .memory-workbench .wb-tile,.memory-workbench .wb-node {padding:.65rem .75rem;border:1px solid var(--wb-line);border-radius:.65rem;background:#fff;color:#15382f;text-align:center;line-height:1.45}
    .memory-workbench .wb-tile strong,.memory-workbench .wb-tile small,.memory-workbench .wb-node strong,.memory-workbench .wb-node small {display:block}
    .memory-workbench .wb-tile[aria-pressed="true"],.memory-workbench .wb-chosen {background:var(--wb-soft);border:2px solid var(--wb-accent);font-weight:700}
    .memory-workbench .wb-bits {display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px}
    .memory-workbench .wb-bits button {padding:.3rem 0;font-variant-numeric:tabular-nums}
    .memory-workbench .wb-flow {align-items:center}
    .memory-workbench .wb-node small,.memory-workbench .wb-tile small {font-size:.77rem}
    .memory-workbench .wb-columns {display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
    .memory-workbench .wb-column {border:1px solid var(--wb-line);padding:.65rem;border-radius:.65rem}
    .memory-workbench .wb-page {display:block;margin:.45rem 0;padding:.4rem;border:1px dashed var(--wb-line);border-radius:.35rem;font-size:.88rem}
    .memory-workbench .wb-valid {border-style:solid;background:var(--wb-soft);font-weight:700}
    .memory-workbench .wb-old {background:#f2f1ed;color:#5d5952}
    .memory-workbench [data-part="total"] {font-size:1.15rem;font-weight:700}
    .memory-workbench .wb-muted {opacity:.68}
    .memory-workbench details {margin:.8rem 0}
    .memory-workbench summary {cursor:pointer;font-weight:600}
    .memory-workbench .wb-sources {font-size:.85rem}
    @media(max-width:450px){.memory-workbench .wb-bits{grid-template-columns:repeat(4,minmax(0,1fr))}.memory-workbench .wb-node{padding:.45rem}.memory-workbench .wb-columns{gap:.4rem}.memory-workbench .wb-column{padding:.4rem}}
  </style>`;
  const status = '<p class="readout" role="status" aria-live="polite" data-part="status"></p>';
  const reset = '<button type="button" data-action="reset">처음으로</button>';
  const view = html => styles + '<div class="memory-workbench">' + html + '</div>';
  const address = n => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
  const binary = n => n.toString(2).padStart(8, '0');
  const button = (action, label) => `<button type="button" data-action="${action}">${label}</button>`;
  const part = (root, key) => root.querySelector('[data-part="' + key + '"]');
  const details = (term, definition) => '<details><summary>' + term + '</summary><p>' + definition + '</p></details>';
  const onClick = (root, run) => root.addEventListener('click', event => {
    const control = event.target.closest('button[data-action]');
    if (control && root.contains(control)) run(control.dataset.action, Number(control.dataset.value));
  });

  const bits = {
    title: '비트와 주소',
    question: '같은 비트를 눌러도 쓰는 주소가 다르면 어떤 값이 바뀔까요?',
    html: view(`
      <section class="panel">
        <h3>바이트 주소 선택</h3>
        <div class="wb-row" aria-label="주소 선택">${[0,1,2,3].map(n => `<button type="button" class="wb-tile" data-action="address" data-value="${n}"><small>${address(n)}</small><strong></strong></button>`).join('')}</div>
        <h3>저장된 8비트</h3>
        <p>아래 숫자는 각 비트의 자릿값입니다. 비트를 누르면 선택한 바이트에 바로 씁니다.</p>
        <div class="wb-bits">${[7,6,5,4,3,2,1,0].map(n => `<button type="button" class="wb-tile" data-action="bit" data-value="${n}"><strong></strong><small>× ${2 ** n}</small></button>`).join('')}</div>
        <p data-part="total"></p>${status}
        <div class="controls">${reset}</div>
      </section>
      ${details('비트 · 바이트 · 주소', '비트는 0 또는 1이고, 이 지도에서 8비트가 1바이트입니다. 이 실험에서는 연속된 주소 하나에 1바이트씩 들어갑니다. 0x는 주소를 16진수로 표시했다는 뜻입니다.')}
      ${details('더 깊이 보기 · 같은 비트를 저장하는 세 방법', 'SRAM은 되먹임 회로의 두 안정 상태, DRAM은 셀의 전하, NAND는 셀의 문턱 전압 범위로 정보를 표현합니다. 주소에서 읽은 바이트 뒤에 있는 물리 회로는 메모리 종류에 따라 달라집니다.')}
      <p><a href="#cache">SRAM 캐시에서 주소 읽기 →</a> · <a href="#cell">DRAM 셀 열기 →</a> · <a href="#ssd">NAND 페이지 열기 →</a></p>
    `),
    init(root) {
      let selected = 0, bytes = [1, 2, 4, 8];
      function render(message) {
        root.querySelectorAll('[data-action="address"]').forEach((key, n) => {
          key.setAttribute('aria-pressed', String(n === selected));
          key.querySelector('strong').textContent = bytes[n];
          key.setAttribute('aria-label', address(n) + ' 주소, 값 ' + bytes[n]);
        });
        root.querySelectorAll('[data-action="bit"]').forEach(key => {
          const index = Number(key.dataset.value), value = (bytes[selected] >> index) & 1;
          key.setAttribute('aria-pressed', String(Boolean(value)));
          key.setAttribute('aria-label', '자릿값 ' + 2 ** index + ', 비트 ' + value);
          key.querySelector('strong').textContent = value;
        });
        part(root,'total').textContent = binary(bytes[selected]) + '₂ = ' + bytes[selected] + ' (10진수)';
        part(root,'status').textContent = message;
      }
      const hint = '자릿값 8을 눌러 보세요. 켜진 자리의 합이 이 주소에 저장된 값입니다.';
      render(hint);
      onClick(root, (action, n) => {
        if (action === 'reset') { selected = 0; bytes = [1,2,4,8]; render(hint); }
        if (action === 'address') { selected = n; render(address(n) + ' 주소에서 값 ' + bytes[n] + '을 읽었습니다.'); }
        if (action === 'bit') {
          const before = bytes[selected]; bytes[selected] ^= 1 << n;
          render(address(selected) + ' 주소의 자릿값 ' + 2 ** n + ' 비트를 바꿔 ' + before + '에서 ' + bytes[selected] + '이 되었습니다.');
        }
      });
    }
  };

  const cache = {
    title: 'CPU 캐시와 SRAM',
    question: '읽은 적 없는 이웃 주소도 캐시에 있을 수 있을까요?',
    html: view(`
      <section class="panel">
        <h3>CPU에서 읽을 주소</h3>
        <div class="controls wb-row">${[0,1,8,9].map(n => `<button type="button" data-action="read" data-value="${n}">${address(n)} 읽기</button>`).join('')}</div>
        <div class="wb-flow" aria-label="읽기 경로">
          <span class="wb-node"><small>요청</small><strong data-part="cpu">CPU</strong></span><span>→</span>
          <span class="wb-node" data-part="cache-node"><small>SRAM 캐시</small><strong data-part="tag">빈 라인</strong></span><span data-part="arrow">→</span>
          <span class="wb-node" data-part="dram-node"><small>주기억장치</small><strong data-part="dram">DRAM</strong></span>
        </div>
        <h3>캐시 라인 안의 4바이트</h3>
        <div class="wb-row" data-part="line"></div><p data-part="counts"></p>${status}
        <div class="controls">${reset}</div>
      </section>
      ${details('라인 · 적중 · 지역성', 'CPU가 한 바이트를 요청해도 캐시는 인접 바이트 묶음인 라인을 가져올 수 있습니다. 같은 주소의 재사용은 시간 지역성, 가까운 주소를 연이어 쓰는 경향은 공간 지역성입니다. 요청한 주소가 캐시에 들어 있으면 적중입니다.')}
      <details><summary>더 깊이 보기 · SRAM은 어떻게 1비트를 유지할까요?</summary>
        <p>대표적인 6T SRAM 셀에서는 두 인버터가 서로의 출력을 입력으로 받아 Q와 반대 값 Q̅를 유지합니다. 셀 여러 개를 묶어 한 번에 워드 단위로 접근할 수 있습니다. 캐시 라인은 캐시와 아래 단계 사이의 전송 단위입니다.</p>
        <div class="wb-flow"><span class="wb-node" data-part="q"></span><strong>⇄</strong><span class="wb-node" data-part="qbar"></span></div>
        <div class="controls wb-row">${button('flip','반대 값 쓰기')}${button('power','셀 전원 끄기')}</div><p role="status" data-part="cell-result"></p>
        <p>위 셀은 별도 확대 모형입니다. 캐시 실험은 비어 있는 라인 1개, 라인당 4바이트, 읽기 요청만 사용합니다. 실제 CPU의 라인 크기와 배치 방식은 제품마다 다릅니다.</p>
        <p class="wb-sources"><a href="https://support.arm.com/documentation/den0042/latest/Caches">Arm 캐시 설명</a> · <a href="https://www-inst.eecs.berkeley.edu/~eecs151/fa21/files/lectures/Lecture23-SRAM-1up.pdf">UC Berkeley SRAM 회로 강의</a></p>
      </details>
    `),
    init(root) {
      let base, last, hits, misses, powered, q;
      const line = part(root, 'line');
      const renderCell = message => {
        part(root,'q').textContent = 'Q = ' + (q ?? '?');
        part(root,'qbar').textContent = 'Q̅ = ' + (q === null ? '?' : 1 - q);
        root.querySelector('[data-action="flip"]').disabled = !powered;
        root.querySelector('[data-action="flip"]').textContent = q === null ? '1 쓰기' : '반대 값 쓰기';
        root.querySelector('[data-action="power"]').textContent = powered ? '셀 전원 끄기' : '셀 전원 켜기';
        part(root,'cell-result').textContent = message;
      };
      const render = (message, hit) => {
        part(root,'cpu').textContent = last === null ? '대기' : address(last);
        part(root,'tag').textContent = base === null ? '빈 라인' : address(base) + ' ~ ' + address(base+3);
        part(root,'dram').textContent = last === null ? '대기' : hit ? '접근 생략' : '라인 전송';
        part(root,'arrow').textContent = hit ? '∥' : '→';
        part(root,'dram-node').classList.toggle('wb-muted', Boolean(hit));
        line.innerHTML = [0,1,2,3].map(offset => {
          const n = base === null ? null : base + offset;
          return `<span class="wb-node ${n !== null && n === last ? 'wb-chosen' : ''}"><small>${n === null ? '빈칸' : address(n)}</small><strong>${n === null ? '—' : n + 16}</strong></span>`;
        }).join('');
        part(root,'counts').textContent = '적중 ' + hits + '회 · 실패 ' + misses + '회';
        part(root,'status').textContent = message;
      };
      function resetAll() {
        base = last = null; hits = misses = q = 0; powered = true;
        render('0x00, 0x01, 0x00, 0x08 순서로 읽어 요청 경로를 비교하세요.', false);
        renderCell('전원 켜짐 · 두 노드가 서로 반대 값을 유지합니다.');
      }
      resetAll();
      onClick(root, (action, n) => {
        if (action === 'reset') resetAll();
        if (action === 'flip') { q = q === null ? 1 : 1-q; renderCell('쓰기 회로가 Q에 ' + q + '을 쓰고 되먹임 회로가 새 상태를 유지합니다.'); }
        if (action === 'power') { powered = !powered; q = null; renderCell(powered ? '전원을 켰습니다. 이전 값을 보장할 수 없어 ?로 표시합니다.' : '전원을 끄면 되먹임이 멈춰 저장한 1비트를 잃습니다.'); }
        if (action === 'read') {
          const nextBase = n - n % 4, hit = base === nextBase, previous = base;
          last = n; base = nextBase; if (hit) hits++; else misses++;
          render(hit ? '적중 · ' + address(n) + '의 값 ' + (n + 16) + '이 이미 라인에 있어 CPU가 캐시에서 읽습니다.'
            : '실패 · DRAM에서 ' + address(base) + '부터 4바이트를 가져와 ' + (previous === null ? '빈 캐시 라인을 채웠습니다.' : '이전 라인을 교체했습니다.'), hit);
        }
      });
    }
  };

  const ssd = {
    title: 'SSD와 NAND 플래시',
    question: '같은 주소에 다시 쓰면 NAND에서는 어느 페이지가 바뀔까요?',
    html: view(`
      <section class="panel">
        <h3>논리 주소를 골라 새 버전 쓰기</h3>
        <div class="controls wb-row">${button('write-a','주소 A에 쓰기')}${button('write-b','주소 B에 쓰기')}${button('collect','블록 정리')}</div>
        <p data-part="mapping"></p><div class="wb-columns" data-part="blocks"></div>${status}
        <div class="controls">${reset}</div>
      </section>
      ${details('페이지 · 블록 · 주소 변환', 'SSD 컨트롤러는 논리 주소가 가리키는 물리 위치를 관리합니다. NAND는 페이지 단위로 읽거나 프로그램하고, 여러 페이지를 모은 블록 단위로 지웁니다. 무효 페이지에는 옛 데이터가 남아 있어 블록을 지운 뒤 다시 쓸 수 있습니다.')}
      <details><summary>더 깊이 보기 · NAND에서 1비트 읽기</summary>
        <p>한 셀에 1비트를 저장하는 SLC를 선택했습니다. 저장된 전하량에 따라 트랜지스터에 전류가 흐르기 시작하는 문턱 전압이 달라집니다. 읽기 전압을 두 상태 사이에 두면 0과 1을 구별할 수 있습니다.</p>
        <div class="wb-flow"><span class="wb-node" data-part="threshold"></span><span>→</span><span class="wb-node" data-part="current"></span></div>
        <div class="controls wb-row">${button('program','셀에 0 기록')}${button('erase','예시 블록 지우기')}${button('power','셀 전원 끄기')}</div>
        <p role="status" data-part="cell-result"></p>
        <p>이 확대 셀은 위의 주소 실험과 독립입니다. 주소 실험에서는 논리 주소 두 개와 블록 두 개, 블록당 네 페이지를 사용하고 버전 번호로 내용을 표시합니다. 한 블록은 복사 공간으로 확보합니다. 실제 제품은 더 많은 페이지와 여러 비트 셀, 다양한 회수 정책을 사용합니다.</p>
        <p class="wb-sources"><a href="https://www.micron.com/about/micron-glossary/solid-state-drives">Micron SSD 동작 원리</a> · <a href="https://www.kioxia.com/en-jp/rd/technology/multi-level-cell.html">KIOXIA 문턱 전압과 판독</a></p>
      </details>
    `),
    init(root) {
      let pages, active, latest, powered, stored;
      const blockName = index => index === 0 ? 'Ⅰ' : 'Ⅱ';
      const loc = (block,index) => blockName(block) + '·P' + index;
      function render(message) {
        const free = pages[active].includes(null), stale = pages[active].some(p => p && !p.valid);
        ['write-a','write-b'].forEach(key => {root.querySelector('[data-action="'+key+'"]').disabled = !free;});
        root.querySelector('[data-action="collect"]').disabled = !stale;
        part(root,'mapping').textContent = '컨트롤러 주소표　' + ['A','B'].map(id => {
          const index = pages[active].findIndex(p => p?.valid && p.id === id);
          return id + ' → ' + (index < 0 ? '비어 있음' : loc(active, index));
        }).join('　/　');
        part(root,'blocks').innerHTML = pages.map((block,b) => `<div class="wb-column"><strong>블록 ${blockName(b)}</strong><small> · ${b === active ? '기록 중' : '예비'}</small>${block.map((p,i) =>
          `<span class="wb-page ${!p ? '' : p.valid ? 'wb-valid' : 'wb-old'}">P${i} · ${!p ? '빈 페이지' : p.id+' v'+p.version+' · '+(p.valid?'유효':'무효')}</span>`).join('')}</div>`).join('');
        part(root,'status').textContent = message + (free ? '' : ' 기록 블록이 가득 찼습니다. 블록 정리를 누르세요.');
      }
      function renderCell(message) {
        part(root,'threshold').textContent = stored ? '낮은 문턱 전압' : '높은 문턱 전압';
        part(root,'current').textContent = !powered ? '전원 꺼짐 · 읽기 대기' : stored ? '전류 흐름 · 1' : '전류 차단 · 0';
        root.querySelector('[data-action="program"]').disabled = !powered || !stored;
        root.querySelector('[data-action="erase"]').disabled = !powered || Boolean(stored);
        root.querySelector('[data-action="power"]').textContent = powered ? '셀 전원 끄기' : '셀 전원 켜기';
        part(root,'cell-result').textContent = message;
      }
      function resetAll() {
        active = 0; pages = [Array(4).fill(null),Array(4).fill(null)]; latest = {A:1,B:1};
        pages[0][0] = {id:'A',version:1,valid:true}; pages[0][1] = {id:'B',version:1,valid:true};
        powered = true; stored = 1;
        render('주소 A에 써 보세요. 주소표의 화살표와 이전 페이지 상태를 살펴보세요.');
        renderCell('지워진 SLC 예시 셀은 읽기 전압에서 전류가 흘러 1로 판독합니다.');
      }
      resetAll();
      onClick(root, action => {
        if (action === 'reset') resetAll();
        if (action === 'power') { powered = !powered; renderCell(powered ? '전원을 다시 켰습니다. 남아 있는 문턱 전압 상태에서 ' + stored + '을 읽습니다.' : '전원을 꺼도 전하 저장층이 문턱 전압 상태를 유지합니다.'); }
        if (action === 'program') { stored = 0; renderCell('전하 저장층에 전자가 늘어 문턱 전압이 올라갑니다. 읽기 전압에서 전류가 흐르기 어려워 0으로 판독합니다.'); }
        if (action === 'erase') { stored = 1; renderCell('이 셀이 속한 예시 블록을 함께 지웠습니다. 문턱 전압이 낮아져 1로 판독합니다.'); }
        if (action === 'write-a' || action === 'write-b') {
          const id = action === 'write-a' ? 'A' : 'B', block = pages[active];
          const slot = block.indexOf(null), old = block.findIndex(p => p?.valid && p.id === id);
          if (slot < 0) return;
          block[slot] = {id,version:++latest[id],valid:true}; block[old].valid = false;
          render(id+'의 새 버전을 '+loc(active,slot)+'에 썼습니다. 주소표가 이동하여 '+loc(active,old)+'는 무효가 되었습니다.');
        }
        if (action === 'collect') {
          const before = active, valid = pages[before].filter(p => p?.valid);
          active = 1 - active;
          valid.forEach((p,i) => {pages[active][i] = p;});
          pages[before].fill(null);
          render('유효 페이지 '+valid.length+'개를 블록 '+blockName(active)+'로 복사해 주소표를 갱신하고, 이전 블록 '+blockName(before)+' 전체를 지웠습니다.');
        }
      });
    }
  };
  Object.assign(window.MemoryScenes ||= {}, {bits,cache,ssd});
})();

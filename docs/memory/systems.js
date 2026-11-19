/* HBM packaging and memory subsystem experiments. No timing depends on animation. */
(() => {
  "use strict";

  const styles = `<style>
    .ms-lab {--ms-ink:#23394a;--ms-stroke:#9cb1bd;--ms-pale:#e9f4f2;color:var(--ms-ink)}
    .ms-lab h3 {margin:0 0 .65rem;color:inherit}
    .ms-lab .ms-section {padding:clamp(14px,3vw,26px);border:1px solid #cad6d8;border-radius:15px;background:#fff;color:var(--ms-ink);margin:0 0 16px}
    .ms-lab p {margin: .6rem 0}
    .ms-lab .ms-controls {display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}
    .ms-lab button,.ms-lab select {font:inherit;min-height:44px;border:1px solid var(--ms-stroke);border-radius:8px;color:var(--ms-ink);background:white;padding:6px 12px;cursor:pointer}
    .ms-lab button:disabled {cursor:default;opacity:.6}
    .ms-lab button:focus-visible,.ms-lab summary:focus-visible,.ms-lab select:focus-visible {outline:3px solid #775000;outline-offset:2px}
    .ms-lab .ms-primary {background:#155d56;color:white;border-color:#155d56}
    .ms-lab .ms-read {padding:10px 14px;border-inline-start:3px solid #157a70;background:#edf6f3;color:#183c36}
    .ms-lab .ms-package {padding:16px clamp(8px,4vw,30px) 12px;border:1px solid #c6d8dc;border-radius:12px;background:#eff4f5}
    .ms-lab .ms-dies {display:grid;position:relative;gap:2px;max-width:340px;margin:auto}
    .ms-lab .ms-dies[data-open=true] {gap:12px}
    .ms-lab .ms-dies::before,.ms-lab .ms-dies::after {content:"";position:absolute;inset-block:7px;inset-inline-start:17%;width:5px;background:#bc7332}
    .ms-lab .ms-dies::after {inset-inline-start:auto;inset-inline-end:17%}
    .ms-lab .ms-die {display:grid;place-items:center;position:relative;min-height:26px;padding:2px;text-align:center;background:#dbefeb;border:1px solid #6a968d;border-radius:5px;font-size:.86rem;color:#173d36}
    .ms-lab .ms-die::before,.ms-lab .ms-die::after {content:"";position:absolute;inset-block:0;inset-inline-start:17%;width:5px;background:#bc7332}
    .ms-lab .ms-die::after {inset-inline-start:auto;inset-inline-end:17%}
    .ms-lab .ms-base {background:#214b55;color:white;padding:4px;text-align:center;position:relative;border-radius:5px}
    .ms-lab .ms-path {display:block;text-align:center;font-size:.85rem;font-weight:600;margin-top:8px}
    .ms-lab .ms-grid,.ms-lab .ms-code,.ms-lab .ms-time {display:grid;gap:4px;margin:14px 0}
    .ms-lab .ms-grid,.ms-lab .ms-code {grid-template-columns:repeat(4,minmax(0,1fr))}
    .ms-lab .ms-grid span,.ms-lab .ms-time span {border:1px dashed var(--ms-stroke);border-radius:5px;text-align:center;font-size:.8rem;padding:7px 2px;background:#f8fafb}
    .ms-lab .ms-grid .ms-sent,.ms-lab .ms-time .ms-done {border:1px solid #396d68;background:var(--ms-pale);font-weight:bold}
    .ms-lab .ms-time {grid-template-columns:repeat(auto-fit,minmax(54px,1fr))}
    .ms-lab .ms-time span {display:grid;line-height:1.5}
    .ms-lab .ms-code button {display:grid;gap:2px;padding:6px 2px;line-height:1.4;place-items:center}
    .ms-lab .ms-code small,.ms-lab .ms-code i {font-size:.7rem;font-style:normal}
    .ms-lab .ms-code button[aria-pressed=true] {border:2px dashed #933c29;background:#fff0e8}
    .ms-lab .ms-metrics {display:flex;flex-wrap:wrap;gap:8px 18px;margin:10px 0}
    .ms-lab details {border-top:1px solid #cbd4da;margin-top:12px;padding-top:8px}
    .ms-lab summary {cursor:pointer;font-weight:600}
    @media(min-width:640px){.ms-lab .ms-grid,.ms-lab .ms-code {grid-template-columns:repeat(8,minmax(0,1fr))}}
  </style>`;

  const hbm = {
    title: "HBM의 적층 구조",
    question: "겹쳐 쌓은 DRAM은 가속기로 데이터를 어떻게 보내나요?",
    html: styles + `<div class="ms-lab">
      <section class="ms-section">
        <h3>칩 단면 펼쳐 보기</h3>
        <div class="ms-package" role="img" aria-label="DRAM 네 층의 TSV가 베이스 다이까지 이어지고 가속기와 연결된 HBM 단면 모식도">
          <div class="ms-dies" data-stack data-open="false">
            <span class="ms-die">DRAM 4층</span><span class="ms-die">DRAM 3층</span>
            <span class="ms-die">DRAM 2층</span><span class="ms-die">DRAM 1층</span>
            <span class="ms-base">베이스 다이</span>
          </div>
          <span class="ms-path">│ 수직 연결(TSV)　→　패키지 배선　→　가속기</span>
        </div>
        <div class="ms-controls"><button type="button" data-expand aria-pressed="false">층 사이 펼치기</button></div>
        <p class="ms-read" data-stack-info role="status">주황색 세로선은 칩을 관통하는 전기 통로입니다. 층 사이를 펼쳐 연결을 살펴보세요.</p>
        <details><summary>TSV와 적층</summary><p>TSV는 실리콘 칩을 수직으로 관통하는 전극입니다. 여러 DRAM 다이를 쌓으면 좁은 바닥 면적에 용량을 더할 수 있습니다. 그림 속 네 층과 두 전극은 구조를 설명하기 위한 예시입니다.</p></details>
      </section>
      <section class="ms-section">
        <h3>128바이트를 몇 번에 옮길까요?</h3>
        <p>각 칸은 16바이트입니다. 전송 폭을 선택하고 데이터를 한 번씩 보내 보세요.</p>
        <label>전송 폭 <select data-width><option value="128">128비트</option><option value="512">512비트</option><option value="1024">1,024비트</option></select></label>
        <div class="ms-grid" data-packets aria-hidden="true"></div>
        <div class="ms-controls"><button class="ms-primary" data-beat type="button">한 번 전송</button><button data-reset type="button">HBM 실험 초기화</button></div>
        <p class="ms-read" role="status" data-transfer></p>
        <details><summary>전송 폭과 대역폭 더 보기</summary><p>초당 전송 횟수가 같을 때, 한 번에 보내는 비트 수가 두 배이면 이론 대역폭도 두 배입니다. Micron HBM3E의 데이터 인터페이스 폭은 1,024비트입니다. 이 실험은 모든 레인을 채울 수 있다고 가정하고 명령·대기 시간은 생략합니다. 폭을 바꾸면 같은 128바이트 요청을 처음부터 비교합니다.</p>
          <p><a href="https://www.micron.com/products/memory/hbm/hbm3e">Micron HBM3E 사양</a> · <a href="https://semiconductor.samsung.com/dram/hbm/">삼성전자 HBM 구조</a></p>
        </details>
      </section></div>`,
    init(root) {
      const get = selector => root.querySelector(selector);
      const stack = get("[data-stack]");
      const toggle = get("[data-expand]");
      const width = get("[data-width]");
      const send = get("[data-beat]");
      let sent = 0;
      function drawStack(open) {
        stack.dataset.open = String(open);
        toggle.setAttribute("aria-pressed", String(open));
        toggle.textContent = open ? "층 사이 접기" : "층 사이 펼치기";
        get("[data-stack-info]").textContent = open
          ? "층 사이를 벌리면 위아래 DRAM의 같은 위치를 잇는 경로가 보입니다. 데이터는 이 수직 연결을 거쳐 베이스 다이로 내려갑니다."
          : "주황색 세로선은 칩을 관통하는 전기 통로입니다. 층 사이를 펼쳐 연결을 살펴보세요.";
      }
      function drawTransfer() {
        const size = Number(width.value) / 8;
        const cells = Array.from({length: 8}, (_, i) => {
          const moved = i * 16 < sent;
          return `<span class="${moved ? "ms-sent" : ""}">${i + 1} · ${moved ? "도착" : "대기"}</span>`;
        });
        get("[data-packets]").innerHTML = cells.join("");
        send.disabled = sent === 128;
        get("[data-transfer]").textContent = `한 번에 ${size}바이트씩 총 ${128 / size}회면 옮길 수 있습니다. ${sent / size}회 전송했고 ${sent}/128바이트가 도착했습니다.`;
      }
      toggle.onclick = () => drawStack(stack.dataset.open !== "true");
      width.onchange = () => { sent = 0; drawTransfer(); };
      send.onclick = () => { sent = Math.min(128, sent + Number(width.value) / 8); drawTransfer(); };
      get("[data-reset]").onclick = () => {
        width.value = "128"; sent = 0; drawStack(false); drawTransfer();
      };
      drawTransfer();
    }
  };

  function codeword() {
    // Positions 1, 2 and 4 hold even parity; position 8 covers the whole word.
    const bits = [0, 0, 0, 1, 0, 0, 1, 1, 0];
    for (const mask of [1, 2, 4]) {
      for (const i of [3, 5, 6, 7]) {
        if (i & mask) bits[mask] ^= bits[i];
      }
    }
    bits[8] = bits.slice(1, 8).reduce((a, b) => a ^ b, 0);
    return bits;
  }
  function diagnose(bits) {
    let syndrome = 0;
    let odd = 0;
    for (let i = 1; i <= 8; i++) {
      odd ^= bits[i];
      if (i < 8 && bits[i]) syndrome ^= i;
    }
    if (odd) return {correct: syndrome || 8, syndrome};
    return {double: syndrome !== 0, syndrome};
  }

  const performance = {
    title: "성능·전력·오류 정정",
    question: "첫 데이터가 도착하는 시간과 모두 도착하는 시간은 어떻게 다를까요?",
    html: styles + `<div class="ms-lab">
      <section class="ms-section">
        <h3>16바이트 요청을 한 칸씩 재생하기</h3>
        <p>0ns에 읽기를 요청합니다. 처음 도착하는 시각과 이후 1ns마다 전달하는 양을 각각 바꿔 보세요.</p>
        <div class="ms-controls">
          <label>첫 도착 <select data-latency><option value="2">2ns</option><option value="4">4ns</option></select></label>
          <label>전송 중 대역폭 <select data-rate><option value="4">4B/ns</option><option value="8">8B/ns</option></select></label>
        </div>
        <div class="ms-time" data-timeline aria-label="전송 예상 시간표"></div>
        <div class="ms-controls"><button class="ms-primary" type="button" data-step>1ns 진행</button><button type="button" data-clock-reset>시간 실험 초기화</button></div>
        <p class="ms-read" data-clock-info role="status"></p>
        <div class="ms-metrics"><span data-energy></span><span data-power></span></div>
        <details><summary>시간·에너지 계산 기준</summary><p>첫 묶음은 지정한 첫 도착 시각에 한꺼번에 도착하고, 뒤따르는 묶음은 1ns 간격으로 도착한다고 가정합니다. 대역폭을 높이면 이후 필요한 묶음 수가 줄어듭니다.</p><p>모형에서는 경과 시간 1ns마다 배경 에너지 2pJ, 전송 1비트마다 1pJ를 더합니다. 평균 전력(mW)은 누적 에너지(pJ)를 경과 시간(ns)으로 나눈 값입니다. 수치와 시각은 학습용이며 제품 측정값과 다를 수 있습니다.</p>
          <p><a href="https://www.intel.com/content/www/us/en/developer/articles/technical/memory-performance-in-a-nutshell.html">Intel의 지연시간과 대역폭 설명</a></p></details>
      </section>
      <section class="ms-section">
        <h3>메모리에 저장한 1011 복구하기</h3>
        <p>데이터 4비트에 검사 비트 4개를 붙였습니다. 아래에서 한 칸 또는 두 칸을 눌러 뒤집고 검사하세요.</p>
        <div class="ms-code" data-word></div>
        <div class="ms-controls"><button class="ms-primary" type="button" data-check>검사하고 정정</button><button type="button" data-ecc-reset>오류 실험 초기화</button></div>
        <p class="ms-read" data-ecc-info role="status"></p>
        <details><summary>어떻게 틀린 위치를 찾을까요?</summary><p>1번 검사 비트는 1·3·5·7번, 2번은 2·3·6·7번, 4번은 4·5·6·7번을 검사합니다. 각 그룹에서 1의 개수를 짝수로 맞춥니다. 한 곳이 뒤집히면 짝수가 깨진 그룹 번호들의 합이 오류 위치입니다.</p><p>8번은 여덟 칸 전체의 짝수 검사용입니다. 전체 짝수가 깨지고 그룹 검사가 모두 맞으면 8번 오류입니다. 전체는 짝수인데 그룹 검사가 어긋나면 두 비트 오류로 판정합니다. 여기서는 한 번에 최대 두 오류까지 넣는 확장 해밍(8,4) 모형을 사용합니다.</p>
          <p><a href="https://docs.amd.com/r/en-US/am011-versal-acap-trm/Memory-Error-Detection-and-Correction">AMD의 단일 오류 정정과 이중 오류 검출 설명</a></p></details>
      </section></div>`,
    init(root) {
      const get = selector => root.querySelector(selector);
      const latency = get("[data-latency]"), rate = get("[data-rate]");
      let time = 0;
      function drawClock() {
        const first = Number(latency.value), bytes = Number(rate.value);
        const finish = first + 16 / bytes - 1;
        const received = Math.max(0, time - first + 1) * bytes;
        const energy = 2 * time + received * 8;
        get("[data-timeline]").innerHTML = Array.from({length: finish + 1}, (_, i) => {
          const event = i === 0 ? "요청" : i < first ? "대기" : i === first ? "첫 도착" : i === finish ? "완료" : "전송";
          return `<span class="${i <= time ? "ms-done" : ""}"><strong>${i}ns</strong>${event}${i === time ? " ◀ 현재" : ""}</span>`;
        }).join("");
        get("[data-clock-info]").textContent = `현재 ${time}ns · ${received}/16바이트 도착. 첫 도착은 ${first}ns, 전체 완료는 ${finish}ns입니다.`;
        get("[data-energy]").textContent = `누적 에너지 ${energy}pJ (배경 ${time * 2} + 전송 ${received * 8})`;
        get("[data-power]").textContent = time ? `평균 전력 ${Number((energy / time).toFixed(1))}mW` : "평균 전력은 1ns부터 계산합니다.";
        get("[data-step]").disabled = time >= finish;
      }
      get("[data-step]").onclick = () => { time++; drawClock(); };
      latency.onchange = rate.onchange = () => { time = 0; drawClock(); };
      get("[data-clock-reset]").onclick = () => {
        latency.value = "2"; rate.value = "4"; time = 0; drawClock();
      };
      drawClock();

      const original = codeword();
      let bits = original.slice();
      const host = get("[data-word]"), info = get("[data-ecc-info]");
      const names = ["", "검사 1", "검사 2", "데이터 1", "검사 4", "데이터 2", "데이터 3", "데이터 4", "전체 검사"];
      host.innerHTML = names.slice(1).map((label, index) =>
        `<button type="button" data-bit="${index + 1}"><small>${index + 1}번 · ${label}</small><b></b><i></i></button>`
      ).join("");
      const controls = [...host.querySelectorAll("button")];
      function drawCode() {
        const count = bits.reduce((n, bit, i) => n + Number(bit !== original[i]), 0);
        for (const button of controls) {
          const i = Number(button.dataset.bit), changed = bits[i] !== original[i];
          button.querySelector("b").textContent = bits[i];
          button.querySelector("i").textContent = changed ? "뒤집힘" : "원래 값";
          button.setAttribute("aria-pressed", String(changed));
          button.disabled = count === 2 && !changed;
        }
      }
      for (const button of controls) button.onclick = () => {
        const i = Number(button.dataset.bit);
        bits[i] ^= 1;
        drawCode();
        info.textContent = `${i}번 값이 ${bits[i]}로 바뀌었습니다. ‘검사하고 정정’을 눌러 검사 비트의 판정을 확인하세요.`;
      };
      get("[data-check]").onclick = () => {
        const result = diagnose(bits);
        if (result.correct) {
          bits[result.correct] ^= 1;
          info.textContent = `전체 짝수가 깨졌고 그룹 번호 합은 ${result.syndrome}입니다. ${result.correct}번을 고쳐 데이터 1011을 복구했습니다.`;
        } else if (result.double) {
          info.textContent = `전체 짝수 검사는 통과했지만 그룹 번호 합은 ${result.syndrome}입니다. 두 비트 오류를 검출했습니다. 위치를 확정할 수 없어 값을 유지합니다.`;
        } else {
          info.textContent = "그룹과 전체의 1 개수가 모두 짝수입니다. 오류 없이 데이터 1011을 읽었습니다.";
        }
        drawCode();
      };
      get("[data-ecc-reset]").onclick = () => {
        bits = original.slice(); drawCode();
        info.textContent = "데이터 1011과 검사 비트를 다시 저장했습니다. 원하는 칸을 누르세요.";
      };
      get("[data-ecc-reset]").onclick();
    }
  };
  Object.assign(window.MemoryScenes ||= {}, {hbm, performance});
})();

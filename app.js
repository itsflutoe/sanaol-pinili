/* ========== AUDIO ========== */
    let audioCtx = null;
    function getAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    function playSound(type) {
      try {
        const ctx = getAudio();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);

        if (type === 'move') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(280 + Math.random()*200, now);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'select') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(1100, now + 0.14);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
          osc.start(now); osc.stop(now + 0.14);
        } else if (type === 'impact') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'coin' || type === 'victory') {
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(f, now + i * 0.07);
            g.gain.setValueAtTime(0.16, now + i * 0.07);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.18);
            o.connect(g); g.connect(ctx.destination);
            o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.18);
          });
        } else if (type === 'point') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.07);
          osc.frequency.setValueAtTime(784, now + 0.14);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
          osc.start(now); osc.stop(now + 0.22);
        }
      } catch(e) {}
    }
    function triggerFlash() {
      playSound('impact');
      const f = document.getElementById('flash-overlay');
      f.classList.add('flash-active');
      setTimeout(() => f.classList.remove('flash-active'), 220);
    }

    /* ========== DATA ========== */
    function makeAvatar(initials, bg, fg) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="100%" height="100%" fill="${bg}"/>
        <circle cx="100" cy="72" r="38" fill="${fg}" opacity="0.3"/>
        <path d="M35 170 C35 125 165 125 165 170 Z" fill="${fg}" opacity="0.3"/>
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="42" font-weight="900" fill="${fg}">${initials}</text>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    const DEFAULT_STUDENTS = [
      { id:'1', name:'ALISA', title:'The Classroom Specialist', photo: makeAvatar('AL','#1e1b4b','#f472b6'), xp:120, badge:'Math Wizard', isKO:false },
      { id:'2', name:'JIN', title:'Front Row Striker', photo: makeAvatar('JN','#7f1d1d','#fca5a5'), xp:95, badge:'Perfect Attendance', isKO:false },
      { id:'3', name:'LILI', title:'Debate Captain', photo: makeAvatar('LI','#581c87','#c084fc'), xp:150, badge:'Top Scholar', isKO:false },
      { id:'4', name:'PAUL', title:'The Power Presenter', photo: makeAvatar('PL','#365314','#a3e635'), xp:80, badge:'Class Clown', isKO:false },
      { id:'5', name:'XIAOYU', title:'Agile Researcher', photo: makeAvatar('XY','#0e7490','#67e8f9'), xp:110, badge:'Creative Thinker', isKO:false },
      { id:'6', name:'KING', title:'Project Leader', photo: makeAvatar('KG','#713f12','#facc15'), xp:130, badge:'Team Anchor', isKO:false },
      { id:'7', name:'LARS', title:'Lab Strategist', photo: makeAvatar('LR','#1e3a5f','#60a5fa'), xp:85, badge:'Tech Guru', isKO:false },
      { id:'8', name:'NINA', title:'Silent Achiever', photo: makeAvatar('NI','#831843','#f9a8d4'), xp:140, badge:'Quiz Master', isKO:false },
      { id:'9', name:'LAW', title:'Speed Reciter', photo: makeAvatar('LW','#14532d','#4ade80'), xp:75, badge:'Fast Responder', isKO:false },
      { id:'10', name:'ASUKA', title:'Peer Mentor', photo: makeAvatar('AS','#4c1d95','#a78bfa'), xp:105, badge:'Helper', isKO:false }
    ];

    const DEFAULT_TASKS = [
      "Answer the next recitation question on the board!",
      "Explain the key concept from yesterday's lesson!",
      "Lead the group energizer for 30 seconds!",
      "Solve the challenge problem within 1 minute!",
      "Summarize the topic in exactly three key words!",
      "Challenge another classmate to a 1v1 Q&A duel!"
    ];

    let students = [];
    let tasks = [];
    let selectedIndex = 0;
    let selectedStudent = null;
    let currentMode = 'solo';
    let numTeams = 4;
    let isSpinning = false;
    let isDrafting = false;

    function loadData() {
      try {
        const s = localStorage.getItem('tekken_v6_students');
        students = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
        students.forEach(st => {
          if (typeof st.xp !== 'number') st.xp = 0;
          if (typeof st.isKO !== 'boolean') st.isKO = false;
          if (!st.photo) st.photo = makeAvatar((st.name||'??').slice(0,2), '#1e1b4b', '#a855f7');
        });
      } catch(e) { students = JSON.parse(JSON.stringify(DEFAULT_STUDENTS)); }

      try {
        const t = localStorage.getItem('tekken_v6_tasks');
        tasks = t ? JSON.parse(t) : [...DEFAULT_TASKS];
      } catch(e) { tasks = [...DEFAULT_TASKS]; }

      const sec = localStorage.getItem('tekken_v6_section');
      if (sec) document.getElementById('hud-section-name').innerText = sec;
    }
    function saveStudents() { localStorage.setItem('tekken_v6_students', JSON.stringify(students)); }
    function saveTasks() { localStorage.setItem('tekken_v6_tasks', JSON.stringify(tasks)); }

    function getActive() { return students.filter(s => !s.isKO); }
    function getRank(xp) {
      if (xp >= 150) return 'TEKKEN GOD';
      if (xp >= 120) return 'VANQUISHER';
      if (xp >= 90) return 'WARRIOR';
      if (xp >= 60) return 'MENTOR';
      return 'BEGINNER';
    }

    /* ========== RENDER ROSTER (2 ROWS) ========== */
    function renderRosterGrid(p1Id, p2Id) {
      const row1 = document.getElementById('roster-row-1');
      const row2 = document.getElementById('roster-row-2');
      if (!row1 || !row2) return;
      row1.innerHTML = '';
      row2.innerHTML = '';
      document.getElementById('roster-count-label').innerText = `TOTAL: ${students.length}  |  ACTIVE: ${getActive().length}`;

      // Left ?
      row1.appendChild(makeMysteryTile());

      const half = Math.ceil(students.length / 2);
      students.forEach((st, idx) => {
        const tile = document.createElement('div');
        tile.className = `roster-tile w-12 h-12 sm:w-14 sm:h-14 ${st.isKO ? 'ko' : ''} ${selectedStudent && selectedStudent.id === st.id ? 'selected' : ''}`;
        tile.dataset.id = st.id;

        tile.innerHTML = `
          <img src="${st.photo}" class="w-full h-full object-cover" onerror="this.style.opacity=0.3">
          <div class="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] font-orbitron text-center truncate text-gray-200 leading-tight px-0.5">${(st.name||'?').split(' ')[0]}</div>
          ${st.isKO ? '<div class="absolute inset-0 bg-red-950/70 flex items-center justify-center font-arcade text-[7px] text-red-400">KO</div>' : ''}
        `;

        if (p1Id === st.id) {
          const c = document.createElement('div');
          c.className = 'p1-cursor';
          c.innerHTML = '<span class="p1-tag">P1</span>';
          tile.appendChild(c);
        }
        if (p2Id === st.id) {
          const c = document.createElement('div');
          c.className = 'p2-cursor';
          c.innerHTML = '<span class="p2-tag">P2</span>';
          tile.appendChild(c);
        }

        if (!st.isKO) {
          tile.onclick = () => {
            if (isSpinning || isDrafting) return;
            selectStudent(idx);
            playSound('move');
          };
        }
        if (idx < half) row1.appendChild(tile);
        else row2.appendChild(tile);
      });

      // Right ?
      row2.appendChild(makeMysteryTile());
    }

    function makeMysteryTile() {
      const d = document.createElement('div');
      d.className = 'roster-tile w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-red-950 border-yellow-600';
      d.innerHTML = '<span class="font-orbitron font-black text-yellow-400 text-lg">?</span>';
      d.onclick = () => { if (!isSpinning && !isDrafting) triggerSoloSpin(); };
      return d;
    }

    function selectStudent(idx) {
      if (idx < 0 || idx >= students.length) return;
      selectedIndex = idx;
      selectedStudent = students[idx];
      updateShowcase(selectedStudent);
      renderRosterGrid(selectedStudent.id, null);
    }

    function updateShowcase(st) {
      if (!st) return;
      document.getElementById('showcase-img').src = st.photo || '';
      document.getElementById('showcase-name').innerText = st.name || 'SELECT';
      document.getElementById('showcase-title').innerText = `"${st.title || 'Classroom Fighter'}"`;
      document.getElementById('showcase-rank').innerText = getRank(st.xp || 0);
      document.getElementById('showcase-xp').innerText = st.xp || 0;
      document.getElementById('showcase-badge').innerHTML = `<i class="fa-solid fa-star mr-1"></i> ${st.badge || st.title || 'Fighter'}`;
      const ko = document.getElementById('showcase-ko');
      if (st.isKO) ko.classList.remove('hidden');
      else ko.classList.add('hidden');
    }

    /* ========== POINTS ========== */
    function adjustPoints(delta) {
      if (!selectedStudent) return;
      selectedStudent.xp = Math.max(0, (selectedStudent.xp || 0) + delta);
      saveStudents();
      updateShowcase(selectedStudent);
      playSound('point');
    }

    /* ========== SOLO SPIN ========== */
    function triggerSoloSpin() {
      const active = getActive();
      if (active.length === 0 || isSpinning) return;
      isSpinning = true;
      document.getElementById('btn-solo-spin').disabled = true;

      let count = 0;
      const max = 22;
      let delay = 40;

      function step() {
        playSound('move');
        const pick = active[Math.floor(Math.random() * active.length)];
        const idx = students.findIndex(s => s.id === pick.id);
        selectedIndex = idx;
        selectedStudent = pick;
        updateShowcase(pick);
        renderRosterGrid(pick.id, null);

        count++;
        if (count < max) {
          delay += 8;
          setTimeout(step, delay);
        } else {
          triggerFlash();
          playSound('victory');
          isSpinning = false;
          document.getElementById('btn-solo-spin').disabled = false;
        }
      }
      step();
    }

    /* ========== VS ========== */
    function rollVSMatch() {
      const active = getActive();
      if (active.length < 2 || isSpinning) {
        alert('Need at least 2 active students!');
        return;
      }
      isSpinning = true;
      document.getElementById('btn-vs-roll').disabled = true;

      let count = 0;
      const max = 20;
      let delay = 45;

      function step() {
        playSound('move');
        let i1 = Math.floor(Math.random() * active.length);
        let i2 = Math.floor(Math.random() * active.length);
        while (i2 === i1) i2 = Math.floor(Math.random() * active.length);
        const p1 = active[i1], p2 = active[i2];

        document.getElementById('vs-p1-img').src = p1.photo;
        document.getElementById('vs-p1-name').innerText = p1.name;
        document.getElementById('vs-p1-xp').innerText = `XP: ${p1.xp || 0}`;
        document.getElementById('vs-p2-img').src = p2.photo;
        document.getElementById('vs-p2-name').innerText = p2.name;
        document.getElementById('vs-p2-xp').innerText = `XP: ${p2.xp || 0}`;
        renderRosterGrid(p1.id, p2.id);

        count++;
        if (count < max) {
          delay += 9;
          setTimeout(step, delay);
        } else {
          triggerFlash();
          playSound('victory');
          isSpinning = false;
          document.getElementById('btn-vs-roll').disabled = false;
        }
      }
      step();
    }

    /* ========== CHALLENGE ========== */
    function drawChallenge() {
      const active = getActive();
      if (active.length === 0 || tasks.length === 0 || isSpinning) {
        alert('Need active students and tasks!');
        return;
      }
      isSpinning = true;
      document.getElementById('btn-chal-draw').disabled = true;

      let count = 0;
      const max = 16;
      let delay = 50;

      function step() {
        playSound('move');
        const st = active[Math.floor(Math.random() * active.length)];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        document.getElementById('chal-img').src = st.photo;
        document.getElementById('chal-name').innerText = st.name;
        document.getElementById('chal-title').innerText = st.title || 'Challenger';
        document.getElementById('chal-task').innerText = `"${task}"`;
        renderRosterGrid(st.id, null);
        selectedStudent = st;
        count++;
        if (count < max) {
          delay += 10;
          setTimeout(step, delay);
        } else {
          triggerFlash();
          playSound('victory');
          isSpinning = false;
          document.getElementById('btn-chal-draw').disabled = false;
        }
      }
      step();
    }

    function renderTaskList() {
      const box = document.getElementById('task-list');
      if (!box) return;
      box.innerHTML = '';
      tasks.forEach((t, i) => {
        const b = document.createElement('div');
        b.className = 'bg-yellow-950/70 border border-yellow-600/50 rounded px-2 py-0.5 text-[11px] text-yellow-200 flex items-center gap-1';
        b.innerHTML = `<span>📜 ${t}</span><button onclick="removeTask(${i})" class="text-red-400 hover:text-red-300 font-bold ml-1">✕</button>`;
        box.appendChild(b);
      });
    }
    function addTaskPrompt() {
      const t = prompt('Enter new challenge task:');
      if (t && t.trim()) {
        tasks.push(t.trim());
        saveTasks();
        renderTaskList();
      }
    }
    function removeTask(i) {
      tasks.splice(i, 1);
      saveTasks();
      renderTaskList();
    }

    /* ========== TEAM DRAFT ========== */
    function setTeamCount(n) {
      numTeams = n;
      [2,3,4,5,6].forEach(x => {
        const b = document.getElementById(`btn-t${x}`);
        if (!b) return;
        if (x === n) b.className = 'team-btn px-2.5 py-1 text-[10px] font-orbitron rounded border border-purple-300 bg-purple-600 text-white';
        else b.className = 'team-btn px-2.5 py-1 text-[10px] font-orbitron rounded border border-purple-500 bg-purple-900 text-white';
      });
      prepareSquads();
    }

    function prepareSquads() {
      const box = document.getElementById('squads-container');
      if (!box) return;
      box.innerHTML = '';
      const names = ['SQUAD ALPHA','SQUAD BRAVO','SQUAD CHARLIE','SQUAD DELTA','SQUAD ECHO','SQUAD FOX'];
      for (let i = 0; i < numTeams; i++) {
        const card = document.createElement('div');
        card.className = 'bg-gray-950/80 border border-purple-600/50 rounded-lg p-2.5';
        card.innerHTML = `
          <div class="flex justify-between text-[10px] font-orbitron text-yellow-400 border-b border-purple-700/40 pb-1 mb-1.5">
            <span>🛡️ ${names[i]}</span>
            <span id="sq-count-${i}">(0)</span>
          </div>
          <div id="sq-list-${i}" class="space-y-1 min-h-[80px] max-h-40 overflow-y-auto">
            <div class="text-center text-gray-500 text-xs font-mono py-4">Awaiting draft...</div>
          </div>
        `;
        box.appendChild(card);
      }
    }

    function startTeamDraft() {
      const active = getActive();
      if (active.length === 0 || isDrafting) return;
      isDrafting = true;
      document.getElementById('btn-start-draft').disabled = true;
      prepareSquads();
      for (let i = 0; i < numTeams; i++) {
        const el = document.getElementById(`sq-list-${i}`);
        if (el) el.innerHTML = '';
      }

      const shuffled = [...active].sort(() => Math.random() - 0.5);
      let idx = 0;

      function next() {
        if (idx >= shuffled.length) {
          triggerFlash();
          playSound('victory');
          isDrafting = false;
          document.getElementById('btn-start-draft').disabled = false;
          return;
        }
        const st = shuffled[idx];
        const team = idx % numTeams;

        let hops = 0;
        function hop() {
          playSound('move');
          const random = active[Math.floor(Math.random() * active.length)];
          renderRosterGrid(random.id, null);
          hops++;
          if (hops < 8) setTimeout(hop, 45);
          else {
            playSound('impact');
            renderRosterGrid(st.id, null);
            const list = document.getElementById(`sq-list-${team}`);
            const row = document.createElement('div');
            row.className = 'flex items-center gap-1.5 bg-black/70 p-1 rounded border border-purple-600/40';
            row.innerHTML = `
              <img src="${st.photo}" class="w-7 h-7 rounded object-cover border border-purple-400">
              <div class="overflow-hidden flex-1">
                <div class="font-orbitron text-xs text-yellow-300 truncate">${st.name}</div>
                <div class="text-[9px] text-gray-400 truncate">${st.title || ''} • ${st.xp||0}xp</div>
              </div>
            `;
            list.appendChild(row);
            document.getElementById(`sq-count-${team}`).innerText = `(${list.children.length})`;
            idx++;
            setTimeout(next, 150);
          }
        }
        hop();
      }
      next();
    }

    /* ========== MODE SWITCH ========== */
    function setGameMode(mode) {
      currentMode = mode;
      playSound('select');

      document.querySelectorAll('.mode-tab').forEach(t => {
        t.className = 'mode-tab px-3 py-1.5 text-xs md:text-sm font-orbitron font-bold uppercase rounded border border-gray-700 bg-gray-900 text-gray-400 hover:text-white';
      });
      const active = document.getElementById(`tab-${mode}`);
      if (active) active.className = 'mode-tab px-3 py-1.5 text-xs md:text-sm font-orbitron font-bold uppercase rounded border border-red-600 bg-red-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]';

      ['view-solo','view-vs','view-challenge','view-draft'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
      });

      if (mode === 'solo') {
        const v = document.getElementById('view-solo');
        v.classList.remove('hidden'); v.style.display = '';
        if (selectedStudent) updateShowcase(selectedStudent);
        renderRosterGrid(selectedStudent ? selectedStudent.id : null, null);
      } else if (mode === 'vs') {
        const v = document.getElementById('view-vs');
        v.classList.remove('hidden'); v.style.display = '';
      } else if (mode === 'challenge') {
        const v = document.getElementById('view-challenge');
        v.classList.remove('hidden'); v.style.display = '';
        renderTaskList();
      } else if (mode === 'draft') {
        const v = document.getElementById('view-draft');
        v.classList.remove('hidden'); v.style.display = 'flex';
        prepareSquads();
      }
    }

    /* ========== MODALS ========== */
    function openModal(id) {
      playSound('select');
      const m = document.getElementById(id);
      m.classList.remove('hidden');
      m.style.display = 'flex';
      if (id === 'modal-roster-builder') renderRosterTable();
      if (id === 'modal-leaderboard') renderLeaderboard();
    }
    function closeModal(id) {
      const m = document.getElementById(id);
      m.classList.add('hidden');
      m.style.display = 'none';
    }

    function startArcadeSession() {
      const sec = document.getElementById('input-section-name').value.trim() || 'BEEd-4A';
      document.getElementById('hud-section-name').innerText = sec;
      localStorage.setItem('tekken_v6_section', sec);
      closeModal('modal-coin');
      playSound('coin');
    }

    /* ========== ROSTER BUILDER ========== */
    function renderRosterTable() {
      const tbody = document.getElementById('student-table-body');
      tbody.innerHTML = '';
      students.forEach((s, i) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-900/50';
        tr.innerHTML = `
          <td class="p-1.5"><img src="${s.photo}" class="w-8 h-8 rounded object-cover"></td>
          <td class="p-1.5 font-bold text-white text-xs">${s.name}</td>
          <td class="p-1.5 text-gray-400 text-xs">${s.title || '-'}</td>
          <td class="p-1.5 text-yellow-400 font-bold text-xs">${s.xp||0}</td>
          <td class="p-1.5">
            <button onclick="toggleKO(${i})" class="text-[10px] px-1.5 py-0.5 rounded ${s.isKO ? 'bg-emerald-700 text-white' : 'bg-red-800 text-white'}">${s.isKO ? 'REVIVE' : 'KO'}</button>
          </td>
          <td class="p-1.5 text-right space-x-1">
            <button onclick="quickXP(${i},5)" class="text-emerald-400 hover:text-emerald-300 text-[10px]">+5</button>
            <button onclick="quickXP(${i},-5)" class="text-red-400 hover:text-red-300 text-[10px]">-5</button>
            <button onclick="removeStudent(${i})" class="text-red-500 hover:text-red-400"><i class="fa-solid fa-trash text-xs"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function addStudent() {
      const nameEl = document.getElementById('new-student-name');
      const titleEl = document.getElementById('new-student-title');
      const fileEl = document.getElementById('new-student-photo');
      const name = nameEl.value.trim().toUpperCase();
      if (!name) return;

      const finish = (photo) => {
        const initials = name.split(' ').map(w => w[0]).join('').slice(0,2);
        students.push({
          id: Date.now().toString(),
          name,
          title: titleEl.value.trim() || 'Classroom Fighter',
          photo: photo || makeAvatar(initials || 'ST', '#1e1b4b', '#a855f7'),
          xp: 0,
          badge: 'New Challenger',
          isKO: false
        });
        saveStudents();
        renderRosterGrid(selectedStudent ? selectedStudent.id : null, null);
        renderRosterTable();
        nameEl.value = ''; titleEl.value = ''; fileEl.value = '';
        playSound('select');
      };

      if (fileEl.files && fileEl.files[0]) {
        const r = new FileReader();
        r.onload = e => finish(e.target.result);
        r.readAsDataURL(fileEl.files[0]);
      } else finish(null);
    }

    function removeStudent(i) {
      if (!confirm('Delete this student?')) return;
      const id = students[i].id;
      students.splice(i, 1);
      if (selectedStudent && selectedStudent.id === id) {
        selectedIndex = Math.min(selectedIndex, students.length - 1);
        selectedStudent = students[selectedIndex] || null;
        if (selectedStudent) updateShowcase(selectedStudent);
      }
      saveStudents();
      renderRosterGrid(selectedStudent ? selectedStudent.id : null, null);
      renderRosterTable();
    }

    function toggleKO(i) {
      students[i].isKO = !students[i].isKO;
      saveStudents();
      renderRosterGrid(selectedStudent ? selectedStudent.id : null, null);
      renderRosterTable();
      if (selectedStudent && selectedStudent.id === students[i].id) updateShowcase(students[i]);
    }

    function quickXP(i, delta) {
      students[i].xp = Math.max(0, (students[i].xp || 0) + delta);
      saveStudents();
      renderRosterTable();
      if (selectedStudent && selectedStudent.id === students[i].id) updateShowcase(students[i]);
      playSound('point');
    }

    function resetDefaultRoster() {
      if (!confirm('Reset roster to defaults?')) return;
      students = JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
      saveStudents();
      selectedIndex = 0;
      selectedStudent = students[0];
      updateShowcase(selectedStudent);
      renderRosterGrid(selectedStudent.id, null);
      renderRosterTable();
    }

    /* ========== LEADERBOARD ========== */
    function renderLeaderboard() {
      const box = document.getElementById('leaderboard-list');
      box.innerHTML = '';
      const sorted = [...students].sort((a,b) => (b.xp||0) - (a.xp||0));
      if (!sorted.length) {
        box.innerHTML = '<p class="text-center text-gray-500 py-6 font-mono text-sm">No fighters yet</p>';
        return;
      }
      sorted.forEach((s, i) => {
        const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'border-gray-800 bg-gray-900';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
        const item = document.createElement('div');
        item.className = `flex items-center justify-between p-2.5 rounded border-2 ${rankClass}`;
        item.innerHTML = `
          <div class="flex items-center space-x-3">
            <span class="font-orbitron font-black text-base w-8 text-center">${medal}</span>
            <img src="${s.photo}" class="w-10 h-10 rounded object-cover border border-gray-600 ${s.isKO?'opacity-40':''}">
            <div>
              <div class="font-orbitron font-bold text-white text-sm">${s.name}</div>
              <div class="text-[10px] font-mono text-gray-400">${getRank(s.xp||0)}${s.isKO?' • KO':''}</div>
            </div>
          </div>
          <div class="font-orbitron font-bold text-yellow-400 text-sm">${s.xp||0} XP</div>
        `;
        box.appendChild(item);
      });
    }

    function resetAllPoints() {
      if (!confirm('Reset ALL XP to 0?')) return;
      students.forEach(s => s.xp = 0);
      saveStudents();
      renderLeaderboard();
      if (selectedStudent) updateShowcase(selectedStudent);
      playSound('impact');
    }

    /* ========== KEYBOARD ========== */
    window.addEventListener('keydown', e => {
      if (isSpinning || isDrafting || students.length === 0) return;
      if (e.key === 'ArrowRight') {
        let next = (selectedIndex + 1) % students.length;
        while (students[next].isKO && next !== selectedIndex) next = (next + 1) % students.length;
        selectStudent(next);
        playSound('move');
      } else if (e.key === 'ArrowLeft') {
        let prev = (selectedIndex - 1 + students.length) % students.length;
        while (students[prev].isKO && prev !== selectedIndex) prev = (prev - 1 + students.length) % students.length;
        selectStudent(prev);
        playSound('move');
      } else if (e.key === 'Enter' && currentMode === 'solo') {
        triggerSoloSpin();
      }
    });

    /* ========== BOOT ========== */
    window.onload = function() {
      loadData();
      if (students.length > 0) {
        selectedIndex = 0;
        selectedStudent = students[0];
        updateShowcase(selectedStudent);
      }
      renderRosterGrid(selectedStudent ? selectedStudent.id : null, null);
      document.getElementById('modal-coin').classList.remove('hidden');
      document.getElementById('modal-coin').style.display = 'flex';
    };
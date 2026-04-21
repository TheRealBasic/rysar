(function () {
  const STORAGE_KEY = 'rysar_command_center_v1';
  const defaults = {
    tasks: [],
    ideas: [],
    metrics: { followers: 0, views: 0, posts: 0, collabs: 0 },
    wins: []
  };

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        ...defaults,
        ...raw,
        metrics: { ...defaults.metrics, ...(raw.metrics || {}) },
        tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
        ideas: Array.isArray(raw.ideas) ? raw.ideas : [],
        wins: Array.isArray(raw.wins) ? raw.wins : []
      };
    } catch {
      return { ...defaults };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function byId(id) {
    return document.getElementById(id);
  }

  const el = {
    formTask: byId('command-task-form'),
    taskInput: byId('command-task-input'),
    ownerSelect: byId('command-owner'),
    laneSelect: byId('command-lane'),
    taskList: byId('command-task-list'),
    taskEmpty: byId('command-task-empty'),
    ideaInput: byId('idea-input'),
    saveIdeaBtn: byId('save-idea-btn'),
    ideaList: byId('idea-list'),
    generateHookBtn: byId('generate-hook-btn'),
    hookOutput: byId('hook-output'),
    generateCaptionBtn: byId('generate-caption-btn'),
    captionOutput: byId('caption-output'),
    metricInputs: {
      followers: byId('metric-followers'),
      views: byId('metric-views'),
      posts: byId('metric-posts'),
      collabs: byId('metric-collabs')
    },
    metricCards: {
      followers: byId('metric-card-followers'),
      views: byId('metric-card-views'),
      posts: byId('metric-card-posts'),
      collabs: byId('metric-card-collabs')
    },
    winsInput: byId('wins-input'),
    addWinBtn: byId('add-win-btn'),
    winsList: byId('wins-list')
  };

  if (!el.formTask) return;

  const state = loadState();

  const hookBank = [
    'We gave ourselves 2 hours to make this dead car move. Bad idea?',
    'This is what {owner} found under the seat and it changed the whole story.',
    'Everyone told us not to buy this one. Here is why we did anyway.',
    'POV: you and your best friend try to revive a Swedish legend with no budget.',
    'Before we turn this key, rate our chances from 1-10.'
  ];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderTasks() {
    if (!state.tasks.length) {
      el.taskEmpty.style.display = 'block';
      el.taskList.innerHTML = '';
      return;
    }

    el.taskEmpty.style.display = 'none';
    el.taskList.innerHTML = state.tasks.map((task) => `
      <div class="kanban-item" data-task-id="${task.id}">
        <strong>${escapeHtml(task.text)}</strong>
        <div class="item-sub" style="margin-top:6px">Owner: ${escapeHtml(task.owner)} · Lane: ${escapeHtml(task.lane)}</div>
        <div class="inline-actions" style="margin-top:8px">
          <button class="creator-btn secondary" data-task-action="advance" data-task-id="${task.id}" type="button">Advance lane</button>
          <button class="creator-btn secondary" data-task-action="delete" data-task-id="${task.id}" type="button">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderIdeas() {
    el.ideaList.innerHTML = state.ideas.slice().reverse().map((idea) => (
      `<div class="tag cyan">${escapeHtml(idea)}</div>`
    )).join('');
  }

  function renderMetrics() {
    Object.entries(state.metrics).forEach(([k, v]) => {
      const num = Number(v) || 0;
      if (el.metricInputs[k]) el.metricInputs[k].value = num;
      if (el.metricCards[k]) el.metricCards[k].textContent = num.toLocaleString();
    });
  }

  function renderWins() {
    if (!state.wins.length) {
      el.winsList.innerHTML = '<div class="item-sub">No wins tracked yet — add your first momentum point.</div>';
      return;
    }

    el.winsList.innerHTML = state.wins.slice().reverse().map((win) => `<div class="hook-box"><span class="hook-label">WIN</span>${escapeHtml(win)}</div>`).join('');
  }

  function renderAll() {
    renderTasks();
    renderIdeas();
    renderMetrics();
    renderWins();
  }

  el.formTask.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = (el.taskInput.value || '').trim();
    if (!text) return;

    state.tasks.push({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      owner: el.ownerSelect.value,
      lane: el.laneSelect.value
    });

    el.taskInput.value = '';
    saveState(state);
    renderTasks();
  });

  el.taskList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-task-action]');
    if (!button) return;
    const id = button.getAttribute('data-task-id');
    const action = button.getAttribute('data-task-action');
    const index = state.tasks.findIndex((t) => t.id === id);
    if (index < 0) return;

    if (action === 'delete') {
      state.tasks.splice(index, 1);
    }

    if (action === 'advance') {
      const order = ['Backlog', 'Filming', 'Editing', 'Scheduled', 'Published'];
      const current = order.indexOf(state.tasks[index].lane);
      state.tasks[index].lane = order[(current + 1) % order.length];
    }

    saveState(state);
    renderTasks();
  });

  el.saveIdeaBtn.addEventListener('click', () => {
    const idea = (el.ideaInput.value || '').trim();
    if (!idea) return;
    state.ideas.push(idea);
    if (state.ideas.length > 30) state.ideas = state.ideas.slice(-30);
    el.ideaInput.value = '';
    saveState(state);
    renderIdeas();
  });

  el.generateHookBtn.addEventListener('click', () => {
    const owner = (el.ownerSelect.value || 'Assar');
    const base = hookBank[Math.floor(Math.random() * hookBank.length)];
    el.hookOutput.textContent = base.replace('{owner}', owner);
  });

  el.generateCaptionBtn.addEventListener('click', () => {
    const topic = (el.ideaInput.value || 'our latest Swedish garage mission').trim();
    el.captionOutput.value = `New episode: ${topic}.\n\nWhat should we fix next — practical upgrade or pure chaos?\n\n#Rysar #CarTok #BudgetBuild #Sweden #GarageLife`;
  });

  Object.entries(el.metricInputs).forEach(([key, input]) => {
    input.addEventListener('change', () => {
      state.metrics[key] = Number(input.value) || 0;
      saveState(state);
      renderMetrics();
    });
  });

  el.addWinBtn.addEventListener('click', () => {
    const win = (el.winsInput.value || '').trim();
    if (!win) return;
    state.wins.push(win);
    if (state.wins.length > 25) state.wins = state.wins.slice(-25);
    el.winsInput.value = '';
    saveState(state);
    renderWins();
  });

  renderAll();
})();

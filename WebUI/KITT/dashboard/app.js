async function loadJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${url}`);
  return res.json();
}

function renderAgents(agents) {
  const container = document.getElementById('agentsTable');
  if (!container) return;
  container.innerHTML = agents.map(agent => `
    <div class="agent-row">
      <span class="agent-name">${agent.name || agent.id}</span>
      <span class="agent-status">${agent.status || 'offline'}</span>
    </div>
  `).join('');
}

function renderTasks(tasks) {
  const list = document.querySelector('.jobs');
  if (!list) return;
  list.innerHTML = tasks.slice(0, 5).map(task => `
    <li>
      <span>${task.intent}</span>
      <strong>${task.status}</strong>
    </li>
  `).join('');
}

async function bootDashboard() {
  try {
    const agents = await loadJson('http://localhost:8000/agents');
    renderAgents(agents);

    const tasks = await loadJson('http://localhost:8000/tasks');
    renderTasks(tasks);

    const presets = await loadJson('http://localhost:8000/presets');
    const presetNames = Object.keys(presets || {});
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect && presetNames.length) {
      voiceSelect.innerHTML = '<option value="">Select voice preset</option>' + presetNames.map(name => `<option value="${name}">${name}</option>`).join('');
    }
  } catch (err) {
    const container = document.getElementById('agentsTable');
    if (container) {
      container.innerHTML = '<div class="agent-row"><span class="agent-name">Core API offline</span><span class="agent-status">offline</span></div>';
    }
    const list = document.querySelector('.jobs');
    if (list) {
      list.innerHTML = '<li><span>Local core not started</span><strong>offline</strong></li>';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  bootDashboard();
});

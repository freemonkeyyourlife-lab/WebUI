const agents = [
  { name: 'K.I.T.T.', status: 'online' },
  { name: 'Illuminati', status: 'online' },
  { name: 'Daniel Düsentrieb', status: 'online' },
  { name: 'Spielberg-Dali', status: 'online' },
  { name: 'MJ', status: 'online' },
  { name: 'Mattlock', status: 'online' },
  { name: 'Bill Jobs', status: 'online' },
];

const container = document.getElementById('agentsTable');

if (container) {
  container.innerHTML = agents.map(agent => `
    <div class="agent-row">
      <span class="agent-name">${agent.name}</span>
      <span class="agent-status">${agent.status}</span>
    </div>
  `).join('');
}

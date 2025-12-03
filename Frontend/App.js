const form = document.getElementById('taskForm');
const tasksUL = document.getElementById('tasks');
const titleInput = document.getElementById('title');

const API = '/api/tasks';

async function request(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  } catch (err) {
    alert('Error: ' + err.message);
    throw err;
  }
}

async function fetchTasks() {
  const data = await request(API);
  tasksUL.innerHTML = '';
  data.forEach(renderTask);
}

function renderTask(t) {
  const li = document.createElement('li');
  li.dataset.id = t._id;
  li.className = t.completed ? 'completed' : '';
  li.innerHTML = `
    <span class="task-title">${escapeHtml(t.title)}</span>
    <div class="task-actions">
      <button class="btn edit">✏️</button>
      <button class="btn del">🗑️</button>
    </div>
  `;

  // toggle complete on double click
  li.addEventListener('dblclick', async () => {
    try {
      const updated = await request(`${API}/${t._id}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ completed: !t.completed })
      });
      li.className = updated.completed ? 'completed' : '';
      t.completed = updated.completed;
    } catch (e) {}
  });

  li.querySelector('.del').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Delete task?')) return;
    await request(`${API}/${t._id}`, { method: 'DELETE' });
    li.remove();
  });

  li.querySelector('.edit').addEventListener('click', async (e) => {
    e.stopPropagation();
    const newTitle = prompt('Edit task title', t.title);
    if (newTitle === null) return;
    if (!newTitle.trim()) { alert('Title required'); return; }
    const updated = await request(`${API}/${t._id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title: newTitle })
    });
    t.title = updated.title;
    li.querySelector('.task-title').textContent = updated.title;
  });

  tasksUL.appendChild(li);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return alert('Enter task title');
  const created = await request(API, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title })
  });
  titleInput.value = '';
  renderTask(created);
});

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// initial fetch
fetchTasks();

// --- CONFIGURATION ---
// CHECK THIS: Ensure this matches your server.js route!
const API_URL = 'http://localhost:5000/api/tasks'; 

// --- STATE MANAGEMENT ---
let tasks = [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Login Status
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
        fetchTasks(); // Load data from Backend
    } else {
        showLandingPage();
    }

    // 2. Set Date
    const dateEl = document.getElementById('currentDate');
    if(dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.innerText = new Date().toLocaleDateString('en-US', options);
    }
});

// --- API FUNCTIONS (Connect to Backend) ---

// 1. GET (Read Tasks)
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        
        const data = await response.json();
        tasks = data; // Update local state with DB data
        renderAllViews();
    } catch (error) {
        console.error("Error loading tasks:", error);
        // Optional: Show an error notification to user
    }
}

// 2. POST (Add Task)
async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return alert("Please write a task!");

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, completed: false }) 
            // Note: Make sure your Mongoose Schema expects 'text'
        });

        if (response.ok) {
            input.value = ""; // Clear input
            fetchTasks(); // Refresh list from DB
        }
    } catch (error) {
        console.error("Error adding task:", error);
    }
}

// 3. PUT (Toggle Complete)
async function toggleTask(id) {
    // Find task to get current status
    const task = tasks.find(t => t._id === id); 
    if (!task) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT', // Or 'PATCH' depending on your backend
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !task.completed })
        });
        fetchTasks(); // Refresh list
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

// 4. DELETE (Remove Task)
async function deleteTask(id) {
    if(!confirm("Are you sure you want to delete this task?")) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        fetchTasks(); // Refresh list
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

// --- RENDER FUNCTIONS (Updated to use _id) ---

function renderAllViews() {
    // 1. Update Stats
    const total = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    
    // Safely update elements if they exist
    const totalEl = document.getElementById('totalTasks');
    if(totalEl) totalEl.innerText = total;
    
    const pendingEl = document.getElementById('pendingTasks');
    if(pendingEl) pendingEl.innerText = total - completedCount;
    
    const completedEl = document.getElementById('completedTasks');
    if(completedEl) completedEl.innerText = completedCount;

    // 2. Render Lists
    renderList('dashboardTaskList', tasks.slice(0, 4));
    renderList('mainTaskList', tasks);
    renderList('completedTaskList', tasks.filter(t => t.completed));
}

function renderList(elementId, taskArray) {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;

    listElement.innerHTML = "";

    if (taskArray.length === 0) {
        listElement.innerHTML = `<div style="text-align:center; color:#ccc; padding:20px;">No tasks found.</div>`;
        return;
    }

    taskArray.forEach((task) => {
        // Use MongoDB _id for identifying tasks
        const taskId = task._id; 
        const isChecked = task.completed ? 'completed' : '';
        const checkIcon = task.completed ? '<i class="fa-solid fa-check" style="color:white; font-size:0.7rem;"></i>' : '';

        // Note the single quotes around taskId inside the function calls
        const html = `
            <div class="task-item ${isChecked}">
                <div class="task-left">
                    <div class="custom-checkbox" onclick="toggleTask('${taskId}')">
                        ${checkIcon}
                    </div>
                    <span class="task-text">${task.text}</span>
                </div>
                <i class="fa-solid fa-trash delete-btn" onclick="deleteTask('${taskId}')"></i>
            </div>
        `;
        listElement.insertAdjacentHTML('beforeend', html);
    });
}

// --- NAVIGATION & UTILS ---

function handleLogin() {
    localStorage.setItem('isLoggedIn', 'true');
    showDashboard();
    fetchTasks();
}

function handleLogout() {
    localStorage.setItem('isLoggedIn', 'false');
    showLandingPage();
}

function showLandingPage() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('appDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('appDashboard').classList.remove('hidden');
}

function switchView(viewName, navElement) {
    const titles = { 'dashboard': 'Dashboard', 'all-tasks': 'All Tasks', 'completed': 'Completed', 'settings': 'Settings' };
    document.getElementById('pageTitle').innerText = titles[viewName];
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    navElement.classList.add('active');
    renderAllViews();
}

// Add Main Input Wrapper
function addTaskMain() {
    const input = document.getElementById('taskInputMain');
    const text = input.value.trim();
    if (!text) return alert("Please write a task!");
    
    // Reuse the main addTask logic but we need to manually call fetch here since addTask reads from specific ID
    // Better to refactor, but for now let's just use fetch directly:
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, completed: false })
    }).then(res => {
        if(res.ok) {
            input.value = "";
            fetchTasks();
        }
    });
}
const STORAGE_KEY = "myTasks";

const defaultTasks = [
    { id: 1, title: "Make one interaction work.", completed: true },
    { id: 2, title: "Create Basic Page Structure.", completed: true },
    { id: 3, title: "Add project/task date.", completed: false },
];

// --- State -----------------------------------------------------------

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : structuredClone(defaultTasks);
    } catch {
        return structuredClone(defaultTasks);
    }
}

let tasks = loadTasks();

// --- DOM references --------------------------------------------------

const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("addTaskForm");
const taskInput = document.getElementById("taskName");
const taskCount = document.getElementById("taskCount");
const taskTotal = document.getElementById("taskTotal");

// --- Operations: change state, then commit() -------------------------

function addTask(title) {
    const nextId = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    tasks.push({ id: nextId, title, completed: false });
    commit();
}

function setCompleted(id, completed) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = completed;
    commit();
}

function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    commit();
}

// One place where state becomes storage and screen.
function commit() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    render();
}

// --- Rendering -------------------------------------------------------

function render() {
    taskList.innerHTML = "";
    for (const task of tasks) {
        taskList.appendChild(createTaskItem(task));
    }
    updateStats();
}

function createTaskItem(task) {
    const item = document.createElement("li");
    item.className =
        "bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 " +
        "flex items-center gap-3 transition-colors hover:border-zinc-700";

    // Wrapping the checkbox and text in one <label> means clicking the
    // text toggles the checkbox. No id/htmlFor bookkeeping needed.
    const label = document.createElement("label");
    label.className = "flex-1 flex items-center gap-3 cursor-pointer min-w-0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.className = "accent-violet-500 w-4 h-4 shrink-0 cursor-pointer";
    checkbox.addEventListener("change", () => {
        setCompleted(task.id, checkbox.checked);
    });

    const text = document.createElement("span");
    text.textContent = task.title;
    text.className = task.completed
        ? "text-sm font-medium break-words line-through text-slate-500"
        : "text-sm font-medium break-words text-slate-200";

    label.append(checkbox, text);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className =
        "text-sm text-slate-500 hover:text-red-400 transition-colors " +
        "px-2 py-1 rounded-md shrink-0";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    item.append(label, deleteButton);
    return item;
}

function updateStats() {
    const done = tasks.filter((t) => t.completed).length;
    taskCount.textContent = done;
    taskTotal.textContent = tasks.length;
}

// --- Events ----------------------------------------------------------

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = taskInput.value.trim();
    if (title === "") {
        taskInput.focus();
        return;
    }

    addTask(title);
    taskInput.value = "";
});

render();
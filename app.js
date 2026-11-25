// app.js: connects the data (model.js + storage.js) to the page.
//
// The flow for every change is the same:
//   user action -> model function returns a NEW store -> update() saves it -> renderAll()

import * as model from "./model.js";
import { loadStore, saveStore } from "./storage.js";

const ROUTES = {
    dashboard: "Dashboard",
    projects: "Projects",
    tasks: "Tasks",
    calendar: "Calendar",
    settings: "Settings",
};

// Tailwind only generates classes it can find as complete strings in the
// source. So these are written out in full, never built with string pieces
// like "text-" + color.
const NAV_ACTIVE = ["bg-zinc-800", "text-violet-400"];
const NAV_IDLE = ["text-slate-400"];

let store = loadStore();

// --- Small helpers ---------------------------------------------------

const $ = (id) => document.getElementById(id);

// Creates an element with text. textContent (not innerHTML) means user
// input is shown as plain text, never run as HTML.
function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

// --- State -----------------------------------------------------------

function update(nextStore) {
    store = nextStore;
    saveStore(store);
    renderAll();
}

// --- Routing: #/dashboard, #/tasks, ... -----------------------------

function currentRoute() {
    const name = location.hash.replace("#/", "");
    // Object.hasOwn avoids matching built-ins like "constructor".
    return Object.hasOwn(ROUTES, name) ? name : "dashboard";
}

function showRoute() {
    const route = currentRoute();
    $("pageTitle").textContent = ROUTES[route];

    for (const section of document.querySelectorAll("[data-view]")) {
        section.hidden = section.dataset.view !== route;
    }

    for (const link of document.querySelectorAll("[data-route]")) {
        const active = link.dataset.route === route;
        link.classList.remove(...(active ? NAV_IDLE : NAV_ACTIVE));
        link.classList.add(...(active ? NAV_ACTIVE : NAV_IDLE));
    }

    if (route === "tasks") taskInput.focus();
}

// --- Rendering -------------------------------------------------------

function renderAll() {
    renderDashboard();
    renderProjects();
    renderTaskForm();
    renderTasks();
}

function createProjectCard(project) {
    // Computed from the data every time. Never stored on the project.
    const stats = model.projectStats(store, project.id);

    const card = el(
        "article",
        "bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3",
        ""
    );

    const header = el("div", "flex items-start justify-between gap-3", "");
    header.append(
        el("h3", "font-semibold text-slate-100 break-words", project.name),
        el(
            "span",
            "text-xs font-medium text-violet-400 bg-zinc-800 rounded-full px-2 py-1 shrink-0",
            project.status
        )
    );

    const bar = el("div", "w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden", "");
    const fill = el("div", "h-full bg-violet-500 rounded-full transition-all", "");
    // A dynamic percentage can't be a Tailwind class, so it goes in the
    // inline style. This is the one place where we set style directly.
    fill.style.width = `${stats.percent}%`;
    bar.append(fill);

    card.append(
        header,
        el("p", "text-sm text-slate-400", project.description || "No description"),
        bar,
        el(
            "p",
            "text-sm text-slate-400",
            `${stats.completed} of ${stats.total} tasks done (${stats.percent}%)`
        )
    );

    return card;
}

function renderDashboard() {
    const s = model.overallStats(store);
    $("statProjects").textContent = s.projects;
    $("statActive").textContent = s.activeProjects;
    $("statTasks").textContent = `${s.completed} / ${s.total}`;
    $("statPercent").textContent = `${s.percent}%`;

    $("dashboardProjects").replaceChildren(...store.projects.map(createProjectCard));
}

function renderProjects() {
    $("projectsGrid").replaceChildren(...store.projects.map(createProjectCard));
}

function renderTaskForm() {
    // Keep the user's selection if that project still exists.
    const previous = projectSelect.value;

    const options = store.projects.map((p) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        return option;
    });
    projectSelect.replaceChildren(...options);

    if (store.projects.some((p) => p.id === previous)) {
        projectSelect.value = previous;
    }
}

function createTaskItem(task, projectName) {
    const item = el(
        "li",
        "bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700 transition-colors",
        ""
    );

    const label = el("label", "flex-1 flex items-center gap-3 cursor-pointer min-w-0", "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.className = "accent-violet-500 w-4 h-4 shrink-0 cursor-pointer";
    checkbox.addEventListener("change", () => {
        update(model.setTaskCompleted(store, task.id, checkbox.checked));
    });

    const title = el(
        "span",
        task.completed
            ? "text-sm font-medium break-words line-through text-slate-500"
            : "text-sm font-medium break-words text-slate-200",
        task.title
    );

    const tag = el(
        "span",
        "text-xs text-slate-500 bg-zinc-800 rounded-md px-2 py-0.5 shrink-0",
        projectName ?? "Unknown project"
    );

    label.append(checkbox, title, tag);

    const deleteButton = el(
        "button",
        "text-sm text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-md shrink-0",
        "Delete"
    );
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
        update(model.deleteTask(store, task.id));
    });

    item.append(label, deleteButton);
    return item;
}

function renderTasks() {
    const names = new Map(store.projects.map((p) => [p.id, p.name]));
    const items = store.tasks.map((task) => createTaskItem(task, names.get(task.projectId)));

    taskList.replaceChildren(...items);
    $("taskEmpty").hidden = store.tasks.length > 0;
}

// --- Elements we use often -------------------------------------------

const taskForm = $("addTaskForm");
const taskInput = $("taskName");
const projectSelect = $("projectSelect");
const taskList = $("taskList");
const taskError = $("taskError");

// --- Events ----------------------------------------------------------

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    taskError.textContent = "";

    try {
        // createTask validates the title; addTask checks the project exists.
        const task = model.createTask({
            title: taskInput.value,
            projectId: projectSelect.value,
        });
        update(model.addTask(store, task));
        taskInput.value = "";
    } catch (err) {
        taskError.textContent = err.message;
    }
});

window.addEventListener("hashchange", showRoute);

// --- Start -----------------------------------------------------------

// A brand-new user has no projects, and tasks can't exist without one.
// Create a General project so the task form works immediately.
if (store.projects.length === 0) {
    const general = model.createProject({ name: "General", status: "In Progress" });
    update(model.addProject(store, general));
}

renderAll();
showRoute();

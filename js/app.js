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
// source, so every class name below is written out in full, never built
// from pieces like "text-" + color.
const NAV_ACTIVE = ["bg-card", "text-violet-300"];
const NAV_IDLE = ["text-slate-500"];

// The board columns are the project statuses, left to right.
const BOARD = [
    { status: "Planning", listId: "colPlanning", countId: "countPlanning" },
    { status: "In Progress", listId: "colInProgress", countId: "countInProgress" },
    { status: "Completed", listId: "colCompleted", countId: "countCompleted" },
];

let store = loadStore();

// --- Small helpers ---------------------------------------------------

const $ = (id) => document.getElementById(id);

// Creates an element with text. textContent (not innerHTML) means user
// input is shown as plain text, never run as HTML.
function el(tag, className, text = "") {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

// "2026-12-03" becomes a Date at local midnight. new Date("2026-12-03") would
// be read as UTC, which can show the wrong day in some time zones.
function parseDate(iso) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(iso) {
    return parseDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(project) {
    if (!project.targetDate || project.status === "Completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseDate(project.targetDate) < today;
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
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
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

// Every number here is computed from the data. Nothing is stored on a project.
function createProjectCard(project, { showStatus = false } = {}) {
    const stats = model.projectStats(store, project.id);

    const card = el(
        "article",
        "flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-violet-500/40"
    );

    const header = el("div", "flex items-start justify-between gap-3");
    header.append(el("h3", "min-w-0 break-words font-semibold text-white", project.name));
    if (showStatus) {
        header.append(
            el("span", "shrink-0 rounded-full bg-panel px-2.5 py-1 text-xs font-medium text-slate-300", project.status)
        );
    }

    const bar = el("div", "h-1.5 w-full overflow-hidden rounded-full bg-panel");
    const fill = el("div", "h-full rounded-full bg-violet-500 transition-all");
    // A dynamic percentage can't be a Tailwind class, so it goes in the
    // inline style. This is the one place where we set style directly.
    fill.style.width = `${stats.percent}%`;
    bar.append(fill);

    const footer = el("div", "flex items-center justify-between gap-3 text-xs");
    footer.append(
        el(
            "span",
            "text-slate-400",
            stats.total === 0 ? "No tasks yet" : `${stats.completed} of ${stats.total} tasks done`
        )
    );
    if (project.targetDate) {
        footer.append(
            el(
                "span",
                isOverdue(project) ? "shrink-0 text-red-400" : "shrink-0 text-slate-500",
                `Due ${formatDate(project.targetDate)}`
            )
        );
    }

    card.append(
        header,
        el("p", "line-clamp-2 text-sm text-slate-400", project.description || "No description yet"),
        bar,
        footer
    );

    return card;
}

function renderDashboard() {
    const s = model.overallStats(store);
    const inProgress = store.projects.filter((p) => p.status === "In Progress").length;
    const completed = store.projects.filter((p) => p.status === "Completed").length;

    $("statProjects").textContent = s.projects;
    $("statActive").textContent = `${s.activeProjects} active`;
    $("statInProgress").textContent = inProgress;
    $("statCompleted").textContent = completed;
    $("statTasks").textContent = `${s.completed} / ${s.total}`;
    $("statPercent").textContent = `${s.percent}%`;
    $("statBar").style.width = `${s.percent}%`;

    renderBoard();
}

function renderBoard() {
    for (const column of BOARD) {
        const projects = store.projects.filter((p) => p.status === column.status);

        const cards = projects.map((p) => createProjectCard(p));
        if (cards.length === 0) {
            cards.push(
                el(
                    "p",
                    "rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-slate-600",
                    "Nothing here yet"
                )
            );
        }

        $(column.listId).replaceChildren(...cards);
        $(column.countId).textContent = projects.length;
    }
}

function renderProjects() {
    $("projectsGrid").replaceChildren(
        ...store.projects.map((p) => createProjectCard(p, { showStatus: true }))
    );
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
        "flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 transition-colors hover:border-violet-500/40"
    );

    const label = el("label", "flex min-w-0 flex-1 cursor-pointer items-center gap-3");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.className = "size-4 shrink-0 cursor-pointer accent-violet-500";
    checkbox.addEventListener("change", () => {
        update(model.setTaskCompleted(store, task.id, checkbox.checked));
    });

    const title = el(
        "span",
        task.completed
            ? "min-w-0 flex-1 break-words text-sm font-medium text-slate-500 line-through"
            : "min-w-0 flex-1 break-words text-sm font-medium text-slate-100",
        task.title
    );

    const tag = el(
        "span",
        "shrink-0 rounded-md bg-panel px-2 py-0.5 text-xs text-slate-400",
        projectName ?? "Unknown project"
    );

    label.append(checkbox, title, tag);

    const deleteButton = el(
        "button",
        "shrink-0 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-red-400",
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

$("pageDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
});

renderAll();
showRoute();

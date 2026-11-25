// model.js: pure data logic for projects and tasks.
//
// Nothing in this file touches the DOM or localStorage. Every function takes
// data in and returns data out. That's what lets us test it in Node.
//
// Rule used throughout: never mutate. Store operations return a NEW store
// object instead of changing the one they were given.

export const STORE_VERSION = 2;
export const STATUSES = Object.freeze(["Planning", "In Progress", "Completed"]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// --- Helpers ---------------------------------------------------------

export function createId() {
    return crypto.randomUUID();
}

function isObject(value) {
    return typeof value === "object" && value !== null;
}

function percentOf(done, total) {
    return total === 0 ? 0 : Math.round((done / total) * 100);
}

// --- Constructors: validate input, return a clean record -------------

export function emptyStore() {
    return { version: STORE_VERSION, projects: [], tasks: [] };
}

// `options` lets tests pass a fixed id and timestamp. Production code
// uses the defaults.
export function createProject(fields, options = {}) {
    const { id = createId(), now = new Date().toISOString() } = options;

    const name = (fields.name ?? "").trim();
    if (name === "") throw new Error("Project name is required.");

    const status = fields.status ?? "Planning";
    if (!STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);

    // An empty <input type="date"> gives "", so "" becomes null here.
    const targetDate = fields.targetDate || null;
    if (targetDate !== null && !DATE_PATTERN.test(targetDate)) {
        throw new Error("Target date must look like YYYY-MM-DD.");
    }

    return {
        id,
        name,
        description: (fields.description ?? "").trim(),
        status,
        createdAt: now,
        targetDate,
    };
}

export function createTask(fields, options = {}) {
    const { id = createId() } = options;

    const title = (fields.title ?? "").trim();
    if (title === "") throw new Error("Task title is required.");
    if (!fields.projectId) throw new Error("A task must belong to a project.");

    return {
        id,
        projectId: fields.projectId,
        title,
        completed: Boolean(fields.completed),
    };
}

// --- Store operations: each returns a new store ----------------------

export function addProject(store, project) {
    return { ...store, projects: [...store.projects, project] };
}

// Deleting a project also deletes its tasks. Otherwise they'd be orphans
// pointing at a project that no longer exists.
export function deleteProject(store, projectId) {
    return {
        ...store,
        projects: store.projects.filter((p) => p.id !== projectId),
        tasks: store.tasks.filter((t) => t.projectId !== projectId),
    };
}

export function addTask(store, task) {
    const projectExists = store.projects.some((p) => p.id === task.projectId);
    if (!projectExists) throw new Error("That project does not exist.");

    return { ...store, tasks: [...store.tasks, task] };
}

export function setTaskCompleted(store, taskId, completed) {
    return {
        ...store,
        tasks: store.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
    };
}

export function deleteTask(store, taskId) {
    return { ...store, tasks: store.tasks.filter((t) => t.id !== taskId) };
}

// --- Derived numbers: always computed, never stored ------------------

export function projectStats(store, projectId) {
    const tasks = store.tasks.filter((t) => t.projectId === projectId);
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;

    return {
        total,
        completed,
        remaining: total - completed,
        percent: percentOf(completed, total),
    };
}

export function overallStats(store) {
    const total = store.tasks.length;
    const completed = store.tasks.filter((t) => t.completed).length;

    return {
        projects: store.projects.length,
        activeProjects: store.projects.filter((p) => p.status !== "Completed").length,
        total,
        completed,
        percent: percentOf(completed, total),
    };
}

// --- Migration from the old flat `myTasks` format --------------------

// Old format: [{ id: 1, title: "...", completed: true }, ...]
// New format: a store with one "General" project that owns those tasks.
export function migrateLegacyTasks(legacyTasks, options = {}) {
    const { now = new Date().toISOString() } = options;

    const general = createProject({ name: "General", status: "In Progress" }, { now });

    const tasks = legacyTasks
        .filter((old) => isObject(old) && typeof old.title === "string" && old.title.trim() !== "")
        .map((old) =>
            createTask({
                title: old.title,
                completed: old.completed,
                projectId: general.id,
            })
        );

    return { ...emptyStore(), projects: [general], tasks };
}

// --- Validation: is this loaded data safe to use? --------------------

// Run this on whatever localStorage returns. If it fails, fall back to
// an empty store instead of crashing the render.
export function isStore(value) {
    if (!isObject(value) || value.version !== STORE_VERSION) return false;
    if (!Array.isArray(value.projects) || !Array.isArray(value.tasks)) return false;

    const projectsOk = value.projects.every(
        (p) =>
            isObject(p) &&
            typeof p.id === "string" &&
            typeof p.name === "string" &&
            STATUSES.includes(p.status)
    );

    const tasksOk = value.tasks.every(
        (t) =>
            isObject(t) &&
            typeof t.id === "string" &&
            typeof t.projectId === "string" &&
            typeof t.title === "string" &&
            typeof t.completed === "boolean"
    );

    return projectsOk && tasksOk;
}

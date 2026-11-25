// Run with: npm test
// Uses Node's built-in test runner. No install needed.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as model from "../js/model.js";

// Fixed ids keep the tests predictable.
const fixedProject = (id, fields = { name: "Test project" }) =>
    model.createProject(fields, { id, now: "2026-01-01T00:00:00.000Z" });

const fixedTask = (id, projectId, fields = {}) =>
    model.createTask({ title: `Task ${id}`, projectId, ...fields }, { id });

// --- Constructors ----------------------------------------------------

test("createProject trims the name and defaults status to Planning", () => {
    const p = model.createProject({ name: "  Learn SQL  " }, { id: "p1" });
    assert.equal(p.name, "Learn SQL");
    assert.equal(p.status, "Planning");
    assert.equal(p.targetDate, null);
});

test("createProject rejects an empty name", () => {
    assert.throws(() => model.createProject({ name: "   " }), /name is required/);
});

test("createProject turns an empty date string into null", () => {
    const p = model.createProject({ name: "X", targetDate: "" }, { id: "p1" });
    assert.equal(p.targetDate, null);
});

test("createProject rejects a malformed date", () => {
    assert.throws(
        () => model.createProject({ name: "X", targetDate: "next week" }),
        /YYYY-MM-DD/
    );
});

test("createTask rejects a task with no project", () => {
    assert.throws(() => model.createTask({ title: "Orphan" }), /belong to a project/);
});

// --- Store operations ------------------------------------------------

test("addTask refuses a project that does not exist", () => {
    const store = model.emptyStore();
    assert.throws(
        () => model.addTask(store, fixedTask("t1", "missing")),
        /does not exist/
    );
});

test("setTaskCompleted does not mutate the original store", () => {
    const p = fixedProject("p1");
    const t = fixedTask("t1", "p1");
    const before = model.addTask(model.addProject(model.emptyStore(), p), t);

    const after = model.setTaskCompleted(before, "t1", true);

    assert.equal(before.tasks[0].completed, false); // original untouched
    assert.equal(after.tasks[0].completed, true);
    assert.notEqual(before, after);
});

test("deleteProject also deletes that project's tasks", () => {
    let store = model.addProject(model.emptyStore(), fixedProject("p1"));
    store = model.addProject(store, fixedProject("p2"));
    store = model.addTask(store, fixedTask("t1", "p1"));
    store = model.addTask(store, fixedTask("t2", "p2"));

    const result = model.deleteProject(store, "p1");

    assert.deepEqual(result.projects.map((p) => p.id), ["p2"]);
    assert.deepEqual(result.tasks.map((t) => t.id), ["t2"]);
});

// --- Derived numbers -------------------------------------------------

test("projectStats returns 0% for a project with no tasks, not NaN", () => {
    const store = model.addProject(model.emptyStore(), fixedProject("p1"));
    assert.deepEqual(model.projectStats(store, "p1"), {
        total: 0,
        completed: 0,
        remaining: 0,
        percent: 0,
    });
});

test("projectStats updates as tasks are completed and deleted", () => {
    let store = model.addProject(model.emptyStore(), fixedProject("p1"));
    store = model.addTask(store, fixedTask("t1", "p1"));
    store = model.addTask(store, fixedTask("t2", "p1"));
    store = model.addTask(store, fixedTask("t3", "p1"));

    store = model.setTaskCompleted(store, "t1", true);
    assert.deepEqual(model.projectStats(store, "p1"), {
        total: 3,
        completed: 1,
        remaining: 2,
        percent: 33,
    });

    store = model.deleteTask(store, "t1");
    assert.deepEqual(model.projectStats(store, "p1"), {
        total: 2,
        completed: 0,
        remaining: 2,
        percent: 0,
    });
});

test("projectStats only counts tasks belonging to that project", () => {
    let store = model.addProject(model.emptyStore(), fixedProject("p1"));
    store = model.addProject(store, fixedProject("p2"));
    store = model.addTask(store, fixedTask("t1", "p1", { completed: true }));
    store = model.addTask(store, fixedTask("t2", "p2"));

    assert.equal(model.projectStats(store, "p1").total, 1);
    assert.equal(model.projectStats(store, "p2").total, 1);
});

test("overallStats counts active projects (not Completed)", () => {
    let store = model.addProject(model.emptyStore(), fixedProject("p1"));
    store = model.addProject(
        store,
        fixedProject("p2", { name: "Done one", status: "Completed" })
    );

    assert.equal(model.overallStats(store).projects, 2);
    assert.equal(model.overallStats(store).activeProjects, 1);
});

// --- Migration -------------------------------------------------------

test("migrateLegacyTasks moves old tasks into a General project", () => {
    const legacy = [
        { id: 1, title: "Make one interaction work.", completed: true },
        { id: 2, title: "Add project/task date.", completed: false },
    ];

    const store = model.migrateLegacyTasks(legacy, { now: "2026-01-01T00:00:00.000Z" });

    assert.equal(store.projects.length, 1);
    assert.equal(store.projects[0].name, "General");
    assert.equal(store.tasks.length, 2);
    assert.ok(store.tasks.every((t) => t.projectId === store.projects[0].id));
    assert.equal(store.tasks[0].completed, true);
    assert.equal(store.tasks[1].completed, false);
});

test("migrateLegacyTasks skips entries with no usable title", () => {
    const legacy = [null, { id: 9, completed: true }, { id: 10, title: "Keep me" }];
    const store = model.migrateLegacyTasks(legacy);
    assert.deepEqual(store.tasks.map((t) => t.title), ["Keep me"]);
});

// --- Validation ------------------------------------------------------

test("isStore accepts a valid store", () => {
    let store = model.addProject(model.emptyStore(), fixedProject("p1"));
    store = model.addTask(store, fixedTask("t1", "p1"));
    assert.equal(model.isStore(store), true);
});

test("isStore rejects corrupted data instead of letting it crash the UI", () => {
    assert.equal(model.isStore(null), false);
    assert.equal(model.isStore([]), false);
    assert.equal(model.isStore({ version: 1, projects: [], tasks: [] }), false);
    assert.equal(
        model.isStore({
            version: 2,
            projects: [],
            tasks: [{ id: "t1", projectId: "p1", title: "x", completed: "yes" }],
        }),
        false
    );
    assert.equal(model.isStore({ version: 2, projects: [null], tasks: [] }), false);
});

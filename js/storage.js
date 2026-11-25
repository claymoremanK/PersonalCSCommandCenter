// storage.js: the only file that touches localStorage.
//
// Everything else works with plain store objects. If we ever switch to a
// server or a different storage method, only this file changes.

import { emptyStore, isStore, migrateLegacyTasks } from "./model.js";

const STORE_KEY = "commandCenter.v2";
const LEGACY_KEY = "myTasks"; // the flat task list from Phase 0

function readJSON(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        // Corrupted JSON: treat it as missing rather than crashing.
        return null;
    }
}

export function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

// Order of checks:
//   1. A valid new-format store wins.
//   2. Otherwise, if old tasks exist, migrate them once and save.
//   3. Otherwise, start empty.
export function loadStore() {
    const saved = readJSON(STORE_KEY);
    if (isStore(saved)) return saved;

    const legacy = readJSON(LEGACY_KEY);
    if (Array.isArray(legacy)) {
        const migrated = migrateLegacyTasks(legacy);
        saveStore(migrated);
        return migrated;
    }

    return emptyStore();
}

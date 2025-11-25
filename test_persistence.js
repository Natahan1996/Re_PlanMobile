const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return store[key] || null;
        },
        setItem: function (key, value) {
            store[key] = value.toString();
        },
        clear: function () {
            store = {};
        }
    };
})();

global.localStorage = localStorageMock;

// Mock DOM
global.window = {};
global.document = {
    getElementById: () => ({ value: '', addEventListener: () => { } }),
    createElement: () => ({ style: {}, classList: { add: () => { } } })
};

// Read scheduler code
const schedulerCode = fs.readFileSync(path.join(__dirname, 'scheduler.js'), 'utf8');
eval(schedulerCode);

// Test Suite
console.log("Starting Persistence Verification...");

let passed = 0;
let total = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`✅ ${message}`);
    } else {
        console.error(`❌ ${message}`);
    }
}

// 1. Create Scheduler and Add Task
const scheduler1 = new Scheduler();
const task = scheduler1.addTask("Persistence Test Task", 60, 20);
scheduler1.autoAssign();

assert(scheduler1.tasks.length === 1, "Scheduler 1 has 1 task");
assert(task.scheduled === true, "Task is scheduled in Scheduler 1");

// Verify data is in localStorage
const savedData = localStorage.getItem('chronoFlowData');
assert(savedData !== null, "Data saved to localStorage");

// 2. Create New Scheduler (Simulate Reload)
// The new scheduler should load from the mocked localStorage
const scheduler2 = new Scheduler();

assert(scheduler2.tasks.length === 1, "Scheduler 2 loaded 1 task");
const loadedTask = scheduler2.tasks[0];
assert(loadedTask.title === "Persistence Test Task", "Loaded task has correct title");

// Check if it is scheduled
// We need to find if it's in the days
let isScheduledInDays = false;
scheduler2.days.forEach(day => {
    if (day.scheduledItems.some(item => item.task.id === loadedTask.id)) {
        isScheduledInDays = true;
    }
});

assert(loadedTask.scheduled === true, "Loaded task is marked as scheduled");
assert(isScheduledInDays === true, "Loaded task is present in a day's scheduledItems");

console.log(`\nPersistence Tests: ${passed}/${total} Passed`);

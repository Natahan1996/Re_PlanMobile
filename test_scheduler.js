const fs = require('fs');
const path = require('path');

// Mock DOM for the scheduler to run in Node
global.window = {};
global.document = {
    getElementById: () => ({ value: '', addEventListener: () => { } }),
    createElement: () => ({ style: {}, classList: { add: () => { } } })
};

// Read the scheduler code
const schedulerCode = fs.readFileSync(path.join(__dirname, 'scheduler.js'), 'utf8');

// Eval the code to get the class (quick hack for testing without modules)
eval(schedulerCode);

// Test Suite
console.log("Starting Scheduler Logic Verification...");

const scheduler = new Scheduler();
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

// Test 1: Initialization
assert(scheduler.days.length === 7, "Scheduler initializes 7 days");
assert(scheduler.days[0].energyCapacity === 50, "Weekday has 50 energy");
assert(scheduler.days[6].energyCapacity === 100, "Sunday has 100 energy");

// Test 2: Add Task
const task = scheduler.addTask("Test Task", 60, 20);
assert(scheduler.tasks.length === 1, "Task added to pool");
assert(task.duration === 60, "Task duration correct");

// Test 3: Auto Assign (Simple)
scheduler.autoAssign();
assert(task.scheduled === true, "Task was scheduled");
assert(scheduler.days[0].scheduledItems.length > 0 || scheduler.days[1].scheduledItems.length > 0, "Task placed in a day");

// Test 4: Energy Constraint
scheduler.clearSchedule();
// Add a task that exceeds weekday energy (80 > 50) but fits weekend (80 < 100)
const heavyTask = scheduler.addTask("Heavy Workout", 60, 80);
scheduler.autoAssign();

const scheduledDay = scheduler.days.find(d => d.scheduledItems.includes(d.scheduledItems.find(i => i.task === heavyTask)));
if (scheduledDay) {
    assert(scheduledDay.isWeekend === true, "High energy task (80) scheduled on weekend");
} else {
    assert(false, "High energy task should have been scheduled on weekend");
}

// Test 5: Work Hours Blocking
scheduler.clearSchedule();
// Weekday: Blocked 8am (480) - 7pm (1140).
// Try to schedule a task. It should fall before 8am or after 7pm.
const workTask = scheduler.addTask("Quick Call", 30, 10);
scheduler.autoAssign();

const item = scheduler.days.find(d => d.scheduledItems.length > 0)?.scheduledItems[0];
if (item) {
    // Check if it overlaps with work (480-1140)
    const overlaps = (item.start < 1140 && item.end > 480);
    assert(!overlaps || scheduler.days.find(d => d.scheduledItems.includes(item)).isWeekend, "Task does not overlap with work hours on weekday");
}

console.log(`\nTests Completed: ${passed}/${total} Passed`);

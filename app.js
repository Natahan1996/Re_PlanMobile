/**
 * App Controller
 * Connects UI to Scheduler Logic
 */

const scheduler = new Scheduler();

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskPoolList = document.getElementById('task-pool-list');
const calendarGrid = document.getElementById('calendar-grid');
const autoScheduleBtn = document.getElementById('auto-schedule-btn');
const clearBtn = document.getElementById('clear-btn');
const totalEnergyDisplay = document.getElementById('total-energy-used');
const taskTitleInput = document.getElementById('task-title');

// Initial Render
renderCalendarStructure();
updateUI();

// Event Listeners
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value; // Get value from input
    const energy = parseInt(document.getElementById('task-energy').value);
    const frequency = parseInt(document.getElementById('task-frequency').value) || 1;
    const durationInput = parseInt(document.getElementById('task-duration').value);
    const duration = durationInput || (energy * 6); // Fallback if empty
    const groupId = Date.now().toString(); // Unique ID for this batch

    if (!title) return; // Prevent empty tasks

    for (let i = 0; i < frequency; i++) {
        scheduler.addTask(title, duration, energy, groupId);
    }

    // Reset form
    document.getElementById('task-title').value = '';
    // Reset defaults
    document.getElementById('task-energy').value = '10';
    document.getElementById('task-frequency').value = '1';

    updateUI();
});

// Delete Task Delegation
taskPoolList.addEventListener('click', (e) => {
    if (e.target.closest('.btn-delete')) {
        const taskId = e.target.closest('.task-card').dataset.id;
        scheduler.deleteTask(taskId);
        updateUI();
    }
});

// Smart Prediction Logic
taskTitleInput.addEventListener('blur', () => {
    const title = taskTitleInput.value.toLowerCase();
    const prediction = predictTaskAttributes(title);

    if (prediction) {
        document.getElementById('task-energy').value = prediction.energy;
        document.getElementById('task-duration').value = prediction.duration;
    }
});

function predictTaskAttributes(title) {
    const rules = [
        { keywords: ['gym', 'workout', 'exercise', 'run', 'fitness'], duration: 90, energy: 15 },
        { keywords: ['read', 'book', 'study', 'learn'], duration: 45, energy: 8 },
        { keywords: ['cook', 'dinner', 'lunch', 'meal'], duration: 45, energy: 8 },
        { keywords: ['clean', 'chore', 'laundry', 'tidy'], duration: 60, energy: 10 },
        { keywords: ['meeting', 'call', 'zoom', 'sync'], duration: 30, energy: 5 },
        { keywords: ['code', 'program', 'dev', 'work'], duration: 120, energy: 20 },
        { keywords: ['nap', 'relax', 'tv', 'movie', 'game'], duration: 60, energy: 2 },
        { keywords: ['shop', 'grocer', 'store'], duration: 60, energy: 10 }
    ];

    for (let rule of rules) {
        if (rule.keywords.some(k => title.includes(k))) {
            return { duration: rule.duration, energy: rule.energy };
        }
    }
    return null; // No prediction
}

autoScheduleBtn.addEventListener('click', () => {
    scheduler.autoAssign();
    updateUI();
});

clearBtn.addEventListener('click', () => {
    scheduler.clearSchedule();
    updateUI();
});

// Rendering Logic

function updateUI() {
    renderTaskPool();
    renderCalendarEvents();
    updateStats();
}

function renderTaskPool() {
    taskPoolList.innerHTML = '';
    const unscheduled = scheduler.tasks.filter(t => !t.scheduled);

    if (unscheduled.length === 0) {
        taskPoolList.innerHTML = '<div class="empty-state">No tasks in pool</div>';
        return;
    }

    unscheduled.forEach(task => {
        const el = document.createElement('div');
        el.className = 'task-card';
        el.dataset.id = task.id;
        el.innerHTML = `
            <div>
                <div class="task-title">${task.title}</div>
                <div class="task-meta">⏱ ${task.duration}m | ⚡ ${task.energy}</div>
            </div>
            <button class="btn-delete" title="Delete Task">×</button>
        `;
        taskPoolList.appendChild(el);
    });
}

function renderCalendarStructure() {
    calendarGrid.innerHTML = '';

    // Update Headers with Dates (Keep for desktop/landscape compatibility if needed, but we hide in mobile portrait)
    const headerCells = document.querySelectorAll('.day-header');
    scheduler.days.forEach((day, index) => {
        if (headerCells[index]) {
            const capHtml = `<span class="capacity">${day.energyCapacity}e</span>`;
            headerCells[index].innerHTML = `${day.name} <span class="date-sub">${day.dateStr}</span> ${capHtml}`;
        }
    });

    scheduler.days.forEach((day, index) => {
        const col = document.createElement('div');
        col.className = 'day-column';
        col.id = `day-col-${index}`;

        // Add Day Header inside the column (for vertical layout)
        const dayLabel = document.createElement('div');
        dayLabel.className = 'mobile-day-label';
        dayLabel.innerHTML = `${day.name} <span class="date-sub">${day.dateStr}</span> <span class="capacity">${day.energyCapacity}e</span>`;
        col.appendChild(dayLabel);

        // Apply Theme
        if (day.theme) {
            col.classList.add(`theme-${day.theme}`);
        }

        // Background Image (Anime Girl)
        const bgOverlay = document.createElement('div');
        bgOverlay.className = 'day-bg-overlay';
        const images = [
            'anime_girl_mon.png',
            'anime_girl_tue.png',
            'anime_girl_wed.png',
            'anime_girl_thu.png',
            'anime_girl_fri.png',
            'anime_girl_sat.png',
            'anime_girl_sun.png'
        ];
        // Use index % 7 to be safe
        bgOverlay.style.backgroundImage = `linear-gradient(rgba(10, 10, 10, 0.85), rgba(10, 10, 10, 0.85)), url('${images[index]}')`;
        col.appendChild(bgOverlay);

        // Passed Day Styling
        if (day.isPassed) {
            col.classList.add('passed-day');
            // Make it darker
            bgOverlay.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.95)), url('${images[index]}')`;
        }

        // Render Blocked Ranges (Work)
        day.blockedRanges.forEach(block => {
            const blockEl = document.createElement('div');
            blockEl.className = 'blocked-time';
            // Convert minutes to percentage of day (assuming 6am to 11pm view range = 1020 mins)
            // View starts at 0:00 (0min)
            const viewStart = 0;
            const viewDuration = 1440; // 24 hours
            const PIXELS_PER_MINUTE = 0.7;

            let start = block.start;
            let end = block.end;

            // Clamp to view range
            if (start < viewStart) start = viewStart;
            if (end > viewStart + viewDuration) end = viewStart + viewDuration;

            if (end > start) {
                const top = (start - viewStart) * PIXELS_PER_MINUTE;
                const height = (end - start) * PIXELS_PER_MINUTE;

                blockEl.style.top = `${top}px`;
                blockEl.style.height = `${height}px`;
                blockEl.textContent = block.label;

                col.appendChild(blockEl);
            }
        });

        calendarGrid.appendChild(col);
    });
}

function renderCalendarEvents() {
    renderCalendarStructure();

    scheduler.days.forEach((day, index) => {
        const col = document.getElementById(`day-col-${index}`);

        day.scheduledItems.forEach(item => {
            const el = document.createElement('div');

            // Color coding based on energy
            let energyClass = 'energy-low';
            if (item.task.energy >= 70) energyClass = 'energy-high';
            else if (item.task.energy >= 40) energyClass = 'energy-med';

            el.className = `scheduled-task ${energyClass}`;

            const viewStart = 0;
            // const viewDuration = 1440; 
            const PIXELS_PER_MINUTE = 0.7; // 42px per hour

            const top = (item.start - viewStart) * PIXELS_PER_MINUTE;
            const height = (item.end - item.start) * PIXELS_PER_MINUTE;

            el.style.top = `${top}px`;
            el.style.height = `${height}px`;

            // Format time
            const startHour = Math.floor(item.start / 60);
            const startMin = item.start % 60;
            const endHour = Math.floor(item.end / 60);
            const endMin = item.end % 60;

            const timeStr = `${startHour}:${startMin.toString().padStart(2, '0')} - ${endHour}:${endMin.toString().padStart(2, '0')}`;

            el.innerHTML = `
                <div class="time">${timeStr}</div>
                <div class="title">${item.task.title}</div>
            `;

            col.appendChild(el);
        });
    });
}

function updateStats() {
    const { totalUsed, totalCap } = scheduler.getStats();
    totalEnergyDisplay.textContent = `${totalUsed} / ${totalCap}`;
}

// Debug Info
document.getElementById('debug-btn').addEventListener('click', () => {
    const allTasks = scheduler.tasks;
    const scheduled = allTasks.filter(t => t.scheduled);
    const unscheduled = allTasks.filter(t => !t.scheduled);

    let msg = `Total Tasks: ${allTasks.length}\nScheduled: ${scheduled.length}\nUnscheduled: ${unscheduled.length}\n\n`;

    msg += '--- Scheduled ---\n';
    scheduler.days.forEach(day => {
        day.scheduledItems.forEach(item => {
            msg += `[${day.name} ${Math.floor(item.start / 60)}:${(item.start % 60).toString().padStart(2, '0')}] ${item.task.title} (${item.task.energy}e)\n`;
        });
    });

    msg += '\n--- Unscheduled (Pool) ---\n';
    unscheduled.forEach(t => {
        msg += `${t.title} (${t.energy}e)\n`;
    });

    alert(msg);
    console.log(msg);
});

/**
 * Scheduler Logic
 * Handles the data model and auto-assignment algorithms.
 */

class Scheduler {
    constructor() {
        this.tasks = []; // All tasks (scheduled and unscheduled)
        this.days = this.initializeDays();
        this.load(); // Load data on init
    }

    initializeDays(startDate = new Date('2025-11-24T12:00:00')) { // Default to Thanksgiving week 2025
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const now = new Date(); // Current real-world time

        return days.map((name, index) => {
            // Calculate date
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Check if day is in the past (strictly before today's date)
            // We compare YYYY-MM-DD strings to avoid time issues
            const isPassed = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Holiday Logic (Thanksgiving 2025 is Nov 27)
            const isThanksgiving = date.getMonth() === 10 && date.getDate() === 27;

            const isWeekend = index >= 5; // Sat, Sun

            let energyCapacity = isWeekend ? 100 : 30;
            let blockedRanges = [];
            let theme = null;

            if (isThanksgiving) {
                energyCapacity = 0;
                blockedRanges = [{ start: 0, end: 1440, label: "Thanksgiving Holiday" }];
                theme = 'thanksgiving';
            } else {
                // Normal Constraints
                blockedRanges = isWeekend ? [
                    { start: 0, end: 720, label: "Weekend Morning" }
                ] : [
                    { start: 0, end: 480, label: "Sleep / Morning Routine" },
                    { start: 480, end: 1140, label: "Work + Commute" },
                    { start: 1260, end: 1440, label: "Wind Down" }
                ];
            }

            return {
                name: name,
                dateStr: dateStr,
                isWeekend: isWeekend,
                isPassed: isPassed, // New property
                energyCapacity: energyCapacity,
                currentEnergyLoad: 0,
                blockedRanges: blockedRanges,
                theme: theme,
                scheduledItems: [] // { task, start, end }
            };
        });
    }

    addTask(title, duration, energy, groupId = null) {
        const task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            duration: parseInt(duration),
            energy: parseInt(energy),
            groupId: groupId,
            scheduled: false
        };
        this.tasks.push(task);
        this.save();
        return task;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        // Also remove from scheduled items if present
        this.days.forEach(day => {
            day.scheduledItems = day.scheduledItems.filter(item => item.task.id !== taskId);
            // Recalculate energy load
            day.currentEnergyLoad = day.scheduledItems.reduce((acc, item) => acc + item.task.energy, 0);
        });
        this.save();
    }

    clearSchedule() {
        this.days = this.initializeDays();
        this.tasks.forEach(t => t.scheduled = false);
        this.save();
    }

    /**
     * Main Auto-Assign Algorithm
     * Attempts to place all unscheduled tasks into the best available slots.
     */
    autoAssign() {
        // Sort tasks: High energy & Long duration first (Hardest to fit)
        const unscheduled = this.tasks.filter(t => !t.scheduled)
            .sort((a, b) => (b.energy * b.duration) - (a.energy * a.duration));

        unscheduled.forEach(task => {
            this.findSlotForTask(task);
        });
        this.save();
    }

    findSlotForTask(task) {
        // Try each day
        for (let day of this.days) {
            // Skip passed days
            if (day.isPassed) continue;

            // Check energy constraint
            if (day.currentEnergyLoad + task.energy > day.energyCapacity) {
                continue; // Not enough energy this day
            }

            // Spacing Constraint: Check if this task group is already on this day
            if (task.groupId) {
                const alreadyHasGroup = day.scheduledItems.some(item => item.task.groupId === task.groupId);
                if (alreadyHasGroup) continue; // Skip day to ensure spacing
            }

            // Find a time slot
            // Day starts at 6:00 (360) and ends at 23:00 (1380)
            const dayStart = 360;
            const dayEnd = 1380;

            // Simple linear search for a gap
            // We iterate in 15 min increments
            for (let time = dayStart; time <= dayEnd - task.duration; time += 15) {
                const potentialEnd = time + task.duration;

                if (this.isTimeFree(day, time, potentialEnd)) {
                    // Found a spot!
                    this.scheduleTaskOnDay(task, day, time, potentialEnd);
                    return; // Done with this task
                }
            }
        }
        console.log(`Could not schedule task: ${task.title}`);
    }

    isTimeFree(day, start, end) {
        // Check against blocked ranges (Work)
        for (let block of day.blockedRanges) {
            // Overlap check
            if (start < block.end && end > block.start) return false;
        }

        // Check against already scheduled tasks
        for (let item of day.scheduledItems) {
            if (start < item.end && end > item.start) return false;
        }

        return true;
    }

    scheduleTaskOnDay(task, day, start, end) {
        day.scheduledItems.push({
            task: task,
            start: start,
            end: end
        });
        day.currentEnergyLoad += task.energy;
        task.scheduled = true;

        // Keep items sorted by time
        day.scheduledItems.sort((a, b) => a.start - b.start);
    }

    getStats() {
        const totalUsed = this.days.reduce((acc, day) => acc + day.currentEnergyLoad, 0);
        const totalCap = this.days.reduce((acc, day) => acc + day.energyCapacity, 0);
        return { totalUsed, totalCap };
    }

    save() {
        if (typeof localStorage === 'undefined') return; // Node env check
        const data = {
            tasks: this.tasks,
            days: this.days
        };
        localStorage.setItem('chronoFlowData', JSON.stringify(data));
    }

    load() {
        if (typeof localStorage === 'undefined') return;
        const dataStr = localStorage.getItem('chronoFlowData');
        if (dataStr) {
            const data = JSON.parse(dataStr);
            this.tasks = data.tasks || [];

            // Restore scheduled state
            // We have fresh 'this.days' from the constructor (with correct dates/constraints)
            // We need to re-populate 'scheduledItems' from the saved data

            if (data.days) {
                data.days.forEach(savedDay => {
                    // Find the corresponding day in the current session by date string
                    const currentDay = this.days.find(d => d.dateStr === savedDay.dateStr);

                    if (currentDay && savedDay.scheduledItems) {
                        // Restore items
                        savedDay.scheduledItems.forEach(item => {
                            // We need to link the actual task object from this.tasks
                            // because 'item.task' is just a copy from JSON
                            const realTask = this.tasks.find(t => t.id === item.task.id);

                            if (realTask) {
                                currentDay.scheduledItems.push({
                                    task: realTask,
                                    start: item.start,
                                    end: item.end
                                });
                                currentDay.currentEnergyLoad += realTask.energy;
                                realTask.scheduled = true; // Ensure task is marked as scheduled
                            }
                        });

                        // Sort just in case
                        currentDay.scheduledItems.sort((a, b) => a.start - b.start);
                    }
                });
            }
        }
    }
}

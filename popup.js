const TIMER_DURATION = 25 * 60 * 1000; // 25 minutes in ms
const TIMER_KEY = "studentBuddyTimerEnd";

let timerDisplay = document.querySelector("#timer-display");
let startBtn = document.querySelector("#start");
let taskInput = document.querySelector("#task-input");
let taskList = document.querySelector("#task-list");
let addBtn = document.querySelector("#add");
let tasks = [];

let timerInterval = null;

// ---------- TIMER LOGIC ----------

function msToMMSS(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}

function updateDisplayLoop(endTime) {
    // Clear any existing interval
    if (timerInterval) clearInterval(timerInterval);

    function tick() {
        const now = Date.now();
        const remaining = endTime - now;

        if (remaining <= 0) {
            timerDisplay.innerText = "00:00";
            clearInterval(timerInterval);
            timerInterval = null;

            // Clear saved timer
            chrome.storage.sync.remove(TIMER_KEY);

            alert("Take a break!");
            return;
        }

        timerDisplay.innerText = msToMMSS(remaining);
    }

    tick(); // update immediately
    timerInterval = setInterval(tick, 1000);
}

// When popup opens, restore timer state
function restoreTimer() {
    chrome.storage.sync.get([TIMER_KEY], (result) => {
        const endTime = result[TIMER_KEY];

        if (!endTime) {
            // No active timer
            timerDisplay.innerText = msToMMSS(TIMER_DURATION);
            return;
        }

        const remaining = endTime - Date.now();

        if (remaining <= 0) {
            // Timer has already finished
            timerDisplay.innerText = "00:00";
            chrome.storage.sync.remove(TIMER_KEY);
        } else {
            // Resume countdown display
            updateDisplayLoop(endTime);
        }
    });
}

// Start button
startBtn.addEventListener("click", () => {
    const endTime = Date.now() + TIMER_DURATION;

    chrome.storage.sync.set({ [TIMER_KEY]: endTime }, () => {
        updateDisplayLoop(endTime);
    });
});

// Call once when popup loads
restoreTimer();

// ---------- TASKS LOGIC (same as before) ----------

renderTasks();

addBtn.addEventListener("click", () => {
    let inputVal = taskInput.value.trim();
    if (!inputVal) return;

    tasks.push(inputVal);
    chrome.storage.sync.set({ buddytasks: tasks }).then(() => {
        renderTasks();
        taskInput.value = "";
    });
});

function renderTasks() {
    taskList.innerHTML = "";
    chrome.storage.sync.get(["buddytasks"]).then((result) => {
        tasks = result.buddytasks || [];
        tasks.forEach((element) => {
            let li = document.createElement("li");
            li.textContent = element;

            let delBtn = document.createElement("button");
            delBtn.textContent = "X";
            delBtn.onclick = () => {
                tasks = tasks.filter((t) => t !== element);
                chrome.storage.sync.set({ buddytasks: tasks });
                li.remove();
            };

            li.appendChild(delBtn);
            taskList.appendChild(li);
        });
    });
}

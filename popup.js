const TIMER_DURATION = 25 * 60 * 1000;

let timerDisplay = document.querySelector("#timer-display");
let startBtn = document.querySelector("#start");
let taskInput = document.querySelector("#task-input");
let taskList = document.querySelector("#task-list");
let addBtn = document.querySelector("#add");

let timerInterval = null;

// ---------- TIMER LOGIC ----------

function msToMMSS(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function startDisplayLoop(endTime) {
    if (timerInterval) clearInterval(timerInterval);

    function tick() {
        const remaining = endTime - Date.now();
        if (remaining <= 0) {
            timerDisplay.innerText = "00:00";
            clearInterval(timerInterval);
            timerInterval = null;
            setUIState("IDLE");
            return;
        }
        timerDisplay.innerText = msToMMSS(remaining);
    }

    tick();
    timerInterval = setInterval(tick, 1000);
}

function setUIState(state) {
    if (state === "RUNNING") {
        startBtn.textContent = "Stop / Give Up";
        startBtn.classList.add("stop-mode");
    } else {
        startBtn.textContent = "Start Focus";
        startBtn.classList.remove("stop-mode");
        timerDisplay.innerText = "25:00";
        if (timerInterval) clearInterval(timerInterval);
    }
}

// Initialize
chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response.timerState === "RUNNING") {
        setUIState("RUNNING");
        startDisplayLoop(response.endTime);
    } else {
        setUIState("IDLE");
    }
});

// Button Handler
startBtn.addEventListener("click", () => {
    // Check current state via button text/class or just ask background? 
    // Optimistic UI update is faster.
    const isRunning = startBtn.classList.contains("stop-mode");

    if (isRunning) {
        // STOP
        chrome.runtime.sendMessage({ type: "STOP_POMODORO" }, () => {
            setUIState("IDLE");
        });
    } else {
        // START
        chrome.runtime.sendMessage({ type: "START_POMODORO" }, () => {
            setUIState("RUNNING");
            // approximate end time for immediate feedback, background has truth
            startDisplayLoop(Date.now() + TIMER_DURATION);
        });
    }
});


// ---------- TASKS LOGIC ----------

renderTasks();

addBtn.addEventListener("click", () => {
    let inputVal = taskInput.value.trim();
    if (!inputVal) return;

    chrome.storage.sync.get(["buddytasks"], (result) => {
        const tasks = result.buddytasks || [];
        tasks.push(inputVal);
        chrome.storage.sync.set({ buddytasks: tasks }, () => {
            renderTasks();
            taskInput.value = "";
        });
    });
});

function renderTasks() {
    taskList.innerHTML = "";
    chrome.storage.sync.get(["buddytasks"], (result) => {
        const tasks = result.buddytasks || [];
        tasks.forEach((element) => {
            let li = document.createElement("li");
            li.textContent = element;

            let delBtn = document.createElement("button");
            delBtn.textContent = "✖";
            delBtn.className = "delete-btn";
            delBtn.onclick = () => {
                const newTasks = tasks.filter((t) => t !== element);
                chrome.storage.sync.set({ buddytasks: newTasks }, renderTasks);
            };

            li.appendChild(delBtn);
            taskList.appendChild(li);
        });
    });
}

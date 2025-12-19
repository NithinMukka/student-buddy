// background.js (Service Worker)

const ALARM_NAME = "pomodoroAlarm";

// Initialize state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    timerState: "IDLE", // IDLE, RUNNING
    endTime: null
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_POMODORO") {
    const durationMs = message.duration || 25 * 60 * 1000;
    const endTime = Date.now() + durationMs;

    // Save state
    chrome.storage.sync.set({
      timerState: "RUNNING",
      endTime: endTime
    });

    // Set alarm
    chrome.alarms.create(ALARM_NAME, { when: endTime });

    sendResponse({ ok: true });
  } else if (message.type === "STOP_POMODORO") {
    // Clear alarm
    chrome.alarms.clear(ALARM_NAME);

    // Reset state
    chrome.storage.sync.set({
      timerState: "IDLE",
      endTime: null
    });

    sendResponse({ ok: true });
  } else if (message.type === "GET_STATUS") {
    // Retrieve current state for popup initialization
    chrome.storage.sync.get(["timerState", "endTime"], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }
});

// Alarm Handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    // Timer finished
    chrome.storage.sync.set({
      timerState: "IDLE",
      endTime: null
    });

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Time's up!",
      message: "Great job! Take a break. 🎉",
      priority: 2
    });
  }
});

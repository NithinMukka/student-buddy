// content.js

function checkStatusAndBlock() {
    chrome.storage.sync.get(["timerState"], (result) => {
        if (result.timerState === "RUNNING") {
            enableBlocker();
        } else {
            disableBlocker();
        }
    });
}

// Initial Block (creates the overlay but might hide it if not running)
// Actually, better to only create if needed to avoid flashing.
let blockerDiv = null;

function enableBlocker() {
    if (document.getElementById("student-buddy-blocker")) return; // Already blocked

    // We use a high z-index overlay instead of replacing body innerHTML 
    // to avoid destroying the page state completely if we want to unblock without reload (optional),
    // BUT the requirement is "unblock on stop". Converting innerHTML is safer to stop videos playing.
    // However, if we replace innerHTML, we can't easily "restore" without reload.
    // Let's stick to replacing document.body logic as it's most effective for "Distraction Blocker".

    // Create a new body content
    const style = `
        height: 100vh;
        width: 100vw;
        background-color: #1a1a1a;
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
    `;

    blockerDiv = document.createElement("div");
    blockerDiv.id = "student-buddy-blocker";
    blockerDiv.style.cssText = style;
    blockerDiv.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px;">🛑</div>
        <h1 style="font-size: 40px; margin: 0 0 20px 0;">Focus Mode Active</h1>
        <p style="font-size: 20px; color: #aaa;">The timer is running. Get back to work!</p>
    `;

    // Nuke the body and append our blocker
    // We strictly hide everything else
    document.documentElement.style.overflow = 'hidden'; // Stop scrolling
    if (document.body) {
        document.body.appendChild(blockerDiv);
    } else {
        // In case body doesn't exist yet (run_at document_start?)
        // manifest defaults to document_idle usually, but let's be safe
        window.onload = () => document.body.appendChild(blockerDiv);
    }
}

function disableBlocker() {
    const existing = document.getElementById("student-buddy-blocker");
    if (existing) {
        // If we were blocked, we should probably reload to restore the page correctly
        // especially if we want to restore video players etc.
        location.reload();
    }
}

// Check on load
checkStatusAndBlock();

// Listen for changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.timerState) {
        if (changes.timerState.newValue === "RUNNING") {
            enableBlocker();
        } else {
            disableBlocker();
        }
    }
});
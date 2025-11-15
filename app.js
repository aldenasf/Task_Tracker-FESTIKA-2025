// Request notification permission
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}
function notify(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

// INIT
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
const form = document.querySelector(".add-task form");
const taskListContainer = document.querySelector(".task-list");
const filterButtons = document.querySelectorAll(".filter-buttons button");

// SAVE TO LOCALSTORAGE
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
// ADD NEW TASK
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const title = form.querySelector("input").value;
    const desc = form.querySelector("textarea").value;
    const deadline = form.querySelector("input[type=datetime-local]").value;

    const task = {
        id: Date.now(),
        title,
        desc,
        deadline,
        done: false,
        important: false,

        notified7: false,
        notified3: false,
        notified1: false,
        notified10: false,
        notifiedDue: false
};


    tasks.push(task);
    saveTasks();
    renderTasks();

    form.reset();
});

// DELETE TASK
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// MARK AS DONE / UNDO
function toggleDone(id) {
    const t = tasks.find(x => x.id === id);
    t.done = !t.done;
    saveTasks();
    renderTasks();
}

// IMPORTANT ⭐ TOGGLE
function toggleImportant(id) {
    const t = tasks.find(x => x.id === id);
    t.important = !t.important;
    saveTasks();
    renderTasks();
}

// FILTER SYSTEM
let activeFilter = "all";

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        filterButtons.forEach(x => x.classList.remove("active"));
        btn.classList.add("active");

        activeFilter = btn.textContent.trim().toLowerCase();
        renderTasks();
    });
});

function applyFilter(task) {
    const now = Date.now();
    const dl = new Date(task.deadline).getTime();
    const diff = dl - now;

    if (activeFilter === "all") return true;
    if (activeFilter === "important ⭐" || activeFilter === "important") return task.important;

    if (activeFilter === "7 days left") {
        return diff <= 7 * 24 * 60 * 60 * 1000 && diff > 0;
    }
    if (activeFilter === "3 days left") {
        return diff <= 3 * 24 * 60 * 60 * 1000 && diff > 0;
    }
    if (activeFilter === "today") {
        return diff <= 24 * 60 * 60 * 1000 && diff > 0;
    }
    if (activeFilter === "overdue") {
        return diff < 0;
    }

    return true;
}

// DEADLINE COLOR
function getDeadlineColor(deadline, done) {
    if (done) return "green";

    const now = Date.now();
    const diff = new Date(deadline).getTime() - now;

    if (diff < 0) return "red";
    if (diff < 24*60*60*1000) return "red";
    if (diff < 7*24*60*60*1000) return "orange";

    return "green";
}

// RENDER TASKS
function renderTasks() {
    const list = document.querySelector(".task-list");
    list.innerHTML = "<h2>Your Tasks</h2>";

    const filtered = tasks.filter(applyFilter);

    if (filtered.length === 0) {
        list.innerHTML += `<p style="opacity:0.6;">No tasks match this filter.</p>`;
        return;
    }

    filtered.forEach(t => {
        const dlColor = getDeadlineColor(t.deadline, t.done);

        const card = document.createElement("div");
        card.className = "task-card";
        if (t.done) card.classList.add("done");

        card.innerHTML = `
            <div class="task-header">
                <h3>${t.title}</h3>
                <span class="important" onclick="toggleImportant(${t.id})">
                    ${t.important ? "⭐" : "☆"}
                </span>
            </div>
            
            <p class="desc">${t.desc}</p>

            <p class="deadline ${dlColor}">
                ${t.done ? "Completed" : "Deadline: " + t.deadline.replace("T", " ")}
            </p>

            <div class="task-actions">
                ${
                    t.done 
                    ? `<button class="undo-btn" onclick="toggleDone(${t.id})">Undo</button>`
                    : `<button class="done-btn" onclick="toggleDone(${t.id})">Mark as Done</button>`
                }
                <button class="delete-btn" onclick="deleteTask(${t.id})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}
// FUNGSI REMINDER
function checkReminders() {
    const now = Date.now();

    tasks.forEach(task => {
        if (task.done) return; // tidak notif task sudah selesai

        const deadline = new Date(task.deadline).getTime();
        const diff = deadline - now;

        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        const oneDay = 1 * 24 * 60 * 60 * 1000;
        const tenMinutes = 10 * 60 * 1000;

        // 7 hari
        if (!task.notified7 && diff <= sevenDays && diff > threeDays) {
            notify("Reminder 7 Hari", `${task.title} akan jatuh tempo dalam 7 hari.`);
            task.notified7 = true;
        }

        // 3 hari
        if (!task.notified3 && diff <= threeDays && diff > oneDay) {
            notify("Reminder 3 Hari", `${task.title} tinggal 3 hari lagi.`);
            task.notified3 = true;
        }

        // 1 hari
        if (!task.notified1 && diff <= oneDay && diff > tenMinutes) {
            notify("Reminder Besok", `${task.title} deadlinenya besok.`);
            task.notified1 = true;
        }

        // 10 menit
        if (!task.notified10 && diff <= tenMinutes && diff > 0) {
            notify("Reminder 10 Menit", `${task.title} deadlinenya 10 menit lagi!`);
            task.notified10 = true;
        }

        // Hari H
        if (!task.notifiedDue && diff <= 0) {
            notify("Deadline Sekarang!", `${task.title} sudah saatnya dikerjakan sekarang.`);
            task.notifiedDue = true;
        }

        saveTasks();
    });
}

function runReminderSystem() {
  const tasks = loadTasks();
  const now = new Date();

  tasks.forEach(task => {
    if (!task.deadline || task.done) return;

    const deadline = new Date(task.deadline);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    // sudah diingatkan? (biar ga spam)
    if (!task.reminded) task.reminded = {};

    // reminder 7 hari
    if (diffDays === 7 && !task.reminded["7d"]) {
      showPopup("Reminder (7 hari lagi)", `Tugas "${task.title}" akan jatuh tempo 7 hari lagi!`);
      task.reminded["7d"] = true;
    }

    // reminder 3 hari
    if (diffDays === 3 && !task.reminded["3d"]) {
      showPopup("Reminder (3 hari lagi)", `Tugas "${task.title}" akan jatuh tempo 3 hari lagi!`);
      task.reminded["3d"] = true;
    }

    // reminder hari H
    if (diffDays === 0 && !task.reminded["due"]) {
      showPopup("Deadline Hari Ini", `Tugas "${task.title}" harus diselesaikan hari ini!`);
      task.reminded["due"] = true;
    }
  });

  // simpan balik reminder flags
  saveTasks(tasks);
}
// cek setiap 30 detik
setInterval(runReminderSystem, 30000);

// POPUP NOTIFICATION
function showPopup(title, message) {
  const popup = document.getElementById("popup");
  const t = document.getElementById("popup-title");
  const msg = document.getElementById("popup-message");
  const close = document.getElementById("popup-close");

  t.textContent = title;
  msg.textContent = message;

  popup.classList.remove("hidden");

  close.onclick = () => popup.classList.add("hidden");
}

// Initial render
renderTasks();
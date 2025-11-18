// LOAD TASKS
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

// ELEMENTS
const taskList = document.getElementById("task-list");
const filter = document.getElementById("filter");

// SAVE
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ADD TASK
document.getElementById("add-task").addEventListener("click", function(e) {
  e.preventDefault();

  const title = document.getElementById("task-title").value;
  const deadline = document.getElementById("task-deadline").value;
  const important = document.getElementById("task-important").value === "important";
  const desc = document.getElementById("task-desc").value;  // AMBIL DESC

    // VALIDASI FORM KOSONG
    if (!title) {
    showToast("Judule kok kosong rek? Ndang diisi 😭");
    return;
  }
    if (!deadline) {
    showToast("Deadline kosong i? PIYE TO KIHH? 😡");
    return;
  }

  if (!title || !deadline) return;

  // CEK TANGGAL
  const now = new Date();
  now.setHours(0,0,0,0);
  const chosen = new Date(deadline);
  chosen.setHours(0,0,0,0);

if (chosen < now) {
  showToast("Rek, iki tanggal lawas lho! Kok isok mlebu kene? 😭🔥");
  return;
}

  // BUAT TASK
  tasks.push({
    id: Date.now(),
    title,
    deadline,
    important,
    desc,         
    done: false,
    reminded: {}
  });

  saveTasks();
  renderTasks();

  // CLEAR INPUT
  document.getElementById("task-title").value = "";
  document.getElementById("task-deadline").value = "";
  document.getElementById("task-important").value = "normal";
  document.getElementById("task-desc").value = ""; // CLEAR DESC
});

// RENDER TASKS
function renderTasks() {
  taskList.innerHTML = "";

  let filtered = tasks;

  if (filter.value === "important")
    filtered = tasks.filter(t => t.important);

  if (filter.value === "done")
    filtered = tasks.filter(t => t.done);

  filtered.forEach(t => {
    // HITUNG WARNA
    const diffDays = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    let noteColor = "note-green";

    if (diffDays <= 3 && diffDays >= 1) noteColor = "note-orange";
    if (diffDays < 1) noteColor = "note-red";

    // DEADLINE TEXT COLOR
    let deadlineColor = "green";
    if (diffDays <= 3 && diffDays >= 1) deadlineColor = "orange";
    if (diffDays < 1) deadlineColor = "red";

    // STICKY NOTE ELEMENT
    const card = document.createElement("div");
    card.className = `task-card ${noteColor}` + (t.done ? " done" : "");

    card.innerHTML = `
      <div class="task-header">
        <h3>${t.title}</h3>
        <span onclick="toggleImportant(${t.id})">
          ${t.important ? "⭐" : "☆"}
        </span>
      </div>

      <p class="task-desc">${t.desc || "(no description)"}</p>

      <p class="deadline ${deadlineColor}">
        ${t.done ? "Completed" : "Deadline: " + t.deadline}
      </p>

      <div class="task-actions">
        ${
          t.done
            ? `<button class="undo-btn" onclick="toggleDone(${t.id})">Undo</button>`
            : `<button class="done-btn" onclick="toggleDone(${t.id})">Done</button>`
        }
        <button class="delete-btn" onclick="deleteTask(${t.id})">Delete</button>
      </div>
    `;

    taskList.appendChild(card);
  });
}

// DELETE / TOGGLE
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  t.done = !t.done;
  saveTasks();
  renderTasks();
}

function toggleImportant(id) {
  const t = tasks.find(x => x.id === id);
  t.important = !t.important;
  saveTasks();
  renderTasks();
}

filter.addEventListener("change", renderTasks);

// TOAST
function showToast(msg) {
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");

    toastText.textContent = msg;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 300);
    }, 2500); 
}

// REMINDER
function reminderCheck() {
  const now = new Date();

  tasks.forEach(t => {
    if (t.done) return;

    const deadline = new Date(t.deadline);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (!t.reminded["7d"] && diffDays === 7) {
      showToast(`${t.title} - Wes tinggal 7 dina, ojo lali yo rek`);
      t.reminded["7d"] = true;
    }

    if (!t.reminded["3d"] && diffDays === 3) {
      showToast(`${t.title} - Rek, kurang 3 dina. Gas pol ae!`);
      t.reminded["3d"] = true;
    }

    if (!t.reminded["1d"] && diffDays === 1) {
      showToast(`${t.title} - Sesok wes deadline rek! Ayo dikebut dikit`);
      t.reminded["1d"] = true;
    }

    if (!t.reminded["due"] && diffDays <= 0) {
      showToast(`${t.title} - DEADLINE DINO IKI! GEK NDANGG 🙏`);
      t.reminded["due"] = true;
    }
  });

  saveTasks();
}

setInterval(reminderCheck, 30000);

// INITIAL RENDER
renderTasks();

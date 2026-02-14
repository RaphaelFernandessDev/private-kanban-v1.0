const USERS_KEY = "private-kanban-users-v1";
const SESSION_KEY = "private-kanban-session-v1";
const TASKS_PREFIX = "private-kanban-tasks";
const THEME_KEY = "private-kanban-theme-v1";
const USER_EVENTS_KEY = "private-kanban-user-events-v1";
const DISMISSED_USER_EVENTS_KEY = "private-kanban-dismissed-user-events-v1";
const PRESENCE_KEY = "private-kanban-presence-v1";
const API_TIMEOUT_MS = 10000;
const STATUSES = ["todo", "doing", "done"];
const PRESENCE_HEARTBEAT_MS = 10000;
const ONLINE_WINDOW_MS = 30000;

const elements = {
  authScreen: document.querySelector("#auth-screen"),
  appScreen: document.querySelector("#app-screen"),
  loginForm: document.querySelector("#login-form"),
  loginUsername: document.querySelector("#login-username"),
  loginPassword: document.querySelector("#login-password"),
  loginError: document.querySelector("#login-error"),
  themeToggleAuth: document.querySelector("#theme-toggle-auth"),
  themeIconAuth: document.querySelector("#theme-icon-auth"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeIcon: document.querySelector("#theme-icon"),
  notificationMenu: document.querySelector("#notification-menu"),
  notificationToggle: document.querySelector("#notification-toggle"),
  notificationBadge: document.querySelector("#notification-badge"),
  notificationDropdown: document.querySelector("#notification-dropdown"),
  notificationList: document.querySelector("#notification-list"),
  notificationClear: document.querySelector("#notification-clear"),
  currentUserLabel: document.querySelector("#current-user-label"),
  profileMenu: document.querySelector("#profile-menu"),
  profileToggle: document.querySelector("#profile-toggle"),
  profileDropdown: document.querySelector("#profile-dropdown"),
  profileChangePassword: document.querySelector("#profile-change-password"),
  logoutButton: document.querySelector("#logout-button"),

  adminPanel: document.querySelector("#admin-panel"),
  userForm: document.querySelector("#user-form"),
  newUsername: document.querySelector("#new-username"),
  newPassword: document.querySelector("#new-password"),
  userFeedback: document.querySelector("#user-feedback"),
  usersList: document.querySelector("#users-list"),
  notificationHost: document.querySelector("#notification-host"),
  taskModal: document.querySelector("#task-modal"),
  taskModalBackdrop: document.querySelector("#task-modal-backdrop"),
  taskModalClose: document.querySelector("#task-modal-close"),
  taskModalSave: document.querySelector("#task-modal-save"),
  taskModalTaskName: document.querySelector("#task-modal-task-name"),
  taskModalDescription: document.querySelector("#task-modal-description"),
  taskModalUpload: document.querySelector("#task-modal-upload"),
  taskModalImagesCount: document.querySelector("#task-modal-images-count"),
  taskModalImages: document.querySelector("#task-modal-images"),
  taskModalImageList: document.querySelector("#task-modal-image-list"),
  imageViewer: document.querySelector("#image-viewer"),
  imageViewerBackdrop: document.querySelector("#image-viewer-backdrop"),
  imageViewerClose: document.querySelector("#image-viewer-close"),
  imageViewerImg: document.querySelector("#image-viewer-img"),
  passwordModal: document.querySelector("#password-modal"),
  passwordModalBackdrop: document.querySelector("#password-modal-backdrop"),
  passwordModalClose: document.querySelector("#password-modal-close"),
  passwordModalSave: document.querySelector("#password-modal-save"),
  passwordCurrent: document.querySelector("#password-current"),
  passwordNext: document.querySelector("#password-next"),
  passwordConfirm: document.querySelector("#password-confirm"),
  passwordFeedback: document.querySelector("#password-feedback"),
  editTaskModal: document.querySelector("#edit-task-modal"),
  editTaskBackdrop: document.querySelector("#edit-task-backdrop"),
  editTaskClose: document.querySelector("#edit-task-close"),
  editTaskSave: document.querySelector("#edit-task-save"),
  editTaskName: document.querySelector("#edit-task-name"),
  editTaskDueDate: document.querySelector("#edit-task-due-date"),
  editTaskPriority: document.querySelector("#edit-task-priority"),
  editTaskFeedback: document.querySelector("#edit-task-feedback"),

  taskForm: document.querySelector("#task-form"),
  titleInput: document.querySelector("#task-title"),
  priorityInput: document.querySelector("#task-priority"),
  dueDateInput: document.querySelector("#task-due-date"),
  searchInput: document.querySelector("#search"),
  priorityFilter: document.querySelector("#priority-filter"),
  clearDoneButton: document.querySelector("#clear-done"),
  template: document.querySelector("#task-template"),
  dropzones: [...document.querySelectorAll("[data-dropzone]")],
  counters: [...document.querySelectorAll("[data-counter]")],
};

let users = loadUsers();
let userEvents = loadUserEvents();
let currentUser = null;
let tasks = [];
let dragTaskId = null;
let activeTaskId = null;
let activeEditTaskId = null;
let currentTheme = "light";
let dismissedNotifications = new Set();
let dismissedUserEventNotifications = loadDismissedUserEventNotifications();
let currentNotifications = [];
let presenceState = loadPresenceState();
let presenceHeartbeatId = null;
let adminRealtimeId = null;
let datePickerElement = null;
let activeDatePickerInput = null;
let datePickerYear = 0;
let datePickerMonth = 0;

boot();

/// funcao boot. ///
async function boot() {
  ensureAdminUser();
  initializeTheme();
  initializePasswordToggles();
  initializeCustomDatePicker();
  bindEvents();
  await refreshUsersFromApi();

  const sessionUserId = localStorage.getItem(SESSION_KEY);
  if (sessionUserId) {
    const sessionUser = users.find((user) => user.id === sessionUserId);
    if (sessionUser) {
      startSession(sessionUser);
      return;
    }
  }

  showAuth();
}

/// funcao bindEvents. ///
function bindEvents() {
  elements.loginForm.addEventListener("submit", onLoginSubmit);
  elements.themeToggle?.addEventListener("click", toggleTheme);
  elements.themeToggleAuth?.addEventListener("click", toggleTheme);
  elements.notificationToggle?.addEventListener("click", toggleNotificationMenu);
  elements.notificationClear?.addEventListener("click", clearNotifications);
  elements.profileToggle?.addEventListener("click", toggleProfileMenu);
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onGlobalKeydown);
  window.addEventListener("storage", onStorageEvent);
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("resize", onDatePickerViewportChange);
  window.addEventListener("scroll", onDatePickerViewportChange, true);
  elements.logoutButton?.addEventListener("click", logout);
  elements.userForm?.addEventListener("submit", onCreateUser);
  elements.taskModalClose?.addEventListener("click", closeTaskModal);
  elements.taskModalBackdrop?.addEventListener("click", closeTaskModal);
  elements.taskModalSave?.addEventListener("click", saveTaskModal);
  elements.taskModalImages?.addEventListener("change", onTaskImagesSelected);
  elements.imageViewerClose?.addEventListener("click", closeImageViewer);
  elements.imageViewerBackdrop?.addEventListener("click", closeImageViewer);
  elements.profileChangePassword?.addEventListener("click", openPasswordModal);
  elements.passwordModalClose?.addEventListener("click", closePasswordModal);
  elements.passwordModalBackdrop?.addEventListener("click", closePasswordModal);
  elements.passwordModalSave?.addEventListener("click", savePasswordChange);
  elements.editTaskClose?.addEventListener("click", closeEditTaskModal);
  elements.editTaskBackdrop?.addEventListener("click", closeEditTaskModal);
  elements.editTaskSave?.addEventListener("click", saveEditTaskModal);
  elements.taskModalUpload?.addEventListener("click", () => elements.taskModalImages?.click());
  elements.taskModalUpload?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.taskModalImages?.click();
    }
  });
  elements.taskModalDescription?.addEventListener("input", handleModalDescriptionInput);

  elements.taskForm.addEventListener("submit", onTaskSubmit);
  elements.searchInput.addEventListener("input", render);
  elements.priorityFilter.addEventListener("change", render);

  elements.clearDoneButton.addEventListener("click", () => {
    tasks = tasks.filter((task) => task.status !== "done");
    persistTasks();
    render();
  });

  elements.dropzones.forEach((dropzone) => {
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("over");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("over");
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("over");

      const status = dropzone.dataset.dropzone;
      if (!dragTaskId || !status) {
        return;
      }

      const task = tasks.find((item) => item.id === dragTaskId);
      if (!task) {
        return;
      }

      task.status = status;
      persistTasks();
      render();
    });
  });
}

/// funcao onLoginSubmit. ///
async function onLoginSubmit(event) {
  event.preventDefault();

  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;

  if (isRemoteUsersEnabled()) {
    try {
      const result = await requestApi("/api/login", {
        method: "POST",
        body: { username, password },
      });
      const remoteUser = mapApiUser(result.user);
      await refreshUsersFromApi();
      elements.loginError.textContent = "";
      startSession(remoteUser);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar.";
      if (message === "Login ou senha inválidos." || message === "Login ou senha invalidos.") {
        elements.loginError.textContent = message;
        return;
      }
    }
  }

  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) {
    elements.loginError.textContent = "Login ou senha inválidos.";
    return;
  }

  elements.loginError.textContent = "";
  startSession(user);
}

/// funcao startSession. ///
function startSession(user) {
  currentUser = user;
  localStorage.setItem(SESSION_KEY, user.id);
  if (!isRemoteUsersEnabled()) {
    registerUserLastAccess(user.id);
    users = loadUsers();
  }
  currentUser = users.find((item) => item.id === user.id) || user;
  tasks = loadTasksByUser(user.id);
  dismissedNotifications = new Set();
  currentNotifications = [];
  startPresenceTracking();

  elements.currentUserLabel.textContent = currentUser.username;
  closeProfileMenu();
  closeNotificationMenu();

  if (currentUser.role === "admin") {
    elements.adminPanel.classList.remove("hidden");
    elements.profileChangePassword?.classList.remove("hidden");
    renderUsersList();
    startAdminRealtimeRefresh();
  } else {
    elements.adminPanel.classList.add("hidden");
    elements.profileChangePassword?.classList.remove("hidden");
    stopAdminRealtimeRefresh();
  }

  showApp();
  render();
}

/// funcao logout. ///
function logout() {
  stopPresenceTracking(true);
  stopAdminRealtimeRefresh();
  currentUser = null;
  tasks = [];
  activeTaskId = null;
  dismissedNotifications = new Set();
  currentNotifications = [];
  localStorage.removeItem(SESSION_KEY);
  closeProfileMenu();
  closeNotificationMenu();
  closeTaskModal();
  closePasswordModal();
  closeEditTaskModal();
  closeDatePicker();
  clearTaskColumns();
  elements.loginForm.reset();
  elements.loginError.textContent = "";
  showAuth();
}

/// funcao showAuth. ///
function showAuth() {
  elements.authScreen.classList.remove("hidden");
  elements.appScreen.classList.add("hidden");
  closeProfileMenu();
  closeNotificationMenu();
  closeTaskModal();
  closePasswordModal();
  closeEditTaskModal();
  closeDatePicker();
  stopAdminRealtimeRefresh();
}

/// funcao showApp. ///
function showApp() {
  elements.authScreen.classList.add("hidden");
  elements.appScreen.classList.remove("hidden");
  closeProfileMenu();
  closeNotificationMenu();
}

/// funcao onCreateUser. ///
async function onCreateUser(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "admin") {
    return;
  }

  const username = elements.newUsername.value.trim();
  const password = elements.newPassword.value.trim();

  if (!username || !password) {
    setUserFeedback("Informe login e senha.", true);
    return;
  }

  if (!isValidCredential(username) || !isValidCredential(password)) {
    setUserFeedback("Use apenas letras, números, ponto, traço ou underline.", true);
    return;
  }

  const exists = users.some((user) => user.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    setUserFeedback("Este login já existe.", true);
    return;
  }

  if (isRemoteUsersEnabled()) {
    try {
      await requestApi("/api/users/create", {
        method: "POST",
        body: { username, password },
      });
      await refreshUsersFromApi();
      elements.userForm.reset();
      setUserFeedback("Usuário cadastrado com sucesso.", false);
      renderUsersList();
      return;
    } catch (error) {
      setUserFeedback(error instanceof Error ? error.message : "Falha ao cadastrar usuário.", true);
      return;
    }
  }

  users.push({
    id: crypto.randomUUID(),
    username,
    password,
    role: "user",
  });

  persistUsers();
  elements.userForm.reset();
  setUserFeedback("Usuário cadastrado com sucesso.", false);
  renderUsersList();
}

/// funcao renderUsersList. ///
function renderUsersList() {
  if (!currentUser || currentUser.role !== "admin") {
    return;
  }

  elements.usersList.innerHTML = "";

  users
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username, "pt-BR"))
    .forEach((user) => {
      const item = document.createElement("li");
      const info = document.createElement("div");
      const loginLabel = document.createElement("strong");
      const passwordLabel = document.createElement("span");
      const metaLine = document.createElement("div");
      const statusLabel = document.createElement("span");
      const accessLabel = document.createElement("span");
      const action = document.createElement("button");
      const online = isUserOnline(user.id, user.lastLoginAt);

      info.className = "user-credentials";
      loginLabel.textContent = `Login: ${user.username}${user.role === "admin" ? " (Admin)" : ""}`;
      passwordLabel.textContent = `Senha: ${user.password || "Não definida"}`;
      metaLine.className = "user-meta";
      statusLabel.className = `user-status ${online ? "online" : "offline"}`;
      statusLabel.textContent = online ? "Online" : "Offline";
      accessLabel.className = "user-last-access";
      accessLabel.textContent = `Último acesso: ${formatDateTime(user.lastLoginAt)}`;
      metaLine.append(statusLabel, accessLabel);
      info.append(loginLabel, passwordLabel, metaLine);
      item.appendChild(info);

      if (user.role !== "admin") {
        action.type = "button";
        action.textContent = "Excluir";
        action.addEventListener("click", () => deleteUser(user.id));
        item.appendChild(action);
      }

      elements.usersList.appendChild(item);
    });
}

/// funcao deleteUser. ///
function deleteUser(userId) {
  if (!currentUser || currentUser.role !== "admin") {
    return;
  }

  const user = users.find((item) => item.id === userId);
  if (!user || user.role === "admin") {
    return;
  }

  showConfirmNotification({
    message: `Deseja excluir o usuário ${user.username}?`,
    onConfirm: async () => {
      if (isRemoteUsersEnabled()) {
        try {
          await requestApi("/api/users/delete", {
            method: "POST",
            body: { userId },
          });
          await refreshUsersFromApi();
          localStorage.removeItem(getTasksKey(userId));
          setUserFeedback("Usuário removido.", false);
          renderUsersList();
          return;
        } catch (error) {
          setUserFeedback(error instanceof Error ? error.message : "Falha ao remover usuário.", true);
          return;
        }
      }

      users = users.filter((item) => item.id !== userId);
      persistUsers();
      localStorage.removeItem(getTasksKey(userId));
      setUserFeedback("Usuário removido.", false);
      renderUsersList();
    },
  });
}

/// funcao onTaskSubmit. ///
function onTaskSubmit(event) {
  event.preventDefault();

  if (!currentUser) {
    return;
  }

  const title = elements.titleInput.value.trim();
  const priority = elements.priorityInput.value;
  const dueDate = getDateInputIso(elements.dueDateInput);
  if (!title) {
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    priority,
    dueDate,
    details: "",
    images: [],
    status: "todo",
    createdAt: new Date().toISOString(),
  });

  elements.titleInput.value = "";
  setDateInputIso(elements.dueDateInput, null);
  persistTasks();
  render();
}

/// funcao render. ///
function render() {
  const filters = getFilters();

  clearTaskColumns();

  const visibleTasks = tasks.filter((task) => matchesFilters(task, filters));

  STATUSES.forEach((status) => {
    const zone = document.querySelector(`[data-dropzone="${status}"]`);
    if (!zone) {
      return;
    }

    visibleTasks
      .filter((task) => task.status === status)
      .sort(compareTasksByDueDate)
      .forEach((task) => zone.appendChild(buildTaskElement(task)));
  });

  updateCounters();
  updateNotificationCenter();
}

/// funcao clearTaskColumns. ///
function clearTaskColumns() {
  elements.dropzones.forEach((dropzone) => {
    dropzone.innerHTML = "";
    dropzone.classList.remove("over");
  });

  elements.counters.forEach((counter) => {
    counter.textContent = "0";
  });
}

/// funcao getFilters. ///
function getFilters() {
  return {
    text: elements.searchInput.value.trim().toLowerCase(),
    priority: elements.priorityFilter.value,
  };
}

/// funcao matchesFilters. ///
function matchesFilters(task, filters) {
  const matchesText = task.title.toLowerCase().includes(filters.text);
  const matchesPriority = filters.priority === "todas" || task.priority === filters.priority;
  return matchesText && matchesPriority;
}

/// funcao buildTaskElement. ///
function buildTaskElement(task) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".task");
  const title = fragment.querySelector(".task-title");
  const meta = fragment.querySelector(".task-meta");
  const moveLeftButton = fragment.querySelector('[data-action="move-left"]');
  const moveRightButton = fragment.querySelector('[data-action="move-right"]');
  const editButton = fragment.querySelector('[data-action="edit"]');
  const deleteButton = fragment.querySelector('[data-action="delete"]');

  card.dataset.id = task.id;
  card.classList.add(`task-status-${task.status}`);
  const dueState = getDueState(task);
  if (dueState !== "normal") {
    card.classList.add("task-status-alert");
  }
  title.textContent = task.title;

  const date = new Date(task.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? "Data inválida"
    : date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  const dueDateLabel = formatDueDate(task.dueDate);
  meta.textContent = dueDateLabel
    ? `Criada em ${dateLabel} | Entrega: ${dueDateLabel}`
    : `Criada em ${dateLabel}`;
  const dueBadgeLabel = getDueBadgeLabel(task);
  if (dueBadgeLabel) {
    meta.insertAdjacentHTML(
      "beforeend",
      ` <span class="due-badge ${dueBadgeLabel === "Em atraso" ? "due-badge-overdue" : "due-badge-soon"}">${dueBadgeLabel}</span>`
    );
  }
  meta.insertAdjacentHTML(
    "beforeend",
    ` <span class="priority-badge priority-${task.priority}">${capitalize(task.priority)}</span>`
  );

  card.addEventListener("dragstart", () => {
    dragTaskId = task.id;
  });

  card.addEventListener("dragend", () => {
    dragTaskId = null;
  });

  card.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".task-actions button")) {
      return;
    }

    openTaskModal(task.id);
  });

  moveLeftButton.disabled = task.status === "todo";
  moveRightButton.disabled = task.status === "done";

  moveLeftButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveTask(task.id, -1);
  });

  moveRightButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveTask(task.id, 1);
  });

  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openEditTaskModal(task.id);
  });

  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showConfirmNotification({
      message: "Deseja excluir esta tarefa?",
      onConfirm: () => {
        tasks = tasks.filter((item) => item.id !== task.id);
        if (activeTaskId === task.id) {
          closeTaskModal();
        }
        if (activeEditTaskId === task.id) {
          closeEditTaskModal();
        }
        persistTasks();
        render();
      },
    });
  });

  return fragment;
}

/// funcao moveTask. ///
function moveTask(taskId, direction) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  const currentIndex = STATUSES.indexOf(task.status);
  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= STATUSES.length) {
    return;
  }

  task.status = STATUSES[nextIndex];
  persistTasks();
  render();
}

/// funcao updateCounters. ///
function updateCounters() {
  elements.counters.forEach((counter) => {
    const status = counter.dataset.counter;
    if (!status) {
      return;
    }

    const count = tasks.filter((task) => task.status === status).length;
    counter.textContent = String(count);
  });
}

/// funcao ensureAdminUser. ///
function ensureAdminUser() {
  if (isRemoteUsersEnabled()) {
    return;
  }

  const hasAdmin = users.some((user) => user.role === "admin" && user.username === "Admin");
  if (hasAdmin) {
    return;
  }

  users.push({
    id: crypto.randomUUID(),
    username: "Admin",
    password: "Admin",
    role: "admin",
  });

  persistUsers();
}

/// funcao loadUsers. ///
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((user) => (
      user
      && typeof user.id === "string"
      && typeof user.username === "string"
      && typeof user.password === "string"
      && (typeof user.lastLoginAt === "string" || user.lastLoginAt === null || typeof user.lastLoginAt === "undefined")
      && ["admin", "user"].includes(user.role)
    ));
  } catch {
    return [];
  }
}

/// funcao persistUsers. ///
function persistUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/// funcao registerUserLastAccess. ///
function registerUserLastAccess(userId) {
  const userIndex = users.findIndex((user) => user.id === userId);
  if (userIndex < 0) {
    return;
  }

  users[userIndex].lastLoginAt = new Date().toISOString();
  persistUsers();
}

/// funcao loadUserEvents. ///
function loadUserEvents() {
  try {
    const raw = localStorage.getItem(USER_EVENTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((event) => (
      event
      && typeof event.id === "string"
      && typeof event.type === "string"
      && typeof event.userId === "string"
      && typeof event.username === "string"
      && typeof event.timestamp === "number"
    ));
  } catch {
    return [];
  }
}

/// funcao persistUserEvents. ///
function persistUserEvents() {
  localStorage.setItem(USER_EVENTS_KEY, JSON.stringify(userEvents));
}

/// funcao loadDismissedUserEventNotifications. ///
function loadDismissedUserEventNotifications() {
  try {
    const raw = localStorage.getItem(DISMISSED_USER_EVENTS_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {
    return new Set();
  }
}

/// funcao persistDismissedUserEventNotifications. ///
function persistDismissedUserEventNotifications() {
  localStorage.setItem(
    DISMISSED_USER_EVENTS_KEY,
    JSON.stringify([...dismissedUserEventNotifications])
  );
}

/// funcao loadPresenceState. ///
function loadPresenceState() {
  try {
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

/// funcao persistPresenceState. ///
function persistPresenceState() {
  localStorage.setItem(PRESENCE_KEY, JSON.stringify(presenceState));
}

/// funcao startPresenceTracking. ///
function startPresenceTracking() {
  stopPresenceTracking(false);
  updateCurrentPresence();
  presenceHeartbeatId = window.setInterval(() => {
    updateCurrentPresence();
  }, PRESENCE_HEARTBEAT_MS);
}

/// funcao stopPresenceTracking. ///
function stopPresenceTracking(removeCurrent) {
  if (presenceHeartbeatId) {
    window.clearInterval(presenceHeartbeatId);
    presenceHeartbeatId = null;
  }

  if (!currentUser) {
    return;
  }

  if (isRemoteUsersEnabled()) {
    if (removeCurrent) {
      requestApi("/api/presence", {
        method: "POST",
        body: { userId: currentUser.id, offline: true },
      }).catch(() => {});
    }
    return;
  }

  if (removeCurrent) {
    delete presenceState[currentUser.id];
    persistPresenceState();
  }
}

/// funcao updateCurrentPresence. ///
function updateCurrentPresence() {
  if (!currentUser) {
    return;
  }

  if (isRemoteUsersEnabled()) {
    requestApi("/api/presence", {
      method: "POST",
      body: { userId: currentUser.id },
    }).catch(() => {});
    return;
  }

  presenceState[currentUser.id] = {
    username: currentUser.username,
    lastSeen: Date.now(),
  };
  persistPresenceState();
}

/// funcao startAdminRealtimeRefresh. ///
function startAdminRealtimeRefresh() {
  stopAdminRealtimeRefresh();
  adminRealtimeId = window.setInterval(() => {
    if (currentUser?.role === "admin") {
      if (isRemoteUsersEnabled()) {
        refreshUsersFromApi().then(() => {
          renderUsersList();
        }).catch(() => {});
      } else {
        presenceState = loadPresenceState();
        renderUsersList();
      }
    }
  }, 5000);
}

/// funcao stopAdminRealtimeRefresh. ///
function stopAdminRealtimeRefresh() {
  if (adminRealtimeId) {
    window.clearInterval(adminRealtimeId);
    adminRealtimeId = null;
  }
}

/// funcao isUserOnline. ///
function isUserOnline(userId, lastSeenRemote) {
  if (isRemoteUsersEnabled()) {
    if (!lastSeenRemote) {
      return false;
    }

    const timestamp = Date.parse(lastSeenRemote);
    if (Number.isNaN(timestamp)) {
      return false;
    }

    return Date.now() - timestamp <= ONLINE_WINDOW_MS;
  }

  const entry = presenceState[userId];
  if (!entry || typeof entry.lastSeen !== "number") {
    return false;
  }

  return Date.now() - entry.lastSeen <= ONLINE_WINDOW_MS;
}

/// funcao formatDateTime. ///
function formatDateTime(value) {
  if (!value) {
    return "Nunca";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nunca";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/// funcao onStorageEvent. ///
function onStorageEvent(event) {
  if (!event || !event.key) {
    return;
  }

  if (event.key === USERS_KEY) {
    users = loadUsers();
    if (currentUser?.role === "admin") {
      renderUsersList();
    }
    return;
  }

  if (event.key === USER_EVENTS_KEY) {
    userEvents = loadUserEvents();
    updateNotificationCenter();
    return;
  }

  if (event.key === DISMISSED_USER_EVENTS_KEY) {
    dismissedUserEventNotifications = loadDismissedUserEventNotifications();
    updateNotificationCenter();
    return;
  }

  if (event.key === PRESENCE_KEY) {
    presenceState = loadPresenceState();
    if (currentUser?.role === "admin") {
      renderUsersList();
    }
  }
}

/// funcao onBeforeUnload. ///
function onBeforeUnload() {
  stopPresenceTracking(true);
}

/// funcao loadTasksByUser. ///
function loadTasksByUser(userId) {
  try {
    const raw = localStorage.getItem(getTasksKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((task) => (
        task
        && typeof task.id === "string"
        && typeof task.title === "string"
        && STATUSES.includes(task.status)
        && ["alta", "media", "baixa"].includes(task.priority)
        && typeof task.createdAt === "string"
        && (typeof task.dueDate === "string" || task.dueDate === null || typeof task.dueDate === "undefined")
      ))
      .map((task) => ({
        ...task,
        details: typeof task.details === "string" ? task.details : "",
        images: Array.isArray(task.images) ? task.images.filter((image) => typeof image === "string") : [],
      }));
  } catch {
    return [];
  }
}

/// funcao persistTasks. ///
function persistTasks() {
  if (!currentUser) {
    return;
  }

  localStorage.setItem(getTasksKey(currentUser.id), JSON.stringify(tasks));
}

/// funcao getTasksKey. ///
function getTasksKey(userId) {
  return `${TASKS_PREFIX}-${userId}`;
}

/// funcao setUserFeedback. ///
function setUserFeedback(message, isError) {
  elements.userFeedback.textContent = message;
  elements.userFeedback.classList.toggle("error", Boolean(isError));
}

/// funcao initializeCustomDatePicker. ///
function initializeCustomDatePicker() {
  const dateInputs = [elements.dueDateInput, elements.editTaskDueDate].filter(Boolean);
  if (!dateInputs.length) {
    return;
  }

  dateInputs.forEach((input) => {
    const iso = normalizeIsoDate(input.value);
    setDateInputIso(input, iso);

    input.addEventListener("click", () => {
      openDatePicker(input);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        openDatePicker(input);
      }
    });
  });
}

/// funcao ensureDatePickerElement. ///
function ensureDatePickerElement() {
  if (datePickerElement) {
    return datePickerElement;
  }

  const picker = document.createElement("section");
  picker.className = "date-picker hidden";
  picker.setAttribute("aria-hidden", "true");
  picker.innerHTML = `
    <div class="date-picker-header">
      <button type="button" class="date-picker-nav" data-dp-action="prev" aria-label="Mês anterior">◀</button>
      <strong class="date-picker-title" data-dp="title"></strong>
      <button type="button" class="date-picker-nav" data-dp-action="next" aria-label="Próximo mês">▶</button>
    </div>
    <div class="date-picker-weekdays" data-dp="weekdays"></div>
    <div class="date-picker-grid" data-dp="grid"></div>
    <div class="date-picker-actions">
      <button type="button" class="date-picker-action" data-dp-action="clear">Limpar</button>
      <button type="button" class="date-picker-action" data-dp-action="today">Hoje</button>
    </div>
  `;

  picker.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.dpAction;
    if (action === "prev") {
      datePickerMonth -= 1;
      if (datePickerMonth < 0) {
        datePickerMonth = 11;
        datePickerYear -= 1;
      }
      renderDatePicker();
      return;
    }

    if (action === "next") {
      datePickerMonth += 1;
      if (datePickerMonth > 11) {
        datePickerMonth = 0;
        datePickerYear += 1;
      }
      renderDatePicker();
      return;
    }

    if (action === "clear") {
      if (activeDatePickerInput) {
        setDateInputIso(activeDatePickerInput, null);
      }
      closeDatePicker();
      return;
    }

    if (action === "today") {
      if (activeDatePickerInput) {
        setDateInputIso(activeDatePickerInput, toIsoDate(new Date()));
      }
      closeDatePicker();
      return;
    }

    const dayValue = target.dataset.dpDay;
    if (!dayValue || !activeDatePickerInput) {
      return;
    }

    setDateInputIso(activeDatePickerInput, dayValue);
    closeDatePicker();
  });

  document.body.appendChild(picker);
  datePickerElement = picker;
  return picker;
}

/// funcao openDatePicker. ///
function openDatePicker(input) {
  const picker = ensureDatePickerElement();
  activeDatePickerInput = input;

  const selectedIso = getDateInputIso(input);
  const base = selectedIso ? parseIsoDate(selectedIso) : new Date();
  datePickerYear = base.getFullYear();
  datePickerMonth = base.getMonth();

  picker.classList.remove("hidden");
  picker.setAttribute("aria-hidden", "false");
  renderDatePicker();
  positionDatePicker(input);
}

/// funcao closeDatePicker. ///
function closeDatePicker() {
  if (!datePickerElement) {
    return;
  }

  datePickerElement.classList.add("hidden");
  datePickerElement.setAttribute("aria-hidden", "true");
  activeDatePickerInput = null;
}

/// funcao positionDatePicker. ///
function positionDatePicker(input) {
  if (!datePickerElement) {
    return;
  }

  const rect = input.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  const desiredLeft = rect.left + scrollX;
  const maxLeft = Math.max(8, scrollX + window.innerWidth - 300);
  const left = Math.min(Math.max(8, desiredLeft), maxLeft);
  const top = rect.bottom + scrollY + 8;

  datePickerElement.style.left = `${left}px`;
  datePickerElement.style.top = `${top}px`;
}

/// funcao onDatePickerViewportChange. ///
function onDatePickerViewportChange() {
  if (!datePickerElement || datePickerElement.classList.contains("hidden") || !activeDatePickerInput) {
    return;
  }

  positionDatePicker(activeDatePickerInput);
}

/// funcao renderDatePicker. ///
function renderDatePicker() {
  if (!datePickerElement) {
    return;
  }

  const title = datePickerElement.querySelector('[data-dp="title"]');
  const weekdays = datePickerElement.querySelector('[data-dp="weekdays"]');
  const grid = datePickerElement.querySelector('[data-dp="grid"]');
  if (!title || !weekdays || !grid) {
    return;
  }

  const monthLabel = new Date(datePickerYear, datePickerMonth, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  title.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  weekdays.innerHTML = "";
  ["D", "S", "T", "Q", "Q", "S", "S"].forEach((name) => {
    const label = document.createElement("span");
    label.textContent = name;
    weekdays.appendChild(label);
  });

  grid.innerHTML = "";
  const firstDay = new Date(datePickerYear, datePickerMonth, 1);
  const startOffset = firstDay.getDay();
  const selectedIso = activeDatePickerInput ? getDateInputIso(activeDatePickerInput) : null;
  const todayIso = toIsoDate(new Date());

  for (let cell = 0; cell < 42; cell += 1) {
    const dayNumber = cell - startOffset + 1;
    const date = new Date(datePickerYear, datePickerMonth, dayNumber);
    const iso = toIsoDate(date);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-picker-day";
    button.dataset.dpDay = iso;
    button.textContent = String(date.getDate());

    if (date.getMonth() !== datePickerMonth) {
      button.classList.add("outside");
    }

    if (iso === selectedIso) {
      button.classList.add("selected");
    }

    if (iso === todayIso) {
      button.classList.add("today");
    }

    grid.appendChild(button);
  }
}

/// funcao getDateInputIso. ///
function getDateInputIso(input) {
  if (!input) {
    return null;
  }

  const raw = (input.dataset.iso || "").trim();
  if (normalizeIsoDate(raw)) {
    return raw;
  }

  const fromDisplay = parseDisplayDate(input.value);
  return fromDisplay;
}

/// funcao setDateInputIso. ///
function setDateInputIso(input, isoDate) {
  if (!input) {
    return;
  }

  const iso = normalizeIsoDate(isoDate);
  if (!iso) {
    input.dataset.iso = "";
    input.value = "";
    return;
  }

  input.dataset.iso = iso;
  input.value = formatIsoToDisplay(iso);
}

/// funcao normalizeIsoDate. ///
function normalizeIsoDate(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const date = parseIsoDate(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return trimmed;
}

/// funcao parseDisplayDate. ///
function parseDisplayDate(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const parts = trimmed.split("/");
  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts.map((item) => Number(item));
  if (!day || !month || !year) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return toIsoDate(date);
}

/// funcao parseIsoDate. ///
function parseIsoDate(value) {
  return new Date(`${value}T00:00:00`);
}

/// funcao toIsoDate. ///
function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/// funcao formatIsoToDisplay. ///
function formatIsoToDisplay(value) {
  const date = parseIsoDate(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/// funcao isValidCredential. ///
function isValidCredential(value) {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

/// funcao capitalize. ///
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/// funcao formatDueDate. ///
function formatDueDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/// funcao compareTasksByDueDate. ///
function compareTasksByDueDate(a, b) {
  const aDue = getDueDateTimestamp(a?.dueDate);
  const bDue = getDueDateTimestamp(b?.dueDate);

  if (aDue === null && bDue === null) {
    const aCreated = Date.parse(a?.createdAt || "") || 0;
    const bCreated = Date.parse(b?.createdAt || "") || 0;
    return bCreated - aCreated;
  }

  if (aDue === null) {
    return 1;
  }

  if (bDue === null) {
    return -1;
  }

  if (aDue !== bDue) {
    return aDue - bDue;
  }

  const aCreated = Date.parse(a?.createdAt || "") || 0;
  const bCreated = Date.parse(b?.createdAt || "") || 0;
  return bCreated - aCreated;
}

/// funcao getDueState. ///
function getDueState(task) {
  const dueTimestamp = getDueDateTimestamp(task?.dueDate);
  if (dueTimestamp === null) {
    return "normal";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((dueTimestamp - today.getTime()) / 86400000);

  if (diffDays <= 1) {
    return diffDays < 0 ? "overdue" : "soon";
  }

  return "normal";
}

/// funcao getDueDateTimestamp. ///
function getDueDateTimestamp(dueDate) {
  if (!dueDate || typeof dueDate !== "string") {
    return null;
  }

  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

/// funcao getDueBadgeLabel. ///
function getDueBadgeLabel(task) {
  const dueTimestamp = getDueDateTimestamp(task?.dueDate);
  if (dueTimestamp === null) {
    return "";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((dueTimestamp - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return "Em atraso";
  }

  if (diffDays === 1) {
    return "Vence amanhã";
  }

  return "";
}

/// funcao showConfirmNotification. ///
function showConfirmNotification({ message, onConfirm }) {
  if (!elements.notificationHost) {
    return;
  }

  elements.notificationHost.innerHTML = "";

  const notification = document.createElement("article");
  notification.className = "notification";

  const text = document.createElement("p");
  text.textContent = message;

  const actions = document.createElement("div");
  actions.className = "notification-actions";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Cancelar";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.textContent = "Confirmar";
  confirmButton.className = "confirm";

  cancelButton.addEventListener("click", () => {
    notification.remove();
  });

  confirmButton.addEventListener("click", () => {
    notification.remove();
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  });

  actions.append(cancelButton, confirmButton);
  notification.append(text, actions);
  elements.notificationHost.appendChild(notification);
}

/// funcao openTaskModal. ///
function openTaskModal(taskId) {
  const task = getTaskById(taskId);
  if (!task) {
    return;
  }

  activeTaskId = taskId;
  elements.taskModalTaskName.textContent = task.title;
  elements.taskModalDescription.value = task.details || "";
  elements.taskModalImages.value = "";
  elements.taskModal.classList.remove("hidden");
  elements.taskModal.setAttribute("aria-hidden", "false");
  syncModalLayout(task);
  renderTaskImageList(task);
}

/// funcao closeTaskModal. ///
function closeTaskModal() {
  activeTaskId = null;
  closeImageViewer();
  elements.taskModal.classList.add("hidden");
  elements.taskModal.setAttribute("aria-hidden", "true");
  elements.taskModalDescription.value = "";
  elements.taskModalImages.value = "";
  elements.taskModalImagesCount.textContent = "Nenhuma imagem";
  elements.taskModalImageList.innerHTML = "";
  const modalCard = elements.taskModal.querySelector(".task-modal-card");
  if (modalCard) {
    modalCard.classList.remove("expanded");
  }
}

/// funcao saveTaskModal. ///
function saveTaskModal() {
  if (!activeTaskId) {
    return;
  }

  const task = getTaskById(activeTaskId);
  if (!task) {
    return;
  }

  task.details = elements.taskModalDescription.value.trim();
  persistTasks();
  render();
  closeTaskModal();
}

/// funcao onTaskImagesSelected. ///
function onTaskImagesSelected(event) {
  if (!activeTaskId) {
    return;
  }

  const task = getTaskById(activeTaskId);
  if (!task) {
    return;
  }

  const files = [...(event.target.files || [])];
  if (!files.length) {
    return;
  }

  files.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      task.images = task.images || [];
      task.images.push(reader.result);
      persistTasks();
      syncModalLayout(task);
      renderTaskImageList(task);
      render();
    };
    reader.readAsDataURL(file);
  });

  event.target.value = "";
}

/// funcao renderTaskImageList. ///
function renderTaskImageList(task) {
  elements.taskModalImageList.innerHTML = "";
  const imageCount = Array.isArray(task.images) ? task.images.length : 0;
  elements.taskModalImagesCount.textContent = formatImageCount(imageCount);

  if (!imageCount) {
    return;
  }

  task.images.forEach((imageSrc, index) => {
    const item = document.createElement("article");
    item.className = "task-modal-image-item";

    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = `Imagem ${index + 1} da tarefa`;
    img.addEventListener("click", () => {
      openImageViewer(imageSrc);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "task-modal-image-remove";
    removeButton.textContent = "X";
    removeButton.addEventListener("click", () => {
      const currentTask = getTaskById(activeTaskId);
      if (!currentTask || !Array.isArray(currentTask.images)) {
        return;
      }

      currentTask.images = currentTask.images.filter((_, imageIndex) => imageIndex !== index);
      persistTasks();
      syncModalLayout(currentTask);
      renderTaskImageList(currentTask);
      render();
    });

    item.append(img, removeButton);
    elements.taskModalImageList.appendChild(item);
  });
}

/// funcao getTaskById. ///
function getTaskById(taskId) {
  return tasks.find((item) => item.id === taskId);
}

/// funcao onGlobalKeydown. ///
function onGlobalKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (datePickerElement && !datePickerElement.classList.contains("hidden")) {
    closeDatePicker();
    return;
  }

  if (elements.notificationDropdown && !elements.notificationDropdown.classList.contains("hidden")) {
    closeNotificationMenu();
    return;
  }

  if (elements.editTaskModal && !elements.editTaskModal.classList.contains("hidden")) {
    closeEditTaskModal();
    return;
  }

  if (elements.passwordModal && !elements.passwordModal.classList.contains("hidden")) {
    closePasswordModal();
    return;
  }

  if (elements.imageViewer && !elements.imageViewer.classList.contains("hidden")) {
    closeImageViewer();
    return;
  }

  if (activeTaskId) {
    closeTaskModal();
  }
}

/// funcao openImageViewer. ///
function openImageViewer(imageSrc) {
  if (!elements.imageViewer || !elements.imageViewerImg) {
    return;
  }

  elements.imageViewerImg.src = imageSrc;
  elements.imageViewer.classList.remove("hidden");
  elements.imageViewer.setAttribute("aria-hidden", "false");
}

/// funcao closeImageViewer. ///
function closeImageViewer() {
  if (!elements.imageViewer || !elements.imageViewerImg) {
    return;
  }

  elements.imageViewer.classList.add("hidden");
  elements.imageViewer.setAttribute("aria-hidden", "true");
  elements.imageViewerImg.src = "";
}

/// funcao openPasswordModal. ///
function openPasswordModal() {
  if (!currentUser) {
    return;
  }

  closeProfileMenu();
  elements.passwordCurrent.value = "";
  elements.passwordNext.value = "";
  elements.passwordConfirm.value = "";
  elements.passwordFeedback.textContent = "";
  elements.passwordFeedback.classList.remove("error");
  elements.passwordModal.classList.remove("hidden");
  elements.passwordModal.setAttribute("aria-hidden", "false");
}

/// funcao closePasswordModal. ///
function closePasswordModal() {
  if (!elements.passwordModal) {
    return;
  }

  elements.passwordModal.classList.add("hidden");
  elements.passwordModal.setAttribute("aria-hidden", "true");
}

/// funcao savePasswordChange. ///
async function savePasswordChange() {
  if (!currentUser) {
    return;
  }

  const currentPassword = elements.passwordCurrent.value;
  const nextPassword = elements.passwordNext.value;
  const confirmPassword = elements.passwordConfirm.value;

  if (!nextPassword.trim()) {
    setPasswordFeedback("Digite uma nova senha válida.", true);
    return;
  }

  if (nextPassword !== confirmPassword) {
    setPasswordFeedback("A confirmação de senha não confere.", true);
    return;
  }

  if (isRemoteUsersEnabled()) {
    try {
      await requestApi("/api/users/change-password", {
        method: "POST",
        body: {
          userId: currentUser.id,
          currentPassword,
          nextPassword,
        },
      });
      await refreshUsersFromApi();
      const updated = users.find((user) => user.id === currentUser.id);
      if (updated) {
        currentUser = updated;
      } else {
        currentUser.password = nextPassword;
      }
      addUserPasswordChangeEvent(currentUser);
      setPasswordFeedback("Senha alterada com sucesso.", false);
    } catch (error) {
      setPasswordFeedback(error instanceof Error ? error.message : "Falha ao alterar senha.", true);
      return;
    }
  } else {
    if (currentPassword !== currentUser.password) {
      setPasswordFeedback("Senha atual incorreta.", true);
      return;
    }

    const userIndex = users.findIndex((user) => user.id === currentUser.id);
    if (userIndex < 0) {
      setPasswordFeedback("Usuário não encontrado.", true);
      return;
    }

    users[userIndex].password = nextPassword;
    currentUser.password = nextPassword;
    persistUsers();
    addUserPasswordChangeEvent(currentUser);
    setPasswordFeedback("Senha alterada com sucesso.", false);
  }

  if (elements.adminPanel && !elements.adminPanel.classList.contains("hidden")) {
    renderUsersList();
  }

  closePasswordModal();
}

/// funcao setPasswordFeedback. ///
function setPasswordFeedback(message, isError) {
  elements.passwordFeedback.textContent = message;
  elements.passwordFeedback.classList.toggle("error", Boolean(isError));
}

/// funcao openEditTaskModal. ///
function openEditTaskModal(taskId) {
  const task = getTaskById(taskId);
  if (!task) {
    return;
  }

  activeEditTaskId = task.id;
  elements.editTaskName.value = task.title || "";
  setDateInputIso(elements.editTaskDueDate, task.dueDate || null);
  elements.editTaskPriority.value = task.priority || "media";
  elements.editTaskFeedback.textContent = "";
  elements.editTaskFeedback.classList.remove("error");
  elements.editTaskModal.classList.remove("hidden");
  elements.editTaskModal.setAttribute("aria-hidden", "false");
}

/// funcao closeEditTaskModal. ///
function closeEditTaskModal() {
  activeEditTaskId = null;
  closeDatePicker();
  if (!elements.editTaskModal) {
    return;
  }

  elements.editTaskModal.classList.add("hidden");
  elements.editTaskModal.setAttribute("aria-hidden", "true");
  elements.editTaskFeedback.textContent = "";
  elements.editTaskFeedback.classList.remove("error");
}

/// funcao saveEditTaskModal. ///
function saveEditTaskModal() {
  if (!activeEditTaskId) {
    return;
  }

  const task = getTaskById(activeEditTaskId);
  if (!task) {
    setEditTaskFeedback("Tarefa não encontrada.", true);
    return;
  }

  const nextName = elements.editTaskName.value.trim();
  const nextDueDate = getDateInputIso(elements.editTaskDueDate);
  const nextPriority = elements.editTaskPriority.value;

  if (!nextName) {
    setEditTaskFeedback("Informe o nome da tarefa.", true);
    return;
  }

  if (!["baixa", "media", "alta"].includes(nextPriority)) {
    setEditTaskFeedback("Selecione uma prioridade válida.", true);
    return;
  }

  task.title = nextName;
  task.dueDate = nextDueDate;
  task.priority = nextPriority;
  persistTasks();
  render();
  closeEditTaskModal();
}

/// funcao setEditTaskFeedback. ///
function setEditTaskFeedback(message, isError) {
  elements.editTaskFeedback.textContent = message;
  elements.editTaskFeedback.classList.toggle("error", Boolean(isError));
}

/// funcao initializePasswordToggles. ///
function initializePasswordToggles() {
  const toggleButtons = [...document.querySelectorAll("[data-password-toggle]")];
  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest(".password-input-wrap");
      const field = wrapper?.querySelector("input");
      if (!field) {
        return;
      }

      const willShow = field.type === "password";
      field.type = willShow ? "text" : "password";
      button.classList.toggle("is-visible", willShow);
      button.setAttribute("aria-label", willShow ? "Ocultar senha" : "Mostrar senha");
      button.setAttribute("title", willShow ? "Ocultar senha" : "Mostrar senha");
    });
  });
}

/// funcao formatImageCount. ///
function formatImageCount(count) {
  if (!count) {
    return "Nenhuma imagem";
  }

  if (count === 1) {
    return "1 imagem";
  }

  return `${count} imagens`;
}

/// funcao handleModalDescriptionInput. ///
function handleModalDescriptionInput() {
  const task = getTaskById(activeTaskId);
  if (!task) {
    return;
  }

  autoResizeModalDescription();
  syncModalLayout(task);
}

/// funcao autoResizeModalDescription. ///
function autoResizeModalDescription() {
  const field = elements.taskModalDescription;
  field.style.height = "auto";
  const nextHeight = Math.min(field.scrollHeight, 340);
  field.style.height = `${nextHeight}px`;
}

/// funcao syncModalLayout. ///
function syncModalLayout(task) {
  autoResizeModalDescription();

  const modalCard = elements.taskModal.querySelector(".task-modal-card");
  if (!modalCard) {
    return;
  }

  const textSize = (elements.taskModalDescription.value || task.details || "").length;
  const imageCount = Array.isArray(task.images) ? task.images.length : 0;
  const shouldExpand = textSize > 260 || imageCount > 3;
  modalCard.classList.toggle("expanded", shouldExpand);
}

/// funcao initializeTheme. ///
function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
    return;
  }

  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

/// funcao toggleTheme. ///
function toggleTheme() {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

/// funcao applyTheme. ///
function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme-dark", currentTheme === "dark");
  localStorage.setItem(THEME_KEY, currentTheme);
  updateThemeIcon();
}

/// funcao updateThemeIcon. ///
function updateThemeIcon() {
  const toggles = [elements.themeToggle, elements.themeToggleAuth].filter(Boolean);
  const icons = [elements.themeIcon, elements.themeIconAuth].filter(Boolean);
  const icon = currentTheme === "dark" ? "☾" : "☀";
  const label = currentTheme === "dark" ? "Tema escuro" : "Tema claro";

  icons.forEach((item) => {
    item.textContent = icon;
  });

  toggles.forEach((item) => {
    item.setAttribute("aria-label", label);
    item.setAttribute("title", label);
  });
}

/// funcao toggleProfileMenu. ///
function toggleProfileMenu(event) {
  event.stopPropagation();
  if (!elements.profileDropdown || !elements.profileToggle) {
    return;
  }

  const isOpen = !elements.profileDropdown.classList.contains("hidden");
  if (isOpen) {
    closeProfileMenu();
    return;
  }

  closeNotificationMenu();
  elements.profileDropdown.classList.remove("hidden");
  elements.profileToggle.setAttribute("aria-expanded", "true");
}

/// funcao toggleNotificationMenu. ///
function toggleNotificationMenu(event) {
  event.stopPropagation();
  if (!elements.notificationDropdown || !elements.notificationToggle) {
    return;
  }

  const isOpen = !elements.notificationDropdown.classList.contains("hidden");
  if (isOpen) {
    closeNotificationMenu();
    return;
  }

  closeProfileMenu();
  elements.notificationDropdown.classList.remove("hidden");
  elements.notificationToggle.setAttribute("aria-expanded", "true");
}

/// funcao closeNotificationMenu. ///
function closeNotificationMenu() {
  if (!elements.notificationDropdown || !elements.notificationToggle) {
    return;
  }

  elements.notificationDropdown.classList.add("hidden");
  elements.notificationToggle.setAttribute("aria-expanded", "false");
}

/// funcao clearNotifications. ///
function clearNotifications() {
  currentNotifications.forEach((notification) => {
    if (notification.source === "user-event") {
      dismissedUserEventNotifications.add(notification.key);
    } else {
      dismissedNotifications.add(notification.key);
    }
  });
  persistDismissedUserEventNotifications();

  updateNotificationCenter();
}

/// funcao updateNotificationCenter. ///
function updateNotificationCenter() {
  if (!elements.notificationList || !elements.notificationBadge || !elements.notificationClear) {
    return;
  }

  const taskNotifications = tasks
    .map((task) => buildTaskNotification(task))
    .filter((notification) => notification && !dismissedNotifications.has(notification.key));
  const userEventNotifications = currentUser?.role === "admin"
    ? buildAdminUserEventNotifications().filter((notification) => !dismissedUserEventNotifications.has(notification.key))
    : [];
  const notifications = [...taskNotifications, ...userEventNotifications];

  currentNotifications = notifications;
  elements.notificationList.innerHTML = "";

  if (!notifications.length) {
    const empty = document.createElement("li");
    empty.className = "notification-item-empty";
    empty.textContent = "Sem novas notificações.";
    elements.notificationList.appendChild(empty);
  } else {
    notifications.forEach((notification) => {
      const item = document.createElement("li");
      item.className = `notification-item notification-item-${notification.type}`;

      const type = document.createElement("span");
      type.className = `notification-type notification-type-${notification.type}`;
      type.textContent = notification.label;

      const text = document.createElement("p");
      text.className = "notification-text";
      text.textContent = notification.message;

      item.append(type, text);
      elements.notificationList.appendChild(item);
    });
  }

  const count = notifications.length;
  elements.notificationBadge.textContent = count > 99 ? "99+" : String(count);
  elements.notificationBadge.classList.toggle("hidden", count === 0);
  elements.notificationClear.disabled = count === 0;
}

/// funcao buildTaskNotification. ///
function buildTaskNotification(task) {
  if (!task || task.status === "done") {
    return null;
  }

  const dueState = getDueState(task);
  if (dueState === "normal") {
    return null;
  }

  const dueDateLabel = formatDueDate(task.dueDate);
  const dueTimestamp = getDueDateTimestamp(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = dueTimestamp === null ? 0 : Math.floor((dueTimestamp - today.getTime()) / 86400000);
  const stateLabel = dueState === "overdue"
    ? "Atrasada"
    : (diffDays === 0 ? "Vence hoje" : "Vence amanhã");

  return {
    key: `${task.id}:${dueState}:${task.dueDate || ""}`,
    source: "task",
    type: dueState === "overdue" ? "overdue" : "soon",
    label: stateLabel,
    message: `${task.title}${dueDateLabel ? ` (Entrega: ${dueDateLabel})` : ""}`,
  };
}

/// funcao buildAdminUserEventNotifications. ///
function buildAdminUserEventNotifications() {
  return userEvents
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((event) => {
      if (event.type === "password_changed") {
        return {
          key: `event:${event.id}`,
          source: "user-event",
          type: "info",
          label: "Senha alterada",
          message: `${event.username} alterou a senha.`,
        };
      }

      return null;
    })
    .filter(Boolean);
}

/// funcao addUserPasswordChangeEvent. ///
function addUserPasswordChangeEvent(user) {
  if (!user || user.role === "admin") {
    return;
  }

  userEvents.push({
    id: crypto.randomUUID(),
    type: "password_changed",
    userId: user.id,
    username: user.username,
    timestamp: Date.now(),
  });
  persistUserEvents();
}

/// funcao closeProfileMenu. ///
function closeProfileMenu() {
  if (!elements.profileDropdown || !elements.profileToggle) {
    return;
  }

  elements.profileDropdown.classList.add("hidden");
  elements.profileToggle.setAttribute("aria-expanded", "false");
}

/// funcao onDocumentClick. ///
function onDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (elements.profileMenu && !elements.profileMenu.contains(target)) {
    closeProfileMenu();
  }

  if (elements.notificationMenu && !elements.notificationMenu.contains(target)) {
    closeNotificationMenu();
  }

  if (
    datePickerElement
    && !datePickerElement.classList.contains("hidden")
    && activeDatePickerInput
    && !datePickerElement.contains(target)
    && target !== activeDatePickerInput
  ) {
    closeDatePicker();
  }
}

/// funcao isRemoteUsersEnabled. ///
function isRemoteUsersEnabled() {
  return window.location.protocol !== "file:";
}

/// funcao requestApi. ///
async function requestApi(path, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || "Erro na API.");
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A requisição demorou demais. Tente novamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/// funcao mapApiUser. ///
function mapApiUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    password: user.password_plain ?? user.password ?? "",
    role: user.role,
    lastLoginAt: user.last_login_at ?? user.lastLoginAt ?? null,
  };
}

/// funcao refreshUsersFromApi. ///
async function refreshUsersFromApi() {
  if (!isRemoteUsersEnabled()) {
    return false;
  }

  try {
    const data = await requestApi("/api/users");
    const list = Array.isArray(data?.users) ? data.users.map(mapApiUser).filter(Boolean) : [];
    if (!list.length) {
      return false;
    }
    users = list;
    persistUsers();
    return true;
  } catch {
    return false;
  }
}

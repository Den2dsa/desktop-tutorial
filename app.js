"use strict";

const STORAGE_KEY = "my-tech-devices-v1";
const categoryNames = {
  computer: "Компьютер",
  phone: "Телефон",
  network: "Сеть и NAS",
  audio: "Аудио",
  other: "Другое",
};

const starterDevices = [
  {
    id: "sample-laptop",
    name: "Рабочий ноутбук",
    model: "Ноутбук",
    category: "computer",
    icon: "💻",
    location: "Рабочий стол",
    notes: "Добавьте сюда модель и полезные заметки.",
  },
  {
    id: "sample-nas",
    name: "Домашний NAS",
    model: "Сетевое хранилище",
    category: "network",
    icon: "📡",
    location: "Домашняя сеть",
    notes: "Место для файлов, резервных копий и проектов.",
  },
  {
    id: "sample-phone",
    name: "Личный телефон",
    model: "Смартфон",
    category: "phone",
    icon: "📱",
    location: "С собой",
    notes: "Нажмите ✎, чтобы изменить эту карточку.",
  },
];

const deviceGrid = document.querySelector("#device-grid");
const deviceCount = document.querySelector("#device-count");
const dialog = document.querySelector("#device-dialog");
const form = document.querySelector("#device-form");
const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const statusMessage = document.querySelector("#status-message");

let statusTimer;
let devices = loadDevices();

function loadDevices() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return starterDevices.map((device) => ({ ...device }));
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new Error("В хранилище ожидался список устройств.");
    }

    return parsed.filter((device) => device && typeof device.id === "string" && typeof device.name === "string");
  } catch (error) {
    showStatus("Не удалось прочитать сохранённые данные. Каталог открыт с примерами.");
    return starterDevices.map((device) => ({ ...device }));
  }
}

function saveDevices() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    return true;
  } catch (error) {
    showStatus("Браузер не смог сохранить изменения. Проверьте настройки хранилища.");
    return false;
  }
}

function showStatus(message) {
  statusMessage.textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    statusMessage.textContent = "";
  }, 5000);
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeActionButton(label, symbol, action, extraClass = "") {
  const button = createElement("button", `icon-button ${extraClass}`.trim(), symbol);
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.dataset.action = action;
  return button;
}

function renderDevices() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru");
  const selectedCategory = categoryFilter.value;
  const visibleDevices = devices.filter((device) => {
    const searchableText = [device.name, device.model, device.location, device.notes]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ru");
    const matchesText = !query || searchableText.includes(query);
    const matchesCategory = selectedCategory === "all" || device.category === selectedCategory;
    return matchesText && matchesCategory;
  });

  deviceCount.textContent = String(devices.length);
  deviceGrid.replaceChildren();

  if (visibleDevices.length === 0) {
    const empty = createElement("div", "empty-state");
    const icon = createElement("span", "empty-icon", devices.length === 0 ? "＋" : "⌕");
    icon.setAttribute("aria-hidden", "true");
    const title = createElement("h3", "", devices.length === 0 ? "Пока здесь пусто" : "Ничего не нашлось");
    const description = createElement(
      "p",
      "",
      devices.length === 0 ? "Добавьте первое устройство — и ваша коллекция начнёт расти." : "Попробуйте изменить запрос или выбрать другую категорию.",
    );
    empty.append(icon, title, description);
    if (devices.length === 0) {
      const addButton = createElement("button", "button button-primary", "Добавить устройство");
      addButton.type = "button";
      addButton.dataset.action = "add";
      empty.append(addButton);
    }
    deviceGrid.append(empty);
    return;
  }

  visibleDevices.forEach((device) => deviceGrid.append(createDeviceCard(device)));
}

function createDeviceCard(device) {
  const card = createElement("article", "device-card");
  card.dataset.deviceId = device.id;
  const visual = createElement("div", "device-visual");
  const category = createElement("span", "category-label", categoryNames[device.category] || categoryNames.other);
  const icon = createElement("span", "device-icon", device.icon || "🔌");
  icon.setAttribute("aria-hidden", "true");
  const actions = createElement("div", "device-actions");
  actions.append(
    makeActionButton(`Изменить: ${device.name}`, "✎", "edit"),
    makeActionButton(`Удалить: ${device.name}`, "×", "delete", "delete-device"),
  );
  visual.append(category, icon, actions);

  const copy = createElement("div", "card-copy");
  const title = createElement("h3", "device-title", device.name);
  const model = createElement("p", "device-model", device.model || "Модель не указана");
  const details = createElement("div", "device-meta");
  if (device.location) {
    details.append(createElement("span", "meta-pin", "⌖"), createElement("span", "", device.location));
  }
  const notes = createElement("p", "device-notes", device.notes || "Заметок пока нет.");
  copy.append(title, model, details, notes);
  card.append(visual, copy);
  return card;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openForm(device = null) {
  form.reset();
  document.querySelector("#device-id").value = device ? device.id : "";
  document.querySelector("#dialog-title").textContent = device ? "Изменить устройство" : "Новое устройство";
  document.querySelector("#device-name").value = device ? device.name : "";
  document.querySelector("#device-model").value = device ? device.model || "" : "";
  document.querySelector("#device-category").value = device ? device.category || "other" : "computer";
  document.querySelector("#device-icon").value = device ? device.icon || "🔌" : "💻";
  document.querySelector("#device-location").value = device ? device.location || "" : "";
  document.querySelector("#device-notes").value = device ? device.notes || "" : "";
  dialog.showModal();
  document.querySelector("#device-name").focus();
}

function closeForm() {
  dialog.close();
}

document.querySelectorAll("#add-device, #add-device-secondary").forEach((button) => {
  button.addEventListener("click", () => openForm());
});

document.querySelectorAll(".close-dialog").forEach((button) => {
  button.addEventListener("click", closeForm);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const id = String(formData.get("id") || "");
  const device = {
    id: id || createId(),
    name: String(formData.get("name") || "").trim(),
    model: String(formData.get("model") || "").trim(),
    category: String(formData.get("category") || "other"),
    icon: String(formData.get("icon") || "🔌"),
    location: String(formData.get("location") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  };

  if (id) {
    devices = devices.map((item) => item.id === id ? device : item);
    showStatus("Карточка устройства обновлена.");
  } else {
    devices.unshift(device);
    showStatus("Устройство добавлено в каталог.");
  }

  saveDevices();
  closeForm();
  renderDevices();
});

deviceGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "add") {
    openForm();
    return;
  }

  const card = button.closest(".device-card");
  const selectedDevice = devices.find((device) => device.id === card?.dataset.deviceId);
  if (!selectedDevice) return;

  if (button.dataset.action === "edit") {
    openForm(selectedDevice);
  } else if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Удалить устройство «${selectedDevice.name}»?`);
    if (!confirmed) return;
    devices = devices.filter((device) => device.id !== selectedDevice.id);
    saveDevices();
    renderDevices();
    showStatus("Устройство удалено из каталога.");
  }
});

searchInput.addEventListener("input", renderDevices);
categoryFilter.addEventListener("change", renderDevices);

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && dialog.open) closeForm();
});

renderDevices();

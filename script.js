const rooms = [
  {
    name: "Wohnzimmer",
    rows: 3,
    cols: 4,
    items: [
      { name: "Schlüssel", icon: "Bilder/wohnzimmer_icon_schluessel_clean.png" },
      { name: "Fernbedienung", icon: "Bilder/wohnzimmer_icon_fernbedienung_clean.png" },
      { name: "Brille", icon: "Bilder/wohnzimmer_icon_brille_clean.png" },
      { name: "Buch", icon: "Bilder/wohnzimmer_icon_buch_clean.png" },
      { name: "Handy", icon: "Bilder/wohnzimmer_icon_handy_clean.png" },
      { name: "Sofa", icon: "Bilder/wohnzimmer_icon_sofa_clean.png" }
    ]
  },
  {
    name: "Küche",
    rows: 3,
    cols: 4,
    items: [
      { name: "Tasse", icon: "Bilder/kueche_icon_tasse_clean.png" },
      { name: "Pfanne", icon: "Bilder/kueche_icon_pfanne_clean.png" },
      { name: "Messer", icon: "Bilder/kueche_icon_messer_clean.png" },
      { name: "Löffel", icon: "Bilder/kueche_icon_loeffel_clean.png" },
      { name: "Salzstreuer", icon: "Bilder/kueche_icon_salzstreuer_clean.png" },
      { name: "Teller", icon: "Bilder/kueche_icon_teller_clean.png" }
    ]
  }
];

const ITEM_COUNT_MIN = 3;
const ITEM_COUNT_MAX = 6;
const DEFAULT_ITEM_COUNT = 4;
const DEFAULT_MEMORIZE_DURATION = 15;

let phase = "idle";
let selectedRoomIndex = null;
let placements = {};
let cellAssignments = {};
let activeItem = null;
let timerInterval = null;
let timeLeft = DEFAULT_MEMORIZE_DURATION;
let cellElements = new Map();
let itemButtons = new Map();
let roundItems = [];
let roundTargets = {};
let selectedItemCount = DEFAULT_ITEM_COUNT;
let memorizeDuration = DEFAULT_MEMORIZE_DURATION;

const roomButtonsContainer = document.getElementById("roomButtons");
const startMemorizeButton = document.getElementById("startMemorize");
const startRecallButton = document.getElementById("startRecall");
const resetButton = document.getElementById("resetGame");
const gridElement = document.getElementById("grid");
const itemsContainer = document.getElementById("items");
const messageElement = document.getElementById("message");
const timerElement = document.getElementById("timer");
const itemCountSelect = document.getElementById("itemCount");
const memorizeDurationSelect = document.getElementById("memorizeDuration");

function init() {
  buildRoomButtons();
  startMemorizeButton.addEventListener("click", handleStartMemorize);
  startRecallButton.addEventListener("click", startRecall);
  resetButton.addEventListener("click", resetGame);
  itemCountSelect.addEventListener("change", handleItemCountChange);
  memorizeDurationSelect.addEventListener("change", handleMemorizeDurationChange);
  updateControls();
}

function buildRoomButtons() {
  roomButtonsContainer.innerHTML = "";
  rooms.forEach((room, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = room.name;
    button.addEventListener("click", () => selectRoom(index));
    roomButtonsContainer.appendChild(button);
  });
  updateRoomButtonStates();
}

function updateRoomButtonStates() {
  const buttons = Array.from(roomButtonsContainer.querySelectorAll("button"));
  buttons.forEach((button, index) => {
    if (index === selectedRoomIndex) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function selectRoom(index) {
  selectedRoomIndex = index;
  updateRoomButtonStates();
  resetRoundState();
  messageElement.textContent = `Raum "${rooms[index].name}" ausgewählt. Drücke auf "Merken starten".`;
  updateControls();
}

function handleStartMemorize() {
  if (selectedRoomIndex === null) {
    return;
  }
  startMemorize(selectedRoomIndex);
}

function startMemorize(roomIndex) {
  resetRoundState();
  const room = rooms[roomIndex];
  prepareRound(room);
  phase = "memorize";
  buildGrid(room, true);
  messageElement.textContent = "Merke dir die Positionen der Gegenstände.";
  startTimer();
  startMemorizeButton.disabled = true;
  startRecallButton.disabled = false;
}

function prepareRound(room) {
  const maxAllowed = Math.min(room.items.length, ITEM_COUNT_MAX);
  if (selectedItemCount > maxAllowed) {
    selectedItemCount = maxAllowed;
    itemCountSelect.value = String(maxAllowed);
  }
  const shuffledItems = shuffleArray([...room.items]);
  roundItems = shuffledItems.slice(0, selectedItemCount);

  const allCells = [];
  for (let row = 0; row < room.rows; row += 1) {
    for (let col = 0; col < room.cols; col += 1) {
      allCells.push({ row, col });
    }
  }
  const shuffledCells = shuffleArray(allCells);
  roundTargets = {};
  shuffledCells.slice(0, roundItems.length).forEach((cell, index) => {
    roundTargets[roundItems[index].name] = cell;
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = memorizeDuration;
  timerElement.textContent = `Merken: ${timeLeft} Sekunden verbleiben.`;
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft > 0) {
      timerElement.textContent = `Merken: ${timeLeft} Sekunden verbleiben.`;
    } else {
      timerElement.textContent = "Merken abgeschlossen.";
      clearInterval(timerInterval);
      if (phase === "memorize") {
        startRecall();
      }
    }
  }, 1000);
}

function startRecall() {
  if (phase !== "memorize" || selectedRoomIndex === null) {
    return;
  }
  phase = "recall";
  clearInterval(timerInterval);
  timerElement.textContent = "Lege die Gegenstände wieder zurück.";
  const room = rooms[selectedRoomIndex];
  buildGrid(room, false);
  buildItemButtons(roundItems);
  messageElement.textContent = "Wähle einen Gegenstand und klicke dann auf ein Feld.";
  startRecallButton.disabled = true;
}

function buildGrid(room, showTargets) {
  gridElement.innerHTML = "";
  gridElement.style.gridTemplateColumns = `repeat(${room.cols}, 1fr)`;
  gridElement.style.gridTemplateRows = `repeat(${room.rows}, 1fr)`;
  cellElements = new Map();

  for (let row = 0; row < room.rows; row += 1) {
    for (let col = 0; col < room.cols; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.classList.add("cell");
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);

      if (phase === "memorize") {
        cell.classList.add("memorize");
      } else if (phase === "recall") {
        cell.classList.add("recall");
      }

      const targetItem = getItemByPosition(row, col);
      if (showTargets && targetItem) {
        renderIconInCell(cell, targetItem);
      }

      if (phase === "recall") {
        cell.addEventListener("click", () => handleCellClick(row, col));
      } else {
        cell.disabled = true;
      }

      gridElement.appendChild(cell);
      cellElements.set(`${row},${col}`, cell);
    }
  }
}

function buildItemButtons(items) {
  itemsContainer.innerHTML = "";
  itemButtons = new Map();
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", item.name);

    const icon = document.createElement("img");
    icon.src = item.icon;
    icon.alt = item.name;
    icon.classList.add("item-icon");

    const label = document.createElement("span");
    label.textContent = item.name;

    button.appendChild(icon);
    button.appendChild(label);

    button.addEventListener("click", () => selectItem(item.name));
    itemsContainer.appendChild(button);
    itemButtons.set(item.name, button);
  });
  updateItemSelection();
}

function selectItem(itemName) {
  if (phase !== "recall") {
    return;
  }
  activeItem = itemName;
  updateItemSelection();
  messageElement.textContent = `Platziere "${itemName}" auf dem Spielfeld.`;
}

function updateItemSelection() {
  itemButtons.forEach((button, name) => {
    if (name === activeItem) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
    if (placements[name]) {
      button.classList.add("placed");
    } else {
      button.classList.remove("placed");
    }
  });
}

function handleCellClick(row, col) {
  if (phase !== "recall" || !activeItem) {
    messageElement.textContent = "Bitte wähle zuerst einen Gegenstand aus.";
    return;
  }

  const key = `${row},${col}`;
  const cell = cellElements.get(key);

  if (!cell) {
    return;
  }

  if (placements[activeItem]) {
    const previousKey = `${placements[activeItem].row},${placements[activeItem].col}`;
    const previousCell = cellElements.get(previousKey);
    if (previousCell) {
      previousCell.innerHTML = "";
    }
    delete cellAssignments[previousKey];
  }

  if (cellAssignments[key] && cellAssignments[key] !== activeItem) {
    const otherItem = cellAssignments[key];
    delete placements[otherItem];
  }

  placements[activeItem] = { row, col };
  cellAssignments[key] = activeItem;
  const itemData = getRoundItem(activeItem);
  if (itemData) {
    renderIconInCell(cell, itemData);
  }

  activeItem = null;
  updateItemSelection();
  messageElement.textContent = "Gegenstand platziert. Wähle den nächsten Gegenstand.";

  const placedCount = Object.keys(placements).length;
  const totalItems = roundItems.length;
  if (placedCount === totalItems) {
    evaluate();
  }
}

function evaluate() {
  phase = "result";
  const room = rooms[selectedRoomIndex];
  let correctCount = 0;

  itemButtons.forEach((button) => button.setAttribute("disabled", "true"));
  cellElements.forEach((cell) => {
    cell.disabled = true;
  });

  roundItems.forEach((item) => {
    const target = roundTargets[item.name];
    if (!target) {
      return;
    }
    const targetKey = `${target.row},${target.col}`;
    const targetCell = cellElements.get(targetKey);
    if (targetCell) {
      targetCell.classList.remove("memorize", "recall");
      renderIconInCell(targetCell, item);
    }

    const userPlacement = placements[item.name];
    if (userPlacement && userPlacement.row === target.row && userPlacement.col === target.col) {
      correctCount += 1;
      if (targetCell) {
        targetCell.classList.add("correct");
      }
    } else if (userPlacement) {
      const userKey = `${userPlacement.row},${userPlacement.col}`;
      const userCell = cellElements.get(userKey);
      if (userCell) {
        userCell.classList.add("wrong");
        userCell.disabled = true;
      }
      if (targetCell) {
        targetCell.classList.add("correct");
      }
    } else if (targetCell) {
      targetCell.classList.add("correct");
    }
    if (targetCell) {
      targetCell.disabled = true;
    }
  });

  const total = roundItems.length;
  messageElement.textContent = `Du hast ${correctCount} von ${total} Gegenständen richtig platziert.`;
  timerElement.textContent = "Runde beendet.";
  startMemorizeButton.disabled = selectedRoomIndex === null;
  startRecallButton.disabled = true;
}

function resetRoundState() {
  clearInterval(timerInterval);
  phase = phase === "result" ? "idle" : phase;
  placements = {};
  cellAssignments = {};
  activeItem = null;
  cellElements = new Map();
  itemButtons = new Map();
  roundItems = [];
  roundTargets = {};
  itemsContainer.innerHTML = "";
  gridElement.innerHTML = "";
  timerElement.textContent = "";
  startRecallButton.disabled = true;
}

function resetGame() {
  clearInterval(timerInterval);
  phase = "idle";
  placements = {};
  cellAssignments = {};
  activeItem = null;
  cellElements = new Map();
  itemButtons = new Map();
  roundItems = [];
  roundTargets = {};
  gridElement.innerHTML = "";
  itemsContainer.innerHTML = "";
  timerElement.textContent = "";
  messageElement.textContent = selectedRoomIndex === null
    ? "Wähle zuerst einen Raum aus."
    : "Bereit für eine neue Runde. Starte erneut die Merken-Phase.";
  startMemorizeButton.disabled = selectedRoomIndex === null;
  startRecallButton.disabled = true;
  updateRoomButtonStates();
}

function updateControls() {
  startMemorizeButton.disabled = selectedRoomIndex === null;
  startRecallButton.disabled = true;
}

function handleItemCountChange(event) {
  const newValue = Number(event.target.value);
  if (Number.isNaN(newValue)) {
    return;
  }
  selectedItemCount = Math.max(ITEM_COUNT_MIN, Math.min(ITEM_COUNT_MAX, newValue));
}

function handleMemorizeDurationChange(event) {
  const newValue = Number(event.target.value);
  if (Number.isNaN(newValue)) {
    return;
  }
  memorizeDuration = Math.max(5, newValue);
}

function getItemByPosition(row, col) {
  return roundItems.find((item) => {
    const target = roundTargets[item.name];
    return target && target.row === row && target.col === col;
  });
}

function getRoundItem(name) {
  return roundItems.find((item) => item.name === name);
}

function renderIconInCell(cell, item) {
  cell.innerHTML = "";
  const icon = document.createElement("img");
  icon.src = item.icon;
  icon.alt = item.name;
  icon.classList.add("item-icon");
  cell.appendChild(icon);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

init();

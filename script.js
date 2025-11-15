const rooms = [
  {
    name: "Wohnzimmer",
    rows: 3,
    cols: 4,
    items: [
      { name: "Schlüssel", target: { row: 0, col: 1 } },
      { name: "Fernbedienung", target: { row: 1, col: 3 } },
      { name: "Brille", target: { row: 2, col: 0 } },
      { name: "Buch", target: { row: 1, col: 1 } },
      { name: "Handy", target: { row: 0, col: 3 } }
    ]
  },
  {
    name: "Küche",
    rows: 3,
    cols: 4,
    items: [
      { name: "Tasse", target: { row: 0, col: 0 } },
      { name: "Pfanne", target: { row: 2, col: 3 } },
      { name: "Messer", target: { row: 1, col: 2 } },
      { name: "Löffel", target: { row: 2, col: 1 } },
      { name: "Salzstreuer", target: { row: 0, col: 2 } }
    ]
  }
];

const MEMORIZE_DURATION = 15;

let phase = "idle";
let selectedRoomIndex = null;
let placements = {};
let cellAssignments = {};
let activeItem = null;
let timerInterval = null;
let timeLeft = MEMORIZE_DURATION;
let cellElements = new Map();
let itemButtons = new Map();

const roomButtonsContainer = document.getElementById("roomButtons");
const startMemorizeButton = document.getElementById("startMemorize");
const startRecallButton = document.getElementById("startRecall");
const resetButton = document.getElementById("resetGame");
const gridElement = document.getElementById("grid");
const itemsContainer = document.getElementById("items");
const messageElement = document.getElementById("message");
const timerElement = document.getElementById("timer");

function init() {
  buildRoomButtons();
  startMemorizeButton.addEventListener("click", handleStartMemorize);
  startRecallButton.addEventListener("click", startRecall);
  resetButton.addEventListener("click", resetGame);
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
  phase = "memorize";
  const room = rooms[roomIndex];
  resetRoundState();
  buildGrid(room, true);
  messageElement.textContent = "Merke dir die Positionen der Gegenstände.";
  startTimer();
  startMemorizeButton.disabled = true;
  startRecallButton.disabled = false;
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = MEMORIZE_DURATION;
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
  buildItemButtons(room.items);
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

      const itemAtCell = room.items.find(
        (item) => item.target.row === row && item.target.col === col
      );
      if (showTargets && itemAtCell) {
        cell.textContent = itemAtCell.name;
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
    button.textContent = item.name;
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

  // remove previous assignment for this item
  if (placements[activeItem]) {
    const previousKey = `${placements[activeItem].row},${placements[activeItem].col}`;
    const previousCell = cellElements.get(previousKey);
    if (previousCell) {
      previousCell.textContent = "";
    }
    delete cellAssignments[previousKey];
  }

  // if another item was in this cell, remove it
  if (cellAssignments[key] && cellAssignments[key] !== activeItem) {
    const otherItem = cellAssignments[key];
    delete placements[otherItem];
  }

  placements[activeItem] = { row, col };
  cellAssignments[key] = activeItem;
  cell.textContent = activeItem;

  activeItem = null;
  updateItemSelection();
  messageElement.textContent = "Gegenstand platziert. Wähle den nächsten Gegenstand.";

  const placedCount = Object.keys(placements).length;
  const totalItems = rooms[selectedRoomIndex].items.length;
  if (placedCount === totalItems) {
    evaluate();
  }
}

function evaluate() {
  phase = "result";
  const room = rooms[selectedRoomIndex];
  let correctCount = 0;

  // Clear state for result view
  itemButtons.forEach((button) => button.setAttribute("disabled", "true"));
  cellElements.forEach((cell) => {
    cell.disabled = true;
  });

  room.items.forEach((item) => {
    const targetKey = `${item.target.row},${item.target.col}`;
    const targetCell = cellElements.get(targetKey);
    targetCell.classList.remove("memorize", "recall");
    targetCell.textContent = item.name;

    const userPlacement = placements[item.name];
    if (userPlacement && userPlacement.row === item.target.row && userPlacement.col === item.target.col) {
      correctCount += 1;
      targetCell.classList.add("correct");
    } else if (userPlacement) {
      const userKey = `${userPlacement.row},${userPlacement.col}`;
      const userCell = cellElements.get(userKey);
      if (userCell) {
        userCell.classList.add("wrong");
        userCell.disabled = true;
      }
      targetCell.classList.add("correct");
    } else {
      targetCell.classList.add("correct");
    }
    targetCell.disabled = true;
  });

  const total = room.items.length;
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

init();

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

const WORD_POOL = [
  "Haus", "Baum", "Auto", "Lampe", "Stuhl", "Tisch", "Fenster", "Buch", "Brille", "Computer",
  "Garten", "Straße", "Fluss", "Berg", "Schule", "Tür", "Telefon", "Uhr", "Bild", "Koffer",
  "Zeitung", "Blume", "Zug", "Bus", "Fahrrad", "Küche", "Teller", "Gabel", "Löffel", "Pfanne",
  "Tasse", "Becher", "Glas", "Karte", "Stadt", "Dorf", "Insel", "Wolke", "Sonne", "Mond",
  "Stern", "Kerze", "Spiegel", "Teppich", "Boden", "Decke", "Vorhang", "Kissen", "Schrank", "Regal",
  "Fensterbank", "Pflanze", "Sofa", "Stift", "Papier", "Tasche", "Rucksack", "Ball", "Puppe", "Spielzeug",
  "Trommel", "Gitarre", "Klavier", "Geige", "Trompete", "Bildschirm", "Tastatur", "Maus", "Drucker", "Lautsprecher",
  "Kabel", "Kamera", "Fotoapparat", "Kopfhörer", "Mikrofon", "Notizbuch", "Kalender", "Ordner", "Heft", "Lineal",
  "Zirkel", "Radiergummi", "Pinsel", "Farbe", "Leinwand", "Staffelei", "Schraube", "Hammer", "Zange", "Schraubenzieher",
  "Bohrer", "Leiter", "Eimer", "Besen", "Schwamm", "Seife", "Handtuch", "Kamm", "Bürste", "Seil"
];

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

const tabs = document.querySelectorAll(".game-tab");
const sections = document.querySelectorAll(".game-section");
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
const wordGameSection = document.getElementById("wordGame");
const wordCountSelect = document.getElementById("wordCountSelect");
const wordPreview = document.getElementById("wordPreview");
const wordNewRoundButton = document.getElementById("wordNewRoundButton");
const wordStartButton = document.getElementById("wordStartButton");
const wordInputArea = document.getElementById("wordInputArea");
const wordInputsContainer = document.getElementById("wordInputs");
const wordFinishButton = document.getElementById("wordFinishButton");
const wordResult = document.getElementById("wordResult");

const wordGameState = {
  targetWords: [],
  expectedCount: 5,
  finished: false
};

function initPage() {
  initTabs();
  initSpatialGame();
  initMemoryGame();
  initWordGame();
}

function initTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      tabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });
      sections.forEach((section) => {
        const isTarget = section.id === target;
        section.classList.toggle("active", isTarget);
        section.hidden = !isTarget;
      });
    });
  });
}

function initSpatialGame() {
  buildRoomButtons();
  startMemorizeButton.addEventListener("click", handleStartMemorize);
  startRecallButton.addEventListener("click", startRecall);
  resetButton.addEventListener("click", resetGame);
  itemCountSelect.addEventListener("change", handleItemCountChange);
  memorizeDurationSelect.addEventListener("change", handleMemorizeDurationChange);
  updateControls();
}

function initWordGame() {
  if (
    !wordGameSection ||
    !wordCountSelect ||
    !wordPreview ||
    !wordNewRoundButton ||
    !wordStartButton ||
    !wordInputArea ||
    !wordInputsContainer ||
    !wordFinishButton ||
    !wordResult
  ) {
    return;
  }

  wordCountSelect.innerHTML = "";
  for (let n = 3; n <= 10; n += 1) {
    const option = document.createElement("option");
    option.value = String(n);
    option.textContent = `${n} Wörter`;
    if (n === 5) {
      option.selected = true;
    }
    wordCountSelect.appendChild(option);
  }

  wordCountSelect.addEventListener("change", prepareWordRound);
  wordNewRoundButton.addEventListener("click", prepareWordRound);
  wordStartButton.addEventListener("click", startWordRound);
  wordFinishButton.addEventListener("click", () => finishWordRound(false));

  prepareWordRound();
}

function prepareWordRound() {
  if (!wordCountSelect || !wordPreview || !wordInputArea || !wordInputsContainer || !wordResult) {
    return;
  }
  const count = parseInt(wordCountSelect.value, 10) || 5;
  wordGameState.expectedCount = count;
  wordGameState.finished = false;

  const poolCopy = [...WORD_POOL];
  shuffleArray(poolCopy);
  wordGameState.targetWords = poolCopy.slice(0, count);

  wordPreview.innerHTML = "";
  const list = document.createElement("ul");
  list.classList.add("word-list");
  wordGameState.targetWords.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    list.appendChild(li);
  });
  wordPreview.appendChild(list);

  wordInputArea.hidden = true;
  wordInputsContainer.innerHTML = "";
  wordResult.innerHTML = "";
}

function startWordRound() {
  if (!wordPreview || !wordInputArea || !wordInputsContainer || !wordResult) {
    return;
  }
  if (!wordGameState.targetWords.length) {
    prepareWordRound();
  }

  wordPreview.innerHTML = "<p>Die Wörter sind jetzt ausgeblendet. Schreibe sie aus dem Gedächtnis auf.</p>";

  buildWordInputs(wordGameState.expectedCount);
  wordInputArea.hidden = false;
  wordResult.innerHTML = "";
  wordGameState.finished = false;
}

function buildWordInputs(count) {
  if (!wordInputsContainer) {
    return;
  }
  wordInputsContainer.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = `Wort ${i + 1}`;
    input.addEventListener("input", handleWordInputChange);
    wordInputsContainer.appendChild(input);
  }
  const first = wordInputsContainer.querySelector("input");
  if (first) {
    first.focus();
  }
}

function handleWordInputChange() {
  if (wordGameState.finished) {
    return;
  }
  const inputs = Array.from(wordInputsContainer.querySelectorAll("input"));
  const nonEmptyCount = inputs.filter((input) => input.value.trim() !== "").length;
  if (nonEmptyCount >= wordGameState.expectedCount) {
    finishWordRound(true);
  }
}

function finishWordRound(autoTriggered = false) {
  if (wordGameState.finished || !wordInputsContainer || !wordResult) {
    return;
  }
  wordGameState.finished = true;

  const inputs = Array.from(wordInputsContainer.querySelectorAll("input"));
  const rawGuesses = inputs
    .map((input) => input.value.trim())
    .filter((value) => value !== "");
  const guesses = rawGuesses.map((value) => value.toLowerCase());

  const normalizedTargets = wordGameState.targetWords.map((word) => word.toLowerCase());

  const hits = [];
  const extras = [];
  const extrasNormalized = [];

  rawGuesses.forEach((raw, index) => {
    const guess = guesses[index];
    if (normalizedTargets.includes(guess) && !hits.includes(guess)) {
      hits.push(guess);
    } else if (!extrasNormalized.includes(guess)) {
      extrasNormalized.push(guess);
      extras.push(raw);
    }
  });

  const missed = normalizedTargets.filter((target) => !hits.includes(target));
  const total = normalizedTargets.length;

  wordResult.innerHTML = "";

  const scoreP = document.createElement("p");
  scoreP.classList.add("word-score");
  scoreP.textContent = `Du hast ${hits.length} von ${total} Wörtern richtig.`;
  wordResult.appendChild(scoreP);

  const list = document.createElement("ul");
  list.classList.add("word-result-list");
  wordGameState.targetWords.forEach((original) => {
    const li = document.createElement("li");
    const normalized = original.toLowerCase();
    li.textContent = original;
    if (hits.includes(normalized)) {
      li.classList.add("hit");
    } else {
      li.classList.add("missed");
    }
    list.appendChild(li);
  });
  wordResult.appendChild(list);

  if (missed.length > 0) {
    const missedP = document.createElement("p");
    const missedOriginals = wordGameState.targetWords.filter((word) => missed.includes(word.toLowerCase()));
    missedP.textContent = `Diese Wörter haben gefehlt: ${missedOriginals.join(", ")}`;
    wordResult.appendChild(missedP);
  }

  if (extras.length > 0) {
    const extrasP = document.createElement("p");
    extrasP.textContent = `Zusätzliche Wörter, die nicht in der Liste waren: ${extras.join(", ")}`;
    wordResult.appendChild(extrasP);
  }

  if (autoTriggered) {
    const autoP = document.createElement("p");
    autoP.textContent = "Alle Felder gefüllt – Auswertung wurde automatisch gestartet.";
    wordResult.appendChild(autoP);
  }

  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.textContent = "Neustart mit neuen Wörtern";
  restartButton.addEventListener("click", prepareWordRound);
  wordResult.appendChild(restartButton);
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
        // Klick weiterhin erlauben
        cell.addEventListener("click", () => handleCellClick(row, col));

        // Drag & Drop Events
        cell.addEventListener("dragover", handleCellDragOver);
        cell.addEventListener("dragenter", handleCellDragEnter);
        cell.addEventListener("dragleave", handleCellDragLeave);
        cell.addEventListener("drop", (event) => handleCellDrop(event, row, col));
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

    // Drag & Drop aktivieren
    button.draggable = true;
    button.addEventListener("dragstart", (event) => handleItemDragStart(event, item.name));
    button.addEventListener("dragend", handleItemDragEnd);

    const icon = document.createElement("img");
    icon.src = item.icon;
    icon.alt = item.name;
    icon.classList.add("item-icon");

    const label = document.createElement("span");
    label.textContent = item.name;

    button.appendChild(icon);
    button.appendChild(label);

    // Klick-Auswahl weiterhin erlauben
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

function handleItemDragStart(event, itemName) {
  if (phase !== "recall") {
    event.preventDefault();
    return;
  }

  activeItem = itemName;
  updateItemSelection();

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemName);
  }

  messageElement.textContent = `Platziere "${itemName}" auf dem Spielfeld.`;
}

function handleItemDragEnd() {
  // Wenn der Drop erfolgreich war, setzt handleCellClick activeItem auf null.
  // Wenn der Drag abgebrochen wurde, räumen wir hier auf.
  if (phase === "recall") {
    activeItem = null;
    updateItemSelection();
  }
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

function handleCellDragOver(event) {
  if (phase !== "recall") {
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleCellDragEnter(event) {
  if (phase !== "recall") {
    return;
  }
  const cell = event.currentTarget;
  cell.classList.add("drag-over");
}

function handleCellDragLeave(event) {
  if (phase !== "recall") {
    return;
  }
  const cell = event.currentTarget;
  cell.classList.remove("drag-over");
}

function handleCellDrop(event, row, col) {
  if (phase !== "recall") {
    return;
  }
  event.preventDefault();
  const cell = event.currentTarget;
  cell.classList.remove("drag-over");

  let itemName = "";
  if (event.dataTransfer) {
    itemName = event.dataTransfer.getData("text/plain");
  }

  if (!itemName && activeItem) {
    itemName = activeItem;
  }

  if (!itemName) {
    return;
  }

  activeItem = itemName;
  handleCellClick(row, col);
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

const memoryIcons = rooms.flatMap((room) => room.items);
const MEMORY_MIN_PAIRS = 4;
const MEMORY_MAX_PAIRS = 12;
const memoryGrid = document.getElementById("memoryGrid");
const memoryStatus = document.getElementById("memoryStatus");
const memoryScoreboard = document.getElementById("memoryScoreboard");
const memoryStartButton = document.getElementById("memoryStart");
const memoryRestartButton = document.getElementById("memoryRestart");
const memoryPairsInput = document.getElementById("memoryPairs");
const memoryPairsOutput = document.getElementById("memoryPairValue");
const memoryModeRadios = document.querySelectorAll("input[name='memoryMode']");
const playerOneInput = document.getElementById("playerOneName");
const playerTwoInput = document.getElementById("playerTwoName");

const memoryState = {
  mode: "solo",
  pairCount: Number(memoryPairsInput?.value ?? MEMORY_MIN_PAIRS),
  players: [
    { name: "Spieler 1", score: 0 },
    { name: "Spieler 2", score: 0 }
  ],
  deck: [],
  revealedCards: [],
  matchedPairs: new Set(),
  activePlayerIndex: 0,
  blockInput: false,
  previewTimer: null,
  flipTimer: null,
  started: false
};

function initMemoryGame() {
  if (!memoryGrid) {
    return;
  }
  memoryPairsInput.addEventListener("input", handlePairsChange);
  memoryModeRadios.forEach((radio) => radio.addEventListener("change", handleModeChange));
  memoryStartButton.addEventListener("click", startMemoryRound);
  memoryRestartButton.addEventListener("click", resetMemoryRound);
  [playerOneInput, playerTwoInput].forEach((input, index) => {
    input.addEventListener("input", () => handleNameChange(index));
  });
  updatePlayerInputVisibility();
  renderMemoryScoreboard();
  handlePairsChange();
}

function handlePairsChange() {
  const count = Number(memoryPairsInput.value);
  memoryState.pairCount = Math.min(Math.max(count, MEMORY_MIN_PAIRS), MEMORY_MAX_PAIRS);
  memoryPairsOutput.value = `${memoryState.pairCount} Paare`;
}

function handleModeChange() {
  const selected = document.querySelector("input[name='memoryMode']:checked");
  memoryState.mode = selected?.value === "duel" ? "duel" : "solo";
  updatePlayerInputVisibility();
  renderMemoryScoreboard();
  updateTurnMessage();
}

function handleNameChange(index) {
  const value = index === 0 ? playerOneInput.value : playerTwoInput.value;
  memoryState.players[index].name = value.trim() || `Spieler ${index + 1}`;
  renderMemoryScoreboard();
  updateTurnMessage();
}

function updatePlayerInputVisibility() {
  const showSecond = memoryState.mode === "duel";
  [playerTwoInput, document.querySelector("label[for='playerTwoName']")].forEach((element) => {
    if (element) {
      element.classList.toggle("hide", !showSecond);
    }
  });
}

function startMemoryRound() {
  clearMemoryTimers();
  memoryState.players[0].name = playerOneInput.value.trim() || "Spieler 1";
  memoryState.players[1].name = playerTwoInput.value.trim() || "Spieler 2";
  memoryState.players.forEach((player) => {
    player.score = 0;
  });
  memoryState.matchedPairs = new Set();
  memoryState.revealedCards = [];
  memoryState.activePlayerIndex = memoryState.mode === "duel" ? Math.floor(Math.random() * 2) : 0;
  memoryState.deck = buildMemoryDeck(memoryState.pairCount);
  memoryState.blockInput = true;
  memoryState.started = true;
  buildMemoryGrid();
  renderMemoryScoreboard();
  memoryStatus.textContent = "Alle Karten werden kurz angezeigt – präge sie dir gut ein!";
  peekCards();
}

function resetMemoryRound() {
  clearMemoryTimers();
  memoryState.deck = [];
  memoryState.revealedCards = [];
  memoryState.matchedPairs = new Set();
  memoryState.blockInput = false;
  memoryState.activePlayerIndex = 0;
  memoryState.started = false;
  memoryGrid.innerHTML = "";
  renderMemoryScoreboard();
  memoryStatus.textContent = "Stelle den Modus ein und starte das Spiel.";
}

function clearMemoryTimers() {
  clearTimeout(memoryState.previewTimer);
  clearTimeout(memoryState.flipTimer);
}

function buildMemoryDeck(pairCount) {
  const availableIcons = shuffleArray([...memoryIcons]).slice(0, pairCount);
  const deck = [];
  availableIcons.forEach((icon, index) => {
    const first = { ...icon, pairId: `pair-${index}` };
    const second = { ...icon, pairId: `pair-${index}` };
    deck.push(first, second);
  });
  return shuffleArray(deck);
}

function buildMemoryGrid() {
  memoryGrid.innerHTML = "";
  memoryGrid.style.removeProperty("grid-template-columns");
  memoryState.deck.forEach((cardData, index) => {
    const cardButton = document.createElement("button");
    cardButton.type = "button";
    cardButton.classList.add("memory-card", "peek");
    cardButton.dataset.index = String(index);
    cardButton.dataset.pair = cardData.pairId;
    cardButton.addEventListener("click", () => handleCardClick(cardButton, cardData));

    const inner = document.createElement("div");
    inner.classList.add("memory-card-inner");

    const front = document.createElement("div");
    front.classList.add("memory-card-face", "memory-card-front");

    const back = document.createElement("div");
    back.classList.add("memory-card-face", "memory-card-back");
    const img = document.createElement("img");
    img.src = cardData.icon;
    img.alt = cardData.name;
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    cardButton.appendChild(inner);
    memoryGrid.appendChild(cardButton);
  });
}

function peekCards() {
  memoryState.previewTimer = setTimeout(() => {
    const cards = memoryGrid.querySelectorAll(".memory-card");
    cards.forEach((card) => {
      card.classList.remove("peek");
      card.classList.remove("revealed");
    });
    memoryState.blockInput = false;
    updateTurnMessage();
  }, 5000);
}

function handleCardClick(card, cardData) {
  if (memoryState.blockInput || card.classList.contains("revealed") || card.classList.contains("matched")) {
    return;
  }
  card.classList.add("revealed");
  memoryState.revealedCards.push({ card, data: cardData });

  if (memoryState.revealedCards.length === 2) {
    memoryState.blockInput = true;
    const [first, second] = memoryState.revealedCards;
    if (first.data.pairId === second.data.pairId) {
      registerMatch(first.card, second.card);
    } else {
      memoryState.flipTimer = setTimeout(() => {
        first.card.classList.remove("revealed");
        second.card.classList.remove("revealed");
        memoryState.revealedCards = [];
        memoryState.blockInput = false;
        advancePlayer();
      }, 900);
    }
  }
}

function registerMatch(firstCard, secondCard) {
  memoryState.revealedCards = [];
  memoryState.matchedPairs.add(firstCard.dataset.pair);
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");
  setTimeout(() => {
    firstCard.classList.add("gone");
    secondCard.classList.add("gone");
  }, 400);

  if (memoryState.mode === "duel") {
    memoryState.players[memoryState.activePlayerIndex].score += 1;
  }
  renderMemoryScoreboard();

  if (memoryState.matchedPairs.size === memoryState.pairCount) {
    finishMemoryRound();
  } else {
    memoryState.blockInput = false;
    updateTurnMessage();
  }
}

function advancePlayer() {
  if (memoryState.mode === "duel") {
    memoryState.activePlayerIndex = memoryState.activePlayerIndex === 0 ? 1 : 0;
  }
  updateTurnMessage();
}

function updateTurnMessage() {
  if (!memoryState.started) {
    memoryStatus.textContent = "Stelle den Modus ein und starte das Spiel.";
    return;
  }
  if (memoryState.mode === "solo") {
    const found = memoryState.matchedPairs.size;
    memoryStatus.textContent = `Finde alle Paare (${found}/${memoryState.pairCount})!`;
  } else {
    const activePlayer = memoryState.players[memoryState.activePlayerIndex];
    memoryStatus.textContent = `${activePlayer.name} ist am Zug.`;
  }
  highlightActivePlayer();
}

function highlightActivePlayer() {
  const playerElements = memoryScoreboard.querySelectorAll(".player");
  playerElements.forEach((element, index) => {
    element.classList.toggle("active", memoryState.mode === "duel" && index === memoryState.activePlayerIndex);
  });
}

function finishMemoryRound() {
  memoryState.blockInput = true;
  if (memoryState.mode === "solo") {
    memoryStatus.textContent = "Geschafft! Alle Paare wurden gefunden.";
  } else {
    const [first, second] = memoryState.players;
    if (first.score === second.score) {
      memoryStatus.textContent = "Unentschieden! Ihr seid ein eingespieltes Team.";
    } else {
      const winner = first.score > second.score ? first : second;
      memoryStatus.textContent = `${winner.name} gewinnt mit ${winner.score} Paaren!`;
    }
  }
}

function renderMemoryScoreboard() {
  memoryScoreboard.innerHTML = "";
  const showSecond = memoryState.mode === "duel";
  memoryState.players.forEach((player, index) => {
    if (!showSecond && index === 1) {
      return;
    }
    const playerCard = document.createElement("div");
    playerCard.classList.add("player");
    const name = document.createElement("div");
    name.classList.add("name");
    name.textContent = player.name;
    const score = document.createElement("div");
    score.classList.add("score");
    score.textContent = memoryState.mode === "solo" ? memoryState.matchedPairs.size : player.score;
    playerCard.appendChild(name);
    playerCard.appendChild(score);
    memoryScoreboard.appendChild(playerCard);
  });
  highlightActivePlayer();
}

initPage();

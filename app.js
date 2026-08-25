let bpm = 90;
let isPlaying = false;
let currentStep = 0;
let timer = null;
let swing = 50;

let audioContext = null;

// Metrónomo independiente: no modifica ni elimina la Drum Machine.
let metronomePlaying = false;
let metronomeTimer = null;
let metronomeStep = 0;
let metronomeSubdivision = 1;
let metronomeAccent = true;

const bpmDisplay = document.getElementById("bpm");
const playButton = document.getElementById("playButton");
const grooveName = document.getElementById("grooveName");
const grooveDescription = document.getElementById("grooveDescription");
const sequencer = document.getElementById("sequencer");
const patternName = document.getElementById("patternName");

const metronomePlay = document.getElementById("metronomePlay");
const metronomeBpm = document.getElementById("metronomeBpm");
const metronomeStatus = document.getElementById("metronomeStatus");
const metroBeats = [
    document.getElementById("metroBeat1"),
    document.getElementById("metroBeat2"),
    document.getElementById("metroBeat3"),
    document.getElementById("metroBeat4")
];

const beats = [
    document.getElementById("beat1"),
    document.getElementById("beat2"),
    document.getElementById("beat3"),
    document.getElementById("beat4")
];

const grooveData = {
    FUNK: "Groove para practicar precisión y notas muertas.",
    ROCK: "Groove sólido para trabajar pulso y consistencia.",
    "R&B": "Groove relajado para practicar pocket y dinámica.",
    LATIN: "Groove para trabajar subdivisiones y coordinación."
};

/*
    Cada patrón tiene 16 pasos.
    0 = apagado
    1 = encendido

    La cuadrícula es:
    1 e & a 2 e & a 3 e & a 4 e & a
*/

const patterns = {
    funk: {
        name: "Funk 1",
        kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,0,0],
        snare: [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
        hihat: [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,1]
    },

    rock: {
        name: "Rock",
        kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
    },

    rb: {
        name: "R&B",
        kick:  [1,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,1,0],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
    },

    latin: {
        name: "Latin",
        kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
        snare: [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
        hihat: [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]
    }
};

let currentPattern = "funk";

function getAudioContext() {
    if (!audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) {
            alert("Tu navegador no soporta Web Audio API.");
            return null;
        }

        audioContext = new AudioContext();
    }

    return audioContext;
}

function playKick(time) {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(140, time);
    oscillator.frequency.exponentialRampToValueAtTime(55, time + 0.12);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.15);
}

function playSnare(time) {
    const context = getAudioContext();
    if (!context) return;

    const bufferSize = context.sampleRate * 0.12;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1200;

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    noise.start(time);
    noise.stop(time + 0.13);
}

function playHiHat(time) {
    const context = getAudioContext();
    if (!context) return;

    const bufferSize = context.sampleRate * 0.045;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 5500;

    gain.gain.setValueAtTime(0.13, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    noise.start(time);
    noise.stop(time + 0.05);
}

function playMetronomeClick(time, accent = false) {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(accent ? 1500 : 1000, time);

    gain.gain.setValueAtTime(accent ? 0.28 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.06);
}

function updateMetronomeVisual() {
    metroBeats.forEach((beat) => beat.classList.remove("active"));

    const quarterBeat = Math.floor(metronomeStep / metronomeSubdivision) % 4;
    metroBeats[quarterBeat].classList.add("active");
}

function getMetronomeInterval() {
    return (60000 / bpm) / metronomeSubdivision;
}

function playMetronomeStep() {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
        context.resume();
    }

    const isQuarterBeat = metronomeStep % metronomeSubdivision === 0;
    const quarterBeat = Math.floor(metronomeStep / metronomeSubdivision) % 4;
    const accent = metronomeAccent && quarterBeat === 0 && isQuarterBeat;

    playMetronomeClick(context.currentTime, accent);
    updateMetronomeVisual();

    metronomeStep = (metronomeStep + 1) % (4 * metronomeSubdivision);
}

function scheduleMetronomeStep() {
    if (!metronomePlaying) return;

    metronomeTimer = setTimeout(() => {
        playMetronomeStep();
        scheduleMetronomeStep();
    }, getMetronomeInterval());
}

function startMetronome() {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
        context.resume();
    }

    clearTimeout(metronomeTimer);
    metronomePlaying = true;
    metronomeStep = 0;

    metronomePlay.textContent = "■";
    metronomePlay.setAttribute("aria-label", "Detener metrónomo");
    metronomeStatus.textContent = "ACTIVO";

    playMetronomeStep();
    scheduleMetronomeStep();
}

function stopMetronome() {
    metronomePlaying = false;
    clearTimeout(metronomeTimer);
    metronomeTimer = null;
    metronomeStep = 0;

    metronomePlay.textContent = "▶";
    metronomePlay.setAttribute("aria-label", "Iniciar metrónomo");
    metronomeStatus.textContent = "DETENIDO";

    metroBeats.forEach((beat) => beat.classList.remove("active"));
    metroBeats[0].classList.add("active");
}

function renderSequencer() {
    sequencer.innerHTML = "";

    const numberLabel = document.createElement("div");
    numberLabel.className = "row-label";
    numberLabel.textContent = "PASO";
    sequencer.appendChild(numberLabel);

    for (let i = 0; i < 16; i++) {
        const number = document.createElement("div");
        number.className = "step-number";
        number.textContent = i + 1;
        sequencer.appendChild(number);
    }

    const rows = [
        ["KICK", "kick"],
        ["SNARE", "snare"],
        ["HI-HAT", "hihat"]
    ];

    rows.forEach(([label, instrument]) => {
        const rowLabel = document.createElement("div");
        rowLabel.className = "row-label";
        rowLabel.textContent = label;
        sequencer.appendChild(rowLabel);

        patterns[currentPattern][instrument].forEach((active, index) => {
            const cell = document.createElement("button");

            cell.className = "step";
            cell.dataset.instrument = instrument;
            cell.dataset.step = index;
            cell.setAttribute("aria-label", `${label}, paso ${index + 1}`);

            if (active) {
                cell.classList.add(`active-${instrument}`);
            }

            cell.addEventListener("click", () => {
                patterns[currentPattern][instrument][index] =
                    patterns[currentPattern][instrument][index] ? 0 : 1;

                renderSequencer();
            });

            sequencer.appendChild(cell);
        });
    });
}

function updateCurrentStepVisual() {
    document.querySelectorAll(".step").forEach((cell) => {
        cell.classList.remove("current");

        if (Number(cell.dataset.step) === currentStep) {
            cell.classList.add("current");
        }
    });

    const beat = Math.floor(currentStep / 4);

    beats.forEach((item) => item.classList.remove("active"));
    beats[beat].classList.add("active");
}

function playStep() {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
        context.resume();
    }

    const pattern = patterns[currentPattern];

    if (pattern.kick[currentStep]) {
        playKick(context.currentTime);
    }

    if (pattern.snare[currentStep]) {
        playSnare(context.currentTime);
    }

    if (pattern.hihat[currentStep]) {
        playHiHat(context.currentTime);
    }

    updateCurrentStepVisual();

    currentStep = (currentStep + 1) % 16;
}

function getStepInterval() {
    // 16 pasos = semicorcheas.
    // Una negra dura 60000 / BPM.
    return (60000 / bpm) / 4;
}

function scheduleNextStep() {
    if (!isPlaying) return;

    const baseInterval = getStepInterval();

    // Swing simple:
    // Los pasos pares se adelantan y los impares se retrasan.
    let interval = baseInterval;

    if (swing > 50) {
        const swingAmount = (swing - 50) / 100;

        if (currentStep % 2 === 0) {
            interval = baseInterval * (1 - swingAmount);
        } else {
            interval = baseInterval * (1 + swingAmount);
        }
    }

    timer = setTimeout(() => {
        playStep();
        scheduleNextStep();
    }, interval);
}

function startMachine() {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
        context.resume();
    }

    isPlaying = true;
    currentStep = 0;

    playButton.textContent = "■";
    playButton.setAttribute("aria-label", "Detener");

    playStep();
    scheduleNextStep();
}

function stopMachine() {
    isPlaying = false;

    clearTimeout(timer);
    timer = null;

    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "Reproducir");

    currentStep = 0;

    document.querySelectorAll(".step").forEach((cell) => {
        cell.classList.remove("current");
    });

    beats.forEach((beat) => beat.classList.remove("active"));
    beats[0].classList.add("active");
}

function restartIfPlaying() {
    if (isPlaying) {
        stopMachine();
        startMachine();
    }
}

function updateBpm(newBpm) {
    bpm = Math.max(40, Math.min(240, newBpm));
    bpmDisplay.textContent = bpm;
    metronomeBpm.textContent = bpm;
    restartIfPlaying();

    if (metronomePlaying) {
        clearTimeout(metronomeTimer);
        scheduleMetronomeStep();
    }
}

// PLAY / STOP

playButton.addEventListener("click", () => {
    if (isPlaying) {
        stopMachine();
    } else {
        startMachine();
    }
});

// BPM

document.getElementById("minusBpm").addEventListener("click", () => {
    updateBpm(bpm - 5);
});

document.getElementById("plusBpm").addEventListener("click", () => {
    updateBpm(bpm + 5);
});

document.querySelectorAll("[data-tempo]").forEach((button) => {
    button.addEventListener("click", () => {
        updateBpm(Number(button.dataset.tempo));
    });
});

// SWING

document.getElementById("swing").addEventListener("input", (event) => {
    swing = Number(event.target.value);
    document.getElementById("swingValue").textContent = `${swing}%`;
});

// PATRONES

document.querySelectorAll(".pattern-button").forEach((button) => {
    button.addEventListener("click", () => {
        currentPattern = button.dataset.pattern;
        patternName.textContent = patterns[currentPattern].name;

        document.querySelectorAll(".pattern-button").forEach((item) => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        renderSequencer();
    });
});

// METRÓNOMO

metronomePlay.addEventListener("click", () => {
    if (metronomePlaying) {
        stopMetronome();
    } else {
        startMetronome();
    }
});

document.getElementById("metronomeMinus").addEventListener("click", () => {
    updateBpm(bpm - 5);
});

document.getElementById("metronomePlus").addEventListener("click", () => {
    updateBpm(bpm + 5);
});

document.getElementById("metroSubdivision").addEventListener("change", (event) => {
    metronomeSubdivision = Number(event.target.value);

    if (metronomePlaying) {
        clearTimeout(metronomeTimer);
        metronomeStep = 0;
        playMetronomeStep();
        scheduleMetronomeStep();
    }
});

document.getElementById("metroAccent").addEventListener("change", (event) => {
    metronomeAccent = event.target.checked;
});

// GROOVES

document.querySelectorAll(".groove-button").forEach((button) => {
    button.addEventListener("click", () => {
        const groove = button.dataset.groove;

        grooveName.textContent = groove;
        grooveDescription.textContent = grooveData[groove];

        document.querySelectorAll(".groove-button").forEach((item) => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        const matchingPattern = {
            FUNK: "funk",
            ROCK: "rock",
            "R&B": "rb",
            LATIN: "latin"
        }[groove];

        if (matchingPattern) {
            currentPattern = matchingPattern;
            patternName.textContent = patterns[currentPattern].name;

            document.querySelectorAll(".pattern-button").forEach((item) => {
                item.classList.toggle(
                    "selected",
                    item.dataset.pattern === currentPattern
                );
            });

            renderSequencer();
        }
    });
});

// EJERCICIO

document.getElementById("practiceButton").addEventListener("click", () => {
    alert(
        "EJERCICIO: NOTAS MUERTAS\n\n" +
        "1. Empieza a 60 BPM.\n" +
        "2. Toca una nota muerta por cada pulso.\n" +
        "3. Mantén el groove sin acelerar.\n" +
        "4. Sube 5 BPM cuando tengas precisión.\n\n" +
        "Objetivo: tocar relajado y dentro del pulso."
    );
});

window.addEventListener("beforeunload", () => {
    clearTimeout(timer);
    clearTimeout(metronomeTimer);
});

// Inicializar
renderSequencer();

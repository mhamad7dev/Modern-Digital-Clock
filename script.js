"use strict";

/* ========================================
    Digital Clock Engine & Features
  ======================================== */

const clockElements = {
    time: document.querySelector("#clock-time"),
    period: document.querySelector("#clock-period"),
    date: document.querySelector("#clock-date"),
    day: document.querySelector("#clock-day"),
    timezone: document.querySelector("#clock-timezone"),
    formatButtons: document.querySelectorAll("[data-format]"),
    secondsRing: document.querySelector("#seconds-ring"),
    secondsVal: document.querySelector("#seconds-val"),
    btnFullscreen: document.querySelector("#btn-fullscreen"),
    btnAudio: document.querySelector("#btn-audio"),
    iconAudio: document.querySelector("#icon-audio")
};

const clockState = {
    format: 12,
    timerId: null,
    soundEnabled: false,
    theme: 'cyan'
};

const dateFormatters = {
    date: new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }),
    day: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
    }),
    timeZone: new Intl.DateTimeFormat("en-US", {
        timeZoneName: "short",
    }),
};

// Web Audio API for synthetic Futuristic Ticking sound
let audioCtx = null;
function playTickSound() {
    if (!clockState.soundEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {
        console.error("Audio block", e);
    }
}

/**
 * Returns a two-digit padded number.
 */
function padNumber(value) {
    return String(value).padStart(2, "0");
}

/**
 * Updates the active UI state of format toggles.
 */
function updateFormatButtons() {
    clockElements.formatButtons.forEach((button) => {
        const isActive = Number(button.dataset.format) === clockState.format;
        button.classList.toggle("btn-glow-active", isActive);
        if(!isActive) {
            button.classList.remove("text-white");
            button.classList.add("text-slate-400");
        } else {
            button.classList.remove("text-slate-400");
        }
        button.setAttribute("aria-pressed", String(isActive));
    });
}

/**
 * Updates displayed time, ring progress, and date info.
 */
function updateClock() {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const is12Hour = clockState.format === 12;
    const displayedHours = is12Hour ? hours % 12 || 12 : hours;

    clockElements.time.innerHTML = `${padNumber(displayedHours)}<span class="pulse-dots">:</span>${padNumber(minutes)}<span class="pulse-dots">:</span>${padNumber(seconds)}`;

    clockElements.period.textContent = hours >= 12 ? "PM" : "AM";
    clockElements.period.style.display = is12Hour ? "inline-block" : "none";

    clockElements.date.textContent = dateFormatters.date.format(now);
    clockElements.day.textContent = dateFormatters.day.format(now);

    clockElements.timezone.textContent =
        dateFormatters.timeZone
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? "Local time";

    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (seconds / 60) * circumference;
    if(clockElements.secondsRing) {
        clockElements.secondsRing.style.strokeDashoffset = offset;
    }
    if(clockElements.secondsVal) {
        clockElements.secondsVal.textContent = padNumber(seconds);
    }

    playTickSound();
}

function setClockFormat(format) {
    if (format !== 12 && format !== 24) return;
    clockState.format = format;
    updateFormatButtons();
    updateClock();
}

function setTheme(themeName) {
    clockState.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.themeName === themeName) {
            btn.classList.add('ring-2', 'ring-offset-2', 'ring-offset-slate-950', 'opacity-100');
            btn.classList.remove('opacity-60');
        } else {
            btn.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-slate-950', 'opacity-100');
            btn.classList.add('opacity-60');
        }
    });
}

/* Modes Switcher (Clock vs Stopwatch vs Timer) */
const modeClockBtn = document.querySelector('#mode-clock');
const modeStopwatchBtn = document.querySelector('#mode-stopwatch');
const modeTimerBtn = document.querySelector('#mode-timer');

const panelClock = document.querySelector('#panel-clock');
const panelStopwatch = document.querySelector('#panel-stopwatch');
const panelTimer = document.querySelector('#panel-timer');

modeClockBtn.addEventListener('click', () => {
    panelClock.classList.remove('hidden');
    panelClock.classList.add('flex');
    panelStopwatch.classList.add('hidden');
    panelStopwatch.classList.remove('flex');
    panelTimer.classList.add('hidden');
    panelTimer.classList.remove('flex');

    modeClockBtn.classList.add('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeClockBtn.classList.remove('text-slate-400');
    modeStopwatchBtn.classList.remove('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeStopwatchBtn.classList.add('text-slate-400');
    modeTimerBtn.classList.remove('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeTimerBtn.classList.add('text-slate-400');
});

modeStopwatchBtn.addEventListener('click', () => {
    panelStopwatch.classList.remove('hidden');
    panelStopwatch.classList.add('flex');
    panelClock.classList.add('hidden');
    panelClock.classList.remove('flex');
    panelTimer.classList.add('hidden');
    panelTimer.classList.remove('flex');

    modeStopwatchBtn.classList.add('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeStopwatchBtn.classList.remove('text-slate-400');
    modeClockBtn.classList.remove('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeClockBtn.classList.add('text-slate-400');
    modeTimerBtn.classList.remove('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeTimerBtn.classList.add('text-slate-400');
});

modeTimerBtn.addEventListener('click', () => {
    panelTimer.classList.remove('hidden');
    panelTimer.classList.add('flex');
    panelClock.classList.add('hidden');
    panelClock.classList.remove('flex');
    panelStopwatch.classList.add('hidden');
    panelStopwatch.classList.remove('flex');

    modeTimerBtn.classList.add('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeTimerBtn.classList.remove('text-slate-400');
    modeClockBtn.classList.remove('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeClockBtn.classList.add('text-slate-400');
    modeStopwatchBtn.classList.remove('bg-white/10', 'text-white', 'border', 'border-white/10');
    modeStopwatchBtn.classList.add('text-slate-400');
});

/* Stopwatch Engine */
let swInterval = null;
let swElapsed = 0;
const swDisplay = document.querySelector('#sw-display');
const swStartBtn = document.querySelector('#sw-start');
const swResetBtn = document.querySelector('#sw-reset');

function formatStopwatch(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${padNumber(mins)}:${padNumber(secs)}.${padNumber(hundredths)}`;
}

swStartBtn.addEventListener('click', () => {
    if (swInterval) {
        clearInterval(swInterval);
        swInterval = null;
        swStartBtn.textContent = 'Start';
    } else {
        const startTime = Date.now() - swElapsed;
        swInterval = setInterval(() => {
            swElapsed = Date.now() - startTime;
            swDisplay.textContent = formatStopwatch(swElapsed);
        }, 10);
        swStartBtn.textContent = 'Pause';
    }
});

swResetBtn.addEventListener('click', () => {
    clearInterval(swInterval);
    swInterval = null;
    swElapsed = 0;
    swDisplay.textContent = '00:00.00';
    swStartBtn.textContent = 'Start';
});

/* Timer Engine */
let timerInterval = null;
let alarmInterval = null;
let totalSecondsRemaining = 0;
let isTimerRunning = false;
let isAlarmRinging = false;

const timerInputWrap = document.querySelector('#timer-input-wrap');
const timerDisplay = document.querySelector('#timer-display');
const timerInputHours = document.querySelector('#timer-input-hours');
const timerInputMins = document.querySelector('#timer-input-mins');
const timerInputSecs = document.querySelector('#timer-input-secs');
const timerStartBtn = document.querySelector('#timer-start');
const timerResetBtn = document.querySelector('#timer-reset');

function startContinuousAlarm() {
    if (isAlarmRinging) return;
    isAlarmRinging = true;
    playSingleBeep();
    alarmInterval = setInterval(() => {
        playSingleBeep();
    }, 1000);
}

function playSingleBeep() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
        console.error("Alarm error", e);
    }
}

function stopContinuousAlarm() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
    isAlarmRinging = false;
}

function formatTimer(totalSecs) {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${padNumber(hours)}:${padNumber(mins)}:${padNumber(secs)}`;
}

timerStartBtn.addEventListener('click', () => {
    if (isAlarmRinging) {
        stopContinuousAlarm();
        timerStartBtn.textContent = 'Start';
        timerDisplay.classList.add('hidden');
        timerInputWrap.classList.remove('hidden');
        timerDisplay.textContent = '00:00:00';
        return;
    }

    if (isTimerRunning) {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        timerStartBtn.textContent = 'Resume';
    } else {
        if (!timerInterval && totalSecondsRemaining === 0) {
            const hours = parseInt(timerInputHours.value) || 0;
            const mins = parseInt(timerInputMins.value) || 0;
            const secs = parseInt(timerInputSecs.value) || 0;
            
            totalSecondsRemaining = (hours * 3600) + (mins * 60) + secs;

            if (totalSecondsRemaining <= 0) return;

            timerInputWrap.classList.add('hidden');
            timerDisplay.classList.remove('hidden');
            timerDisplay.textContent = formatTimer(totalSecondsRemaining);
        }

        isTimerRunning = true;
        timerStartBtn.textContent = 'Pause';

        timerInterval = setInterval(() => {
            if (totalSecondsRemaining > 0) {
                totalSecondsRemaining--;
                timerDisplay.textContent = formatTimer(totalSecondsRemaining);
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                isTimerRunning = false;
                timerStartBtn.textContent = 'Stop Alarm';
                startContinuousAlarm();
            }
        }, 1000);
    }
});

timerResetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    stopContinuousAlarm();
    isTimerRunning = false;
    totalSecondsRemaining = 0;
    timerStartBtn.textContent = 'Start';
    
    timerDisplay.classList.add('hidden');
    timerInputWrap.classList.remove('hidden');
    timerDisplay.textContent = '00:00:00';
});

/**
 * Initialization and Listeners setup
 */
function initClock() {
    clockElements.formatButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setClockFormat(Number(button.dataset.format));
        });
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.themeName));
    });

    clockElements.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen().catch(err => console.log(err));
        }
    });

    clockElements.btnAudio.addEventListener('click', () => {
        clockState.soundEnabled = !clockState.soundEnabled;
        if(clockState.soundEnabled) {
            clockElements.iconAudio.className = "fa-solid fa-volume-high text-sm text-teal-400";
        } else {
            clockElements.iconAudio.className = "fa-solid fa-volume-xmark text-sm";
        }
    });

    updateClock();

    const delay = 1000 - (Date.now() % 1000);
    clockState.timerId = window.setTimeout(function tick() {
        updateClock();
        clockState.timerId = window.setInterval(updateClock, 1000);
    }, delay);
}

function destroyClock() {
    window.clearTimeout(clockState.timerId);
    window.clearInterval(clockState.timerId);
}

document.addEventListener("DOMContentLoaded", initClock, { once: true });
window.addEventListener("pagehide", destroyClock);
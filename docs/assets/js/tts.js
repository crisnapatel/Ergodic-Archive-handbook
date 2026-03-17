/**
 * Ergodic Archive — Text-to-Speech
 * Uses the Web Speech API (no external deps, works offline, no API key).
 * Floating button: bottom-right corner of every page.
 */
(function () {
  if (!window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  let chunks = [];
  let currentChunk = 0;
  let isPlaying = false;
  let isPaused = false;
  let rate = 1.0;

  // ── Text extraction ───────────────────────────────────────────────────────
  function extractChunks() {
    const article = document.querySelector("article");
    if (!article) return [];

    const clone = article.cloneNode(true);

    // Strip elements that shouldn't be read aloud
    [
      "pre", "code", "script", "style", "svg",
      ".headerlink", ".md-source", ".tabbed-labels",
      ".admonition-title",
    ].forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // One utterance per block element — eliminates per-sentence startup gaps.
    // blockquote is intentionally excluded: its child <p> is already selected,
    // so including blockquote would read the definition twice.
    const chunks = [];
    clone
      .querySelectorAll("h1, h2, h3, h4, p, li, td")
      .forEach((el) => {
        // Skip elements that are descendants of already-queried block elements
        // (e.g. a <p> inside a <li> would otherwise be double-selected)
        if (el.closest("li") && el.tagName !== "LI") return;
        const text = el.textContent.replace(/\s+/g, " ").trim();
        if (text.length > 10) chunks.push(text);
      });

    return chunks;
  }

  // ── Playback ──────────────────────────────────────────────────────────────
  function speakChunk(index) {
    if (index >= chunks.length) { stop(); return; }

    const utt = new SpeechSynthesisUtterance(chunks[index]);
    utt.rate = rate;
    utt.pitch = 1.0;

    utt.onend = () => {
      if (!isPaused) { currentChunk++; speakChunk(currentChunk); }
    };
    utt.onerror = (e) => {
      // "interrupted" / "canceled" fire when we cancel intentionally — ignore them
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("TTS error:", e.error);
      }
    };

    synth.speak(utt);
  }

  function play() {
    if (isPaused) {
      // synth.pause() is unreliable on Linux/Chrome — we cancel and restart the
      // current chunk instead. Loses at most one sentence.
      isPaused = false;
      isPlaying = true;
      synth.cancel();
      speakChunk(currentChunk);
    } else {
      chunks = extractChunks();
      currentChunk = 0;
      synth.cancel();
      isPlaying = true;
      speakChunk(0);
    }
    updateUI();
  }

  function pause() {
    // Cancel is more reliable than synth.pause() across browsers on Linux.
    // currentChunk is already pointing at the chunk in progress, so resume
    // will restart from the beginning of that sentence.
    synth.cancel();
    isPlaying = false;
    isPaused = true;
    updateUI();
  }

  function stop() {
    synth.cancel();
    isPlaying = false;
    isPaused = false;
    currentChunk = 0;
    updateUI();
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  function createUI() {
    if (document.getElementById("tts-bar")) return;

    const bar = document.createElement("div");
    bar.id = "tts-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Text to speech controls");

    const playBtn = document.createElement("button");
    playBtn.id = "tts-play";
    playBtn.setAttribute("aria-label", "Listen to page");

    const stopBtn = document.createElement("button");
    stopBtn.id = "tts-stop";
    stopBtn.setAttribute("aria-label", "Stop");
    stopBtn.title = "Stop";
    stopBtn.textContent = "⏹";

    const label = document.createElement("span");
    label.id = "tts-label";

    const speedSelect = document.createElement("select");
    speedSelect.id = "tts-speed";
    speedSelect.setAttribute("aria-label", "Playback speed");
    [["0.8×", 0.8], ["1×", 1.0], ["1.2×", 1.2], ["1.5×", 1.5], ["2×", 2.0]].forEach(([text, val]) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = text;
      if (val === rate) opt.selected = true;
      speedSelect.appendChild(opt);
    });
    speedSelect.addEventListener("change", () => { rate = parseFloat(speedSelect.value); });

    playBtn.addEventListener("click", () => { isPlaying ? pause() : play(); });
    stopBtn.addEventListener("click", stop);

    bar.appendChild(playBtn);
    bar.appendChild(label);
    bar.appendChild(speedSelect);
    bar.appendChild(stopBtn);
    document.body.appendChild(bar);

    updateUI();
  }

  function updateUI() {
    const playBtn = document.getElementById("tts-play");
    const stopBtn = document.getElementById("tts-stop");
    const label   = document.getElementById("tts-label");
    if (!playBtn) return;

    if (isPlaying) {
      playBtn.textContent = "⏸";
      playBtn.title = "Pause";
      label.textContent = "Pause";
      stopBtn.style.display = "inline-flex";
    } else if (isPaused) {
      playBtn.textContent = "▶";
      playBtn.title = "Resume";
      label.textContent = "Resume";
      stopBtn.style.display = "inline-flex";
    } else {
      playBtn.textContent = "🔊";
      playBtn.title = "Listen to page";
      label.textContent = "Listen";
      stopBtn.style.display = "none";
    }
  }

  // Stop when the page becomes hidden (switching tabs, etc.)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });

  // MkDocs instant navigation fires this event on page switch
  document.addEventListener("DOMContentSwitch", () => {
    stop();
    if (!document.getElementById("tts-bar")) createUI();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();

(() => {
  const canvas = document.getElementById('canvas');
  const overlayEl = document.getElementById('overlay');
  const progressBar = document.getElementById('progressBar');
  const generateBtn = document.getElementById('generate');
  const stopBtn = document.getElementById('stop');
  const downloadBtn = document.getElementById('download');
  const statusEl = document.getElementById('status');
  const tagsInput = document.getElementById('tags');
  const durationInput = document.getElementById('duration');
  const promptInput = document.getElementById('prompt');
  const useAICheck = document.getElementById('useAI');
  const keyInput = document.getElementById('openaiKey');
  const modelSelect = document.getElementById('openaiModel');
  const useXI = document.getElementById('use11');
  const xiKeyInput = document.getElementById('xiKey');
  const xiVoiceInput = document.getElementById('xiVoice');

  if (!canvas) return; // Not on studio page

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  let rafId = 0;
  let startMs = 0;
  let recording = false;
  let plannedCaptions = [];
  let mediaRecorder = null;
  let chunks = [];
  let plannedDuration = 10;
  let audioContext = null;
  let narrationSource = null;
  let narrationEndTimer = null;
  let lastBlobUrl = null;

  function getAudioContext() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') { try { audioContext.resume(); } catch (_) {} }
    return audioContext;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || '';
  }

  // Load persisted settings on startup
  (function loadPersisted() {
    try {
      if (keyInput) keyInput.value = localStorage.getItem('openai_key') || '';
      if (modelSelect) modelSelect.value = localStorage.getItem('openai_model') || (modelSelect.value || 'gpt-4o-mini');
      if (useAICheck) useAICheck.checked = (localStorage.getItem('use_ai') === '1');
      if (promptInput) promptInput.value = localStorage.getItem('ai_prompt') || '';

      if (xiKeyInput) xiKeyInput.value = localStorage.getItem('xi_key') || '';
      if (xiVoiceInput) xiVoiceInput.value = localStorage.getItem('xi_voice') || (xiVoiceInput.value || '21m00Tcm4TlvDq8ikWAM');
      if (useXI) useXI.checked = (localStorage.getItem('use_xi') === '1');
    } catch (_) {}
  })();

  // Persist settings on change
  function bindPersist(el, event, key, transform) {
    if (!el) return;
    el.addEventListener(event, () => {
      try { localStorage.setItem(key, transform ? transform(el) : el.value); } catch (_) {}
    });
  }
  bindPersist(keyInput, 'input', 'openai_key');
  bindPersist(modelSelect, 'change', 'openai_model');
  if (useAICheck) useAICheck.addEventListener('change', () => { try { localStorage.setItem('use_ai', useAICheck.checked ? '1' : '0'); } catch (_) {} });
  bindPersist(promptInput, 'input', 'ai_prompt');

  bindPersist(xiKeyInput, 'input', 'xi_key');
  bindPersist(xiVoiceInput, 'input', 'xi_voice');
  if (useXI) useXI.addEventListener('change', () => { try { localStorage.setItem('use_xi', useXI.checked ? '1' : '0'); } catch (_) {} });

  // Simple animated background (soft orbs)
  const orbs = Array.from({ length: 12 }).map((_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 80 + Math.random() * 120,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    hue: Math.floor(Math.random() * 360)
  }));

  function drawBackground(dt) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0b12';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    orbs.forEach((o) => {
      o.x += o.vx * dt * 0.06;
      o.y += o.vy * dt * 0.06;
      if (o.x < -o.r) o.x = width + o.r;
      if (o.x > width + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = height + o.r;
      if (o.y > height + o.r) o.y = -o.r;

      const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grd.addColorStop(0, `hsla(${o.hue}, 80%, 60%, 0.9)`);
      grd.addColorStop(1, `hsla(${(o.hue + 40) % 360}, 80%, 50%, 0.05)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function currentTimeSec() {
    return (performance.now() - startMs) / 1000;
  }

  function renderOverlay(timeSec) {
    // Update progress
    if (progressBar && plannedDuration > 0) {
      const pct = Math.max(0, Math.min(1, timeSec / plannedDuration));
      progressBar.style.width = (pct * 100).toFixed(2) + '%';
    }

    // Caption
    const span = document.createElement('div');
    span.className = 'caption';
    let line = '';
    for (let i = 0; i < plannedCaptions.length; i++) {
      const c = plannedCaptions[i];
      if (timeSec >= c.start && timeSec < c.end) { line = c.text; break; }
    }
    span.textContent = line;
    overlayEl.innerHTML = '';
    overlayEl.appendChild(span);
  }

  function loop() {
    const t = currentTimeSec();
    drawBackground(16);
    renderOverlay(t);
    rafId = requestAnimationFrame(loop);
  }

  // Very small story generator
  function generateStoryLines(tags) {
    const seed = (tags || 'curiosity, discovery, science').split(',').map(s => s.trim()).filter(Boolean);
    const topic = seed[0] || 'curiosity';
    const nowY = new Date().getFullYear();
    return [
      `A quick scroll about ${topic}...`,
      `Did you know the year is ${nowY}?`,
      `Small facts can spark big ideas.`,
      `Keep exploring ${topic}!`
    ];
  }

  async function fetchAIStoryLines({ prompt, tags, apiKey, model }) {
    const sys = 'You write very short, factual, verifiable mini-stories (3-5 sentences), optimized for subtitles.';
    const user = prompt && prompt.trim().length > 2
      ? `${prompt}\n\nTags: ${tags || ''}`
      : `Write a concise, factual mini-story using these tags: ${tags || ''}. Use 3-5 short sentences.`;
    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ],
      temperature: 0.7,
      max_tokens: 220
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('OpenAI request failed');
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const lines = text
      .split(/\n+/)
      .map(s => s.replace(/^[-•\d\.\)\s]+/, '').trim())
      .filter(Boolean);
    // Ensure 3-5 lines
    if (lines.length >= 3) return lines.slice(0, 5);
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    return (sentences.length ? sentences : [text]).slice(0, 5);
  }

  function planCaptionsFromLines(lines, totalSec) {
    const minSec = 1.2;
    const n = Math.max(1, lines.length);
    const base = Math.max(minSec, totalSec / n);
    const caps = [];
    let cursor = 0;
    for (let i = 0; i < n; i++) {
      const dur = i === n - 1 ? (totalSec - cursor) : base;
      caps.push({ text: lines[i], start: cursor, end: cursor + dur });
      cursor += dur;
    }
    if (caps.length) caps[caps.length - 1].end = totalSec;
    return caps;
  }

  function startRecording(totalSec, audioTrack) {
    const canvasStream = canvas.captureStream(30);
    let stream = canvasStream;
    if (audioTrack) {
      stream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        audioTrack
      ]);
    }
    chunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      if (lastBlobUrl) { try { URL.revokeObjectURL(lastBlobUrl); } catch (_) {} }
      lastBlobUrl = URL.createObjectURL(blob);
      downloadBtn.href = lastBlobUrl;
      downloadBtn.setAttribute('download', 'autoshort.webm');
      downloadBtn.removeAttribute('disabled');
      downloadBtn.setAttribute('aria-disabled', 'false');
      setStatus('Ready to download.');
    };
    mediaRecorder.start();
    setTimeout(() => { try { mediaRecorder && mediaRecorder.stop(); } catch (_) {} }, totalSec * 1000 + 200);
  }

  async function fetchElevenLabsTTS({ text, voiceId, apiKey }) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId || '21m00Tcm4TlvDq8ikWAM')}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.7 }
      })
    });
    if (!res.ok) throw new Error('ElevenLabs TTS failed');
    const buf = await res.arrayBuffer();
    const ctx = getAudioContext();
    const audioBuffer = await ctx.decodeAudioData(buf);
    return audioBuffer;
  }

  function disableDuringGenerate(disabled) {
    generateBtn.disabled = disabled;
    stopBtn.disabled = !disabled;
    downloadBtn.disabled = true;
    downloadBtn.setAttribute('aria-disabled', 'true');
  }

  // Force-download handler (covers Safari on anchor click)
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      if (!lastBlobUrl) return;
      try {
        const a = document.createElement('a');
        a.href = lastBlobUrl;
        a.download = 'autoshort.webm';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (_) {}
    });
  }

  async function startGenerate() {
    const tags = (tagsInput && tagsInput.value) || '';
    plannedDuration = Math.max(3, Math.min(60, parseInt(durationInput.value || '12', 10)));
    setStatus('Generating...');
    disableDuringGenerate(true);
    startMs = performance.now();

    // Persist inputs
    try {
      if (keyInput && keyInput.value) localStorage.setItem('openai_key', keyInput.value);
      if (modelSelect) localStorage.setItem('openai_model', modelSelect.value || 'gpt-4o-mini');
      if (useAICheck) localStorage.setItem('use_ai', useAICheck.checked ? '1' : '0');
      if (promptInput) localStorage.setItem('ai_prompt', promptInput.value || '');
      if (xiKeyInput && xiKeyInput.value) localStorage.setItem('xi_key', xiKeyInput.value);
      if (xiVoiceInput && xiVoiceInput.value) localStorage.setItem('xi_voice', xiVoiceInput.value);
      if (useXI) localStorage.setItem('use_xi', useXI.checked ? '1' : '0');
    } catch (_) {}

    // Load persisted values on first run
    try {
      if (keyInput && !keyInput.value) keyInput.value = localStorage.getItem('openai_key') || '';
      if (modelSelect && !modelSelect.value) modelSelect.value = localStorage.getItem('openai_model') || 'gpt-4o-mini';
      if (useAICheck && useAICheck.checked === false) useAICheck.checked = (localStorage.getItem('use_ai') === '1');
      if (promptInput && !promptInput.value) promptInput.value = localStorage.getItem('ai_prompt') || '';
    } catch (_) {}

    let lines = [];
    const wantAI = useAICheck && useAICheck.checked;
    const apiKey = keyInput && keyInput.value;
    const model = modelSelect && modelSelect.value;
    const prompt = promptInput && promptInput.value;

    if (wantAI) {
      try {
        if (!apiKey) throw new Error('Missing API key');
        lines = await fetchAIStoryLines({ prompt, tags, apiKey, model });
      } catch (err) {
        console.warn('AI generation failed, falling back to local:', err);
        lines = generateStoryLines(tags);
      }
    } else {
      lines = generateStoryLines(tags);
    }

    // ElevenLabs path
    const wantXI = useXI && useXI.checked;
    const xiKey = xiKeyInput && xiKeyInput.value;
    const xiVoice = xiVoiceInput && xiVoiceInput.value;

    if (wantXI && xiKey) {
      try {
        const textForTTS = lines.join(' ');
        const audioBuf = await fetchElevenLabsTTS({ text: textForTTS, voiceId: xiVoice || '21m00Tcm4TlvDq8ikWAM', apiKey: xiKey });
        const ctx = getAudioContext();
        const dest = ctx.createMediaStreamDestination();
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        narrationSource = ctx.createBufferSource();
        narrationSource.buffer = audioBuf;
        narrationSource.connect(gain);
        gain.connect(dest);
        // Also monitor locally
        gain.connect(ctx.destination);

        plannedDuration = Math.max(plannedDuration, Math.ceil(audioBuf.duration + 0.25));
        plannedCaptions = planCaptionsFromLines(lines, plannedDuration);

        // Start recording when AudioContext is running and narration can start
        await ctx.resume();
        const audioTrack = dest.stream.getAudioTracks()[0];
        recording = true;
        setStatus('Narration ready. Recording...');
        requestAnimationFrame(() => {
          startRecording(plannedDuration, audioTrack);
          try { narrationSource.start(0); } catch (_) {}
        });
        // Safety stop in case onended doesn't fire
        if (narrationEndTimer) clearTimeout(narrationEndTimer);
        narrationEndTimer = setTimeout(() => {
          try { mediaRecorder && mediaRecorder.stop(); } catch (_) {}
        }, plannedDuration * 1000 + 150);

        narrationSource.onended = () => {
          // No-op; recorder stops via timer above
        };
        return;
      } catch (e) {
        console.warn('ElevenLabs failed, falling back to silent video:', e);
      }
    }

    // Fallback: no audio
    plannedCaptions = planCaptionsFromLines(lines, plannedDuration);
    recording = true;
    startRecording(plannedDuration);
  }

  function stopGenerate() {
    try { mediaRecorder && mediaRecorder.stop(); } catch (_) {}
    recording = false;
    disableDuringGenerate(false);
    setStatus('Stopped.');
  }

  // Bind
  if (generateBtn) generateBtn.addEventListener('click', startGenerate);
  if (stopBtn) stopBtn.addEventListener('click', stopGenerate);

  // Cancel any system speech if tab hidden (safety)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (document.hidden && narrationSource) {
      try { narrationSource.stop(); } catch (_) {}
    }
  });

  // Kick off render loop
  startMs = performance.now();
  loop();
})();



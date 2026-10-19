(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const titles = { anxious: '把「来不及」放慢一点', sad: '想念也会有温柔的回声', angry: '让心里的雷，慢慢散去', tired: '今天的你，可以先休息', calm: '此刻，什么都不用赶' };
  let current = null, state = 'idle', busy = false, frame = 0, generation = 0, playRequest = 0;
  let observedContext = null, analysisController = null, preparedCard = null, shareRequest = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const analysisCache = new Map();
  function notify(message, error = false) { $('message').textContent = message; $('message').classList.toggle('error', error); }
  function formatTime(time) { time = Math.max(0, Math.floor(time)); return String(Math.floor(time / 60)).padStart(2, '0') + ':' + String(time % 60).padStart(2, '0'); }
  function renderInstrument() {
    if (!current) return;
    const config=current.events.meta.config, instrument=$('sound-mode').value==='legacy'?config.legacyInstrument:config.instrument;
    $('track-description').textContent=`${config.name} · ${instrument} · ${Math.round(current.events.meta.bars[0].bpm)} BPM 起 · ${config.beatsPerBar}/4 拍`;
  }
  function renderAnalysis(analysis, selected) {
    const manual = selected !== 'auto', ai = !manual && analysis.source === 'ai';
    $('emotion-badge').textContent = Emotion.LABELS[analysis.emotion] + ' · ' + analysis.intensity + '/5' + (ai ? ' · AI 识别' : manual ? ' · 手动' : '');
    let reason = $('emotion-reason');
    if (!reason) {
      reason = document.createElement('p'); reason.id = 'emotion-reason'; reason.className = 'track-description';
      reason.style.overflowWrap = 'anywhere'; reason.setAttribute('aria-live', 'polite');
      $('track-description').after(reason);
    }
    reason.textContent = manual ? '按你选择的心情编曲。' : analysis.keywords.length ? '识别到：' + analysis.keywords.slice(0, 8).join('、') : ai ? 'AI 根据整句判断了你的心情。' : '没有找到明确的情绪线索。';
    if (!manual && !ai && analysis.confidence < Emotion.AI_THRESHOLD) reason.textContent += ' 我不太确定，你可以手动选一下心情。';
  }
  function setState(next) {
    state = next; $('cassette').classList.toggle('playing', next === 'playing');
    $('tape-caption').textContent = ({ idle: '把今天，轻轻倒带。', ready: '心事已收录，随时可以听。', loading: '正在准备乐器…', playing: '心事已收录，温柔播放中。', paused: '按下暂停，也是一种节奏。', ended: '这一首，轻轻落地了。' })[next];
    $('player-state').textContent = ({ idle: 'STANDBY', ready: 'READY', loading:'LOADING', playing: 'NOW PLAYING', paused: 'PAUSED', ended: 'SIDE A / END' })[next];
    $('play').textContent = next === 'playing' ? 'Ⅱ' : '▶'; $('play').setAttribute('aria-label', next === 'playing' ? '暂停旋律' : next === 'paused' ? '继续播放' : '播放旋律');
    $('play').disabled = !current || busy || next === 'loading'; $('stop').disabled = !current || !['playing', 'paused','loading'].includes(next);
    $('sample-progress').hidden = next !== 'loading';
    document.querySelector('.player-panel').classList.toggle('brewing', busy || next === 'loading');
  }
  function drawWave(progress = 0) {
    const canvas = $('waveform'), ratio = Math.min(window.devicePixelRatio || 1, 2), width = canvas.clientWidth, height = 48;
    if (canvas.width !== Math.round(width * ratio)) { canvas.width = Math.round(width * ratio); canvas.height = height * ratio; }
    const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
    const count = Math.floor(width / 7), source = current?.melody || [];
    if (current && current.waveBins?.length !== count) {
      current.waveBins = Array.from({ length: count }, (_, i) => {
        const start = i / count * current.events.meta.duration, end = (i + 1) / count * current.events.meta.duration;
        return source.reduce((peak, event) => event.time < end && event.time + event.duration > start ? Math.max(peak, event.velocity) : peak, 0);
      });
    }
    const position = progress * (current?.events.meta.duration || 0);
    const active = source.some(event => event.time <= position && position < event.time + event.duration);
    const closing = current ? Math.max(0, (position - current.events.meta.musicalDuration) / Music.MIX.tailSeconds) : 0;
    const collapse = reducedMotion ? (progress === 1 ? 1 : 0) : Math.min(1, closing);
    for (let i = 0; i < count; i++) {
      const strength = current ? current.waveBins[i] : .25;
      const isCurrent = active && Math.abs(i / count - progress) < 1 / count;
      const barHeight = 4 + (1 - collapse) * ((current ? 38 : 21) * strength + (isCurrent ? 7 : 0));
      const x = i * 7 * (1 - collapse) + (width / 2 - 2) * collapse;
      ctx.fillStyle = isCurrent ? '#fff1b0' : i / count < progress ? '#f0c93e' : current ? '#9e80cd' : '#625373';
      ctx.fillRect(x, (height - barHeight) / 2, 3, barHeight);
    }
  }
  function renderProgress(position = 0) {
    const duration = current?.events.meta.duration || 0, progress = duration ? Math.min(1, position / duration) : 0;
    $('time').textContent = `${formatTime(position)} / ${formatTime(duration)}`; $('progress-fill').style.width = progress * 100 + '%'; $('progress').setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    const bars = current?.events.meta.bars;
    const phase = bars ? position >= bars[12].start ? 2 : position >= bars[6].start ? 1 : 0 : -1;
    for (let i = 0; i < 3; i++) $('phase-' + i).classList.toggle('active', !!current && i === phase);
    drawWave(progress);
  }
  function animate() { cancelAnimationFrame(frame); const tick = () => { if (state !== 'playing') return; renderProgress(Music.position()); frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); }
  async function unlockAudio() {
    if (!window.Tone) throw new Error('音乐组件未加载，请联网刷新后再播放；分享卡片仍可使用。');
    try { await Tone.start(); }
    catch (_) { throw new Error('浏览器尚未允许声音，请再点击一次播放，或用系统浏览器打开。'); }
    if (Tone.context.state !== 'running') throw new Error('声音被系统暂停了，请再次点击播放。');
    if (observedContext !== Tone.getContext()) {
      observedContext = Tone.getContext();
      observedContext.on('statechange', () => { if (observedContext.state !== 'running') pauseForInterruption(); });
    }
  }
  async function startPlayback(request = ++playRequest) {
    const track = current;
    setState('loading'); $('sample-progress').value = 0;
    $('sound-status').textContent = $('sound-mode').value === 'sample' ? '正在准备乐器采样…' : '正在准备原合成器…';
    const duration = await Music.playMelody(track.events, { mode:$('sound-mode').value, volume: Number($('volume').value) / 100,
      onProgress: progress => { if(request===playRequest){$('sample-progress').value=progress.percent; $('sound-status').textContent=`正在准备乐器：${progress.completed}/${progress.total}（${progress.percent}%）`;} },
      onSoundStatus: status => { if(request===playRequest) $('sound-status').textContent=status.message; },
      onError: message => notify(message, true), onComplete: () => { cancelAnimationFrame(frame); setState('ended'); renderProgress(track.events.meta.duration); notify('这一首，送给认真生活的你。想听的话，可以再来一遍。'); } });
    if (request !== playRequest || duration === null) return false;
    if (document.hidden) { Music.stop(); setState('ready'); return false; }
    setState('playing'); animate(); return true;
  }
  function setBusy(value) {
    busy = value; $('generate').disabled = value;
    $('worry-form').setAttribute('aria-busy', String(value));
    document.querySelector('.player-panel').classList.toggle('brewing', value || state === 'loading');
    if (value) $('generate').textContent = '✦ 正在给心事编曲…';
    else $('generate').innerHTML = '<span>✦</span> 变成音乐 <span class="button-arrow">↗</span>';
    $('play').disabled = !current || value || state === 'loading';
  }
  function pauseForInterruption() {
    if (state === 'loading') { playRequest++; Music.stop(); setState('ready'); notify('加载已暂停，回来后点击播放即可。'); return; }
    if (state !== 'playing') return;
    Music.pause(); cancelAnimationFrame(frame); setState('paused'); renderProgress(Music.position());
    notify('声音已暂停。回到页面后，点击播放即可继续。');
  }
  function setupAudioLoader() {
    const loader = $('tone-loader');
    const timeout = setTimeout(() => { if (!window.Tone) notify('声音组件加载较慢，卡片仍可生成；联网刷新后可再试播放。', true); }, 8000);
    loader.addEventListener('load', () => { clearTimeout(timeout); if (current && state === 'ready') notify('声音组件已就绪，点击播放即可听见这首歌。'); });
    loader.addEventListener('error', () => { clearTimeout(timeout); notify('声音组件加载失败，卡片仍可生成；请联网刷新页面。', true); });
    if (window.Tone) clearTimeout(timeout);
  }
  $('worry').addEventListener('input', () => { $('char-count').textContent = `${$('worry').value.length} / 280`; });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { $('worry').value = button.dataset.example; $('worry').dispatchEvent(new Event('input')); $('worry').focus(); }));
  $('worry-form').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const text = $('worry').value.trim();
    if (!text) { notify('写下一点点心事吧，几个字也可以。', true); $('worry').focus(); return; }
    const selected = document.querySelector('input[name="emotion"]:checked').value;
    // This call occurs directly inside a user action, before any network request.
    const audioReady = unlockAudio().then(() => null, error => error);
    const token = ++generation; playRequest++; const clean = Music.stop(); cancelAnimationFrame(frame);
    setBusy(true); setState(current ? 'ready' : 'idle'); $('share-preview').disabled = true;
    const useAI = $('use-ai').checked && selected === 'auto';
    const apiConfig = { baseUrl: $('api-url').value.trim(), key: $('api-key').value.trim(), model: $('api-model').value.trim() };
    notify(useAI ? '正在听懂你的心事，随后会在本地编曲…' : '把心事拆成音符，给结尾留一点温柔…');
    try {
      let fallback = false;
      let analysis;
      const cacheKey = JSON.stringify([text, apiConfig.baseUrl, apiConfig.model]);
      if (useAI) {
        analysisController = new AbortController();
        analysis = analysisCache.get(cacheKey) || await Emotion.analyzeWithLLM(text, { ...apiConfig, signal: analysisController.signal, onFallback: () => { fallback = true; } });
        if (token !== generation) return;
        if (!fallback) { analysisCache.set(cacheKey, analysis); if (analysisCache.size > 32) analysisCache.delete(analysisCache.keys().next().value); }
      } else analysis = Emotion.analyze(text);
      if (selected !== 'auto') analysis = { ...analysis, emotion: selected };
      const seed = Music.hashText(text), events = Music.generateMelody({ ...analysis, seed });
      current = { text, analysis, seed, events, melody: events.filter(event => event.track === 'melody') };
      $('track-title').textContent = titles[analysis.emotion]; renderAnalysis(analysis, selected);
      $('track-kicker').textContent = 'WORRY TAPE #' + seed.toString(16).padStart(8, '0').toUpperCase();
      renderInstrument();
      $('tape-caption').textContent = '心事已收录，温柔播放中。';
      renderProgress(0);
      const audioError = await audioReady; if (token !== generation) return;
      setBusy(false); $('share-preview').disabled = false;
      if (audioError) { setState('ready'); notify(audioError.message, true); }
      else if (!clean) { setState('ready'); notify('声音未能完整释放，请刷新页面后再播放。', true); }
      else if (document.hidden || Tone.context.state !== 'running') { setState('ready'); notify('旋律已生成，回到页面后点击播放即可。'); }
      else if (await startPlayback()) notify(fallback ? 'AI 接口暂不可用，已用本地规则完成识别与编曲。' : `${selected !== 'auto' ? '按你选择的' : '听见了你的'}${Emotion.LABELS[analysis.emotion]}。不着急，旋律会陪你慢慢松开。`);
    } catch (_) { if (token === generation) { Music.stop(); setBusy(false); setState(current ? 'ready' : 'idle'); $('share-preview').disabled = !current; notify('这次编曲或声音初始化未完成，请重试；卡片仍可使用。', true); } }
    finally { if (token === generation) { analysisController = null; setBusy(false); } }
  });
  $('play').addEventListener('click', async () => {
    if (!current || busy || state === 'loading') return;
    if (state === 'playing') { Music.pause(); cancelAnimationFrame(frame); setState('paused'); notify('暂停一下也很好。准备好再继续。'); return; }
    const request = ++playRequest; $('play').disabled = true;
    try {
      await unlockAudio(); if (request !== playRequest || busy || document.hidden) return;
      if (state === 'paused') { Music.resume(); setState('playing'); animate(); notify('给自己一首歌的时间。'); }
      else if (await startPlayback(request)) notify('给自己一首歌的时间。');
    } catch (error) {
      if (request !== playRequest) return;
      if (state === 'loading') { Music.stop(); setState('ready'); }
      notify(/[\u3400-\u9fff]/.test(error.message) ? error.message : '播放暂不可用，请重试或刷新页面。', true);
    }
    finally { if (request === playRequest) $('play').disabled = !current || busy || state === 'loading'; }
  });
  $('sound-mode').addEventListener('change', () => {
    playRequest++; Music.stop(); cancelAnimationFrame(frame); setState(current?'ready':'idle'); renderProgress(0);
    $('sound-status').textContent = $('sound-mode').value === 'sample' ? '已选乐器采样版。点击播放，将从同一首旋律开头试听。' : '已选原合成器版。点击播放，将从同一首旋律开头试听。';
    renderInstrument();
  });
  $('stop').addEventListener('click', () => { playRequest++; const clean = Music.stop(); cancelAnimationFrame(frame); setState('ready'); renderProgress(0); notify(clean ? '已停止。这首歌会在这里，等你再听。' : '声音资源未能完整释放，请刷新页面。', !clean); });
  $('volume').addEventListener('input', () => Music.setVolume(Number($('volume').value) / 100));
  function closeShare() {
    shareRequest++; preparedCard = null;
    const dialog = $('share-dialog');
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    $('share-preview').focus();
  }
  $('share-preview').addEventListener('click', async () => {
    if (!current) return;
    const request = ++shareRequest; preparedCard = null;
    try {
      Share.renderCard($('share-canvas'), current, $('hide-text').checked);
      const dialog = $('share-dialog');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.classList.add('fallback-dialog'); dialog.setAttribute('open', ''); $('close-dialog').focus(); }
      $('share-message').textContent = '正在准备图片…'; $('native-share').disabled = true;
      const blob = await Share.blobFromCanvas($('share-canvas'));
      if (request !== shareRequest) return;
      preparedCard = blob;
      $('native-share').disabled = false;
      $('share-message').textContent = '图片已准备好。如浏览器拦截保存，请在系统浏览器打开后下载。';
    } catch (_) {
      if (request !== shareRequest) return;
      $('share-message').textContent = '图片未能生成，请关闭卡片后重试。';
      notify('图片未能生成，请重试。', true);
    }
  });
  $('close-dialog').addEventListener('click', closeShare);
  $('share-dialog').addEventListener('cancel', () => { shareRequest++; preparedCard = null; });
  $('share-dialog').addEventListener('click', event => {
    if (event.target !== $('share-dialog')) return;
    const rect = $('share-dialog').getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeShare();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('share-dialog').classList.contains('fallback-dialog')) closeShare(); });
  $('download-card').addEventListener('click', async () => {
    try { await Share.downloadCard($('share-canvas'), preparedCard); $('share-message').textContent = '已发起保存，请查看浏览器下载。如未出现文件，请用系统浏览器打开。'; }
    catch (_) { $('share-message').textContent = '图片保存失败，请重试或用系统浏览器打开。'; }
  });
  $('native-share').addEventListener('click', async () => {
    try {
      const result = await Share.shareCard($('share-canvas'), preparedCard);
      $('share-message').textContent = result === 'downloaded' ? '当前浏览器不支持系统分享，已发起保存图片。' : '已完成系统分享。';
    } catch (error) {
      $('share-message').textContent = error.name === 'AbortError' ? '已取消分享，图片仍在这里。' : '未能打开分享，请使用「保存图片」。';
    }
  });
  window.addEventListener('resize', () => renderProgress(state === 'ended' ? current.events.meta.duration : Music.position()));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { playRequest++; pauseForInterruption(); }
    else if (current) { renderProgress(state === 'ended' ? current.events.meta.duration : Music.position()); $('play').disabled = busy; }
  });
  window.addEventListener('pagehide', () => {
    generation++; playRequest++; shareRequest++; analysisController?.abort(); analysisController = null;
    Music.stop(); cancelAnimationFrame(frame); setBusy(false); setState(current ? 'ready' : 'idle');
    $('api-key').value = ''; analysisCache.clear(); preparedCard = null;
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      setBusy(false); setState(current ? 'ready' : 'idle'); renderProgress(0); $('share-preview').disabled = !current;
      if (current) notify('欢迎回来。点击播放可重新听这首歌。');
    }
  });
  setupAudioLoader(); drawWave();
})();

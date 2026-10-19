(function (root) {
  'use strict';
  const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
  function wrapText(ctx, text, width) {
    const lines = []; let line = '';
    for (const char of Array.from(text)) {
      if (char === '\n') { lines.push(line); line = ''; continue; }
      if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = ''; }
      line += char;
    }
    if (line) lines.push(line);
    return lines;
  }
  function renderCard(canvas, data, hideText = false) {
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#1a1a24'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#322d40'; for (let x = 20; x < w; x += 30) for (let y = 20; y < h; y += 30) ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = '#0d0d14'; ctx.fillRect(69, 69, w - 120, h - 120);
    ctx.fillStyle = '#24212f'; ctx.fillRect(54, 54, w - 120, h - 120);
    ctx.strokeStyle = '#75608f'; ctx.lineWidth = 4; ctx.strokeRect(54, 54, w - 120, h - 120);
    const text = (value, x, y, size, color = '#f4f1fa', bold = false) => { ctx.fillStyle = color; ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; ctx.fillText(value, x, y); };
    text('WORRY TO MELODY / SIDE B', 110, 131, 22, '#bfa8ff');
    text('今天的烦恼，', 108, 230, 62, '#f4f1fa', true);
    text('已经变成音乐了。', 108, 310, 62, '#bfa8ff', true);
    ctx.fillStyle = '#f0c93e'; ctx.fillRect(112, 338, 84, 7);
    const quote = hideText ? '有些心事不必说出口。\n听完这一首，再慢慢往前走。' : '“' + data.text + '”';
    let fontSize = 33; ctx.font = `${fontSize}px ${FONT}`;
    let lines = wrapText(ctx, quote, 825);
    while (lines.length > 7 && fontSize > 23) { fontSize -= 1; ctx.font = `${fontSize}px ${FONT}`; lines = wrapText(ctx, quote, 825); }
    if (lines.length > 8) {
      lines = lines.slice(0, 8);
      const last = Array.from(lines[7]);
      while (last.length && ctx.measureText(last.join('') + '…').width > 825) last.pop();
      lines[7] = last.join('') + '…';
    }
    lines.forEach((line, i) => text(line, 112, 414 + i * (fontSize + 10), fontSize, '#d2cadd'));
    const y = 778;
    ctx.fillStyle = '#121019'; ctx.fillRect(127, y + 13, 826, 180);
    ctx.fillStyle = '#997cd1'; ctx.fillRect(112, y, 826, 180);
    ctx.fillStyle = '#e8ddbf'; ctx.fillRect(142, y + 20, 766, 120);
    text('FROM NOISE', 168, y + 51, 18, '#42314d', true); text('TO PEACE', 744, y + 51, 18, '#42314d', true);
    ctx.fillStyle = '#282232'; ctx.fillRect(180, y + 66, 690, 53);
    for (const x of [211, 838]) { ctx.beginPath(); ctx.fillStyle = '#b6a6cb'; ctx.arc(x, y + 92, 19, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#32283c'; ctx.fillRect(x - 6, y + 86, 12, 12); }
    for (let i = 0; i < 49; i++) { const size = 8 + ((Math.imul(data.seed ^ i, 31) >>> 0) % 31); ctx.fillStyle = i > 35 ? '#f0c93e' : '#bfa8ff'; ctx.fillRect(265 + i * 10, y + 92 - size / 2, 5, size); }
    text('16 BARS · ONE DEEP BREATH', 340, y + 164, 17, '#332541', true);
    text(`${root.Emotion.LABELS[data.analysis.emotion]}  →  慢慢平静`, 112, 1044, 34, '#f0c93e', true);
    text(`${data.events.meta.config.name}  /  ${data.events.meta.config.instrument}`, 112, 1094, 22, '#bfb2ce');
    ctx.strokeStyle = '#51435f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(112, 1130); ctx.lineTo(938, 1130); ctx.stroke();
    text('烦恼变音乐', 112, 1186, 29, '#ece4f7', true);
    text('无用之用 · 给心事换一条音轨', 112, 1230, 19, '#a99cb9');
    text('#' + data.seed.toString(16).padStart(8, '0').toUpperCase(), 756, 1229, 18, '#a99cb9');
    return canvas;
  }
  function blobFromCanvas(canvas) { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片生成失败，请重试。')), 'image/png')); }
  async function downloadCard(canvas, prepared) {
    const blob = prepared || await blobFromCanvas(canvas), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '烦恼变音乐-心情的B面.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function shareCard(canvas, prepared) {
    // With a prepared blob, navigator.share runs before any await in the click.
    const blob = prepared || await blobFromCanvas(canvas);
    const file = typeof File === 'function' ? new File([blob], '烦恼变音乐.png', { type: 'image/png' }) : null;
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: '烦恼变音乐', text: '给心事换一条音轨。' }); return 'shared'; }
    await downloadCard(canvas, blob); return 'downloaded';
  }
  root.Share = { renderCard, blobFromCanvas, downloadCard, shareCard };
})(typeof window !== 'undefined' ? window : globalThis);

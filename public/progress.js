function startProgress() {
  const container = document.getElementById('analysis-progress');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (!container || !bar || !text) return null;
  container.classList.remove('hidden');
  bar.value = 0;
  const ESTIMATED_MS = 10000; // 10 seconds default estimation
  const start = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(ESTIMATED_MS - elapsed, 0);
    bar.value = Math.min(100, (elapsed / ESTIMATED_MS) * 100);
    text.textContent = `${Math.ceil(remaining / 1000)}s`;
  }, 200);
  return interval;
}

function stopProgress(interval) {
  const container = document.getElementById('analysis-progress');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (interval) clearInterval(interval);
  if (bar) bar.value = 100;
  if (text) text.textContent = '0s';
  if (container) {
    setTimeout(() => container.classList.add('hidden'), 500);
  }
}

(() => {
  const layer = document.createElement('div');
  layer.className = 'confetti-background';
  document.body.appendChild(layer);

  const colors = ['#ff6b6b', '#ffd93d', '#50fa7b', '#61dafb'];
  const confettiCount = 40;

  // Use a low-discrepancy sequence for deterministic yet irregular placement
  const halton = (index, base) => {
    let result = 0;
    let f = 1 / base;
    let i = index;
    while (i > 0) {
      result += f * (i % base);
      i = Math.floor(i / base);
      f /= base;
    }
    return result;
  };

  for (let index = 0; index < confettiCount; index++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.width = '10px';
    confetti.style.height = '6px';
    confetti.style.backgroundColor = colors[index % colors.length];
    confetti.style.top = `${halton(index + 1, 2) * 100}%`;
    confetti.style.left = `${halton(index + 1, 3) * 100}%`;
    confetti.style.transform = `rotate(${(index % 8) * 45}deg)`;
    layer.appendChild(confetti);
  }
})();

(() => {
  const layer = document.createElement('div');
  layer.className = 'confetti-background';
  document.body.appendChild(layer);

  const colors = ['#ff6b6b', '#ffd93d', '#50fa7b', '#61dafb'];
  const CONFETTI_COUNT = 40;

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    const size = 6 + Math.random() * 6;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size * 0.6}px`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.top = `${Math.random() * 100}%`;
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(confetti);
  }
})();

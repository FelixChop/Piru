(() => {
  const layer = document.createElement('div');
  layer.className = 'confetti-background';
  document.body.appendChild(layer);

  // Number of confetti pieces to generate
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

    // Size
    const width = 5 + halton(index + 1, 5) * 10;
    const height = 5 + halton(index + 1, 7) * 10;
    confetti.style.width = `${width}px`;
    confetti.style.height = `${height}px`;

    // Color
    const hue = halton(index + 1, 3) * 360;
    confetti.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

    // Position
    confetti.style.top = `${halton(index + 1, 2) * 100}%`;
    confetti.style.left = `${halton(index + 1, 11) * 100}%`;

    // Rotation and shape
    const rotation = halton(index + 1, 13) * 360;
    confetti.style.transform = `rotate(${rotation}deg)`;
    const radius = halton(index + 1, 17) * 50;
    confetti.style.borderRadius = `${radius}%`;

    layer.appendChild(confetti);
  }
})();

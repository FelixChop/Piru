(() => {
  const layer = document.createElement('div');
  layer.className = 'confetti-background';
  document.body.appendChild(layer);

  const colors = ['#ff6b6b', '#ffd93d', '#50fa7b', '#61dafb'];
  const topPositions = [10, 20, 30, 40, 50, 60, 70, 80];
  const leftPositions = [10, 30, 50, 70, 90];

  const positions = [];
  topPositions.forEach((top) => {
    leftPositions.forEach((left) => {
      positions.push({ top: `${top}%`, left: `${left}%` });
    });
  });

  positions.forEach((pos, index) => {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.width = '10px';
    confetti.style.height = '6px';
    confetti.style.backgroundColor = colors[index % colors.length];
    confetti.style.top = pos.top;
    confetti.style.left = pos.left;
    confetti.style.transform = `rotate(${(index % 8) * 45}deg)`;
    layer.appendChild(confetti);
  });
})();

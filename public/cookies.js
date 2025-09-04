(() => {
  const layer = document.createElement('div');
  layer.className = 'cookie-background';
  document.body.appendChild(layer);

  const cookieCount = 40;
  const images = ['/images/cookie1.png', '/images/cookie2.png', '/images/cookie3.png'];

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

  for (let index = 0; index < cookieCount; index++) {
    const cookie = document.createElement('div');
    cookie.className = 'cookie';

    const size = 20 + halton(index + 1, 5) * 40;
    cookie.style.width = `${size}px`;
    cookie.style.height = `${size}px`;

    cookie.style.backgroundImage = `url('${images[index % images.length]}')`;

    cookie.style.top = `${halton(index + 1, 2) * 100}%`;
    cookie.style.left = `${halton(index + 1, 3) * 100}%`;

    const rotation = halton(index + 1, 7) * 360;
    cookie.style.transform = `rotate(${rotation}deg)`;

    layer.appendChild(cookie);
  }
})();

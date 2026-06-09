type AnimationCallback = () => void;

let keyframesInjected = false;

function injectKeyframes(): void {
  if (keyframesInjected) return;
  const style = document.createElement('style');
  style.id = 'cart-animation-keyframes';
  style.textContent = `
    @keyframes cartShake {
      0%, 100% { transform: rotate(0deg); }
      25%      { transform: rotate(-12deg); }
      75%      { transform: rotate(10deg); }
    }
    @keyframes badgePop {
      0%   { transform: scale(1.8); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  keyframesInjected = true;
}

export function triggerCartAnimation(
  fromElement: HTMLElement,
  cartElement: HTMLElement,
  onComplete?: AnimationCallback
): void {
  injectKeyframes();

  const fromRect = fromElement.getBoundingClientRect();
  const cartRect = cartElement.getBoundingClientRect();

  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const cartCenterX = cartRect.left + cartRect.width / 2;
  const cartCenterY = cartRect.top + cartRect.height / 2;

  // --- 1. Spawn 6 trail dots ---
  const dotSizes = [10, 9, 8, 7, 6, 5];
  const dotColors = ['#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed', '#a78bfa', '#c4b5fd'];
  const dots: HTMLElement[] = [];

  dotSizes.forEach((size, i) => {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${dotColors[i]};
      left: ${fromCenterX - size / 2}px;
      top: ${fromCenterY - size / 2}px;
      transition: left 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms,
                  top 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms,
                  opacity 0.3s ${i * 60 + 300}ms;
    `;
    document.body.appendChild(dot);
    dots.push(dot);
  });

  // --- 2. Trigger trail dot transitions on next frame ---
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dots.forEach((dot, i) => {
        const size = dotSizes[i];
        dot.style.left = `${cartCenterX - size / 2}px`;
        dot.style.top = `${cartCenterY - size / 2}px`;
        dot.style.opacity = '0';
      });
    });
  });

  // --- 3. Spawn main flying node ---
  const mainNode = document.createElement('div');
  mainNode.style.cssText = `
    position: fixed;
    z-index: 99998;
    pointer-events: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #a78bfa;
    left: ${fromCenterX - 14}px;
    top: ${fromCenterY - 14}px;
    transition: left 0.5s cubic-bezier(0.4,0,0.2,1),
                top 0.5s cubic-bezier(0.4,0,0.2,1),
                transform 0.5s,
                opacity 0.2s 0.35s;
  `;
  document.body.appendChild(mainNode);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      mainNode.style.left = `${cartCenterX - 14}px`;
      mainNode.style.top = `${cartCenterY - 14}px`;
      mainNode.style.transform = 'scale(0)';
      mainNode.style.opacity = '0';
    });
  });

  // --- 4. Cleanup trails after dots have animated ---
  const dotCleanupTimeout = setTimeout(() => {
    dots.forEach(dot => dot.remove());
  }, 1600); // generous buffer after staggered delays

  // --- 5. After 520ms (main node arrival) ---
  setTimeout(() => {
    // Remove main node
    mainNode.remove();
    // Ensure dots are cleaned up
    clearTimeout(dotCleanupTimeout);
    dots.forEach(dot => dot.remove());

    // Cart shake
    cartElement.style.animation = 'cartShake 0.4s ease';
    setTimeout(() => {
      cartElement.style.animation = '';
    }, 500);

    // Badge pop
    const badge = document.getElementById('navbar-cart-badge');
    if (badge) {
      badge.style.animation = 'badgePop 0.3s ease';
      setTimeout(() => {
        badge.style.animation = '';
      }, 300);
    }

    onComplete?.();
  }, 520);
}
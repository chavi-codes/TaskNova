document.addEventListener("DOMContentLoaded", () => {

  /* ===================================================
     INTERACTIVE MOUSE PARALLAX ON LAYERS
     =================================================== */
  const layerBg = document.getElementById("layerBg");
  const layerFog = document.getElementById("layerFog");
  const layerStructure = document.getElementById("layerStructure");
  const layerContent = document.getElementById("layerContent");

  const canUseParallax = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  if (canUseParallax) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Track mouse coordinates normalized from -0.5 to 0.5
    window.addEventListener("mousemove", (e) => {
      targetX = (e.clientX / window.innerWidth) - 0.5;
      targetY = (e.clientY / window.innerHeight) - 0.5;
    });

    // Smooth ease-out animate loop
    function animateParallax() {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      // Apply offsets using transform3d to utilize GPU acceleration
      if (layerBg) {
        // Background shifts very slowly to create deep distance feeling
        const x = currentX * 12;
        const y = currentY * 8;
        layerBg.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (layerFog) {
        // Fog shifts slightly faster
        const x = currentX * 24;
        const y = currentY * 14;
        layerFog.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (layerStructure) {
        // Gate checkpoint midground shifts medium speed
        const x = currentX * 36;
        const y = currentY * 20;
        layerStructure.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (layerContent) {
        // Text shifts very subtly to stay matching with the background mountains
        const x = currentX * 16;
        const y = currentY * 10;
        layerContent.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      requestAnimationFrame(animateParallax);
    }

    animateParallax();
  }

  /* ===================================================
     DYNAMIC DRIFTING FLOWER PETALS (ENVIRONMENT)
     =================================================== */
  const petalsContainer = document.getElementById("driftingPetals");

  if (petalsContainer) {
    const petalCount = 18;

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement("div");
      petal.className = "petal";

      // Set random starting positions and offsets
      petal.style.left = `${Math.random() * 110 - 10}%`; // starting slightly offscreen
      petal.style.top = `-${Math.random() * 50 + 10}px`;

      // Set random sizes (mimics distance perspective)
      const scale = 0.4 + Math.random() * 0.8;
      petal.style.width = `${10 * scale}px`;
      petal.style.height = `${16 * scale}px`;

      // Horizontal drift coordinates
      const horizontalDrift = (Math.random() * 200) + 100; // pixels to float right
      petal.style.setProperty("--dx", `${horizontalDrift}px`);

      // Vary speed duration and delay
      petal.style.setProperty("--dur", `${8 + Math.random() * 12}s`);
      petal.style.animationDelay = `${Math.random() * -15}s`;

      petalsContainer.appendChild(petal);
    }
  }

  /* ===================================================
     CYBER TECH PARTICLES (GATE STRUCTURE AREA)
     =================================================== */
  const cyberParticlesContainer = document.getElementById("cyberParticles");

  if (cyberParticlesContainer) {
    const cyberCount = 14;

    for (let i = 0; i < cyberCount; i++) {
      const p = document.createElement("div");
      p.className = "cyber-particle";

      // Align particles near the gateway signboard position
      const startX = 65 + (Math.random() * 20); // between 65% and 85% width
      const startY = 32 + (Math.random() * 25); // between 32% and 57% height
      p.style.left = `${startX}%`;
      p.style.top = `${startY}%`;

      // Random float vectors
      p.style.setProperty("--cx", `${(Math.random() - 0.5) * 80}px`);
      p.style.setProperty("--cy", `${-(Math.random() * 100 + 40)}px`); // float upwards

      p.style.setProperty("--dur", `${4 + Math.random() * 6}s`);
      p.style.animationDelay = `${Math.random() * -5}s`;

      cyberParticlesContainer.appendChild(p);
    }
  }

});
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/*
Mini jeu similaire à pong ou space invaders : attraper le carré avec la barre
- Flèches gauche et droite pour déplacer la barre
- +1 point si on attrape le carré
- -1 point si on le manque
- Le carré réapparaît en haut à chaque fois
*/

// Précaution quand on est sur Codepen pour éviter d'accélérer
if(window.looping) cancelAnimationFrame(window.looping);

// Récupérer la largeur physique du canvas
const rect = canvas.getBoundingClientRect();
const width = rect.width;
const height = rect.height;
const padding = 40; // Marge pour le carré
const squareSize = 20; // Taille du carré
let speed = 2; // Vitesse du jeu

// Sons
const minFreq = 200; // Fréquence grave (gauche)
const maxFreq = 1000; // Fréquence aiguë (droite)

// Variables prédéfinies
const player = { x: 150, y: height - 50, w: 100, h: 15, speed: 5 }; // Le joueur
const square = { x: randomStart(), y: 0, size: squareSize, speed: speed }; // Le carré qu'on doit attraper
let score = 0; // Le score
let flashOpacity = 0; // Opacité du flash (0 à 1)
let flashStartTime = 0; // Temps de début du flash
const projectiles = []; // Tableau pour stocker les projectiles
const projectileSpeed = 8; // Vitesse des projectiles
const projectileWidth = 4; // Largeur des projectiles
const projectileHeight = 12; // Hauteur des projectiles
const particles = []; // Tableau pour stocker les particules d'explosion

// Ajout d'éléments pour la sensation de vitesse : étoiles en arrière-plan
const stars = []; // Tableau pour stocker les étoiles
const starCount = 50; // Nombre d'étoiles
const starSpeed = 2; // Vitesse de défilement des étoiles (plus lent que le carré pour effet de profondeur)

// Initialisation des étoiles
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 1 + Math.random() * 2
  });
}

// Initialisation de l'API Web Audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Tableau des fréquences pour des notes mélodieuses et leurs harmoniques (do4 à do5 et octaves)
const shootFrequencies = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  523.25 * 2, // C6 (harmonique)
  440.00 * 2, // A5 (harmonique)
];

// Objet pour suivre l'état des touches
const keys = { left: false, right: false };

// Écouteurs d'événement pour les touches du clavier
document.addEventListener("keydown", e => {
  if(e.key === 'ArrowRight') { // Flèche droite
    keys.right = true;
    e.preventDefault(); // Empêche le comportement par défaut
  }
  if(e.key === 'ArrowLeft') { // Flèche gauche
    keys.left = true;
    e.preventDefault();
  }
  if(e.key === ' ' || e.key === 'Spacebar') { // Espace pour tirer
    shoot();
  }
});

document.addEventListener("keyup", e => {
  if(e.key === 'ArrowRight') {
    keys.right = false;
  }
  if(e.key === 'ArrowLeft') {
    keys.left = false;
  }
});

// Tir au clic de souris
canvas.addEventListener("click", () => {
  shoot();
});

// Masquer le curseur lors du survol du canvas
canvas.addEventListener('mouseenter', () => {
  canvas.style.cursor = 'none';
});

// Restaurer le curseur à la sortie du canvas
canvas.addEventListener('mouseleave', () => {
  canvas.style.cursor = 'auto';
});

// Déplacement à la souris
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  player.x = mouseX - player.w / 2;

  // Optionnel : limite aux bords
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
});

// Fonction qui génère une position de départ aléatoire pour le carré
function randomStart() {
  return padding + Math.random() * (width - padding * 2 - squareSize);
}

// Fonction pour jouer un son d'explosion 8 bits
function playExplosionSound() {
  if (!audioContext) return; // Vérification de compatibilité
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Fréquence de départ
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3); // Sweep descendant
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // Enveloppe de volume
  
  oscillator.type = 'square'; // Style 8 bits
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// Fonction pour jouer un son de tir 8 bits
function playShootSound(x) {
  if (!audioContext) return; // Vérification de compatibilité
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const shootFrequency = minFreq + (x / canvas.width) * (maxFreq - minFreq); 
  // const shootFrequency = shootFrequencies[Math.floor(Math.random() * shootFrequencies.length)]; // Fréquence aléatoire parmi les notes mélodieuses
  oscillator.frequency.setValueAtTime(shootFrequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // Durée courte
  
  oscillator.type = 'triangle'; // Style 8 bits
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

// Fonction pour créer une explosion de particules
function createExplosion(x, y) {
  const particleCount = 25; // Nombre de particules
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount; // Dispersion circulaire
    const speed = 2 + Math.random() * 3; // Vitesse aléatoire
    particles.push({
      x: x + square.size / 2,
      y: y + square.size / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      life: 1, // Durée de vie (1 = opaque, 0 = disparue)
      decay: 0.015 + Math.random() * 0.015, // Vitesse de disparition
      color: `hsl(${Math.random() * 60}, 100%, 50%)` // Rouge/orange/jaune
    });
  }
  flashOpacity = 1;
  flashStartTime = Date.now(); // Démarre le flash
  // playExplosionSound(); // Joue le son d'explosion
}

// Fonction pour jouer un son d'apparition du carré (grave à aigu selon position horizontale)
function playSquareSound(x) {
  if (!audioContext) return; // Vérification de compatibilité
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const freq = minFreq + (x / canvas.width) * (maxFreq - minFreq);
  oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2); // Durée courte
  
  oscillator.type = 'sine'; // Son propre
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

// Fonction pour jouer un son de pièce (comme dans Mario)
function playCoinSound() {
  if (!audioContext) return; // Vérification de compatibilité

  const now = audioContext.currentTime;
  // Triade majeure C5 - E5 - G5 (petit arpeggio de victoire)
  const notes = [523.25, 659.25, 783.99];
  const noteDur = 0.12; // durée de chaque note en secondes
  const gap = 0.03; // espacement entre les notes

  notes.forEach((freq, i) => {
    const start = now + i * (noteDur + gap);
    const end = start + noteDur;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    // Enveloppe simple : attaque rapide, décroissance
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + noteDur * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(start);
    osc.stop(end + 0.02); // petit tail pour éviter coupures abruptes
  });
}

// Dessin de l'ensemble de la scène (itérations)
function update() {
  // Déplacement joueur
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  // Déplacement carré
  square.y += square.speed;
  
  // Collision avec le joueur
  if (
    square.speed && // On est en train de jouer
    square.y + square.size >= player.y &&
    square.x + square.size >= player.x &&
    square.x <= player.x + player.w
  ) {
    updateScore(score - 3); // Pénalité pour avoir touché le carré
    playExplosionSound(); // Joue le son d'explosion
    square.y = -5000
    square.x = -5000
    square.speed = 0
    setTimeout(() => {
      reset();
    }, 1000)
  }

  // Collision manquée
  if (
    square.y > canvas.height
    && square.speed // On est en train de jouer
  ) {
    updateScore(score - 1);
    square.speed = 0
    setTimeout(() => {
      reset();
    }, 300)
  }

  // Mise à jour des projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].y -= projectileSpeed;
    
    // Collision projectile avec carré (victoire)
    if (
      projectiles[i].x < square.x + square.size &&
      projectiles[i].x + projectiles[i].w > square.x &&
      projectiles[i].y < square.y + square.size &&
      projectiles[i].y + projectiles[i].h > square.y
    ) {
      updateScore(score + 2); // Bonus pour avoir tiré sur le carré
      createExplosion(square.x, square.y); // Crée l'explosion !
      playCoinSound(); // Joue le son de pièce
      projectiles.splice(i, 1); // Supprime le projectile

      // Désactive temporairement le carré pour éviter tout nouveau contact
      square.y = -5000;
      square.x = -5000;
      square.speed = 0;

      // Ajoute un délai d'1s avant la réapparition
      setTimeout(() => {
        reset();
      }, 1000);

      continue;
    }
    
    // Supprime les projectiles sortis de l'écran
    if (projectiles[i].y < -projectiles[i].h) {
      projectiles.splice(i, 1);
    }
  }

  // Mise à jour des particules
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
    particles[i].vy += 0.1; // Gravité
    particles[i].life -= particles[i].decay;
    
    // Supprime les particules mortes
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Mise à jour des étoiles pour sensation de vitesse
  for (let star of stars) {
    star.y += starSpeed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
  
  // Mise à jour de l'opacité du flash
  if (flashOpacity > 0) {
    flashOpacity = Math.max(0, 1 - (Date.now() - flashStartTime) / 1000);
  }
}

// Réinitialisation
function reset() {
  square.x = randomStart();
  square.y = 0;
  square.speed = speed
  setTimeout(() => {
    playSquareSound(square.x); // Joue le son d'apparition
  }, 200); // Petit délai pour éviter le chevauchement avec le son d'explosion
}

// Fonction pour créer un projectile
function shoot() {
  const x = player.x + player.w / 2 - projectileWidth / 2;
  projectiles.push({
    x: x,
    y: player.y,
    w: projectileWidth,
    h: projectileHeight
  });
  playShootSound(x); // Joue le son de tir
}

// Dessin de l'ensemble de la scène
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dessin des étoiles en arrière-plan pour sensation de vitesse
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Blanc semi-transparent
  for (let star of stars) {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  
  // Flash de bordure avec fondu rouge vers orange
  if (flashOpacity > 0) {
    // Interpolation de rouge (255,0,0) vers orange (255,165,0)
    // const r = 255;
    // const g = Math.round(0 + (165 - 0) * (1 - flashOpacity)); // De 0 à 165
    // const b = 0;
    // ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.strokeStyle = '#0069fe'; // Bleu électrique
    ctx.lineWidth = 10;
    ctx.globalAlpha = flashOpacity; // Applique l'opacité
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1; // Réinitialise l'opacité
  }
  // Joueur
  ctx.fillStyle = "greenyellow";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // Carré
  ctx.fillStyle = "red";
  ctx.fillRect(square.x, square.y, square.size, square.size);
  ctx.fill();
  // Projectiles
  for (let projectile of projectiles) {
    let factor = (player.y - projectile.y) / player.y;
    factor = Math.max(0, Math.min(1, factor)); // Clamp entre 0 et 1
    let r = 255;
    let g = Math.round(255 * factor);
    let b = 0;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(projectile.x, projectile.y, projectile.w, projectile.h);
  }
  // Particules d'explosion
  for (let particle of particles) {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1; // Réinitialise l'opacité
  // Texte du score
  // ctx.fillStyle = "white";
  // ctx.font = "16px sans-serif";
  // ctx.fillText("Score: " + score, 20, 30);
}

// Met à jour l'élément du DOM #score avec le score
function updateScore(sc) {
  score = sc;
  document.getElementById('score').textContent = score;
}

// Boucle d'animation
function loop() {
  update();
  draw();
  window.looping = requestAnimationFrame(loop);
}

// Premier appel de la boucle
loop();

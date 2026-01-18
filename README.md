# 🕹️ Kougelpong

Bienvenue dans Kougelpong, le mini jeu où un carré descend du ciel spatial et qu'il faut désintégrer avant qu'il n'atteigne ta barre ! Inspiré par les classiques Pong et Space Invaders, mais avec une touche sonore unique.

Ce jeu a pour vocation d'être accessible y compris aux personnes malvoyantes : grâce à la hauteur du son, on peut s'orienter et viser.

Les sons sont générés en temps réel avec l'API WebAudio.

---

## 🎮 But du jeu

- Tirer sur le carré pour gagner des points (+2)
- Manquer le carré = -1 point
- Le toucher avec ta barre = grosse pénalité (-3)
- Faire péter le carré = pluie de particules et petit jingle de victoire 💥🎶

## 🕹️ Contrôles

- **Flèche gauche / Flèche droite** — déplacer la barre
- **Espace** ou **Clic** — tirer
- **Souris** — déplacer la barre en mode déplacement direct

## 🧩 Fichiers

- `index.html` — structure HTML (canvas & score)
- `style.css` — styles et ambiance
- `script.js` — toute la magie : logique, sons, particules, étoiles et collisions

## 🚀 Lancer localement

1. Ouvrir `index.html` dans ton navigateur (double-clic) — simple et rapide
2. Ou servir le dossier si tu veux (recommandé pour tester correctement l'audio) :

```bash
# Avec Python 3
python -m http.server 8000
# puis ouvrir http://localhost:8000

# Avec Node.js (serve)
npx serve .
# puis ouvrir l'URL indiquée
```

## ✅ Fun tips & stratégies

- Vise le centre du carré pour maximiser tes chances de le toucher.
- Écoute les sons : l'apparition du carré change selon sa position, utile pour te préparer.

## 🛠️ Contribuer

Des idées ? Bugs ? Améliorations cosmétiques ? Ouvre une issue ou une PR. Quelques idées :

- Ajouter un high-score local
- Modes difficulté (vitesse, taille des carrés)
- Niveaux
- Power-ups (multi-tir, bouclier, slow-mo)

## 📜 License

MIT.

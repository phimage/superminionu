# Instructions pour les agents (et contributeurs)

Site statique (GitHub Pages, aucun build) pour suivre la collection d'autocollants
**Minions « Incognitos » — Magasins U 2026** : 80 vignettes, n° 1 à 72 et P1 à P8.

## Structure

```
index.html            page unique
style.css             styles
app.js                logique : compteurs, filtres, partage par fragment d'URL, localStorage
data/stickers.js      catalogue des vignettes (window.STICKERS) ← source de vérité
images/stickers/      images finales, une par vignette : 04.webp, 57.webp, P3.webp…
images/sources/       photos brutes (photos fournies, annonces eBay/Vinted…) avant découpe
tools/add_image.py    découpe + redimensionne une photo et met à jour data/stickers.js
```

## Règle d'or : l'ordre de `data/stickers.js`

La collection est encodée dans l'URL (`#c=...`) : **un caractère base36 par vignette,
dans l'ordre du tableau**. Réordonner ou supprimer une entrée casse tous les liens partagés
et les collections enregistrées. On peut modifier les champs (`name`, `finish`,
`peluche`, `img`) ou ajouter des entrées **à la fin** du tableau, rien d'autre.

## Ajouter l'image d'une vignette

1. Déposer la photo brute dans `images/sources/` (nom libre, ex. `ebay-lot-2026-11-18.jpg`,
   `photo-eric-01.jpg`). Une photo peut contenir plusieurs vignettes.
2. Repérer, pour chaque vignette visible, son numéro (imprimé sur la vignette) et le
   rectangle à découper en pixels (`x,y,largeur,hauteur`). La vignette doit être droite,
   bien cadrée, sans le fond ; prévoir `--rotate` si la photo est de travers.
3. Lancer pour chaque vignette :
   ```sh
   python3 tools/add_image.py images/sources/ebay-lot-2026-11-18.jpg 12 --box 140,80,300,400
   ```
   → crée `images/stickers/12.webp` (360 px de large) et remplit `img` dans `data/stickers.js`.
4. Vérifier visuellement le résultat (ouvrir l'image produite). Garder la meilleure
   image si une vignette existe déjà : le script écrase le fichier existant.
5. Profiter du passage pour compléter `name` si le titre est lisible, et corriger
   `finish` (`classique` | `pailletee` | `doree`) / `peluche` si la photo le montre.

Nommage des fichiers : numéros sur 2 chiffres (`04.webp`), `P1`…`P8` en majuscules.
Format attendu : portrait, ratio proche de 3:4 (la carte affiche l'image en `object-fit: cover`).

## Sources d'images

- Photos fournies par le propriétaire du dépôt (prioritaires, libres d'usage ici).
- Annonces eBay / Vinted de vignettes « Minions Super U » : à découper. Ne garder que la vignette.
- collexstash.com (`/fr/collections/stickers/minions-super-u-2026`) a quelques scans. Ne pas
  les republier sans autorisation : ils servent seulement à identifier les vignettes.

Les photos brutes de `images/sources/` peuvent être volumineuses. Les supprimer une fois découpées
si elles ne servent plus.

## Tester en local

```sh
python3 -m http.server 8000   # puis http://localhost:8000
```

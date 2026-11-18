# superminionu

Suivi de la collection d'autocollants **Minions « Incognitos »** des Magasins U (2026) :
80 vignettes (1–72 + P1–P8).

- Toucher une vignette = +1 exemplaire, bouton **−** pour en retirer un. À partir de 2 exemplaires, l'étiquette « Double » apparaît.
- Filtres : **Toutes / Manquantes / Possédées / Doubles**, et recherche par numéro.
- **Partager** : la collection est encodée dans le fragment de l'URL (`#c=…&n=Nom`). Le lien montre la collection en lecture seule, avec deux filtres d'échange : « Ses doubles qui me manquent » et « Mes doubles qui lui manquent ».
- La collection est aussi enregistrée dans le navigateur (localStorage), donc elle reste après un rafraîchissement.
- Menu ⋯ : copier la liste des doubles ou des manquantes (pour un message d'échange), nommer sa collection, tout effacer.

## Publier sur GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)`.
Aucun build n'est nécessaire.

## Ajouter des images

Voir [AGENTS.md](AGENTS.md) : les photos brutes vont dans `images/sources/`, et `tools/add_image.py` les découpe dans `images/stickers/`.

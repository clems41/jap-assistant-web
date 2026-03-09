# jap-assistant — Guide Claude Code

Application web **mobile-first** de gestion de tournois de padel pour les Juges Arbitres de Padel (JAP) et les joueurs.

## Stack technique

- **Angular 19** (standalone components, SSR avec `@angular/ssr`)
- **Tailwind CSS v4** (`@import "tailwindcss"` dans `styles.css`)
- **PrimeNG 19** + `@primeng/themes` pour les composants UI
- **Bootstrap Icons** (`bi bi-*`) + **PrimeIcons** (`pi pi-*`)
- **RxJS** + **Angular Signals** pour la réactivité
- **Jasmine/Karma** pour les tests unitaires

## Règles absolues

### Styling
- **Jamais de fichier CSS pour les composants** — ni `.css`, ni `.scss`, ni `styleUrls`, ni `styles`
- **Tailwind CSS uniquement** pour le styling custom
- **Pas de valeurs arbitraires** comme `text-[14px]` ou `bg-[#125740]` — utiliser les tokens custom définis dans `styles.css`
- **Pas de styles inline** `style="..."` sauf binding dynamique inévitable

### Composants UI
- **PrimeNG obligatoire** pour tout composant UI existant dans leur librairie (boutons, inputs, dialogs, tables, badges, tags, menus, etc.)
- Exception à valider avec l'utilisateur si aucun composant PrimeNG ne convient

### Angular
- **Standalone** uniquement — pas de NgModules
- **`ChangeDetectionStrategy.OnPush`** sur tous les composants
- **`inject()`** pour l'injection de dépendances — jamais de paramètres de constructeur
- **`input()` / `output()`** signal-based — pas de `@Input()` / `@Output()` decorators
- **`@if`, `@for`, `@switch`** — jamais `*ngIf`, `*ngFor`, `*ngSwitch`
- **TypeScript strict** — pas de `any`, tout typé explicitement

### Tests
- **Chaque service doit avoir un fichier `.spec.ts`** avec une couverture complète
- Tests des cas nominaux, cas limites, et cas d'erreur pour chaque méthode publique

## Palette de couleurs (`styles.css`)

```
cam-*           → Vert principal (brand) — actions primaires, headers
cam-secondary-* → Vert secondaire — éléments de support
jaune-*         → Jaune/or — warnings, highlights, accents
bleu-*          → Bleu — info, liens, actions secondaires
vert-*          → Teal — succès
orange-*        → Orange — alertes modérées
rouge-*         → Rouge — erreurs, actions destructives
violet-*        → Violet — catégories spéciales
gris-*          → Gris neutre — textes, bordures, fonds
blanc-*         → Échelle blanc→noir
```

Variantes : `120` (sombre), `100` (base), `80`, `50`, `15`, `5` (très clair)

**Couleur primaire** : `cam-100` (#125740)

## Typographie (tokens Tailwind)

- Titres : `text-title-1` (35px/700) → `text-title-4` (18px/700)
- Corps : `text-body-regular` (16px/400), `text-body-medium` (16px/500), `text-body-bold` (16px/700), `text-body-light` (14px/300)
- UI : `text-label`, `text-floatlabel`, `text-placeholder`, `text-button`, `text-menu`
- Police : `font-poppins`

## Structure des pages

Fichier suffixe `.page.ts` pour les composants routés, `.component.ts` pour les composants réutilisables.

Shell mobile standard (pages JAP) :
```html
<div class="flex flex-col min-h-screen bg-cam-5 font-poppins">
  <header class="sticky top-0 z-10 bg-cam-100 text-blanc-100 px-4 py-3">...</header>
  <main class="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">...</main>
  <!-- Bottom nav si page principale -->
</div>
```

## Agents disponibles

- **`angular-component`** — Créer un composant UI réutilisable
- **`angular-service`** — Créer un service + ses tests
- **`angular-page`** — Créer une page (composant routé)
- **`ui-reviewer`** — Audit UI/UX et qualité du code
- **`fft-rules`** — Implémenter la logique métier des règles FFT padel

## Commandes utiles

```bash
npm start          # ng serve (dev)
npm test           # ng test (Karma/Jasmine)
npm run build      # ng build (prod)
```

# Design Spec — VC Killer (style "Lumière")

Référence visuelle inspirée du site `vckiller.vercel.app` / type "Lumière" (image jointe par
le porteur). Document destiné à être appliqué sur le projet sans toucher aux données du backend.

---

## 1. Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-deep` | `#1F3A2D` | Fond principal du hero, fond du panneau "Kill questions", fond du verdict (GO/PIVOT) |
| `--bg-deep-2` | `#2D4A3A` | Variante plus claire du vert sapin pour overlays |
| `--bg` | `#EFE9DC` | Fond crème principal (page, cards) |
| `--bg-soft` | `#F5F0E4` | Variante du crème pour sections alternées |
| `--paper` | `#FCF9F1` | Fond des cards et tableaux sur la page crème |
| `--ink` | `#1F3A2D` | Couleur principale du texte sur fond crème |
| `--ink-soft` | `#4A5A4F` | Texte secondaire / paragraphes |
| `--muted` | `#8A857A` | Texte tertiaire, eyebrows en sourdine |
| `--cream` | `#EFE9DC` | Texte/accents sur fond vert sapin |
| `--critical` | `#7A2A2A` | Verdict NO-GO, badge CRITICAL, scores < 40, threat ≥ 70 |
| `--rule` | `rgba(31,58,45,0.15)` | Lignes de séparation discrètes |

**Pas de couleur fluo, pas de néon.** Tout doit rester organique, papier mat.

---

## 2. Typographie

- **Serif italique principale** : `Playfair Display`, weight 700, style italic.
  - Usage : titre hero principal, verdict, sous-titres, citations, numéros de kill questions.
- **Sans-serif neutre** : `Inter`, weights 400 / 500 / 600 / 700.
  - Usage : corps de texte, navigation, boutons, données tabulaires.
- **Pas de monospace.**

### Échelles
| Élément | Font | Taille | Style |
|---|---|---|---|
| Logo top nav | Playfair italic 700 | 22px | letter-spacing -0.01em |
| Hero brand "VC Killer" | Playfair italic 700 | clamp(140px, 26vw, 360px) | letter-spacing -0.04em, line-height 0.85, dépasse en bas (margin-bottom négative) |
| Hero baseline italic | Playfair italic 400 | 22px | "Where the boldest ideas get audited." |
| Verdict (NO-GO/GO/PIVOT) | Playfair italic 700 | clamp(96px, 16vw, 220px) | letter-spacing -0.04em, line-height 0.85 |
| Verdict subtitle | Playfair italic 400 | clamp(24px, 3.4vw, 38px) | line-height 1.2, max-width 75% |
| Verdict description | Inter 400 | 15px | line-height 1.65 |
| Card title | Playfair 700 | 19-22px | line-height 1.25 |
| Eyebrow | Inter 600 | 11px | uppercase, letter-spacing 0.18em |
| Score circulaire | Playfair 700 | 56px | au centre du cercle SVG |
| Kill question number | Playfair italic 700 | 36px | "01", "02", "03" en cream |
| Body | Inter 400 | 13-15px | line-height 1.5-1.65 |

---

## 3. Top navigation

Barre crème en haut, sticky, hauteur ~56px, border-bottom rule discret.

- **Gauche** : eyebrow `Submit · Audit · Verdict`
- **Centre** : "VC Killer" en Playfair italic 22px
- **Droite** : eyebrow `GO · PIVOT · NO-GO`

Aucun bouton "panier" ou "search" — ce sont des artefacts du site source.

---

## 4. Hero (page d'entrée)

Section pleine largeur, fond `--bg-deep` (vert sapin), texte `--cream`, padding latéral ~56px,
min-height 75vh, layout flex column space-between.

### Bloc supérieur (deux colonnes)
- **Gauche** (max-width 420px, padding-top 80px) : phrase italique serif 22px en deux lignes :
  > Where the boldest ideas <em>get audited.</em><br>Honest. Sharp. Factual.
- **Droite** (justify-self: end, min-width 320px) : 3 liens latéraux empilés
  ```
  PAINKILLER DIAGNOSTICS    ↗
  ─────────────────────────────
  8-AXIS BREAKDOWN          ↗
  ─────────────────────────────
  FOUNDER KILL QUESTIONS    ↗
  ```
  Chaque lien : padding-vertical 14px, eyebrow 11px letter-spacing 0.16em, séparateur
  `1px solid rgba(239,233,220,0.4)`, flèche ↗ taille 18px.

### Bloc inférieur — typographie monumentale
"VC Killer" en Playfair italic 700, taille `clamp(140px, 26vw, 360px)`, letter-spacing -0.04em,
line-height 0.85. Dépasse volontairement le bas de la section (`margin-bottom: -40px`) pour
créer la signature "Lumière" qui mord sur la frontière.

### Lignes décoratives sous le hero
Deux lignes horizontales fines empilées (1px crème opacity 0.5, 1px crème opacity 0.3, gap 4px),
qui font la transition vers la zone formulaire.

---

## 5. Formulaire d'entrée

Section dans `<main>` max-width 820px, padding-top 72px, fond crème.

- Eyebrow `Submit your idea`
- H2 italique serif clamp(34px, 5vw, 48px) : "Décris ton idée. Plus c'est précis, plus l'audit est mordant."
- Textarea : fond `--paper`, border 1px ink, padding 22px, font-size 15px, line-height 1.55.
- Bouton :
  - background `--ink`, color `--cream`, padding 18px 36px, font-size 12px, font-weight 700,
    letter-spacing 0.18em, uppercase. Label : "Démonter mon idée".
  - State `running` : background `--muted`, label "Analyse en cours…".
- Compteur de caractères en `--muted` à droite du bouton.

### Pipeline (visible pendant l'analyse)
Liste sans bordure de cards, séparée par `1px solid rgba(31,58,45,0.15)` :
```
01    Compréhension & clarification     ✓
02    Recherche concurrents             ●  (active = bold + accent)
03    Audit 8 axes                      ↗
...
```

---

## 6. Structure du rapport (post-analyse)

Disposé dans `<main>` max-width 1100px, padding 32px 24px 64px.

### 6.1 Top bar du rapport
- Eyebrow `VC Killer — Rapport d'audit` à gauche
- Bouton outline "Nouvelle analyse" à droite (border 1px ink, padding 8px 16px, eyebrow 11px)

### 6.2 Hero verdict
Section pleine largeur (1100px), padding 64px 56px 80px.

- **Background** :
  - `NO-GO` → `--critical` (#7A2A2A)
  - `GO` ou `PIVOT` → `--bg-deep` (#1F3A2D)
- **Foreground** : `--cream` (#EFE9DC)
- Eyebrow `Verdict brut` opacity 0.7
- H2 verdict en Playfair italic 700, clamp(96px, 16vw, 220px), line-height 0.85
- Subtitle en Playfair italic 400, clamp(24px, 3.4vw, 38px), max-width 75%
- Description en Inter 400, 15px, line-height 1.65, max-width 720px

### 6.3 Score (centré, pleine largeur)
> ⚠️ Pas de radar dans cette version — uniquement le score circulaire.

Card unique max-width 380px, centrée, fond `--paper`, border 1px rule, padding 32px.
- Eyebrow `Score global`
- SVG cercle 200×200, stroke-width 14, anneau de fond `#eee`, anneau de progression `--bg-deep`
- Au centre : score en Playfair 700 56px + "/ 100" en muted 11px
- Footer card : séparateur top, ligne `Painkiller / Vitamin` (eyebrow) + badge couleur
  - PAINKILLER → background `--critical`, color `--bg`
  - VITAMIN → background `--ink`, color `--bg`

### 6.4 Notation détaillée — 8 barres
Pleine largeur, fond `--paper`, border 1px ink, padding 40px.

Pour chaque axe (8 lignes empilées, gap 16px) :
```
[ EYEBROW LABEL ]    [============      ]    42
                     ▲ barre              ▲ score Playfair 22px
```
- Largeur du label : 200px, eyebrow 11px
- Barre : height 16px, border 1px ink, fill `--ink` (ou `--critical` si score < 40),
  marqueurs 25/50/75% en lignes verticales claires
- Score à droite : Playfair 700 22px, text-align right

### 6.5 Red flags + Kill questions (grid 1fr 1fr, gap 24px)

#### Red flags (gauche)
- Card fond `--paper`, border 1px rule, padding 32px
- Eyebrow `Red flags`
- Liste des red flags avec :
  - Badge criticality (CRITICAL en `--critical`, HIGH en `--ink`, MEDIUM en `--medium`)
  - Titre Playfair 700 19px line-height 1.25
  - Description Inter 13.5px line-height 1.55 ink-soft
- Séparateur `1px solid rgba(0,0,0,0.1)` entre items

#### Kill questions (droite)
- Card fond `--bg-deep`, color `--cream`, padding 36px
- Eyebrow `Kill questions` color cream opacity 0.7
- H3 Playfair italic 400 28px line-height 1.25 :
  > Réponds à ces 3 questions <em>avant</em> d'écrire la moindre ligne de code.
- Liste numérotée : grid 60px 1fr, numéros en Playfair italic 700 36px cream opacity 0.85,
  texte en Inter 14px line-height 1.5

### 6.6 Benchmark concurrentiel — table dense
> ⚠️ Limite à **2 acteurs maximum** dans cette version (les plus menaçants).

- Fond `--paper`, border 1px ink, padding 40px
- En-tête : eyebrow `Benchmark concurrentiel` à gauche, citation italique
  serif 16px à droite : *"Le statu quo est un concurrent."*
- Header columns : grid `1.5fr 0.8fr 1fr 60px 2.5fr`, border-bottom 1px ink,
  eyebrow 10px letter-spacing 0.18em
  - ACTEUR · TYPE · MENACE · (vide) · NOTE
- Rows :
  - **Acteur** : Inter 600 14px
  - **Type** : pill outline (border 1px ink, padding 3px 8px), font 9px letter-spacing 0.15em
  - **Barre menace** : height 10px, border 1px ink, fill `--ink` (ou `--critical` si threat ≥ 70)
  - **Score** : Playfair 700 16px, text-align right
  - **Note** : Inter 12.5px line-height 1.5 ink-soft

### 6.7 Roadmap MVP — 3 semaines
- Fond `--paper`, border 1px ink, padding 48px
- Eyebrow `Roadmap MVP — ≤ 3 semaines`
- Grid 3 colonnes (gap 32px), chaque colonne avec border-left 1px ink, padding-left 20px
- Marqueur en haut : carré 14×14 ink, marginLeft -27px (sort de la border)
- Eyebrow `Semaine N` en Inter 700 11px ink letter-spacing 0.18em
- Titre Playfair 700 21px line-height 1.2
- "Livrable —" en Inter bold + texte
- "Validation —" en Playfair italic 400 14px ink (le strong en non-italique)
- Bottom : `final_warning` en italique 13px ink-soft précédé de "⚠"

### 6.8 Footer
- Border-top 1px ink, padding-top 24px
- Layout flex space-between
- Gauche : `© VC Killer` en eyebrow 11px muted
- Droite : `Build something they'll pay for.` en Playfair italic 16px ink

---

## 7. Principes transverses

- **Aucune ombre** : la profondeur vient des borders fines + jeu fond crème / fond paper.
- **Aucun arrondi** (`border-radius: 0` partout). Les seules courbes sont le cercle SVG du
  score et le cercle de progression.
- **Letterspacing fort** sur les eyebrows (0.18em) et les badges (0.15em).
- **Italique = signal de personnalité** : utilisé uniquement sur les Playfair, jamais sur Inter.
- **Hiérarchie 3-niveaux** : eyebrow → titre serif → corps sans-serif.
- **Lignes de séparation** : toutes en `rgba(0,0,0,0.08)` ou `rgba(0,0,0,0.15)` selon densité.
- **Données limitées** :
  - Max 2 acteurs dans le tableau concurrents
  - 3 red flags (min 2, max 6 selon backend)
  - Exactement 3 kill questions
  - Exactement 3 semaines de roadmap

---

## 8. Notes d'application

Ce design.md est destiné à être appliqué sur la version brutaliste actuelle de la page.
- Touche uniquement `src/app/globals.css` (palette + classes utilitaires) et
  `src/app/page.tsx` (composants UI).
- Ne touche pas `src/lib/prompts.ts`, `src/lib/llm.ts`, `src/lib/serper.ts`, ni la route API.
- Les types de données existants (`AuditData`, `CompetitorsData`, `RedFlagsData`,
  `RoadmapData`, `Clarification`) restent inchangés.
- Les modifications structurelles de la UI (radar retiré, concurrents limités à 2) doivent
  être faites en parallèle de l'application de cette palette.

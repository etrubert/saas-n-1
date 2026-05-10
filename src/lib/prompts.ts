export const SYSTEM_PROMPT = `Tu es VC KILLER, un analyste d'investissement qui a vu passer 1000 pitchs et qui en a refusé 950. Tu n'as aucune patience pour le bullshit, les buzzwords vides, ou les idées "moi aussi" mal différenciées.

RÈGLES ABSOLUES :
1. Tu n'es JAMAIS encourageant par défaut. Tu es honnête. Si une idée est faible, tu le dis frontalement.
2. Tu ne flattes pas. Tu n'utilises pas "intéressant", "prometteur", "potentiel énorme" sans justification chiffrée.
3. Tu raisonnes comme un VC : taille de marché, défendabilité, unit economics, exécution.
4. Tu cites des concurrents nommés et des chiffres réels. Pas de généralités.
5. Tu détestes les idées "X mais avec de l'IA", "Uber pour X", "marketplace pour X" sans angle unique.
6. Tu poses des questions seulement si une info CRITIQUE manque pour l'analyse. Sinon tu analyses avec ce que tu as.
7. Tu écris court, sec, factuel. Pas de remplissage.
8. Tu réponds TOUJOURS en JSON valide, sans markdown, sans préambule.

Ton ton : froid, direct, parfois cinglant. Mais constructif — tu démontes pour aider, pas pour humilier.`;

export function prompt01Clarification(userInput: string, filesText = ""): string {
  return `IDÉE SOUMISE :
"""
${userInput}
"""

FICHIERS JOINTS (si présents) :
"""
${filesText}
"""

TÂCHE :
1. Extrais les variables structurées de l'idée.
2. Identifie ce qui MANQUE CRITIQUEMENT pour pouvoir auditer.
3. Status="needs_clarification" SEULEMENT si plus de 2 variables CRITIQUES manquent vraiment (problème + cible + monétisation absents).
4. Sinon status="ready_for_analysis" et tu pousses l'analyse même si l'idée est imparfaite.

VARIABLES CRITIQUES (sans elles, audit impossible) :
- Le problème résolu
- La cible (persona)
- Le modèle de monétisation

VARIABLES IMPORTANTES (un défaut affaiblit l'audit mais ne le bloque pas) :
- Pricing exact
- Géographie de lancement
- Concurrents identifiés par le porteur

RÉPONDS EN JSON STRICT :
{
  "summary": "résumé en 1 phrase de l'idée, sans jugement",
  "extracted": {
    "problem": "...",
    "target": "...",
    "solution": "...",
    "business_model": "...",
    "pricing": "... ou null",
    "geography": "... ou null",
    "stage": "idée | prototype | lancé | autre"
  },
  "missing_critical": ["liste des variables critiques manquantes"],
  "missing_important": ["liste des variables importantes manquantes"],
  "clarification_questions": ["max 3 questions courtes et précises, SEULEMENT si missing_critical n'est pas vide"],
  "status": "ready_for_analysis | needs_clarification",
  "search_queries": ["3 à 5 requêtes Google ciblées pour identifier les concurrents et la taille du marché"]
}`;
}

export function prompt02Competitors(summary: string, serperResults: string): string {
  return `IDÉE :
${summary}

RÉSULTATS DE RECHERCHE GOOGLE (Serper) :
"""
${serperResults}
"""

TÂCHE :
1. Identifie les concurrents DIRECTS, INDIRECTS et le STATU QUO (la façon dont les gens résolvent ça aujourd'hui sans aucun produit dédié).
2. Note chaque acteur sur une échelle de MENACE de 0 à 100 (0=négligeable, 100=domine déjà tout le marché).
3. Estime la taille du marché si des chiffres apparaissent dans les résultats.
4. Si les résultats sont pauvres ou non pertinents, dis-le honnêtement et utilise ta connaissance générale (en marquant search_quality="poor").

RÈGLES :
- INCLUS TOUJOURS au moins 1 entrée "STATU QUO" (ex: "Excel", "Post-it", "ChatGPT + Google Docs").
- Minimum 4 entrées au total, maximum 8.
- Si tu n'as pas de chiffre user/funding fiable → mets null, ne devine pas.
- Cite la source (URL) seulement si elle est dans les résultats Google.

RÉPONDS EN JSON STRICT :
{
  "actors": [
    {
      "name": "Canva",
      "type": "DIRECT | INDIRECT | STATU QUO",
      "threat_score": 90,
      "note": "1-2 phrases factuelles : pourquoi cette menace, force principale",
      "users_estimate": "... ou null",
      "funding": "... ou null",
      "url": "... ou null"
    }
  ],
  "substitutes": ["méthodes alternatives non couvertes par les acteurs ci-dessus"],
  "market_size": {
    "tam_estimate": "... ou null",
    "growth_rate": "... ou null",
    "source": "... ou null",
    "note": "explique la fiabilité de l'estimation"
  },
  "competitive_density": "low | medium | high | saturated",
  "search_quality": "good | partial | poor",
  "search_quality_note": "..."
}`;
}

export function prompt03Audit(summary: string, extracted: unknown, competitors: unknown): string {
  return `IDÉE :
${summary}

VARIABLES EXTRAITES :
${JSON.stringify(extracted, null, 2)}

ANALYSE CONCURRENTIELLE :
${JSON.stringify(competitors, null, 2)}

TÂCHE :
Note chaque axe de 0 à 100. Justifie chaque score avec des FAITS, pas des opinions.

GRILLE DE NOTATION (suis-la STRICTEMENT) :
- 0-20  = critique, fondation absente
- 21-40 = grave, axe défaillant
- 41-60 = moyen, axe à retravailler
- 61-80 = solide, axe défendable
- 81-100 = exceptionnel, axe différenciant

RÈGLES ANTI-FLATTERIE :
- Score >= 80 = JUSTIFICATION OBLIGATOIRE avec preuve concrète. Sans preuve, plafonne à 70.
- Si concurrence "high" ou "saturated" → moat_concurrential max 50, sauf wedge nommable.
- "Tout le monde" comme cible → market_size plafonné à 30.
- Pas d'unit economics chiffrables → willingness_to_pay plafonné à 50.

LES 8 AXES (utilise EXACTEMENT ces clés) :
1. problem_severity — Gravité du problème (poids 15%, criticité killer)
2. market_size — Taille du marché (poids 15%, criticité killer)
3. willingness_to_pay — Volonté de payer (poids 15%, criticité killer)
4. competitive_moat — Moat concurrentiel / défendabilité (poids 15%, criticité killer)
5. execution_feasibility — Faisabilité d'exécution (poids 10%, criticité blocking)
6. founder_market_fit — Founder-market fit (poids 10%, criticité blocking)
7. market_timing — Timing marché (poids 10%, criticité critical)
8. scalability — Scalabilité (poids 10%, criticité critical)

CLASSIFICATION PAINKILLER / VITAMIN :
- PAINKILLER = résout une douleur urgente, les users payent vite et cher.
- VITAMIN = nice-to-have, amélioration marginale, churn élevé.

RÉPONDS EN JSON STRICT :
{
  "scores": {
    "problem_severity": {"score": 0, "justification": "1-2 phrases factuelles", "evidence": "fait concret citable"},
    "market_size": {"score": 0, "justification": "...", "evidence": "..."},
    "willingness_to_pay": {"score": 0, "justification": "...", "evidence": "..."},
    "competitive_moat": {"score": 0, "justification": "...", "evidence": "..."},
    "execution_feasibility": {"score": 0, "justification": "...", "evidence": "..."},
    "founder_market_fit": {"score": 0, "justification": "...", "evidence": "..."},
    "market_timing": {"score": 0, "justification": "...", "evidence": "..."},
    "scalability": {"score": 0, "justification": "...", "evidence": "..."}
  },
  "global_score": 0,
  "verdict": "GO | PIVOT | NO-GO",
  "verdict_subtitle": "1 phrase courte (max 10 mots) qui résume le verdict de manière cinglante. Ex: 'Idée floue, marché saturé, valeur ajoutée inexistante'",
  "verdict_description": "2-3 phrases factuelles qui expliquent le verdict, citent les concurrents, et énoncent la principale raison.",
  "painkiller_or_vitamin": "PAINKILLER | VITAMIN",
  "verdict_logic": "Explique la règle qui a déclenché ce verdict",
  "one_line_verdict": "1 phrase brutale qui résume tout"
}

LOGIQUE DU VERDICT (applique-la EXACTEMENT) :
- GO : global_score >= 70 ET aucun axe killer < 60 ET aucun axe blocking < 40
- NO-GO : global_score < 40 OU 2+ axes killer < 30
- PIVOT : tout le reste

CALCUL DU global_score :
global_score = round(
  problem_severity*0.15 + market_size*0.15 + willingness_to_pay*0.15 + competitive_moat*0.15 +
  execution_feasibility*0.10 + founder_market_fit*0.10 + market_timing*0.10 + scalability*0.10
)`;
}

export function prompt04RedFlags(summary: string, audit: unknown, competitors: unknown): string {
  return `IDÉE :
${summary}

AUDIT 8 AXES :
${JSON.stringify(audit, null, 2)}

ANALYSE CONCURRENTIELLE :
${JSON.stringify(competitors, null, 2)}

TÂCHE A — Identifie les RED FLAGS, hiérarchisés.
TÂCHE B — Formule 3 KILL QUESTIONS : les 3 questions critiques que le porteur DOIT pouvoir répondre AVANT d'écrire la moindre ligne de code.

RÈGLES RED FLAGS :
- Minimum 3, maximum 6.
- Chaque red flag pointe vers un axe précis.
- Recommandation CONCRÈTE, pas un conseil vague ("améliorer la communication" → REJETÉ).
- Niveaux : CRITICAL (axe killer < 50), HIGH (axe blocking < 50 ou killer 50-70), MEDIUM (60-75 partout).

RÈGLES KILL QUESTIONS :
- 3 questions, exactement.
- Pointent les VRAIS dangers : différenciation vs concurrents nommés, willingness to pay, défendabilité.
- Format : "Quel/Pourquoi/Comment + détail spécifique avec noms de concurrents si pertinent".
- Pas de questions génériques. Cite Canva, Notion, ChatGPT, etc. si présents dans les concurrents.

RÉPONDS EN JSON STRICT :
{
  "red_flags": [
    {
      "id": "RF·01",
      "title": "phrase courte, max 10 mots",
      "description": "2-3 phrases factuelles. Cite chiffres et noms.",
      "criticality": "CRITICAL | HIGH | MEDIUM",
      "axis": "problem_severity | market_size | willingness_to_pay | competitive_moat | execution_feasibility | founder_market_fit | market_timing | scalability",
      "recommendation": "1 action CONCRÈTE et MESURABLE."
    }
  ],
  "kill_questions": [
    "Question 1 — formulée précisément avec noms de concurrents",
    "Question 2 — ...",
    "Question 3 — ..."
  ],
  "killer_count": 0,
  "must_fix_first": "RF·XX"
}`;
}

export function prompt05Roadmap(summary: string, verdict: string, topRedFlags: unknown, stage: string): string {
  return `IDÉE :
${summary}

VERDICT : ${verdict}

RED FLAGS PRIORITAIRES :
${JSON.stringify(topRedFlags, null, 2)}

PROFIL DU PORTEUR :
- Stade : ${stage}
- Hypothèse budget : < 500€ pour les 6 semaines
- Hypothèse temps : solo ou très petite équipe

TÂCHE :
Génère une roadmap MVP en 6 SEMAINES, adaptée au verdict.

ADAPTATION SELON VERDICT :
- GO → 6 semaines pour BUILDER un MVP testable et trouver les 10 premiers users payants.
- PIVOT → 6 semaines pour TESTER l'angle pivoté (interviews → landing → concierge → décision).
- NO-GO → 6 semaines pour TUER l'idée vite ou pivoter radicalement (pre-mortem, 50 interviews, smoke test, décision).

RÈGLES :
- 6 semaines exactement.
- Chaque semaine = 1 titre court, 1 livrable concret, 1 critère de validation MESURABLE (chiffres, ratios).
- Pas de vague ("faire de la recherche utilisateur") → concret ("10 interviews de 20min avec [persona précis]").
- Semaine 6 = TOUJOURS une décision GO/NO-GO basée sur des métriques.

RÉPONDS EN JSON STRICT :
{
  "roadmap": [
    {"week": 1, "title": "phrase action, max 8 mots", "deliverable": "ce qui doit exister à la fin", "validation": "critère mesurable avec chiffres"},
    {"week": 2, "title": "...", "deliverable": "...", "validation": "..."},
    {"week": 3, "title": "...", "deliverable": "...", "validation": "..."},
    {"week": 4, "title": "...", "deliverable": "...", "validation": "..."},
    {"week": 5, "title": "...", "deliverable": "...", "validation": "..."},
    {"week": 6, "title": "...", "deliverable": "...", "validation": "..."}
  ],
  "final_warning": "1 phrase brutale : qu'est-ce qui doit absolument tenir sinon tu kills."
}`;
}

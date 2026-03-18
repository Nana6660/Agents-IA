// Imports des modules principaux
const { Agent, Task } = require('./core2');
const { fetchTool, lmStudioTool, fileWriteTool } = require('./tools2');

// Configuration
const TARGET_URL = 'https://www.etandex.fr/la-societe-etandex/qui-sommes-nous';
const VERBOSE = false;

// Définition des agents
const fetcher = new Agent('Fetcher', [fetchTool]);

const analyst = new Agent(
    'Analyst',
    [lmStudioTool],
    "Tu es un analyste de pages corporate BTP. Tu identifies l'activité, les expertises, les chiffres, les références et l'innovation sans rien inventer."
);

const extractor = new Agent(
    'Extractor',
    [lmStudioTool],
    "Tu extrais les informations importantes sous forme structurée et concise."
);

const writerAgent = new Agent(
    'Writer',
    [lmStudioTool],
    "Tu es un rédacteur SEO. Tu écris un article markdown fidèle au contenu source, sans invention."
);

const injector = new Agent('Injector', [fileWriteTool]);

// Définition des tâches du pipeline
const tasks = [
    // 1. Récupération du contenu
    new Task(TARGET_URL, 'fetch'),

    // 2. Analyse du contenu
    new Task(
        `Analyse ce contenu de page entreprise et identifie :
- activité
- expertises
- chiffres clés
- points forts
- références chantiers
- innovation

Réponds en 10 points maximum.`,
        'lmStudio'
    ),

    // 3. Extraction structurée en JSON
    new Task(
        `Transforme l'analyse en JSON strict :
{
    "entreprise": "",
    "activite": "",
    "expertises": [],
    "chiffres_cles": [],
    "points_forts": [],
    "references": [],
    "innovation": [],
    "resume": ""
}`,
        'lmStudio'
    ),

    // 4. Rédaction de l'article markdown
    new Task(
        `Rédige un article markdown SEO sur "Qui est Etandex ?"
Contraintes :
- H1
- intro
- H2 expertises
- H2 références
- H2 innovation
- conclusion
- ton professionnel
- ne rien inventer`,
        'lmStudio'
    ),

    // 5. Écriture du résultat dans un fichier
    new Task({ filename: 'result.md', content: '' }, 'writeFile')
];

// Classe orchestratrice du pipeline
class Crew {
    constructor(agents = []) {
        this.agents = agents;
    }

    // Exécution séquentielle des tâches
    async run(tasks = []) {
        const results = [];
        let lastResult = null;

        for (let i = 0; i < tasks.length; i++) {
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            const percent = Math.round(((i + 1) / tasks.length) * 100);

            // Affichage de la progression
            console.log(`🔄 Étape ${i + 1}/${tasks.length} (${percent}%) | 👤 Agent: ${agent.name} | 🛠️ Tool: ${toolName}`);

            // Passage du résultat précédent aux tâches LM Studio
            if (toolName === 'lmStudio' && i > 0 && lastResult) {
                tasks[i].input = `${tasks[i].input}\n\n--- CONTENU PRÉCÉDENT ---\n${lastResult}`;
            }

            // Injection du contenu dans la tâche d'écriture
            if (toolName === 'writeFile') {
                tasks[i].input.content = lastResult;
            }

            // Exécution de la tâche
            lastResult = await agent.perform(tasks[i]);

            // Affichage du résultat (mode verbeux)
            if (VERBOSE || toolName !== 'lmStudio') {
                console.log(
                    `✅ Résultat étape ${i + 1}:`,
                    typeof lastResult === 'string'
                        ? lastResult.slice(0, 120) + (lastResult.length > 120 ? '...' : '')
                        : lastResult
                );
            }

            results.push(lastResult);
        }

        console.log('🎉 Terminé ! Résultat injecté dans result.md');
        return results;
    }
}

// Instanciation et exécution du crew
const crew = new Crew([fetcher, analyst, extractor, writerAgent, injector]);
crew.run(tasks).then(console.log).catch(console.error);
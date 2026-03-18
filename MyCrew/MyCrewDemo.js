const { Tool, Agent, Task } = require('./core');
const { fetchTool, lmStudioTool, fileWriteTool } = require('./tools');

// --- GLOBAL CONFIG ---
const SEARCH_TERM = 'économie';
const VERBOSE = false; 

// --- AGENTS ---

const fetcher = new Agent('Fetcher', [fetchTool]);
const analyst = new Agent('Analyst', [lmStudioTool], "Tu es un expert en analyse d'actualités économiques.");
const extractor = new Agent('Extractor', [lmStudioTool], "Tu es un assistant qui extrait des faits et actualités clés.");
const writerAgent = new Agent('Writer', [lmStudioTool], "Tu es un rédacteur SEO qui écrit des articles de blog optimisés en markdown.");
const injector = new Agent('Injector', [fileWriteTool]);

// --- TASKS ---

const url = `https://fr.m.wikinews.org/w/index.php?search=${encodeURIComponent(SEARCH_TERM)}&ns0=1`; // Utilise SEARCH_TERM

const tasks = [
    new Task(url, 'fetch'), // 1. Récupérer contenu
    new Task('Analyse ce contenu et extrait les principales acttualités et informations.', 'lmStudio'), // 2. Analyse
    new Task('Extrais les infos pertinentes du contenu afin de lister les actualités.', 'lmStudio'), // 3. Extraction
    new Task('Rédige un article de blog sur ce contenu. Tu dois parler des actualités. Formate en markdown et optimisé SEO. Ton texte sera directement injecté dans WordPress.', 'lmStudio'), // 4. Rédaction
    new Task({ filename: 'result.md', content: '' }, 'writeFile') // 6. Injection
];

// --- CREW ---

class Crew {
    constructor(agents = []) {
        this.agents = agents;
    }
    async run(tasks = []) {
        const results = [];
        let lastResult = null;
        for (let i = 0; i < tasks.length; i++) {
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            const percent = Math.round(((i + 1) / tasks.length) * 100);
            console.log(`🔄 Étape ${i + 1}/${tasks.length} (${percent}%) | 👤 Agent: ${agent.name} | 🛠️ Tool: ${toolName}`);

            // Injecte instruction + résultat précédent pour LM Studio
            if (toolName === 'lmStudio' && i > 0 && lastResult) {
                tasks[i].input = `${tasks[i].input}\n\n${lastResult}`;
            } else if (i > 0 && typeof tasks[i].input === 'string' && lastResult) {
                tasks[i].input = lastResult;
            }
            if (toolName === 'writeFile') {
                tasks[i].input.content = lastResult;
            }
            lastResult = await agent.perform(tasks[i]);
            if (VERBOSE && toolName === 'lmStudio') {
                console.log(`✅ Résultat étape ${i + 1}:`, lastResult);
            } else if (toolName !== 'lmStudio') {
                console.log(`✅ Résultat étape ${i + 1}:`, typeof lastResult === 'string' ? lastResult.slice(0, 120) + (lastResult.length > 120 ? '...' : '') : lastResult);
            }
            results.push(lastResult);
        }
        console.log(`🎉 Terminé ! Tous les agents ont fini. Résultat injecté dans result.md`);
        return results;
    }
}

const crew = new Crew([fetcher, analyst, extractor, writerAgent, injector]);
crew.run(tasks).then(console.log);
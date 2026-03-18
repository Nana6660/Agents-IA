
/**
 * Represente un outil avec un nom et une fonctio  exécutable
 * 
 * @class Tool
 * @param {string} name - Le nom de l'outil
 * @param {Function} func - La fonction à exécuter par cet outil - doit accepter une entrée et retourner un résultat (peut être asynchrone)
 * 
 * Cette classe permet de définir un outil avec un nom et une fonction associée,
 * et d'exécuter cette fonction de manière asynchrone via la méthode execute.
 */
class Tool { 
    constructor(name, func) {
        this.name = name; 
        this.func = func; 
    }

    /**
     * Exécute la fonction associée à l'outil de manière asynchrone
     * @async
     * @method execute
     * @param {*} input - L'entrée à passer à la fonction de l'outil
     * @returns {Promise<*>} Une promesse contenant le résultat de l'exécution de la fonction
     */
    async execute(input){
        return await this.func(input);
    }
}

/**
 * Agent : Entité qui utilise des outils pour exécuter des tâches.
 * Un agent possède un nom, une liste d'outils et un prompt système (optionnel).
 * Exemple : Fetcher, Analyst, Writer...
 */

class Agent {
    constructor(name, tool = [], prompt = '') {
        this.name = name; 
        this.tool = tool; 
        this.prompt = prompt;
    }

    /**
     * Exécute une tâche en utilisant le bon outil.
     * @param {Task} task - Tâche à exécuter (input + nom de l'outil)
     * @param {Function} onProgress - Callback pour logs/progression (optionnel)
     * @returns {Promise<*>} - Résultat de la tâche
     */
    async perform(task, onProgress = null){
        //Recherche de l'outil 
        const tool = this.tool.find(t => t.name === task.toolName);
        
        if(!tool) {
            const error = `Tool ${task.toolName} not found for agent ${this.name}`;
            if(onProgress) {
                onProgress({
                    type: 'log', 
                    level: 'error', 
                    message: error
                });
            }
            throw new Error(error);
        }

        if(onProgress) {
            onProgress({
                type: 'log', 
                level: 'error', 
                message: `Agent ${this.name} utilise l'outil ${tool.name}`
            });
        }
        
        try {
            //Exécuter l'outil
            const result = await tool.execute(task.input);
            return result;
        } catch (error) {
            if(onProgress) {
                onProgress({
                    type: 'log', 
                    level: 'error', 
                    message: `Erreur avec l'outil ${tool.name}: ${error.message}`
                });
            }
            throw error;
        }
    }
}
/**
 * Task : Représente une tâche à exécuter par un agent.
 * Contient l'input à traiter et le nom de l'outil à utiliser.
 * Exemple : {input: 'Paris', toolName: 'weather'}
 */
class Task {
    constructor(input, toolName){
        this.input = input;       // Entrée pour l'outil
        this.toolName = toolName; //Nom de l'outil à utiliser 
    }
}
//Export des classes pour utilisation dans d'autres modules
module.exports = { Tool, Agent, Task };
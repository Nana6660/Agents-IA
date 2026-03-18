// Classe représentant un outil exécutable
class Tool {
    constructor(name, func) {
        this.name = name;
        this.func = func;
    }

    // Exécute la fonction associée à l'outil
    async execute(...args) {
        return await this.func(...args);
    }
}

// Classe représentant un agent capable d'effectuer des tâches
class Agent {
    constructor(name, tools = [], prompt = '') {
        this.name = name;
        this.tools = tools;
        this.prompt = prompt;
    }

    // Exécute une tâche en utilisant l'outil approprié
    async perform(task, onProgress = null) {
        // Recherche l'outil correspondant au nom de la tâche
        const tool = this.tools.find(t => t.name === task.toolName);

        // Vérifie si l'outil existe
        if (!tool) {
            const error = `Tool ${task.toolName} not found for agent ${this.name}`;
            throw new Error(error);
        }

        try {
            // Cas spécial pour l'outil lmStudio qui nécessite le prompt
            if (task.toolName === 'lmStudio') {
                return await tool.execute(task.input, this.prompt);
            }
            // Exécute l'outil avec l'input
            return await tool.execute(task.input);
        } catch (error) {
            throw error;
        }
    }
}

// Classe représentant une tâche à exécuter
class Task {
    constructor(input, toolName) {
        this.input = input;
        this.toolName = toolName;
    }
}

module.exports = { Tool, Agent, Task };
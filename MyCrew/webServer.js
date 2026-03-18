const express = require('express');
const path = require('path');
const { Tool, Agent, Task } = require('./core');
const { fetchTool, lmStudioTool, fileWriteTool, weatherTool } = require('./tools');
const { companyOverviewTool, appendAnalysisTool, incomeStatementTool, balanceSheetTool, earningTool, getAnalysisFileTool, newsSentimentTool } = require('./financeTools');

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

// Available tools mapping
const toolsMap = {
    'fetch': fetchTool,
    'lmStudio': lmStudioTool,
    'writeFile': fileWriteTool,
    'weather': weatherTool,
    'companyOverview': companyOverviewTool,
    'incomeStatement': incomeStatementTool,
    'balanceSheet': balanceSheetTool,
    'earning': earningTool,
    'appendAnalysis': appendAnalysisTool,
    'getAnalysisFile': getAnalysisFileTool,
    'newsSentiment': newsSentimentTool
};

class Crew {
    constructor(agents = []) {
        this.agents = agents;
    }
    
    async run(tasks = [], onProgress = null) {
        const results = [];
        let lastResult = null;
        
        for (let i = 0; i < tasks.length; i++) {
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            const percent = Math.round(((i + 1) / tasks.length) * 100);
            
            if (onProgress) {
                onProgress({ 
                    step: i + 1, 
                    total: tasks.length, 
                    percent, 
                    agent: agent.name, 
                    tool: toolName,
                    type: 'progress'
                });
            }

            // Log task execution start
            if (onProgress) {
                onProgress({
                    type: 'log',
                    level: 'info',
                    message: `Exécution tâche ${i + 1}/${tasks.length}: ${toolName} par ${agent.name}`
                });
            }

            // Inject previous result
            if (toolName === 'lmStudio' && i > 0 && lastResult) {
                const resultStr = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
                tasks[i].input = `${tasks[i].input}\n\nRésultat précédent: ${resultStr}`;
            } else if (toolName === 'appendAnalysis' && i > 0 && lastResult) {
                // Injecter le résultat précédent dans le content pour appendAnalysis
                if (typeof tasks[i].input === 'object' && tasks[i].input !== null) {
                    tasks[i].input.content = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
                }
            } else if (toolName === 'writeFile' && lastResult) {
                tasks[i].input.content = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
            } else if (i > 0 && typeof tasks[i].input === 'string' && lastResult) {
                tasks[i].input = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
            }
            
            // Log input
            if (onProgress) {
                const inputStr = typeof tasks[i].input === 'object' 
                    ? JSON.stringify(tasks[i].input) 
                    : tasks[i].input;
                onProgress({
                    type: 'log',
                    level: 'info',
                    message: `Input: ${inputStr.substring(0, 200)}${inputStr.length > 200 ? '...' : ''}`
                });
            }
            
            try {
                lastResult = await agent.perform(tasks[i], onProgress);
                
                // Log successful result
                if (onProgress) {
                    const resultStr = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
                    onProgress({
                        type: 'log',
                        level: 'success',
                        message: `Résultat: ${resultStr.substring(0, 200)}${resultStr.length > 200 ? '...' : ''}`
                    });
                }
                
                results.push(lastResult);
            } catch (error) {
                if (onProgress) {
                    onProgress({
                        type: 'log',
                        level: 'error',
                        message: `Erreur: ${error.message}`
                    });
                }
                throw error;
            }
        }
        
        return results;
    }
}

// API endpoint to execute workflow
app.post('/api/execute', async (req, res) => {
    const { workflow } = req.body;
    
    try {
        // Create agents
        const agents = workflow.agents.map(agentData => {
            const tools = agentData.tools.map(toolName => toolsMap[toolName]).filter(Boolean);
            return new Agent(agentData.name, tools, agentData.prompt);
        });
        
        // Create tasks
        const tasks = workflow.tasks.map(taskData => {
            return new Task(taskData.input, taskData.toolName);
        });
        
        const crew = new Crew(agents);
        const results = await crew.run(tasks, (data) => {
            console.log(data);
        });
        
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Builder server running at http://localhost:${port}`);
});


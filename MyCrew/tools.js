// Fichiers pour création d'Outils d'appels api meteo, api llm studio, api pour lire dans des fichiers etc..

// ===== INITIALISATION =====
require('dotenv').config(); // Charge les variables d'environnement du fichier .env
const fs = require('fs').promises;
const { Tool } = require('./core'); // Importe la classe Tool

// ===== VARIABLES D'ENVIRONNEMENT =====
const LM_API_URL = process.env.LM_API_URL; // URL de l'API LM Studio
const LM_MODEL = process.env.LM_MODEL; // Modèle LM à utiliser
const WEATHER_API_KEY = process.env.WEATHER_API_KEY; // clé API pour l'api météo 

// ===== VALIDATION =====
if (!LM_API_URL || !LM_MODEL) {
    throw new Error('Variables LM_API_URL et LM_MODEL requises dans .env')
}

// ===== OUTILS =====

// Outil pour appeler l'API LM Studio
const lmStudioTool = new Tool('lmStudio', async (input, systemPrompt = null) => {
    // Construction du contexte de conversation
    const messages = [];
    
    // Ajoute le système prompt (instructions générales pour l'IA)
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    
    // Ajoute la question/requête de l'utilisateur
    messages.push({ role: 'user', content: input });
    console.log(`[LM STUDIO] Prompt envoyé: ${input}`);
    
    // Appel de l'API LM Studio
    const res = await fetch(LM_API_URL, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ model: LM_MODEL, messages })
    }); 
    
    // Traitement de la réponse
    const data = await res.json(); 
    const result = data.choices?.[0].message?.content || '';
    console.log(`[LM STUDIO] Réponse : ${result}`);
    
    return result; 
});

// Outil pour récupérer le contenu d'une URL
const fetchTool = new Tool('fetch', async (url) => {
    console.log(`[FETCH] Calling API: ${url}`);
    const response = await fetch(url, {
        // En-tête pour simuler un navigateur
        header: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    // Récupère le contenu en texte brut
    const result = await response.text();
    console.log(`[FETCH] Response: ${result.substring (0, 200)}...`);
    
    // Nettoie le contenu en supprimant les scripts, styles et balises HTML
    return result.replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
});

// Outil pour écrire du contenu dans un fichier
const fileWriteTool = new Tool('fileWrite', async({filename, content}) => {
    console.log('[WRITE FILE] Writing to: ${filename}');
    console.log('[WRITE FILE] Content: ${content.substring(0, 100)}...');

    // Écrit le fichier en encodage UTF-8
    await fs.writeFile(filename, content, 'utf-8');
    const result = 'File written : ${filename}'; 
    console.log('[WRITE FILE] Result: ${result}');
    return result;
});

// Outil pour récupérer les données météorologiques
const weatherTool = new Tool('weather', async (city) => {
    // Construit l'URL de l'API météo avec la clé API et la ville
    const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;

    console.log(`[WEATHER] Calling API for city: ${city}`);
    console.log( `[WEATHER] API URL: ${url}`); 

    // Appel à l'API météo
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`[WEATHER] API Response: ${JSON.stringify(data, null, 2)}`);

    // Vérifie les erreurs de l'API
    if (data.error) {
        const errorMsg = `Weather API error: ${data.error.message}`;
        console.log(`[WEATHER] Error: ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // Formate les données météorologiques pour l'affichage
    const result = `Météo à ${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}. Ressenti: ${data.current.feelslike_c}°C. Humidité: ${data.current.humidity}%. Vent: ${data.current.wind_kph} kph.`;
    console.log(`[WEATHER] Formatted Result: ${result}`);
    return result;
});

// ===== EXPORTS =====
module.exports = { lmStudioTool, fetchTool, fileWriteTool, weatherTool };

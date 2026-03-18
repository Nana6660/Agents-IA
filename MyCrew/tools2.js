// Charger les variables d'environnement
require('dotenv').config();
const fs = require('fs').promises;
const { Tool } = require('./core2');

// Récupérer les variables d'environnement
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Vérifier que les variables requises sont présentes
if (!LM_API_URL || !LM_MODEL) {
    throw new Error('Variables LM_API_URL et LM_MODEL requises dans .env');
}

// Fonction pour limiter la taille du texte
function truncateText(text, max = 12000) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '\n\n[CONTENU TRONQUÉ]' : text;
}

// OUTIL 1: LM Studio - Appel au modèle de langage
const lmStudioTool = new Tool('lmStudio', async (input, systemPrompt = null) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
        const safeInput = truncateText(input, 12000);

        // Construire les messages
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: safeInput });

        console.log(`[LM STUDIO] URL: ${LM_API_URL}`);
        console.log(`[LM STUDIO] Model: ${LM_MODEL}`);
        console.log(`[LM STUDIO] Taille prompt: ${safeInput.length} caractères`);

        // Envoyer la requête à l'API
        const res = await fetch(LM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: LM_MODEL,
                messages,
                temperature: 0.2,
                max_tokens: 1200,
                stream: false
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`LM Studio HTTP ${res.status}: ${text}`);
        }

        const data = await res.json();
        const result = data.choices?.[0]?.message?.content || '';

        console.log(`[LM STUDIO] Réponse reçue (${result.length} caractères)`);
        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('LM Studio a dépassé le délai de 180s. Modèle non chargé, machine trop lente, ou prompt trop volumineux.');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
});

// OUTIL 2: Fetch - Récupérer et nettoyer du contenu web
const fetchTool = new Tool('fetch', async (url) => {
    console.log(`[FETCH] Calling API: ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Fetch HTTP ${response.status} sur ${url}`);
    }

    const result = await response.text();
    console.log(`[FETCH] Response: ${result.substring(0, 200)}...`);

    // Nettoyer le HTML et retourner le texte
    return result
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
});

// OUTIL 3: FileWrite - Écrire un fichier sur le disque
const fileWriteTool = new Tool('fileWrite', async ({ filename, content }) => {
    console.log(`[WRITE FILE] Writing to: ${filename}`);
    console.log(`[WRITE FILE] Content: ${String(content).substring(0, 100)}...`);

    await fs.writeFile(filename, content, 'utf-8');

    const result = `File written: ${filename}`;
    console.log(`[WRITE FILE] Result: ${result}`);
    return result;
});

// OUTIL 4: Weather - Récupérer la météo
const weatherTool = new Tool('weather', async (city) => {
    const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        throw new Error(`Weather API error: ${data.error.message}`);
    }

    return `Météo à ${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}. Ressenti: ${data.current.feelslike_c}°C. Humidité: ${data.current.humidity}%. Vent: ${data.current.wind_kph} kph.`;
});

// Exporter tous les outils
module.exports = { lmStudioTool, fetchTool, fileWriteTool, weatherTool };
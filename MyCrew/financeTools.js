require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Tool } = require('./core');
const fs = require('fs').promises;
const path = require('path');
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_DIR = path.join(__dirname, 'cache');

// Comprendre l'entreprise
const companyOverviewTool = new Tool('companyOverview', async (symbol) => {
    if (!symbol) throw new Error('Ticker symbol is required');
    const cacheFile = path.join(CACHE_DIR, `${symbol}-overview.json`);
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        // Vérifie si le cache existe
        const cached = await fs.readFile(cacheFile, 'utf8');
        console.log(`[companyOverviewTool] ✅ Données récupérées depuis le cache pour ${symbol}`);
        return JSON.parse(cached);
    } catch (err) {
        // Si le cache n'existe pas, fait l'appel API
        console.log(`[companyOverviewTool] 🌐 Données récupérées depuis l'API pour ${symbol}`);
        const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf8');
        return data;
    }
});

const appendAnalysisTool = new Tool('appendAnalysis', async ({ ticker, analysisType, content }) => {
    if (!ticker || !analysisType) throw new Error('ticker et analysisType requis');
    const filename = `analysis-${ticker.toLowerCase()}.md`;
    const section = `## ${analysisType}\n${content || ''}\n\n`;
    await fs.appendFile(filename, section, 'utf8');
    return `Section "${analysisType}" ajoutée à ${filename}`;
});

// Etat financier - Compte de résultat
const incomeStatementTool = new Tool('incomeStatement', async (symbol) => {
    if (!symbol) throw new Error('Ticker symbol is required');
    const cacheFile = path.join(CACHE_DIR, `${symbol}-incomeStatement.json`);
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const cached = await fs.readFile(cacheFile, 'utf8');
        console.log(`[incomeStatementTool] ✅ Données récupérées depuis le cache pour ${symbol}`);
        return JSON.parse(cached);
    } catch (err) {
        console.log(`[incomeStatementTool] 🌐 Données récupérées depuis l'API pour ${symbol}`);
        const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const last3Quarters = Array.isArray(data.quarterlyReports)
            ? data.quarterlyReports.slice(0, 3)
            : [];
        await fs.writeFile(cacheFile, JSON.stringify(last3Quarters, null, 2), 'utf8');
        return last3Quarters;
    }
});

// Etat financier - Bilan
const balanceSheetTool = new Tool('balanceSheet', async (symbol) => {
    if (!symbol) throw new Error('Ticker symbol is required');
    const cacheFile = path.join(CACHE_DIR, `${symbol}-balanceSheet.json`);
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const cached = await fs.readFile(cacheFile, 'utf8');
        console.log(`[balanceSheetTool] ✅ Données récupérées depuis le cache pour ${symbol}`);
        return JSON.parse(cached);
    } catch (err) {
        console.log(`[balanceSheetTool] 🌐 Données récupérées depuis l'API pour ${symbol}`);
        const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const last3Quarters = Array.isArray(data.quarterlyReports)
            ? data.quarterlyReports.slice(0, 3)
            : [];
        await fs.writeFile(cacheFile, JSON.stringify(last3Quarters, null, 2), 'utf8');
        return last3Quarters;
    }
});

// Récupérer les résultats financiers (earnings)
const earningTool = new Tool('earning', async (symbol) => {
    if (!symbol) throw new Error('Ticker symbol is required');
    const cacheFile = path.join(CACHE_DIR, `${symbol}-earning.json`);
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const cached = await fs.readFile(cacheFile, 'utf8');
        console.log(`[earningTool] ✅ Données récupérées depuis le cache pour ${symbol}`);
        return JSON.parse(cached);
    } catch (err) {
        console.log(`[earningTool] 🌐 Données récupérées depuis l'API pour ${symbol}`);
        const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const last3Quarters = Array.isArray(data.quarterlyEarnings)
            ? data.quarterlyEarnings.slice(0, 3)
            : [];
        await fs.writeFile(cacheFile, JSON.stringify(last3Quarters, null, 2), 'utf8');
        return last3Quarters;
    }
});

const getAnalysisFileTool = new Tool('getAnalysisFile', async (ticker) => {
    if (!ticker) throw new Error('Ticker symbol is required');
    const filename = `analysis-${ticker.toLowerCase()}.md`;
    try {
        const content = await fs.readFile(filename, 'utf8');
        return content;
    } catch (err) {
        throw new Error(`Impossible de lire le fichier d'analyse : ${filename}`);
    }
});

// Récupérer les actualités et sentiment pour une société
const newsSentimentTool = new Tool('newsSentiment', async (symbol) => {
    if (!symbol) throw new Error('Ticker symbol is required');
    const cacheFile = path.join(CACHE_DIR, `${symbol}-news.json`);
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const cached = await fs.readFile(cacheFile, 'utf8');
        console.log(`[newsSentimentTool] ✅ Données récupérées depuis le cache pour ${symbol}`);
        return JSON.parse(cached);
    } catch (err) {
        console.log(`[newsSentimentTool] 🌐 Données récupérées depuis l'API pour ${symbol}`);
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=25&tickers=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        
        // Extraire title et summary des actualités
        const newsItems = Array.isArray(data.feed) 
            ? data.feed.map(item => ({
                title: item.title,
                summary: item.summary
            }))
            : [];
            
        await fs.writeFile(cacheFile, JSON.stringify(newsItems, null, 2), 'utf8');
        return newsItems;
    }
});

module.exports = { companyOverviewTool, appendAnalysisTool, incomeStatementTool, balanceSheetTool, earningTool, getAnalysisFileTool, newsSentimentTool };

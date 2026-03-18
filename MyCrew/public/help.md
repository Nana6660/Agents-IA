# CrewAI Builder - Guide d'utilisation

## Vue d'ensemble

CrewAI Builder est une interface visuelle permettant de créer et d'exécuter des workflows d'IA en connectant des agents et des tâches. Chaque agent peut utiliser différents outils pour accomplir des tâches spécifiques.

## Types de blocs

### 🤖 Agents
Les agents sont des entités IA qui exécutent des tâches en utilisant des outils spécialisés.

**Configuration :**
- **Nom** : Identifiant unique de l'agent
- **Outils** : Outil principal que l'agent peut utiliser
- **Prompt** : Instructions système pour guider le comportement de l'agent

### 📋 Tâches
Les tâches définissent les actions à effectuer par les agents.

**Configuration :**
- **Tool** : Outil spécifique à utiliser pour cette tâche
- **Paramètres** : Variables selon l'outil sélectionné

## Outils disponibles

### 🤖 LM Studio
**Utilisation :** Génération de texte par IA

**Paramètres :**
- **Prompt/Input** : Instructions ou question à poser à l'IA

**Exemple d'usage :**
```
Analyse ces données financières et donne un conseil d'investissement
```

### 🌐 Fetch
**Utilisation :** Récupération de contenu web

**Paramètres :**
- **URL** : Adresse web à récupérer

**Exemple d'usage :**
```
https://example.com/api/data
```

### 🌤️ Weather
**Utilisation :** Données météorologiques

**Paramètres :**
- **Ville** : Nom de la ville

**Exemple d'usage :**
```
Paris
```

### 📝 Write File
**Utilisation :** Écriture de fichiers

**Paramètres :**
- **Nom du fichier** : Nom du fichier de sortie

**Exemple d'usage :**
```
rapport.md
```

## Outils Financiers

### 🏢 Company Overview
**Utilisation :** Données générales d'une entreprise

**Paramètres :**
- **Ticker Symbol** : Code boursier (ex: AAPL, TSLA)

**Données récupérées :**
- Informations générales de l'entreprise
- Secteur d'activité
- Capitalisation boursière
- Ratios financiers de base

### 📊 Income Statement
**Utilisation :** Compte de résultat

**Paramètres :**
- **Ticker Symbol** : Code boursier

**Données récupérées :**
- Revenus trimestriels (3 derniers trimestres)
- Bénéfices nets
- Marges opérationnelles

### ⚖️ Balance Sheet
**Utilisation :** Bilan financier

**Paramètres :**
- **Ticker Symbol** : Code boursier

**Données récupérées :**
- Actifs et passifs (3 derniers trimestres)
- Capitaux propres
- Dettes à long terme

### 💰 Earnings
**Utilisation :** Résultats financiers

**Paramètres :**
- **Ticker Symbol** : Code boursier

**Données récupérées :**
- Bénéfices par action (3 derniers trimestres)
- Estimations vs résultats réels
- Surprises positives/négatives

### 📄 Append Analysis
**Utilisation :** Ajout d'analyses au fichier markdown

**Paramètres :**
- **Ticker** : Code boursier
- **Type d'analyse** : Nom de la section (ex: "Overview Analysis")
- **Contenu** : ⚡ *Auto-rempli depuis la tâche précédente*

**Fonctionnement :**
Le contenu est automatiquement injecté depuis le résultat de la tâche précédente (généralement une analyse LM Studio).

### 📖 Get Analysis File
**Utilisation :** Récupération du fichier d'analyse complet

**Paramètres :**
- **Ticker Symbol** : Code boursier

**Données récupérées :**
- Contenu complet du fichier `analysis-{ticker}.md`

## Workflow d'analyse financière

### Exemple typique :

1. **Company Overview** → Récupère les données générales
2. **LM Studio** → Analyse et génère un conseil
3. **Append Analysis** → Sauvegarde l'analyse
4. **Income Statement** → Récupère le compte de résultat
5. **LM Studio** → Analyse les revenus
6. **Append Analysis** → Ajoute au fichier
7. **Balance Sheet** → Récupère le bilan
8. **LM Studio** → Analyse la situation financière
9. **Append Analysis** → Ajoute au fichier
10. **Get Analysis File** → Récupère toutes les analyses
11. **LM Studio** → Synthèse finale
12. **Append Analysis** → Conseil final

## Connexions entre blocs

- **Point de sortie** (droite) : Connectez depuis ce point
- **Point d'entrée** (gauche) : Connectez vers ce point
- Les résultats se transmettent automatiquement entre les tâches connectées

## Injection automatique

### Pour LM Studio :
Le résultat de la tâche précédente est ajouté au prompt :
```
Votre prompt + "\n\nRésultat précédent: [résultat]"
```

### Pour Append Analysis :
Le champ "Contenu" est automatiquement rempli avec le résultat de la tâche précédente.

### Pour Write File :
Le contenu du fichier est remplacé par le résultat de la tâche précédente.

## Conseils d'utilisation

### ✅ Bonnes pratiques
- Utilisez des prompts clairs et spécifiques
- Connectez les tâches dans un ordre logique
- Testez avec des données simples d'abord

### ❌ À éviter
- Prompts trop génériques
- Cycles de connexions infinies
- Oubli des paramètres obligatoires

## Actions de l'interface

### 🚀 Exécuter
Lance l'exécution du workflow en séquence

### 🗑️ Effacer
Supprime tous les blocs du workspace

### 💾 Sauvegarder
Exporte le workflow en fichier JSON

### 📁 Charger
Importe un workflow depuis un fichier JSON

### 🖥️ Console
Affiche les logs d'exécution en temps réel

## Codes d'erreur courants

- **"Ticker symbol is required"** : Code boursier manquant
- **"URL manquante"** : URL requise pour Fetch
- **"Ville manquante"** : Ville requise pour Weather
- **"Tool not found"** : Outil non disponible pour l'agent

## Support

Pour plus d'aide, vérifiez :
1. Les paramètres de vos blocs
2. Les connexions entre les tâches
3. Les logs dans la console
4. Les exemples dans le dossier `/examples`

# 🩺 AvicennAI — Votre Assistant Médical Intelligent

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![LangChain](https://img.shields.io/badge/LangChain-Integration-121212?style=for-the-badge&logo=chainlink&logoColor=white)](https://www.langchain.com/)

**AvicennAI** est une plateforme médicale de pointe conçue par **AI Solution Morocco**. Elle combine la puissance des modèles de langage **Google Gemini** avec une interface utilisateur premium pour offrir une assistance médicale intelligente, des analyses d'imagerie et un suivi rigoureux des effets secondaires des médicaments.

---

## ✨ Caractéristiques Principales

### 💬 Assistant Médical IA

Un agent conversationnel intelligent propulsé par Gemini qui fournit des conseils médicaux, des explications sur les pathologies et une assistance en temps réel.

- **Streaming de réponses** pour une interaction fluide.
- **Compréhension contextuelle** avancée.

### 🖼️ Analyse d'Imagerie Médicale

Soumettez vos scans, radiographies ou IRM pour une analyse visuelle assistée par l'intelligence artificielle (Multimodal Gemini API).

### 💊 DoseEffect Tracker

Un module spécialisé utilisant le protocole **MCP (Model Context Protocol)** pour gérer une base de données de médicaments.

- **Agent Autonome** : L'IA peut créer, lister et analyser les effets secondaires.
- **Calcul de Probabilité** : Suivi statistique des rapports d'effets secondaires.
- **Architecture MCP** : Intégration via passerelle Arcade pour une extensibilité maximale.

### 🎨 Design Premium & UX SaaS

- **Mode Sombre/Clair** : Interface adaptative et élégante.
- **Glassmorphism** : Composants UI modernes avec effets de flou et de profondeur.
- **Responsive** : Optimisé pour PC, Tablettes et Smartphones.
- **Typographie Moderne** : Utilisation des polices _Syne_ et _DM Sans_ pour une lisibilité maximale.

---

## 🛠️ Stack Technique

- **Backend** : Flask (Python)
- **IA/LLM** : Google Gemini-3.5-Flash & Gemini-3-Flash-Preview
- **Agent Framework** : LangChain
- **Base de Données** : SQLite avec SQLAlchemy ORM
- **Protocoles** : Model Context Protocol (MCP) via Arcade Gateway
- **Frontend** : HTML5, Vanilla CSS, Vanilla JavaScript, Lucide Icons

---

## 🚀 Installation & Configuration

### 1. Prérequis

- Python 3.10+
- Une clé API Google AI (Gemini)
- (Optionnel) Une clé API Arcade pour les outils MCP

### 2. Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-repo/avicennai.git
cd avicennai

# Créer un environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
FLASK_APP=app.py
GEMINI_API_KEY=votre_cle_gemini
ARCADE_API_KEY=votre_cle_arcade
ARCADE_USER_ID=votre_user_id
```

### 4. Lancement

```bash
python app.py
```

Accédez à l'application via `http://localhost:5000`.

---

## 🏗️ Architecture du Projet

```text
AVICENNAI/
├── config/             # Configuration DB et App
├── static/
│   ├── css/            # Design System & Page Styles
│   ├── js/             # Logique Frontend
│   └── imgs/           # Assets visuels
├── templates/          # Pages HTML (Jinja2)
├── routes/             # Logique Serveur & Agents IA
├── instance/           # Base de données SQLite
├── app.py              # Point d'entrée principal
└── prompts.yaml        # Instructions système pour l'IA
```

---

## 🔒 Confidentialité & Avertissement

AvicennAI est un outil d'assistance et ne remplace en aucun cas un avis médical professionnel. Les données sont traitées de manière sécurisée conformément aux standards de confidentialité médicale.

---

## 💠 Développé par

**AI Solution Morocco**  
_L'intelligence artificielle au service de la santé._


# Discord Bot Project

Un bot Discord développé en JavaScript, enrichi d'une fonctionnalité intégrée via un sous-module pour convertir des vidéos YouTube en MP3.

---

## 🚀 Fonctionnalités

- Réponses automatisées aux commandes des utilisateurs.
- Gestion des rôles et des utilisateurs.
- Envoi de messages personnalisés.
- Intégration d'un convertisseur YouTube via un sous-module.

---

## 📦 Installation

### Prérequis

- **Node.js** : Version 16 ou supérieure.
- **Un fichier `.env`** contenant votre token Discord.

### Étapes

1. Clonez ce dépôt avec les sous-modules :
   ```bash
   git clone --recurse-submodules https://github.com/M-darius/Discord-bot-project.git
   cd Discord-bot-project
   ```

2. Installez les dépendances du bot Discord :
   ```bash
   npm install
   ```

3. Installez les dépendances du sous-module (convertisseur YouTube) :
   ```bash
   cd youtube-converter
   npm install
   cd ..
   ```

4. Configurez votre fichier `.env` :
   - Créez un fichier `.env` à la racine.
   - Ajoutez votre token Discord :
     ```
     TOKEN=votre_token_discord
     ```

5. Lancez le bot :
   ```bash
   node index.js
   ```

---

## 📂 Structure du Projet

```
Discord-bot-project/
├── youtube-converter/       # Sous-module pour le convertisseur YouTube
├── .env                     # Fichier contenant le token Discord (non versionné)
├── index.js                 # Fichier principal du bot
├── package.json             # Dépendances et scripts
├── package-lock.json        # Versions fixes des dépendances
├── README.md                # Documentation du projet
└── .gitmodules              # Configuration des sous-modules
```

---

## 🔧 Personnalisation

- **Modifier les commandes du bot :**
  - Vous pouvez personnaliser les commandes dans le fichier `index.js`.
- **Configurer le sous-module :**
  - Accédez au dossier `youtube-converter` pour modifier le convertisseur YouTube.

---

## 🎯 Lien avec le Projet Convertisseur YouTube

Ce projet est lié au dépôt suivant via un sous-module :
- **[Convertisseur YouTube](https://github.com/M-darius/convertisseur-youtube-py)**

Le sous-module permet de télécharger et de convertir des vidéos YouTube en MP3. Pour plus d'informations, consultez le README du projet associé.

---

## 📜 Licence

Ce projet est sous licence [MIT](LICENSE).

---

## 📚 Ressources

- [Documentation Discord.js](https://discord.js.org/#/)
- [Convertisseur YouTube](https://github.com/M-darius/convertisseur-youtube-py)

require('dotenv').config();
console.log('Token:', process.env.TOKEN);
const fs = require('fs');
const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const TOKEN = process.env.TOKEN;
const allowedUsers = ['525994073388089355'];
const allowedRoleId = 'ROLE_ID';
const player = createAudioPlayer();

let currentResource = null;
let musicQueue = [];
let isPlaying = false;
let currentBlindtest = null; // Déclaration de `currentBlindtest`

const musicFiles = JSON.parse(fs.readFileSync('musicFiles.json', 'utf-8'));
const blindtestFiles = JSON.parse(fs.readFileSync('blindtestFiles.json', 'utf-8'));

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({ status: 'invisible' });
});

// Fonction pour rejoindre le canal vocal
async function CommandjoinFunc(member, channel) {
    if (member.voice.channel) {
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            channel.send(`Rejoint ${member.voice.channel.name}`);
        });

        connection.on('error', error => {
            console.error('Erreur dans la connexion vocale :', error);
            channel.send('Une erreur est survenue lors de la tentative de rejoindre le canal vocal.');
        });
    } else {
        channel.send('Vous devez être dans un canal vocal pour utiliser cette commande.');
    }
}

// Fonction pour quitter le canal vocal
async function CommandleaveFunc(guild, channel) {
    const connection = getVoiceConnection(guild.id);
    if (connection) {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
            connection.destroy();
            channel.send('Quitte le canal vocal.');
        } else {
            channel.send('La connexion vocale a déjà été détruite.');
        }
    } else {
        channel.send('Je ne suis pas connecté à un canal vocal.');
    }
}

// Fonction pour ajouter une musique à la file d'attente
async function CommandplayFunc(member, channel, filename) {
    const musicFile = musicFiles.find(file => file.name === filename);
    if (!musicFile) {
        channel.send("Le fichier n'existe pas.");
        return;
    }

    const filepath = musicFile.path;

    if (!fs.existsSync(filepath)) {
        channel.send("Le fichier n'existe pas.");
        return;
    }

    musicQueue.push({
        filepath,
        filename,
        member,
        channel
    });

    channel.send(`${filename} a été ajouté à la file d'attente.`);
    
    if (!isPlaying) {
        await playNextInQueue();
    }
}

// Fonction pour jouer la prochaine musique dans la file d'attente
async function playNextInQueue() {
    if (musicQueue.length === 0) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    const { filepath, filename, member, channel } = musicQueue.shift();

    let connection = getVoiceConnection(channel.guild.id);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        connection.on('error', error => {
            console.error('Erreur dans la connexion vocale :', error);
            channel.send('Une erreur est survenue lors de la lecture du fichier audio.');
            playNextInQueue();
        });
    }

    currentResource = createAudioResource(filepath);

    player.play(currentResource);
    connection.subscribe(player);

    player.once(AudioPlayerStatus.Playing, async () => {
        await channel.send(`Lecture de: ${filename}`);
    });

    player.once(AudioPlayerStatus.Idle, async () => {
        playNextInQueue();
    });

    player.on('error', async error => {
        console.error('Erreur dans le lecteur audio :', error);
        await channel.send('Une erreur est survenue lors de la lecture du fichier audio.');
        playNextInQueue();
    });
}

// Fonction pour passer à la musique suivante
async function CommandskipFunc(channel) {
    if (musicQueue.length > 0) {
        player.stop();
        await channel.send('Passage à la musique suivante...');
    } else {
        await channel.send('La file d\'attente est vide.');
        player.stop(); // Arrête la lecture en l'absence de musique suivante, mais reste connecté
    }
}

// Fonction pour lister les musiques dans la file d'attente
async function CommandqueueFunc(channel) {
    if (musicQueue.length > 0) {
        const queueList = musicQueue.map((item, index) => `${index + 1}. ${item.filename}`).join('\n');
        await channel.send(`File d'attente:\n${queueList}`);
    } else {
        await channel.send('La file d\'attente est vide.');
    }
}

// Fonction pour arrêter la lecture
async function CommandstopFunc(member, channel) {
    if (member.voice.channel) {
        if (player.state.status === AudioPlayerStatus.Playing || player.state.status === AudioPlayerStatus.Paused) {
            player.stop();
            channel.send('Lecture arrêtée.');
            isPlaying = false;
            musicQueue = [];
        } else {
            channel.send('Aucune musique n\'est actuellement en cours de lecture.');
        }
    } else {
        channel.send('Vous devez être dans un canal vocal pour utiliser cette commande.');
    }
}

// Fonction pour mettre en pause la lecture
async function CommandpauseFunc(channel) {
    if (player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
        channel.send('Lecture en pause.');
    } else {
        channel.send('Aucune musique n\'est actuellement en cours de lecture.');
    }
}

// Fonction pour reprendre la lecture
async function CommandreprendreFunc(channel) {
    if (player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
        channel.send('Lecture reprise.');
    } else {
        channel.send('Aucune musique n\'est en pause.');
    }
}

// Fonction pour lister les fichiers disponibles
async function CommandlistFunc(channel) {
    if (musicFiles.length > 0) {
        const relativePaths = musicFiles.map(file => `- ${file.name}`);
        channel.send(`Fichiers disponibles:\n${relativePaths.join('\n')}`);
    } else {
        channel.send('Aucun fichier MP3 trouvé dans le répertoire.');
    }
}

// Fonction pour démarrer un blindtest
async function startBlindtest(member, channel, theme) {
    let files;

    if (theme === 'tous') {
        files = blindtestFiles;
    } else {
        files = blindtestFiles.filter(file => file.theme === theme);
    }

    if (files.length === 0) {
        await channel.send(`Aucune musique disponible pour le thème ${theme}.`);
        return;
    }

    currentBlindtest = {
        files,
        index: 0,
        scores: {},
        channel,
        member,
    };

    await playNextBlindtestSong();
}

// Fonction pour jouer la prochaine musique du blindtest
async function playNextBlindtestSong() {
    if (currentBlindtest.index >= currentBlindtest.files.length) {
        await endBlindtest();
        return;
    }

    const file = currentBlindtest.files[currentBlindtest.index];
    const filepath = file.path;

    let connection = getVoiceConnection(currentBlindtest.channel.guild.id);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: currentBlindtest.member.voice.channel.id,
            guildId: currentBlindtest.channel.guild.id,
            adapterCreator: currentBlindtest.channel.guild.voiceAdapterCreator,
        });
    }

    currentResource = createAudioResource(filepath);

    connection.subscribe(player);

    player.play(currentResource);

    player.once(AudioPlayerStatus.Playing, async () => {
        await currentBlindtest.channel.send(`Blindtest en cours : Devinez la musique !`);
    });

    player.once(AudioPlayerStatus.Idle, async () => {
        currentBlindtest.index++;
        await playNextBlindtestSong();
    });

    player.on('error', async error => {
        console.error('Erreur dans le lecteur audio :', error);
        await currentBlindtest.channel.send('Une erreur est survenue lors de la lecture du fichier audio.');
        currentBlindtest = null;
    });
}

// Fonction pour terminer le blindtest
async function endBlindtest() {
    const { scores, channel } = currentBlindtest;

    await channel.send('Le blindtest est terminé ! Voici les scores :');
    const scoreMessages = Object.entries(scores)
        .map(([userId, score]) => `<@${userId}> : ${score} point(s)`)
        .join('\n');
    await channel.send(scoreMessages || 'Aucun point marqué.');

    currentBlindtest = null;
}

// Fonction pour gérer les réponses
client.on('messageCreate', async message => {
    if (!currentBlindtest || message.author.bot) return;

    const correctAnswer = currentBlindtest.files[currentBlindtest.index].name.toLowerCase();
    const userAnswer = message.content.toLowerCase();

    if (userAnswer.includes(correctAnswer)) {
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel && voiceChannel.id === currentBlindtest.member.voice.channel.id) {
            currentBlindtest.scores[message.author.id] = (currentBlindtest.scores[message.author.id] || 0) + 1;
            await currentBlindtest.channel.send(`<@${message.author.id}> a trouvé la bonne réponse !`);
            player.stop(); // Stoppe la lecture actuelle et passe à la suivante
        } else {
            await message.reply('Vous devez être dans le canal vocal pour participer.');
        }
    }
});

// Afficher les options de thème pour le blindtest
async function showBlindtestOptions(channel) {
    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selectTheme')
                .setPlaceholder('Choisissez un thème de Blindtest')
                .addOptions(
                    { label: 'Tous', value: 'tous' },
                    { label: 'Anime', value: 'anime' },
                    { label: 'Film', value: 'film' },
                    { label: 'Dessin Animé', value: 'dessin anime' },
                    { label: 'Série', value: 'serie' },
                    { label: 'Musique', value: 'musique' },
                ),
        );

    await channel.send({ content: 'Sélectionnez un thème pour le Blindtest :', components: [row] });
}

// Gestion de la sélection de thème du blindtest
async function handleBlindtestThemeSelection(interaction) {
    const theme = interaction.values[0];
    await interaction.deferReply();
    await startBlindtest(interaction.member, interaction.channel, theme);
    await interaction.followUp(`Blindtest pour le thème **${theme}** lancé !`);
}

// Commandes et interactions
client.on('messageCreate', async message => {
    if (!message.guild) return;

    if (!allowedUsers.includes(message.author.id) && !message.member.roles.cache.has(allowedRoleId)) {
        return;
    }
    
    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();
    switch (command) {
        case '!join':
            await CommandjoinFunc(message.member, message.channel);
            break;
        case '!leave':
            await CommandleaveFunc(message.guild, message.channel);
            break;
        case '!play':
            await CommandplayFunc(message.member, message.channel, args.join(' '));
            break;
        case '!queue':
            await CommandqueueFunc(message.channel);
            break;
        case '!skip':
            await CommandskipFunc(message.channel);
            break;
        case '!stop':
            await CommandstopFunc(message.member, message.channel);
            break;
        case '!pause':
            await CommandpauseFunc(message.channel);
            break;
        case '!reprendre':
            await CommandreprendreFunc(message.channel);
            break;
        case '!list':
            await CommandlistFunc(message.channel);
            break;
        case '!blindtest':
            await showBlindtestOptions(message.channel);
            break;
        case '!help':
            const helpMessage = `
**Commandes disponibles :**

- **!join** : Rejoindre le canal vocal de l'utilisateur.
- **!leave** : Quitter le canal vocal.
- **!play <nom_du_fichier>** : Ajouter une musique à la file d'attente.
- **!queue** : Voir les musiques dans la file d'attente.
- **!skip** : Passer à la musique suivante.
- **!stop** : Arrêter la lecture et vider la file d'attente.
- **!pause** : Mettre en pause la lecture de la musique.
- **!reprendre** : Reprendre la lecture de la musique.
- **!list** : Lister tous les fichiers MP3 disponibles.
- **!blindtest** : Créer un blindtest et choisir un thème.
            `;
            await message.channel.send(helpMessage);
            break;
        default:
            break;
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'selectTheme') {
        await handleBlindtestThemeSelection(interaction);
    }
});

client.login(TOKEN);

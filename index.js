const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require("discord.js");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection
} = require("@discordjs/voice");

const play = require("play-dl");
const { token } = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// 🎵 Music Queue
const queue = new Map();

client.once("ready", () => {
    console.log(`${client.user.tag} ist online`);
});

/* ---------------- MUSIC ---------------- */
async function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);

    const stream = await play.stream(song.url);
    const resource = createAudioResource(stream.stream, {
        inputType: stream.type
    });

    serverQueue.player.play(resource);
}

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const guildId = interaction.guild.id;

    /* ---------------- PLAY ---------------- */
    if (interaction.commandName === "play") {

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply("❌ Du bist in keinem Voice Channel");
        }

        const songName = interaction.options.getString("song");

        const search = await play.search(songName, { limit: 1 });
        if (!search.length) return interaction.reply("❌ Nichts gefunden");

        const song = search[0];

        const player = createAudioPlayer();

        const serverQueue = {
            voiceChannel,
            player,
            songs: [song],
            playing: true
        };

        queue.set(guildId, serverQueue);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        connection.subscribe(player);

        await playSong(interaction.guild, song);

        player.on(AudioPlayerStatus.Idle, () => {
            queue.delete(guildId);
        });

        return interaction.reply(`🎵 Spiele: **${song.title}**`);
    }

    /* ---------------- SKIP ---------------- */
    if (interaction.commandName === "skip") {
        const serverQueue = queue.get(guildId);
        if (!serverQueue) return interaction.reply("❌ Nichts spielt");

        serverQueue.player.stop();
        return interaction.reply("⏭️ Skip");
    }

    /* ---------------- STOP ---------------- */
    if (interaction.commandName === "stop") {
        const connection = getVoiceConnection(guildId);
        if (connection) connection.destroy();

        queue.delete(guildId);
        return interaction.reply("⏹️ Stopped");
    }

    /* ---------------- MODERATION ---------------- */

    if (!interaction.member.permissions) return;

    if (interaction.commandName === "ban") {
        const user = interaction.options.getMember("user");
        await user.ban();
        return interaction.reply("🔨 Banned");
    }

    if (interaction.commandName === "kick") {
        const user = interaction.options.getMember("user");
        await user.kick();
        return interaction.reply("👢 Kicked");
    }

    if (interaction.commandName === "timeout") {
        const user = interaction.options.getMember("user");
        const minutes = interaction.options.getInteger("minutes");

        await user.timeout(minutes * 60000);
        return interaction.reply("⏳ Timeout gesetzt");
    }

    if (interaction.commandName === "clear") {
        const amount = interaction.options.getInteger("amount");

        await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: "🧹 gelöscht", ephemeral: true });
    }
});

client.login(token);

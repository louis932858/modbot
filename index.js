const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    MessageFlags
} = require("discord.js");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
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

// 🎵 Queue System
const queue = new Map();

client.once("clientReady", () => {
    console.log(`${client.user.tag} ist online!`);
});

/* ---------------- MUSIC ---------------- */
async function playSong(guildId, song, interaction) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) return;

    const stream = await play.stream(song.url);
    const resource = createAudioResource(stream.stream, {
        inputType: stream.type
    });

    serverQueue.player.play(resource);

    serverQueue.player.once("idle", () => {
        queue.delete(guildId);
    });
}

/* ---------------- INTERACTIONS ---------------- */
client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const guildId = interaction.guild.id;

    /* -------- PLAY -------- */
    if (interaction.commandName === "play") {

        const voice = interaction.member.voice.channel;

        if (!voice) {
            return interaction.reply({
                content: "❌ Du bist in keinem Voice Channel",
                flags: MessageFlags.Ephemeral
            });
        }

        const query = interaction.options.getString("song");

        const search = await play.search(query, { limit: 1 });
        if (!search.length) {
            return interaction.reply({
                content: "❌ Kein Song gefunden",
                flags: MessageFlags.Ephemeral
            });
        }

        const song = search[0];

        const player = createAudioPlayer();

        queue.set(guildId, {
            player,
            voiceChannel: voice
        });

        const connection = joinVoiceChannel({
            channelId: voice.id,
            guildId: guildId,
            adapterCreator: voice.guild.voiceAdapterCreator
        });

        connection.subscribe(player);

        await playSong(guildId, song, interaction);

        return interaction.reply(`🎵 Jetzt spielt: **${song.title}**`);
    }

    /* -------- SKIP -------- */
    if (interaction.commandName === "skip") {
        const conn = getVoiceConnection(guildId);

        if (!conn) {
            return interaction.reply("❌ Nichts spielt");
        }

        conn.state.subscription.player.stop();
        return interaction.reply("⏭️ Skip");
    }

    /* -------- STOP -------- */
    if (interaction.commandName === "stop") {
        const conn = getVoiceConnection(guildId);

        if (conn) conn.destroy();

        queue.delete(guildId);
        return interaction.reply("⏹️ Stop");
    }

    /* -------- MODERATION -------- */

    if (interaction.commandName === "ban") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply("❌ Keine Rechte");

        const user = interaction.options.getMember("user");
        await user.ban();

        return interaction.reply("🔨 Gebannt");
    }

    if (interaction.commandName === "kick") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return interaction.reply("❌ Keine Rechte");

        const user = interaction.options.getMember("user");
        await user.kick();

        return interaction.reply("👢 Gekickt");
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

        return interaction.reply({
            content: "🧹 Chat gelöscht",
            flags: MessageFlags.Ephemeral
        });
    }
});

client.login(token);

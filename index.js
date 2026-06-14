const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

const TOKEN = process.env.TOKEN;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID;

/* ---------------- READY ---------------- */
client.once("clientReady", async () => {
    console.log(`${client.user.tag} online`);

    const voiceChannel = await client.channels.fetch(VOICE_CHANNEL_ID);
    const textChannel = await client.channels.fetch(TEXT_CHANNEL_ID);

    if (!voiceChannel) return console.log("❌ Voice Channel nicht gefunden");

    // 🔊 Join Voice
    joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    console.log("🎧 Bot ist im Voice Channel");

    // 👋 Begrüßung
    if (textChannel) {
        textChannel.send("👋 Hallo! Ich bin jetzt im Voice Channel aktiv!");
    }
});

/* ---------------- AUTO REJOIN ---------------- */
client.on("voiceStateUpdate", (oldState, newState) => {

    // Wenn Bot gekickt wird → wieder joinen
    if (oldState.id === client.user.id && !newState.channelId) {

        const channel = newState.guild.channels.cache.get(VOICE_CHANNEL_ID);
        if (!channel) return;

        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        console.log("🔁 Rejoin Voice Channel");
    }
});

client.login(TOKEN);

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus
} = require("@discordjs/voice");

const fs = require("fs");
const { token } = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- COMMANDS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    /* JOIN VOICE */
    if (interaction.commandName === "join") {

        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply("❌ Du bist in keinem Voice Channel");
        }

        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        return interaction.reply(`🎧 Ich bin in ${channel.name}`);
    }

    /* TALK (TTS SIMPLE) */
    if (interaction.commandName === "say") {

        const text = interaction.options.getString("text");

        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply("❌ Kein Voice Channel");

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        const player = createAudioPlayer();

        // einfache TTS Datei (Fake Voice via URL)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=tw-ob`;

        const resource = createAudioResource(url);

        connection.subscribe(player);
        player.play(resource);

        return interaction.reply("🗣️ Ich spreche jetzt!");
    }
});

/* ---------------- REGISTER COMMANDS ---------------- */
async function deploy() {

    const commands = [
        new SlashCommandBuilder()
            .setName("join")
            .setDescription("Bot joint deinem Voice Channel"),

        new SlashCommandBuilder()
            .setName("say")
            .setDescription("Bot spricht Text")
            .addStringOption(o =>
                o.setName("text")
                    .setDescription("Text zum sprechen")
                    .setRequired(true)
            )
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(token);

    const app = await rest.get(Routes.oauth2CurrentApplication());

    await rest.put(
        Routes.applicationCommands(app.id),
        { body: commands }
    );

    console.log("✅ Commands registriert");
}

deploy();

client.login(token);

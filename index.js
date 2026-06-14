const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

const TOKEN = process.env.TOKEN;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- VOICE FOLLOW SYSTEM ---------------- */
client.on("voiceStateUpdate", async (oldState, newState) => {

    const textChannel = await client.channels.fetch(TEXT_CHANNEL_ID);

    // User geht in Call → Bot joint
    if (newState.channelId === VOICE_CHANNEL_ID && oldState.channelId !== VOICE_CHANNEL_ID) {

        joinVoiceChannel({
            channelId: VOICE_CHANNEL_ID,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        if (textChannel) {
            textChannel.send(`🎧 ${newState.member.user.tag} ist im Voice!`);
        }
    }

    // Call leer → Bot geht raus
    if (oldState.channelId === VOICE_CHANNEL_ID && newState.channelId !== VOICE_CHANNEL_ID) {

        const channel = oldState.guild.channels.cache.get(VOICE_CHANNEL_ID);

        if (channel && channel.members.size === 0) {

            const conn = getVoiceConnection(oldState.guild.id);
            if (conn) conn.destroy();

            if (textChannel) {
                textChannel.send("🔇 Voice leer → Bot verlässt Call");
            }
        }
    }
});

/* ---------------- COMMAND HANDLING ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    /* ---------------- /listrole ---------------- */
    if (interaction.commandName === "listrole") {

        const role = interaction.options.getRole("role");

        if (!role) {
            return interaction.reply("❌ Rolle nicht gefunden");
        }

        const members = role.members.map(m => `• ${m.user.tag}`).join("\n");

        return interaction.reply({
            content: `📋 **Mitglieder mit Rolle ${role.name}:**\n\n${members || "Niemand hat diese Rolle"}`,
            ephemeral: false
        });
    }
});

/* ---------------- REGISTER COMMANDS ---------------- */
async function deploy() {

    const commands = [
        new SlashCommandBuilder()
            .setName("listrole")
            .setDescription("Zeigt alle User mit einer Rolle")
            .addRoleOption(o =>
                o.setName("role")
                    .setDescription("Rolle auswählen")
                    .setRequired(true)
            )
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    const app = await rest.get(Routes.oauth2CurrentApplication());

    await rest.put(
        Routes.applicationCommands(app.id),
        { body: commands }
    );

    console.log("✅ Commands registriert");
}

deploy();

client.login(TOKEN);

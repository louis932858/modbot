const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder
} = require("discord.js");

const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

const TOKEN = process.env.TOKEN;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);

    // 🎧 Bot joint automatisch Voice Channel
    const guild = client.guilds.cache.first();

    if (!guild) return;

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

    if (channel) {
        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false
        });

        console.log("🎧 Bot im Voice Channel");
    }
});

/* ---------------- VOICE TRACKING ---------------- */
client.on("voiceStateUpdate", async (oldState, newState) => {

    const guild = newState.guild;
    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

    if (!channel) return;

    // 👤 jemand geht in Call
    if (newState.channelId === VOICE_CHANNEL_ID && oldState.channelId !== VOICE_CHANNEL_ID) {

        const connection = joinVoiceChannel({
            channelId: VOICE_CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false
        });

        console.log(`🎧 ${newState.member.user.tag} im Call`);
    }

    // 👤 Call leer → Bot geht raus
    if (oldState.channelId === VOICE_CHANNEL_ID && newState.channelId !== VOICE_CHANNEL_ID) {

        if (channel.members.size === 0) {
            const conn = getVoiceConnection(guild.id);
            if (conn) conn.destroy();

            console.log("🔇 Call leer → Bot raus");
        }
    }
});

/* ---------------- /listrole ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "listrole") {

        await interaction.guild.members.fetch();

        const roles = interaction.guild.roles.cache
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => b.position - a.position);

        const embed = new EmbedBuilder()
            .setTitle("📋 Rollen + Mitglieder Übersicht")
            .setColor("Blue");

        let desc = "";

        roles.forEach(role => {

            const members = role.members.map(m => m.user.tag);

            desc += `\n**🔹 ${role.name} (${role.members.size})**\n`;

            if (members.length > 0) {
                desc += members.map(u => `• ${u}`).join("\n") + "\n";
            } else {
                desc += "• Niemand\n";
            }
        });

        if (desc.length > 4000) {
            desc = desc.slice(0, 4000) + "\n...gekürzt";
        }

        embed.setDescription(desc);

        return interaction.reply({ embeds: [embed] });
    }
});

/* ---------------- REGISTER COMMAND ---------------- */
async function deploy() {

    const commands = [
        new SlashCommandBuilder()
            .setName("listrole")
            .setDescription("Zeigt alle Rollen + Mitglieder")
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    const app = await rest.get(Routes.oauth2CurrentApplication());

    await rest.put(
        Routes.applicationCommands(app.id),
        { body: commands }
    );

    console.log("✅ Command registriert");
}

deploy();

client.login(TOKEN);

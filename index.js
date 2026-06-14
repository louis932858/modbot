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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

/* ---------------- MEMORY (TEMP STORAGE) ---------------- */
const guildConfig = new Map();

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- COMMANDS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    const guildId = interaction.guild.id;

    /* ---------------- /CONFIG ---------------- */
    if (interaction.commandName === "config") {

        const role = interaction.options.getRole("role");

        if (!guildConfig.has(guildId)) {
            guildConfig.set(guildId, []);
        }

        const list = guildConfig.get(guildId);

        if (!list.includes(role.id)) {
            list.push(role.id);
        }

        guildConfig.set(guildId, list);

        return interaction.reply({
            content: `⚙️ Rolle **${role.name}** wurde zur Liste hinzugefügt`,
            ephemeral: true
        });
    }

    /* ---------------- /LISTROLE ---------------- */
    if (interaction.commandName === "listrole") {

        await interaction.guild.members.fetch();

        const allowedRoles = guildConfig.get(guildId) || [];

        if (allowedRoles.length === 0) {
            return interaction.reply("❌ Keine Rollen konfiguriert. Nutze /config");
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 Team Rollen Übersicht")
            .setColor("Blue");

        let desc = "";

        for (const roleId of allowedRoles) {

            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) continue;

            const members = role.members.map(m => m.user.tag);

            desc += `\n**🔹 ${role.name} (${role.members.size})**\n`;

            if (members.length > 0) {
                desc += members.map(u => `• ${u}`).join("\n") + "\n";
            } else {
                desc += "• Niemand\n";
            }
        }

        embed.setDescription(desc || "Keine Daten");

        return interaction.reply({ embeds: [embed] });
    }

    /* ---------------- /JOIN ---------------- */
    if (interaction.commandName === "join") {

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: "❌ Du bist in keinem Voice Channel!",
                ephemeral: true
            });
        }

        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        return interaction.reply(`🎧 Ich bin in **${voiceChannel.name}**`);
    }

    /* ---------------- /LEAVE ---------------- */
    if (interaction.commandName === "leave") {

        const conn = getVoiceConnection(interaction.guild.id);

        if (conn) conn.destroy();

        return interaction.reply("👋 Voice verlassen");
    }
});

/* ---------------- REGISTER COMMANDS ---------------- */
async function deploy() {

    const commands = [
        new SlashCommandBuilder()
            .setName("config")
            .setDescription("Füge eine Rolle zur Teamliste hinzu")
            .addRoleOption(o =>
                o.setName("role")
                    .setDescription("Rolle auswählen")
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName("listrole")
            .setDescription("Zeigt konfigurierte Team Rollen"),

        new SlashCommandBuilder()
            .setName("join")
            .setDescription("Bot joint deinen Voice Channel"),

        new SlashCommandBuilder()
            .setName("leave")
            .setDescription("Bot verlässt Voice Channel")
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

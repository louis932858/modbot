const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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

/* ---------------- MEMORY ---------------- */
const guildConfig = new Map();

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- HELPERS ---------------- */
function getConfig(guildId) {
    if (!guildConfig.has(guildId)) guildConfig.set(guildId, []);
    return guildConfig.get(guildId);
}

/* ---------------- INTERACTIONS ---------------- */
client.on("interactionCreate", async (interaction) => {

    const guildId = interaction.guild.id;

    /* ---------------- /CONFIG ---------------- */
    if (interaction.isChatInputCommand() && interaction.commandName === "config") {

        await interaction.guild.roles.fetch();

        const roles = interaction.guild.roles.cache
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => b.position - a.position);

        const config = getConfig(guildId);

        const rows = [];
        let row = new ActionRowBuilder();

        let count = 0;

        roles.forEach(role => {

            const active = config.includes(role.id);

            const btn = new ButtonBuilder()
                .setCustomId(`role_${role.id}`)
                .setLabel(`${active ? "✅" : "❌"} ${role.name}`)
                .setStyle(active ? ButtonStyle.Success : ButtonStyle.Secondary);

            row.addComponents(btn);
            count++;

            if (count === 5) {
                rows.push(row);
                row = new ActionRowBuilder();
                count = 0;
            }
        });

        if (row.components.length > 0) rows.push(row);

        return interaction.reply({
            content: "⚙️ Klicke auf Rollen um sie zu aktivieren/deaktivieren:",
            components: rows,
            ephemeral: true
        });
    }

    /* ---------------- BUTTON TOGGLE ---------------- */
    if (interaction.isButton()) {

        if (!interaction.customId.startsWith("role_")) return;

        const roleId = interaction.customId.replace("role_", "");
        const config = getConfig(interaction.guild.id);

        if (config.includes(roleId)) {
            guildConfig.set(
                interaction.guild.id,
                config.filter(r => r !== roleId)
            );
        } else {
            config.push(roleId);
            guildConfig.set(interaction.guild.id, config);
        }

        return interaction.update({
            content: "⚙️ Config aktualisiert! /config erneut öffnen",
            components: []
        });
    }

    /* ---------------- /LISTROLE ---------------- */
    if (interaction.isChatInputCommand() && interaction.commandName === "listrole") {

        await interaction.guild.members.fetch();

        const config = getConfig(guildId);

        if (config.length === 0) {
            return interaction.reply("❌ Keine Rollen aktiviert. Nutze /config");
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 Team Rollen Übersicht")
            .setColor("Blue");

        let desc = "";

        for (const roleId of config) {

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
    if (interaction.isChatInputCommand() && interaction.commandName === "join") {

        const voice = interaction.member.voice.channel;

        if (!voice) {
            return interaction.reply({
                content: "❌ Du bist in keinem Voice Channel!",
                ephemeral: true
            });
        }

        joinVoiceChannel({
            channelId: voice.id,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        return interaction.reply(`🎧 Ich bin in **${voice.name}**`);
    }

    /* ---------------- /LEAVE ---------------- */
    if (interaction.isChatInputCommand() && interaction.commandName === "leave") {

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
            .setDescription("Team Rollen auswählen (Toggle Menü)"),

        new SlashCommandBuilder()
            .setName("listrole")
            .setDescription("Zeigt aktive Team Rollen"),

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

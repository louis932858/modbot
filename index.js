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

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- COMMANDS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    /* ---------------- /JOIN ---------------- */
    if (interaction.commandName === "join") {

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: "❌ Du musst in einem Voice Channel sein!",
                ephemeral: true
            });
        }

        // Bot joint den Channel der Person
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        return interaction.reply(`🎧 Ich bin jetzt in **${voiceChannel.name}**`);
    }

    /* ---------------- /LEAVE (optional) ---------------- */
    if (interaction.commandName === "leave") {

        const conn = getVoiceConnection(interaction.guild.id);

        if (!conn) {
            return interaction.reply({
                content: "❌ Ich bin in keinem Voice Channel",
                ephemeral: true
            });
        }

        conn.destroy();

        return interaction.reply("👋 Voice verlassen");
    }

    /* ---------------- /LISTROLE ---------------- */
    if (interaction.commandName === "listrole") {

        await interaction.guild.members.fetch();

        const roles = interaction.guild.roles.cache
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => b.position - a.position);

        const embed = new EmbedBuilder()
            .setTitle("📋 Rollen Übersicht")
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

/* ---------------- REGISTER COMMANDS ---------------- */
async function deploy() {

    const commands = [
        new SlashCommandBuilder()
            .setName("join")
            .setDescription("Bot joint deinen Voice Channel"),

        new SlashCommandBuilder()
            .setName("leave")
            .setDescription("Bot verlässt Voice Channel"),

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

    console.log("✅ Commands registriert");
}

deploy();

client.login(TOKEN);

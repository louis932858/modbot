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

// 👉 Admin Role ID (deine Rolle)
const ADMIN_ROLE_ID = "1439241591041560576";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

/* ---------------- READY ---------------- */
client.once("ready", async () => {
    console.log(`${client.user.tag} online`);

    for (const guild of client.guilds.cache.values()) {
        await updateNicknames(guild);
    }
});

/* ---------------- NICKNAME SYSTEM ---------------- */
async function updateNicknames(guild) {
    await guild.members.fetch();

    for (const member of guild.members.cache.values()) {

        if (member.user.bot) continue;
        if (!member.manageable) continue;

        // höchste Rolle finden (inkl. Admin override)
        let highestRole = member.roles.highest;

        // Admin Priorität erzwingen
        if (member.roles.cache.has(ADMIN_ROLE_ID)) {
            highestRole = member.guild.roles.cache.get(ADMIN_ROLE_ID);
        }

        if (!highestRole || highestRole.name === "@everyone") continue;

        const newNick = `[${highestRole.name}] ${member.user.username}`;

        try {
            await member.setNickname(newNick);
        } catch (err) {
            console.log(`Nickname Fehler bei ${member.user.tag}`);
        }
    }
}

/* ---------------- ROLE UPDATE LIVE ---------------- */
client.on("guildMemberUpdate", async (oldMember, newMember) => {

    if (newMember.user.bot) return;
    if (!newMember.manageable) return;

    let highestRole = newMember.roles.highest;

    if (newMember.roles.cache.has(ADMIN_ROLE_ID)) {
        highestRole = newMember.guild.roles.cache.get(ADMIN_ROLE_ID);
    }

    if (!highestRole || highestRole.name === "@everyone") return;

    const newNick = `[${highestRole.name}] ${newMember.user.username}`;

    try {
        await newMember.setNickname(newNick);
    } catch (err) {}
});

/* ---------------- COMMANDS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

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

/* ---------------- DEPLOY COMMANDS ---------------- */
async function deploy() {

    const commands = [
        new SlashCommandBuilder()
            .setName("join")
            .setDescription("Bot joint Voice Channel"),

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

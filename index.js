const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const {
    joinVoiceChannel,
    getVoiceConnection
} = require("@discordjs/voice");

const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once("ready", async () => {
    console.log(`${client.user.tag} ist online!`);

    try {
        const app = await client.application.fetch();

        const commands = [
            new SlashCommandBuilder()
                .setName("join")
                .setDescription("Joint deinem Sprachkanal"),

            new SlashCommandBuilder()
                .setName("leave")
                .setDescription("Verlässt den Sprachkanal")
        ];

        const rest = new REST({ version: "10" }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(app.id),
            {
                body: commands.map(cmd => cmd.toJSON())
            }
        );

        console.log("✅ Slash Commands registriert");
    } catch (err) {
        console.error(err);
    }
});

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "join") {

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: "❌ Du musst in einem Sprachkanal sein.",
                ephemeral: true
            });
        }

        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        return interaction.reply(
            `✅ Sprachkanal **${voiceChannel.name}** beigetreten.`
        );
    }

    if (interaction.commandName === "leave") {

        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply({
                content: "❌ Ich bin in keinem Sprachkanal.",
                ephemeral: true
            });
        }

        connection.destroy();

        return interaction.reply("👋 Sprachkanal verlassen.");
    }
});

client.login(TOKEN);

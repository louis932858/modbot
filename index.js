const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const { token } = require("./config");

process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- COMMANDS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    /* BAN */
    if (interaction.commandName === "ban") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply({ content: "❌ Keine Rechte", flags: MessageFlags.Ephemeral });

        const user = interaction.options.getMember("user");
        await user.ban();

        return interaction.reply("🔨 gebannt");
    }

    /* KICK */
    if (interaction.commandName === "kick") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return interaction.reply({ content: "❌ Keine Rechte", flags: MessageFlags.Ephemeral });

        const user = interaction.options.getMember("user");
        await user.kick();

        return interaction.reply("👢 gekickt");
    }

    /* TIMEOUT */
    if (interaction.commandName === "timeout") {
        const user = interaction.options.getMember("user");
        const minutes = interaction.options.getInteger("minutes");

        await user.timeout(minutes * 60000);

        return interaction.reply("⏳ timeout gesetzt");
    }

    /* CLEAR */
    if (interaction.commandName === "clear") {
        const amount = interaction.options.getInteger("amount");

        await interaction.channel.bulkDelete(amount, true);

        return interaction.reply({
            content: "🧹 gelöscht",
            flags: MessageFlags.Ephemeral
        });
    }

    /* TICKET PANEL */
    if (interaction.commandName === "ticket") {

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_open")
                .setLabel("🎫 Ticket erstellen")
                .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
            content: "Support Tickets",
            components: [row]
        });
    }
});

/* ---------------- BUTTONS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    if (interaction.customId === "ticket_open") {

        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages
                    ]
                }
            ]
        });

        await channel.send(`Hallo ${interaction.user}, beschreibe dein Problem.`);

        return interaction.reply({
            content: `Ticket erstellt: ${channel}`,
            flags: MessageFlags.Ephemeral
        });
    }
});

client.login(token);

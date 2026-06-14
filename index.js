const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { token } = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.once("ready", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- COMMANDS ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (interaction.isChatInputCommand()) {

        // 🎫 Ticket Panel
        if (interaction.commandName === "ticketpanel") {

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

        // 🔨 BAN
        if (interaction.commandName === "ban") {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
                return interaction.reply({ content: "Keine Rechte", ephemeral: true });

            const user = interaction.options.getMember("user");
            await user.ban();

            return interaction.reply("User gebannt");
        }

        // 👢 KICK
        if (interaction.commandName === "kick") {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
                return interaction.reply({ content: "Keine Rechte", ephemeral: true });

            const user = interaction.options.getMember("user");
            await user.kick();

            return interaction.reply("User gekickt");
        }

        // ⏳ TIMEOUT
        if (interaction.commandName === "timeout") {
            const user = interaction.options.getMember("user");
            const minutes = interaction.options.getInteger("minutes");

            await user.timeout(minutes * 60000);
            return interaction.reply("User getimeoutet");
        }

        // 🧹 CLEAR
        if (interaction.commandName === "clear") {
            const amount = interaction.options.getInteger("amount");

            await interaction.channel.bulkDelete(amount, true);
            return interaction.reply({ content: "Nachrichten gelöscht", ephemeral: true });
        }
    }

    /* ---------------- TICKETS ---------------- */
    if (interaction.isButton()) {

        // 🎫 OPEN TICKET
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

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("🔒 Ticket schließen")
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `Hallo ${interaction.user}, beschreibe dein Problem.`,
                components: [row]
            });

            return interaction.reply({
                content: `Ticket erstellt: ${channel}`,
                ephemeral: true
            });
        }

        // 🔒 CLOSE TICKET
        if (interaction.customId === "ticket_close") {

            await interaction.reply("Ticket wird geschlossen...");

            setTimeout(() => {
                interaction.channel.delete();
            }, 3000);
        }
    }
});

client.login(token);

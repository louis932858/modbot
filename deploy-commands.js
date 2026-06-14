const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { token } = require("./config");

const commands = [
    new SlashCommandBuilder().setName("ticketpanel").setDescription("Ticket Panel senden"),

    new SlashCommandBuilder()
        .setName("ban")
        .setDescription("User bannen")
        .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription("User kicken")
        .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("User muten")
        .addUserOption(o => o.setName("user").setRequired(true))
        .addIntegerOption(o => o.setName("minutes").setRequired(true)),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Nachrichten löschen")
        .addIntegerOption(o => o.setName("amount").setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    const app = await rest.get(Routes.oauth2CurrentApplication());

    await rest.put(
        Routes.applicationCommands(app.id),
        { body: commands }
    );

    console.log("✅ Commands deployed");
})();

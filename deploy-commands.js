const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { token } = require("./config");

const GUILD_ID = "1496179321704943776";

const commands = [
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
        .setDescription("User timeout")
        .addUserOption(o => o.setName("user").setRequired(true))
        .addIntegerOption(o => o.setName("minutes").setRequired(true)),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Chat löschen")
        .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Ticket Panel senden")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(
            (await rest.get(Routes.oauth2CurrentApplication())).id,
            GUILD_ID
        ),
        { body: commands }
    );

    console.log("✅ Commands registriert");
})();

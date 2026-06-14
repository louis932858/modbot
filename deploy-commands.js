const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { token } = require("./config");

const commands = [

    // 🎵 MUSIC
    new SlashCommandBuilder()
        .setName("play")
        .setDescription("Musik abspielen")
        .addStringOption(o =>
            o.setName("song")
            .setDescription("Song Name")
            .setRequired(true)
        ),

    new SlashCommandBuilder().setName("skip").setDescription("Skip Song"),
    new SlashCommandBuilder().setName("stop").setDescription("Stop Musik"),

    // 🔨 MODERATION
    new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban User")
        .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick User")
        .addUserOption(o => o.setName("user").setRequired(true)),

    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout User")
        .addUserOption(o => o.setName("user").setRequired(true))
        .addIntegerOption(o => o.setName("minutes").setRequired(true)),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Chats löschen")
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

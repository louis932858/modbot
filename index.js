const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

const TOKEN = process.env.TOKEN;
const TARGET_VOICE = process.env.VOICE_CHANNEL_ID;
const TEXT_CHANNEL = process.env.TEXT_CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;

let botConnectedChannel = null;

/* ---------------- READY ---------------- */
client.once("clientReady", () => {
    console.log(`${client.user.tag} online`);
});

/* ---------------- VOICE TRACKING ---------------- */
client.on("voiceStateUpdate", async (oldState, newState) => {

    const textChannel = await client.channels.fetch(TEXT_CHANNEL);

    // 👤 USER GEHT IN TARGET CHANNEL
    if (newState.channelId === TARGET_VOICE && oldState.channelId !== TARGET_VOICE) {

        // Bot joint auch
        const connection = joinVoiceChannel({
            channelId: TARGET_VOICE,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        botConnectedChannel = TARGET_VOICE;

        // 🔔 Nachricht + Role Mention
        if (textChannel) {
            textChannel.send(
                `🎧 <@&${ROLE_ID}> ${newState.member.user.tag} ist im Voice Channel!`
            );
        }

        console.log("➡️ Bot joined Voice");
    }

    // 👤 USER VERLÄSST CHANNEL
    if (oldState.channelId === TARGET_VOICE && newState.channelId !== TARGET_VOICE) {

        // Check ob noch Leute im Channel sind
        const channel = oldState.guild.channels.cache.get(TARGET_VOICE);

        if (channel && channel.members.size === 0) {

            const connection = getVoiceConnection(oldState.guild.id);
            if (connection) connection.destroy();

            botConnectedChannel = null;

            if (textChannel) {
                textChannel.send("🔇 Kein User mehr im Voice → Bot verlässt Channel");
            }

            console.log("⬅️ Bot left Voice");
        }
    }
});

/* ---------------- START ---------------- */
client.login(TOKEN);

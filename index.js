const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

/* ---------------- ENV ---------------- */
const TOKEN = process.env.TOKEN;

const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID;
const UNVERIFIED_ROLE_ID = process.env.UNVERIFIED_ROLE_ID;
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID;

const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID;
const ROLE_MENTION_ID = process.env.ROLE_MENTION_ID;

/* ---------------- READY ---------------- */
client.once("clientReady", async () => {
    console.log(`${client.user.tag} online`);

    // 🔐 Verification Button senden
    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);

    if (channel) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("verify_btn")
                .setLabel("✅ Verifizieren")
                .setStyle(ButtonStyle.Success)
        );

        channel.send({
            content: "🔐 Klicke um dich zu verifizieren",
            components: [row]
        });
    }

    // 🎧 Auto Join Voice
    const voice = await client.channels.fetch(VOICE_CHANNEL_ID);

    if (voice) {
        joinVoiceChannel({
            channelId: voice.id,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        console.log("🎧 Bot im Voice Channel");
    }
});

/* ---------------- VERIFICATION ---------------- */
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    if (interaction.customId === "verify_btn") {

        const member = interaction.member;

        try {
            await member.roles.remove(UNVERIFIED_ROLE_ID);
            await member.roles.add(VERIFIED_ROLE_ID);

            return interaction.reply({
                content: "✅ Du bist jetzt verifiziert!",
                ephemeral: true
            });

        } catch (err) {
            console.log(err);
        }
    }
});

/* ---------------- VOICE TRACKING ---------------- */
client.on("voiceStateUpdate", async (oldState, newState) => {

    const textChannel = await client.channels.fetch(TEXT_CHANNEL_ID);

    // 👤 User geht in Target Call
    if (newState.channelId === VOICE_CHANNEL_ID && oldState.channelId !== VOICE_CHANNEL_ID) {

        joinVoiceChannel({
            channelId: VOICE_CHANNEL_ID,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        if (textChannel) {
            textChannel.send(
                `🎧 <@&${ROLE_MENTION_ID}> ${newState.member.user.tag} ist im Call!`
            );
        }

        console.log("➡️ Follow Voice");
    }

    // 👤 User verlässt Call
    if (oldState.channelId === VOICE_CHANNEL_ID && newState.channelId !== VOICE_CHANNEL_ID) {

        const channel = oldState.guild.channels.cache.get(VOICE_CHANNEL_ID);

        if (channel && channel.members.size === 0) {

            const conn = getVoiceConnection(oldState.guild.id);
            if (conn) conn.destroy();

            if (textChannel) {
                textChannel.send("🔇 Call leer → Bot geht raus");
            }

            console.log("⬅️ Bot left Voice");
        }
    }
});

/* ---------------- LOGIN ---------------- */
client.login(TOKEN);

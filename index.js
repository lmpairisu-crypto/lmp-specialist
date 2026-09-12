// ==========================================
// LAMPOON EXPANDABLE DISCORD BOT
// ==========================================

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const http = require("http");

// ==========================================
// RENDER WEB SERVER
// ==========================================

const PORT = Number(process.env.PORT) || 10000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    return res.end("OK");
  }

  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("LAMPOON Bot is online.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ==========================================
// LOAD LAMPOON CONFIG
// ==========================================

const configPath = path.join(__dirname, "lampoon.json");

let lampoon;

try {
  lampoon = JSON.parse(
    fs.readFileSync(configPath, "utf8")
  );

  console.log("✅ lampoon.json loaded successfully.");
} catch (error) {
  console.error("❌ Failed to load lampoon.json:", error);
  process.exit(1);
}

// ==========================================
// DISCORD CLIENT
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// ==========================================
// MAIN EMBED
// ==========================================

function createMainEmbed() {
  return new EmbedBuilder()
    .setColor(lampoon.colors?.main || "#D4AF37")
    .setTitle(lampoon.title || "LAMPOON")
    .setDescription(
      lampoon.description ||
      "Where HOK meets satire, creativity, and chaos."
    )
    .setFooter({
      text: lampoon.subtitle || "LAMPOON"
    })
    .setTimestamp();
}

// ==========================================
// BUTTONS
// ==========================================

function createButtons(activeSection = null) {
  const buttons = [];

  for (const [id, section] of Object.entries(lampoon.sections || {})) {

    let label = section.button || id;

    // Remove emoji from the beginning of the label
    label = label.replace(/^.{1,2}\s/, "");

    const button = new ButtonBuilder()
      .setCustomId(`lampoon_${id}`)
      .setLabel(label)
      .setStyle(
        activeSection === id
          ? ButtonStyle.Secondary
          : ButtonStyle.Primary
      );

    // Try to use the section emoji if available
    if (section.emoji) {
      button.setEmoji(section.emoji);
    }

    buttons.push(button);
  }

  const rows = [];

  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder().addComponents(
        buttons.slice(i, i + 5)
      )
    );
  }

  return rows;
}

// ==========================================
// BOT READY
// ==========================================

client.once("ready", async () => {
  console.log("==========================================");
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log("==========================================");

  try {

    // ======================================
    // YOUR LAMPOON CHANNEL
    // ======================================

    const channelId = "1539651469819641857";

    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      console.error("❌ LAMPOON channel not found.");
      return;
    }

    if (!channel.isTextBased()) {
      console.error("❌ LAMPOON channel is not a text channel.");
      return;
    }

    console.log(`📢 Posting LAMPOON panel in #${channel.name}`);

    await channel.send({
      embeds: [
        createMainEmbed()
      ],
      components: createButtons()
    });

    console.log("✅ LAMPOON panel posted successfully.");

  } catch (error) {
    console.error(
      "❌ Failed to post LAMPOON panel:",
      error
    );
  }
});

// ==========================================
// BUTTON INTERACTIONS
// ==========================================

client.on("interactionCreate", async interaction => {

  // Ignore anything that isn't a button
  if (!interaction.isButton()) {
    return;
  }

  // Only handle LAMPOON buttons
  if (!interaction.customId.startsWith("lampoon_")) {
    return;
  }

  try {

    // ======================================
    // GET SECTION ID
    // ======================================

    const sectionId = interaction.customId.replace(
      "lampoon_",
      ""
    );

    const section = lampoon.sections?.[sectionId];

    // ======================================
    // SECTION NOT FOUND
    // ======================================

    if (!section) {

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Information section not found.",
          ephemeral: true
        });
      }

      return;
    }

    // ======================================
    // ACKNOWLEDGE DISCORD IMMEDIATELY
    // ======================================
    // This prevents:
    // "The application didn't respond in time."

    await interaction.deferUpdate();

    // ======================================
    // CHECK CURRENT EMBEDS
    // ======================================

    const currentEmbeds = interaction.message.embeds;

    const alreadyOpen =
      currentEmbeds.length > 1 &&
      currentEmbeds[1].title === section.title;

    // ======================================
    // COLLAPSE
    // ======================================

    if (alreadyOpen) {

      await interaction.message.edit({
        embeds: [
          createMainEmbed()
        ],
        components: createButtons()
      });

      console.log(
        `🔽 Collapsed section: ${sectionId}`
      );

      return;
    }

    // ======================================
    // EXPANDED EMBED COLOR
    // ======================================

    const detailColor =
      lampoon.colors?.[sectionId] ||
      lampoon.colors?.expanded ||
      "#C0C0C0";

    // ======================================
    // CREATE DETAIL EMBED
    // ======================================

    const detailEmbed = new EmbedBuilder()
      .setColor(detailColor)
      .setTitle(section.title || "LAMPOON")
      .setDescription(
        `**${section.scenario || ""}**\n\n` +
        `${section.content || ""}`
      )
      .setFooter({
        text:
          "LAMPOON • Click the same button to collapse"
      })
      .setTimestamp();

    // ======================================
    // UPDATE MESSAGE
    // ======================================

    await interaction.message.edit({
      embeds: [
        createMainEmbed(),
        detailEmbed
      ],
      components: createButtons(sectionId)
    });

    console.log(
      `🔼 Opened section: ${sectionId}`
    );

  } catch (error) {

    console.error(
      "❌ Button interaction error:",
      error
    );

    // ======================================
    // TRY TO RESPOND IF POSSIBLE
    // ======================================

    try {

      if (!interaction.replied && !interaction.deferred) {

        await interaction.reply({
          content:
            "❌ Something went wrong while opening this section.",
          ephemeral: true
        });

      }

    } catch (replyError) {

      console.error(
        "❌ Could not send error response:",
        replyError
      );

    }
  }
});

// ==========================================
// DISCORD ERROR HANDLING
// ==========================================

client.on("error", error => {
  console.error("❌ Discord client error:", error);
});

process.on("unhandledRejection", error => {
  console.error(
    "❌ Unhandled promise rejection:",
    error
  );
});

process.on("uncaughtException", error => {
  console.error(
    "❌ Uncaught exception:",
    error
  );
});

// ==========================================
// DISCORD LOGIN
// ==========================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error(
    "❌ DISCORD_TOKEN environment variable is missing."
  );

  process.exit(1);
}

client.login(TOKEN).catch(error => {
  console.error(
    "❌ Discord login failed:",
    error
  );

  process.exit(1);
});
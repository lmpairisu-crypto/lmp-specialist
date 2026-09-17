// ==========================================
// LAMPOON DISCORD BOT
// Expandable Embed + Partnership / Collaboration / Sponsorship
// Discord.js v14
// ==========================================

const http = require("http");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const lampoon = require("./lampoon.json");

console.log("✅ lampoon.json loaded successfully.");

// ==========================================
// RENDER WEB SERVER
// ==========================================

const PORT = Number(process.env.PORT) || 10000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        status: "online",
        bot: "LAMPOON",
        timestamp: new Date().toISOString()
      })
    );

    return;
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
    .setColor(lampoon.colors.main || "#D4AF37")
    .setTitle(lampoon.title)
    .setDescription(lampoon.description)
    .setFooter({
      text: "LAMPOON • Honor of Kings Content Creator Community"
    });
}

// ==========================================
// SECTION EMBED
// ==========================================

function createSectionEmbed(sectionId) {
  const section = lampoon.sections[sectionId];

  if (!section) {
    return new EmbedBuilder()
      .setColor(lampoon.colors.expanded || "#C0C0C0")
      .setTitle("LAMPOON")
      .setDescription("This section is currently unavailable.");
  }

  return new EmbedBuilder()
    .setColor(
      lampoon.colors[sectionId] ||
      lampoon.colors.expanded ||
      "#C0C0C0"
    )
    .setTitle(section.title)
    .setDescription(section.content)
    .setFooter({
      text: `LAMPOON • ${section.scenario || "Information"}`
    });
}

// ==========================================
// GET BUTTON EMOJI
// ==========================================

function getButtonEmoji(buttonText) {
  if (!buttonText) {
    return null;
  }

  const match = buttonText.match(/^(\S+)\s/);

  return match ? match[1] : null;
}

// ==========================================
// CREATE MAIN BUTTONS
// ==========================================

function createButtons() {
  const buttons = [];

  for (const [sectionId, section] of Object.entries(
    lampoon.sections
  )) {
    if (!section || !section.button) {
      continue;
    }

    const emoji = getButtonEmoji(section.button);

    const label = section.button
      .replace(/^(\S+)\s/, "")
      .trim();

    const button = new ButtonBuilder()
      .setCustomId(`lampoon_${sectionId}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary);

    if (emoji) {
      button.setEmoji(emoji);
    }

    buttons.push(button);
  }

  // ==========================================
  // DISCORD MAXIMUM:
  // 5 BUTTONS PER ROW
  // ==========================================

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
// CREATE BACK BUTTON
// ==========================================

function createBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("lampoon_back")
      .setLabel("Back")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
  );
}

// ==========================================
// BOT READY
// ==========================================

client.once("ready", () => {
  console.log("==========================================");
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log("==========================================");
});

// ==========================================
// BUTTON INTERACTION HANDLER
// ==========================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) {
    return;
  }

  const customId = interaction.customId;

  // ========================================
  // BACK TO MAIN EMBED
  // ========================================

  if (customId === "lampoon_back") {
    try {
      await interaction.deferUpdate();

      await interaction.editReply({
        embeds: [createMainEmbed()],
        components: createButtons()
      });

      return;
    } catch (error) {
      console.error("❌ Back button error:", error);
      return;
    }
  }

  // ========================================
  // LAMPOON SECTION BUTTON
  // ========================================

  if (customId.startsWith("lampoon_")) {
    const sectionId = customId.replace("lampoon_", "");

    const section = lampoon.sections[sectionId];

    if (!section) {
      try {
        await interaction.reply({
          content: "❌ This LAMPOON section could not be found.",
          ephemeral: true
        });
      } catch (error) {
        console.error(
          "❌ Unknown section response error:",
          error
        );
      }

      return;
    }

    try {
      // Acknowledge the button immediately.
      // This prevents "This interaction failed."
      await interaction.deferUpdate();

      await interaction.editReply({
        embeds: [createSectionEmbed(sectionId)],
        components: [createBackButton()]
      });

      console.log(
        `🎭 LAMPOON section opened: ${sectionId}`
      );

      return;
    } catch (error) {
      console.error(
        `❌ Error handling ${sectionId} button:`,
        error
      );

      return;
    }
  }
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

client
  .login(TOKEN)
  .then(() => {
    console.log("🔐 Discord login successful.");
  })
  .catch((error) => {
    console.error("❌ Discord login failed:", error);
    process.exit(1);
  });

// ==========================================
// PROCESS ERROR HANDLING
// ==========================================

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Promise Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

// ==========================================
// LAMPOON EXPANDABLE DISCORD BOT
// Discord.js v14
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
// LOAD LAMPOON.JSON
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
    .setColor(
      lampoon.colors?.main || "#D4AF37"
    )
    .setTitle(
      lampoon.title || "LAMPOON"
    )
    .setDescription(
      lampoon.description ||
      "Where HOK meets satire, creativity, and chaos."
    )
    .setFooter({
      text:
        lampoon.subtitle ||
        "LAMPOON"
    })
    .setTimestamp();
}

// ------------------------------
// CREATE BUTTON
// ------------------------------

const button = new ButtonBuilder()
  .setCustomId(`lampoon_${sectionId}`)
  .setLabel(section.button.replace(/^.+?\s/, ""))
  .setStyle(ButtonStyle.Primary);

// ------------------------------
// SECTION EMOJI
// ------------------------------

const emojiMatch = section.button.match(/^(\S+)\s/);

if (emojiMatch) {
  button.setEmoji(emojiMatch[1]);
}

buttons.push(button);

// ------------------------------
// CREATE BUTTON
// ------------------------------

const button = new ButtonBuilder()
  .setCustomId(`lampoon_${sectionId}`)
  .setLabel(section.button.replace(/^.+?\s/, ""))
  .setStyle(ButtonStyle.Primary);

// ------------------------------
// SECTION EMOJI
// ------------------------------

const emojiMatch = section.button.match(/^(\S+)\s/);

if (emojiMatch) {
  button.setEmoji(emojiMatch[1]);
}

buttons.push(button);
    
  // ==================================
  // DISCORD MAXIMUM:
  // 5 BUTTONS PER ROW
  // ==================================

  const rows = [];

  for (
    let i = 0;
    i < buttons.length;
    i += 5
  ) {

    rows.push(
      new ActionRowBuilder()
        .addComponents(
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

  console.log(
    "=========================================="
  );

  console.log(
    `🤖 Logged in as ${client.user.tag}`
  );

  console.log(
    `🆔 Bot ID: ${client.user.id}`
  );

  console.log(
    "=========================================="
  );

  try {

    // ======================================
    // LAMPOON CHANNEL
    // ======================================

    const channelId =
      "1539651469819641857";

    const channel =
      await client.channels.fetch(
        channelId
      );

    if (!channel) {

      console.error(
        "❌ LAMPOON channel not found."
      );

      return;
    }

    if (!channel.isTextBased()) {

      console.error(
        "❌ LAMPOON channel is not a text channel."
      );

      return;
    }

    console.log(
      `📢 Posting LAMPOON panel in #${channel.name}`
    );

    // ======================================
    // POST PANEL
    // ======================================

    await channel.send({
      embeds: [
        createMainEmbed()
      ],
      components:
        createButtons()
    });

    console.log(
      "✅ LAMPOON panel posted successfully."
    );

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

client.on(
  "interactionCreate",
  async interaction => {

    // ======================================
    // ONLY HANDLE BUTTONS
    // ======================================

    if (!interaction.isButton()) {
      return;
    }

    // ======================================
    // ONLY HANDLE LAMPOON BUTTONS
    // ======================================

    if (
      !interaction.customId.startsWith(
        "lampoon_"
      )
    ) {

      return;
    }

    console.log(
      `🔘 Button clicked: ${interaction.customId}`
    );

    try {

      // ====================================
      // ACKNOWLEDGE IMMEDIATELY
      // ====================================
      // This is intentionally BEFORE
      // reading the JSON section.
      //
      // It prevents:
      // "The application didn't respond
      // in time."
      // ====================================

      await interaction.deferUpdate();

      // ====================================
      // GET SECTION ID
      // ====================================

      const sectionId =
        interaction.customId.replace(
          "lampoon_",
          ""
        );

      console.log(
        `📂 Section requested: ${sectionId}`
      );

      // ====================================
      // GET SECTION FROM JSON
      // ====================================

      const section =
        lampoon.sections?.[sectionId];

      // ====================================
      // SECTION DOES NOT EXIST
      // ====================================

      if (!section) {

        console.error(
          `❌ Section not found in lampoon.json: ${sectionId}`
        );

        // Since deferUpdate() has already
        // acknowledged the interaction,
        // we cannot use interaction.reply().
        //
        // Instead, edit the original message.

        await interaction.message.edit({
          embeds: [
            createMainEmbed()
          ],
          components:
            createButtons()
        });

        return;
      }

      // ====================================
      // CURRENT EMBEDS
      // ====================================

      const currentEmbeds =
        interaction.message.embeds;

      // ====================================
      // CHECK IF SAME SECTION IS ALREADY OPEN
      // ====================================

      const alreadyOpen =
        currentEmbeds.length > 1 &&
        currentEmbeds[1].title ===
          section.title;

      // ====================================
      // COLLAPSE SECTION
      // ====================================

      if (alreadyOpen) {

        await interaction.message.edit({
          embeds: [
            createMainEmbed()
          ],
          components:
            createButtons()
        });

        console.log(
          `🔽 Collapsed section: ${sectionId}`
        );

        return;
      }

      // ====================================
      // DETAIL EMBED COLOR
      // ====================================

      const detailColor =
        lampoon.colors?.[sectionId] ||
        lampoon.colors?.expanded ||
        "#C0C0C0";

      // ====================================
      // CREATE DETAIL EMBED
      // ====================================

      const detailEmbed =
        new EmbedBuilder()
          .setColor(
            detailColor
          )
          .setTitle(
            section.title ||
            "LAMPOON"
          )
          .setDescription(

            `**${
              section.scenario || ""
            }**\n\n` +

            `${
              section.content || ""
            }`

          )
          .setFooter({
            text:
              "LAMPOON • Click the same button to collapse"
          })
          .setTimestamp();

      // ====================================
      // UPDATE ORIGINAL MESSAGE
      // ====================================

      await interaction.message.edit({

        embeds: [
          createMainEmbed(),
          detailEmbed
        ],

        components:
          createButtons(
            sectionId
          )

      });

      // ====================================
      // SUCCESS LOG
      // ====================================

      console.log(
        `🔼 Opened section: ${sectionId}`
      );

    } catch (error) {

      console.error(
        "❌ Button interaction error:",
        error
      );

      // ====================================
      // ERROR RESPONSE
      // ====================================
      //
      // If deferUpdate() succeeded, the
      // interaction is already acknowledged.
      //
      // Therefore use followUp() instead
      // of reply().
      // ====================================

      try {

        if (
          interaction.deferred ||
          interaction.replied
        ) {

          await interaction.followUp({
            content:
              "❌ Something went wrong while opening this section.",
            ephemeral: true
          });

        } else {

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

  }
);

// ==========================================
// DISCORD ERROR HANDLING
// ==========================================

client.on(
  "error",
  error => {

    console.error(
      "❌ Discord client error:",
      error
    );

  }
);

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "❌ Unhandled promise rejection:",
      error
    );

  }
);

process.on(
  "uncaughtException",
  error => {

    console.error(
      "❌ Uncaught exception:",
      error
    );

  }
);

// ==========================================
// DISCORD LOGIN
// ==========================================

const TOKEN =
  process.env.DISCORD_TOKEN;

if (!TOKEN) {

  console.error(
    "❌ DISCORD_TOKEN environment variable is missing."
  );

  process.exit(1);
}

client.login(TOKEN)
  .then(() => {

    console.log(
      "🔐 Discord login successful."
    );

  })
  .catch(error => {

    console.error(
      "❌ Discord login failed:",
      error
    );

    process.exit(1);

  });

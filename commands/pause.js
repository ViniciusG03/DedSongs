// Arquivo: commands/pause.js
// Este comando pausa a música atual

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pausa a música que está tocando atualmente"),

  async execute(interaction) {
    const { player } = interaction.client;
    const queue = player.nodes.get(interaction.guildId);

    // Verifica se existe uma fila ativa
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "❌ Não há músicas tocando atualmente!",
        ephemeral: true,
      });
    }

    // Verifica se o usuário está no mesmo canal de voz
    if (interaction.member.voice.channel.id !== queue.channel.id) {
      return interaction.reply({
        content:
          "❌ Você precisa estar no mesmo canal de voz que o bot para usar este comando!",
        ephemeral: true,
      });
    }

    // Pausa a reprodução atual
    if (queue.node.isPaused()) {
      return interaction.reply({
        content: "⚠️ A música já está pausada!",
        ephemeral: true,
      });
    }

    queue.node.pause();
    return interaction.reply("⏸️ Música pausada!");
  },
};

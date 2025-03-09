// Arquivo: commands/resume.js
// Este comando retoma a reprodução de uma música pausada

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Retoma a reprodução da música pausada"),

  async execute(interaction) {
    const { player } = interaction.client;
    const queue = player.nodes.get(interaction.guildId);

    // Verifica se existe uma fila ativa
    if (!queue) {
      return interaction.reply({
        content: "❌ Não há músicas na fila!",
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

    // Retoma a reprodução
    if (!queue.node.isPaused()) {
      return interaction.reply({
        content: "⚠️ A música já está tocando!",
        ephemeral: true,
      });
    }

    queue.node.resume();
    return interaction.reply("▶️ Reprodução retomada!");
  },
};

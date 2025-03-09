// Arquivo: commands/stop.js
// Este comando para a reprodução e limpa a fila

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Para a reprodução e limpa a fila de músicas"),

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

    // Para a reprodução e limpa a fila
    queue.delete();
    return interaction.reply("⏹️ Reprodução parada e fila limpa!");
  },
};

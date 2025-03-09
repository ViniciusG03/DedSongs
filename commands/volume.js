// Este comando ajusta o volume da reprodução

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Ajusta o volume da reprodução")
    .addIntegerOption((option) =>
      option
        .setName("porcentagem")
        .setDescription("O volume em porcentagem (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

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

    // Obtém a porcentagem de volume
    const volume = interaction.options.getInteger("porcentagem");

    // Ajusta o volume
    queue.node.setVolume(volume);

    // Emoji variável de acordo com o volume
    let volumeEmoji;
    if (volume > 75) {
      volumeEmoji = "🔊";
    } else if (volume > 30) {
      volumeEmoji = "🔉";
    } else {
      volumeEmoji = "🔈";
    }

    return interaction.reply(`${volumeEmoji} Volume ajustado para ${volume}%`);
  },
};

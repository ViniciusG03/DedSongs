// Arquivo: commands/skip.js
// Este comando pula para a próxima música na fila

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pula para a próxima música na fila"),

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

    // Armazena o título da música que será pulada
    const currentSong = queue.currentTrack;

    // Verifica se tem próxima música
    if (queue.tracks.size === 0) {
      return interaction.reply({
        content: "⚠️ Não há próxima música na fila para pular!",
        ephemeral: true,
      });
    }

    // Pula para a próxima música
    await queue.node.skip();

    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("⏭️ Música pulada")
      .setDescription(`Pulou: **${currentSong.title}**`)
      .setThumbnail(currentSong.thumbnail)
      .addFields(
        { name: "Próxima música", value: queue.currentTrack.title },
        { name: "Pulado por", value: interaction.user.username }
      );

    return interaction.reply({ embeds: [embed] });
  },
};

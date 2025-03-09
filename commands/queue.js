// Arquivo: commands/queue.js
// Este comando mostra a fila atual de músicas no servidor

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Mostra a fila atual de músicas"),

  async execute(interaction) {
    const { player } = interaction.client;
    const queue = player.nodes.get(interaction.guildId);

    // Verifica se existe uma fila para este servidor
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "❌ Não há músicas tocando atualmente!",
        ephemeral: true,
      });
    }

    const tracks = queue.tracks.toArray();
    const currentTrack = queue.currentTrack;

    // Obtém o progresso atual da música
    const progress = queue.node.getTimestamp();

    // Cria o embed para mostrar a fila
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🎵 Fila de Músicas")
      .setThumbnail(currentTrack.thumbnail)
      .setDescription(
        `**Tocando agora:** [${currentTrack.title}](${currentTrack.url}) (${progress.current}/${currentTrack.duration})`
      )
      .setFooter({
        text: `Solicitado por ${currentTrack.requestedBy.username}`,
      });

    // Adiciona as próximas músicas na fila (até 10)
    if (tracks.length) {
      const nextSongs = tracks.slice(0, 10).map((track, index) => {
        return `${index + 1}. [${track.title}](${track.url}) - ${
          track.duration
        }`;
      });

      embed.addFields({
        name: "📋 Próximas músicas",
        value: nextSongs.join("\n"),
      });

      // Se houver mais de 10 músicas na fila, mostra quantas ainda restam
      if (tracks.length > 10) {
        embed.addFields({
          name: "...e mais",
          value: `${tracks.length - 10} músicas na fila`,
        });
      }
    } else {
      embed.addFields({
        name: "📋 Próximas músicas",
        value: "Não há mais músicas na fila!",
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};

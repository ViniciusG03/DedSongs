// Arquivo: commands/nowplaying.js
// Este comando mostra detalhes sobre a música que está tocando atualmente

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription(
      "Mostra detalhes sobre a música que está tocando atualmente"
    ),

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

    // Obtém informações sobre a música atual
    const track = queue.currentTrack;
    const progress = queue.node.getTimestamp();

    // Cria uma barra de progresso
    const progressBar = createProgressBar(progress);

    // Cria o embed
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🎵 Tocando agora")
      .setDescription(`**[${track.title}](${track.url})**`)
      .setThumbnail(track.thumbnail)
      .addFields(
        { name: "Canal", value: track.author, inline: true },
        {
          name: "Duração",
          value: `${progress.current} / ${track.duration}`,
          inline: true,
        },
        { name: "Volume", value: `${queue.node.volume}%`, inline: true },
        { name: "Progresso", value: progressBar },
        {
          name: "Solicitado por",
          value: track.requestedBy.username,
          inline: true,
        }
      )
      .setFooter({ text: `ID da música: ${track.id}` });

    return interaction.reply({ embeds: [embed] });
  },
};

// Função auxiliar para criar uma barra de progresso visual
function createProgressBar(progress) {
  if (!progress.current || !progress.total) return "Indisponível";

  const currentSeconds = progress.current
    .split(":")
    .reduce((acc, time) => 60 * acc + +time);
  const totalSeconds = progress.total
    .split(":")
    .reduce((acc, time) => 60 * acc + +time);
  const progressPercentage = Math.floor((currentSeconds / totalSeconds) * 100);

  const filledBar = Math.floor(progressPercentage / 10);

  let progressBar = "▬".repeat(filledBar) + "🔘" + "▬".repeat(10 - filledBar);

  return `${progressBar} (${progressPercentage}%)`;
}

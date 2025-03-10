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

    try {
      // Obtém informações sobre a música atual
      const track = queue.currentTrack;

      // Tenta obter o timestamp com tratamento de erro
      let progress;
      let progressBar = "Indisponível";
      let currentTime = "0:00";
      let totalTime = track.duration || "0:00";

      try {
        // Tenta o método padrão primeiro
        progress = queue.node.getTimestamp();

        // Se o timestamp for obtido com sucesso, cria a barra de progresso
        if (progress && progress.current && progress.total) {
          currentTime = progress.current;
          totalTime = progress.total;
          progressBar = createProgressBar(progress);
        }
      } catch (timeError) {
        console.error("Erro ao obter timestamp:", timeError);

        // Método alternativo para calcular o progresso
        try {
          const currentMilliseconds = queue.node.streamTime;
          const totalMilliseconds = track.durationMS || 0;

          if (currentMilliseconds && totalMilliseconds) {
            // Converter milissegundos para formato MM:SS
            currentTime = formatTime(currentMilliseconds);
            totalTime = formatTime(totalMilliseconds);

            // Criar barra de progresso baseada em milissegundos
            const progressPercentage = Math.floor(
              (currentMilliseconds / totalMilliseconds) * 100
            );
            const filledBar = Math.floor(progressPercentage / 10);
            progressBar =
              "▬".repeat(filledBar) +
              "🔘" +
              "▬".repeat(10 - filledBar) +
              ` (${progressPercentage}%)`;
          }
        } catch (altTimeError) {
          console.error(
            "Erro no método alternativo de timestamp:",
            altTimeError
          );
        }
      }

      // Verificação e normalização do thumbnail
      let thumbnailUrl = track.thumbnail;
      if (
        !thumbnailUrl ||
        thumbnailUrl === "null" ||
        thumbnailUrl === "undefined"
      ) {
        // Se não retornar thumbnail, tenta extrair de outras propriedades
        if (track.raw && track.raw.thumbnail) {
          thumbnailUrl = track.raw.thumbnail;
        } else {
          // Backup: usa um placeholder ou tenta obter da propriedade artworkURL
          thumbnailUrl =
            track.artworkURL ||
            track.raw?.artworkURL ||
            "https://i.imgur.com/nkKVlHV.png";
        }
      }

      // Cria o embed
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("🎵 Tocando agora")
        .setDescription(`**[${track.title}](${track.url})**`)
        .setThumbnail(thumbnailUrl)
        .addFields(
          {
            name: "Canal",
            value: track.author || "Desconhecido",
            inline: true,
          },
          {
            name: "Duração",
            value: `${currentTime} / ${totalTime}`,
            inline: true,
          },
          {
            name: "Volume",
            value: `${queue.node.volume || "80"}%`,
            inline: true,
          },
          { name: "Progresso", value: progressBar },
          {
            name: "Solicitado por",
            value: track.requestedBy?.username || "Desconhecido",
            inline: true,
          }
        )
        .setFooter({ text: `ID da música: ${track.id || "Desconhecido"}` });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Erro no comando nowplaying:", error);
      return interaction.reply({
        content: `❌ Ocorreu um erro ao obter informações da música: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};

// Função auxiliar para criar uma barra de progresso visual
function createProgressBar(progress) {
  if (!progress.current || !progress.total) return "Indisponível";

  try {
    // Converter strings de tempo (MM:SS) para segundos
    const currentSeconds = progress.current
      .split(":")
      .reduce((acc, time) => 60 * acc + +time, 0);
    const totalSeconds = progress.total
      .split(":")
      .reduce((acc, time) => 60 * acc + +time, 0);

    if (isNaN(currentSeconds) || isNaN(totalSeconds) || totalSeconds === 0) {
      return "Indisponível";
    }

    const progressPercentage = Math.floor(
      (currentSeconds / totalSeconds) * 100
    );
    // Limitar o percentual entre 0 e 100
    const safePercentage = Math.min(100, Math.max(0, progressPercentage));
    const filledBar = Math.floor(safePercentage / 10);

    const progressBar =
      "▬".repeat(filledBar) + "🔘" + "▬".repeat(10 - filledBar);
    return `${progressBar} (${safePercentage}%)`;
  } catch (error) {
    console.error("Erro ao criar barra de progresso:", error);
    return "Indisponível";
  }
}

// Função para formatar tempo em milissegundos para MM:SS
function formatTime(ms) {
  if (!ms || isNaN(ms)) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

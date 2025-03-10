// Arquivo: commands/skip.js
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

    // Armazena a música atual
    const currentSong = queue.currentTrack;

    // Tratamento para caso seja a última música
    const hasNextTrack = queue.tracks.size > 0;
    const nextTrackTitle = hasNextTrack ? queue.tracks.at(0).title : "Nenhuma";

    try {
      // Tenta pular para a próxima música
      await queue.node.skip();

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⏭️ Música pulada")
        .setDescription(`Pulou: **${currentSong.title}**`)
        .setThumbnail(
          currentSong.thumbnail || "https://i.imgur.com/nkKVlHV.png"
        )
        .addFields(
          { name: "Próxima música", value: nextTrackTitle },
          { name: "Pulado por", value: interaction.user.username }
        );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Erro ao pular música:", error);

      // Tenta um método alternativo se o primeiro falhar
      try {
        if (queue.node.skip) {
          queue.node.skip();
        } else if (queue.skip) {
          queue.skip();
        }
        return interaction.reply(`⏭️ Música **${currentSong.title}** pulada!`);
      } catch (altError) {
        console.error("Erro no método alternativo:", altError);
        return interaction.reply({
          content: `❌ Não foi possível pular a música: ${error.message}`,
          ephemeral: true,
        });
      }
    }
  },
};

// Arquivo: commands/lyrics.js
// Este comando busca a letra da música atual (usando API externa fictícia)

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Busca a letra da música atual ou de uma específica")
    .addStringOption((option) =>
      option
        .setName("busca")
        .setDescription("Nome da música (opcional, padrão é a música atual)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const { player } = interaction.client;
    const queue = player.nodes.get(interaction.guildId);

    // Obtém o termo de busca
    let searchTerm = interaction.options.getString("busca");

    // Se não houver termo de busca específico, usa a música atual
    if (!searchTerm) {
      if (!queue || !queue.isPlaying()) {
        return interaction.followUp({
          content:
            "❌ Não há músicas tocando atualmente e você não especificou uma música para buscar!",
          ephemeral: true,
        });
      }

      const currentTrack = queue.currentTrack;
      searchTerm = `${currentTrack.author} ${currentTrack.title}`;
    }

    try {
      // Nota: Esta parte usa uma API fictícia
      // Na implementação real, você precisaria usar uma API de letras real
      // Exemplos incluem Genius, Musixmatch, etc.

      // Simulação de busca por letra
      const lyrics = await searchLyrics(searchTerm);

      if (!lyrics) {
        return interaction.followUp(
          `❌ Não foi possível encontrar a letra para "${searchTerm}"`
        );
      }

      // Cria o embed com a letra (fragmentado se for muito longo)
      const embed = new EmbedBuilder()
        .setColor("#8F00FF")
        .setTitle(`📝 Letra: ${lyrics.title}`)
        .setDescription(
          lyrics.lyrics.length > 4096
            ? lyrics.lyrics.substring(0, 4093) + "..."
            : lyrics.lyrics
        )
        .setFooter({ text: "Powered by LyricsAPI (Fictício)" });

      // Se a letra for muito longa, avisa o usuário
      if (lyrics.lyrics.length > 4096) {
        embed.addFields({
          name: "Aviso",
          value:
            "A letra é muito longa e foi truncada. Use o link abaixo para ver a letra completa.",
        });

        if (lyrics.url) {
          embed.setURL(lyrics.url);
        }
      }

      return interaction.followUp({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.followUp({
        content: `❌ Ocorreu um erro ao buscar a letra: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};

// Função fictícia para simular busca de letras
// Em um bot real, você usaria uma API de letras
async function searchLyrics(searchTerm) {
  // Simulação de resposta
  return {
    title: searchTerm,
    lyrics: `Esta é uma simulação de letra para a música "${searchTerm}".\n\nNesta implementação real, você precisaria usar uma API de letras de música como Genius, Musixmatch, etc.\n\nA letra apareceria aqui, formatada com quebras de linha e estrofes.`,
    url: "https://example.com/lyrics",
  };

  // Implementação real seria algo como:
  /*
    const response = await fetch(`https://api.lyrics.com/v1/search?q=${encodeURIComponent(searchTerm)}&apikey=YOUR_API_KEY`);
    const data = await response.json();
    
    if (!data || !data.result) return null;
    
    return {
        title: data.result.title,
        lyrics: data.result.lyrics,
        url: data.result.url
    };
    */
}

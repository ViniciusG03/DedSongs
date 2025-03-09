// Arquivo: commands/play.js
// Comando de reprodução modificado para usar apenas Spotify

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Reproduz música do Spotify")
    .addStringOption((option) =>
      option
        .setName("consulta")
        .setDescription("Link do Spotify ou nome da música")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Verifica se o usuário está em um canal de voz
    if (!interaction.member.voice.channel) {
      return interaction.reply({
        content:
          "❌ Você precisa estar em um canal de voz para usar este comando!",
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    console.log("Executando comando play (Spotify)");

    try {
      const { player } = interaction.client;
      let consulta = interaction.options.getString("consulta");

      // Determina o tipo de busca a ser usado
      let searchEngine;

      // Verifica se é um link do Spotify e extrai o ID corretamente
      if (consulta.includes("spotify.com") || consulta.startsWith("spotify:")) {
        // Extrai o ID da faixa do link do Spotify removendo parâmetros extras
        let spotifyId = "";

        if (consulta.includes("/track/")) {
          spotifyId = consulta.split("/track/")[1].split("?")[0];
          consulta = `https://open.spotify.com/track/${spotifyId}`;
          searchEngine = QueryType.SPOTIFY_SONG;
          console.log(
            `Detectado: Link para música do Spotify, ID extraído: ${spotifyId}`
          );
        } else if (consulta.includes("/playlist/")) {
          spotifyId = consulta.split("/playlist/")[1].split("?")[0];
          consulta = `https://open.spotify.com/playlist/${spotifyId}`;
          searchEngine = QueryType.SPOTIFY_PLAYLIST;
          console.log(
            `Detectado: Link para playlist do Spotify, ID extraído: ${spotifyId}`
          );
        } else if (consulta.includes("/album/")) {
          spotifyId = consulta.split("/album/")[1].split("?")[0];
          consulta = `https://open.spotify.com/album/${spotifyId}`;
          searchEngine = QueryType.SPOTIFY_ALBUM;
          console.log(
            `Detectado: Link para álbum do Spotify, ID extraído: ${spotifyId}`
          );
        } else if (consulta.includes("spotify:track:")) {
          spotifyId = consulta.split("spotify:track:")[1];
          consulta = `https://open.spotify.com/track/${spotifyId}`;
          searchEngine = QueryType.SPOTIFY_SONG;
          console.log(
            `Detectado: URI de música do Spotify, ID extraído: ${spotifyId}`
          );
        } else if (consulta.includes("spotify:playlist:")) {
          spotifyId = consulta.split("spotify:playlist:")[1];
          consulta = `https://open.spotify.com/playlist/${spotifyId}`;
          searchEngine = QueryType.SPOTIFY_PLAYLIST;
          console.log(
            `Detectado: URI de playlist do Spotify, ID extraído: ${spotifyId}`
          );
        } else if (consulta.includes("spotify:album:")) {
          spotifyId = consulta.split("spotify:album:")[1];
          consulta = `https://open.spotify.com/album/${spotifyId}`;
          searchEngine = QueryType.SPOTIFY_ALBUM;
          console.log(
            `Detectado: URI de álbum do Spotify, ID extraído: ${spotifyId}`
          );
        } else {
          searchEngine = QueryType.SPOTIFY_SEARCH;
          console.log(
            "Detectado: Outro tipo de link Spotify, usando busca padrão"
          );
        }
      } else {
        // Se não for um link, faz busca no Spotify
        searchEngine = QueryType.SPOTIFY_SEARCH;
        console.log(`Realizando busca no Spotify para: ${consulta}`);
      }

      // Busca usando o mecanismo apropriado com configurações avançadas
      console.log(
        `Iniciando busca com mecanismo: ${searchEngine} para consulta: ${consulta}`
      );
      const searchResult = await player.search(consulta, {
        requestedBy: interaction.user,
        searchEngine: searchEngine,
        fallbackSearchEngine:
          searchEngine === QueryType.SPOTIFY_SONG
            ? QueryType.SPOTIFY_SEARCH
            : undefined,
      });

      if (!searchResult || searchResult.tracks.length === 0) {
        return interaction.followUp(
          "❌ Não foi possível encontrar resultados para esta consulta no Spotify!"
        );
      }

      console.log(`Encontrados ${searchResult.tracks.length} resultados`);
      console.log(
        `Primeira faixa: ${searchResult.tracks[0].title} - ${searchResult.tracks[0].author}`
      );

      // Se for uma música específica pelo ID, verifique se encontrou a correta
      // comparando o ID no URL original com o da resposta
      if (
        searchEngine === QueryType.SPOTIFY_SONG &&
        consulta.includes("/track/")
      ) {
        const trackId = consulta.split("/track/")[1];
        const foundTrackUrl = searchResult.tracks[0].url || "";

        if (!foundTrackUrl.includes(trackId)) {
          console.log(
            `Aviso: O ID da faixa encontrada não corresponde ao solicitado.`
          );
          console.log(`ID solicitado: ${trackId}`);
          console.log(`URL encontrado: ${foundTrackUrl}`);
          await interaction.followUp({
            content:
              "⚠️ Aviso: A música encontrada pode não ser exatamente a que você solicitou. Usando a melhor correspondência disponível.",
            ephemeral: true,
          });
        } else {
          console.log("✅ ID da faixa corresponde ao solicitado.");
        }
      }

      // Criar ou obter a fila para o servidor
      const queue = await player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel,
          client: interaction.guild.members.me,
          requestedBy: interaction.user,
        },
        selfDeaf: true,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000, // 5 minutos
        leaveOnEnd: true,
        leaveOnEndCooldown: 300000, // 5 minutos
        bufferingTimeout: 60000, // 60 segundos de timeout de buffer
      });

      // Verifica se o bot consegue entrar no canal de voz
      if (!queue.connection) {
        try {
          console.log(
            `Conectando ao canal de voz: ${interaction.member.voice.channel.name}`
          );
          await queue.connect(interaction.member.voice.channel);
          console.log("Conectado ao canal de voz com sucesso");
        } catch (connectError) {
          console.error(
            `Erro ao conectar ao canal de voz: ${connectError.message}`
          );
          return interaction.followUp(
            "❌ Não foi possível conectar ao canal de voz. Verifique as permissões do bot."
          );
        }
      }

      // Adiciona as músicas à fila
      const playlist = searchResult.playlist;
      await queue.addTrack(searchResult.tracks);

      // Se a fila não estiver tocando, inicia a reprodução
      if (!queue.isPlaying()) {
        try {
          console.log(
            `Iniciando reprodução de: ${searchResult.tracks[0].title}`
          );
          await queue.node.play();
          console.log("Reprodução iniciada com sucesso");
        } catch (playError) {
          console.error(`Erro ao iniciar reprodução: ${playError.message}`);
          return interaction.followUp(
            "❌ Ocorreu um erro ao tentar reproduzir a música. Tente com outra música ou tente novamente mais tarde."
          );
        }
      }

      // Cria um embed para mostrar o que foi adicionado à fila
      const isPlaylist = searchResult.playlist ? true : false;

      const embed = new EmbedBuilder()
        .setColor("#1DB954") // Cor verde do Spotify
        .setTitle(
          isPlaylist
            ? "🎵 Playlist adicionada à fila"
            : "🎵 Música adicionada à fila"
        )
        .setThumbnail(
          isPlaylist
            ? searchResult.tracks[0].thumbnail
            : searchResult.tracks[0].thumbnail
        );

      if (isPlaylist) {
        embed
          .setDescription(`**${playlist.title}**`)
          .addFields(
            { name: "Músicas", value: `${searchResult.tracks.length} músicas` },
            { name: "Solicitado por", value: interaction.user.username }
          );
      } else {
        embed.setDescription(`**${searchResult.tracks[0].title}**`).addFields(
          {
            name: "Artista",
            value: searchResult.tracks[0].author || "Desconhecido",
          },
          { name: "Duração", value: searchResult.tracks[0].duration },
          { name: "Solicitado por", value: interaction.user.username }
        );
      }

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      console.error("Erro no comando play:", error);
      return interaction.followUp({
        content: `❌ Ocorreu um erro: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};

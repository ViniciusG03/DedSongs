// Arquivo: commands/play.js
// Comando de reprodução universal que suporta Spotify e YouTube

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Reproduz música do Spotify ou YouTube")
    .addStringOption((option) =>
      option
        .setName("consulta")
        .setDescription("Link do Spotify/YouTube ou nome da música")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("youtube")
        .setDescription("Forçar busca no YouTube (opcional)")
        .setRequired(false)
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
    console.log("Executando comando play universal (Spotify/YouTube)");

    try {
      const { player } = interaction.client;
      const consulta = interaction.options.getString("consulta");
      const forceYoutube = interaction.options.getBoolean("youtube") || false;

      // Determina o tipo de busca a ser usado
      let searchEngine;
      let sourceName = ""; // Para uso no log e embed

      // Verifica se o usuário quer forçar busca no YouTube
      if (forceYoutube) {
        searchEngine = QueryType.YOUTUBE_SEARCH;
        sourceName = "YouTube (forçado)";
        console.log(`Forçando busca no YouTube para: ${consulta}`);
      }
      // Verifica se é um link do YouTube
      else if (
        consulta.includes("youtube.com") ||
        consulta.includes("youtu.be")
      ) {
        if (consulta.includes("list=")) {
          searchEngine = QueryType.YOUTUBE_PLAYLIST;
          sourceName = "Playlist do YouTube";
          console.log("Detectado: Link para playlist do YouTube");
        } else {
          searchEngine = QueryType.YOUTUBE_VIDEO;
          sourceName = "Vídeo do YouTube";
          console.log("Detectado: Link para vídeo do YouTube");
        }
      }
      // Verifica se é um link do Spotify
      else if (
        consulta.includes("spotify.com") ||
        consulta.startsWith("spotify:")
      ) {
        if (
          consulta.includes("/track/") ||
          consulta.includes("spotify:track:")
        ) {
          searchEngine = QueryType.SPOTIFY_SONG;
          sourceName = "Música do Spotify";
          console.log("Detectado: Link para música do Spotify");
        } else if (
          consulta.includes("/playlist/") ||
          consulta.includes("spotify:playlist:")
        ) {
          searchEngine = QueryType.SPOTIFY_PLAYLIST;
          sourceName = "Playlist do Spotify";
          console.log("Detectado: Link para playlist do Spotify");
        } else if (
          consulta.includes("/album/") ||
          consulta.includes("spotify:album:")
        ) {
          searchEngine = QueryType.SPOTIFY_ALBUM;
          sourceName = "Álbum do Spotify";
          console.log("Detectado: Link para álbum do Spotify");
        } else {
          searchEngine = QueryType.SPOTIFY_SEARCH;
          sourceName = "Busca no Spotify";
          console.log(
            "Detectado: Outro tipo de link Spotify, usando busca padrão"
          );
        }
      } else {
        // Se não for um link, decide onde buscar com base na opção
        if (forceYoutube) {
          searchEngine = QueryType.YOUTUBE_SEARCH;
          sourceName = "Busca no YouTube";
          console.log(`Realizando busca no YouTube para: ${consulta}`);
        } else {
          // Por padrão, mantemos a busca no Spotify
          searchEngine = QueryType.SPOTIFY_SEARCH;
          sourceName = "Busca no Spotify";
          console.log(`Realizando busca no Spotify para: ${consulta}`);
        }
      }

      // Configuração para melhorar resultados de busca
      const searchOptions = {
        requestedBy: interaction.user,
        searchEngine: searchEngine,
        // Use YouTube como fallback para Spotify
        fallbackSearchEngine: searchEngine.includes("SPOTIFY")
          ? QueryType.YOUTUBE_SEARCH
          : undefined,
      };

      // Adicionar configurações para melhorar a precisão das buscas
      if (searchEngine === QueryType.YOUTUBE_SEARCH) {
        // Para buscas diretas no YouTube, adicionar parâmetros para encontrar conteúdo oficial
        searchOptions.searchOptions = {
          maxResults: 5,
          sortBy: "relevance",
          overrideQuery: (query) =>
            `${query} ${query.includes("cover") ? "" : "official audio"}`,
        };
      } else if (searchEngine === QueryType.SPOTIFY_SEARCH) {
        // Para buscas no Spotify + reprodução no YouTube
        searchOptions.searchOptions = {
          // Não modifica a consulta do Spotify
        };
      }

      // Busca usando o mecanismo apropriado
      console.log(`Iniciando busca com ${sourceName} para: "${consulta}"`);
      const searchResult = await player.search(consulta, searchOptions);

      if (!searchResult || searchResult.tracks.length === 0) {
        return interaction.followUp(
          `❌ Não foi possível encontrar resultados para esta consulta no ${sourceName}!`
        );
      }

      console.log(`Encontrados ${searchResult.tracks.length} resultados`);

      // Realizar filtragem adicional para encontrar versões oficiais (para buscas não diretas)
      if (
        searchEngine === QueryType.SPOTIFY_SEARCH ||
        searchEngine === QueryType.YOUTUBE_SEARCH
      ) {
        if (searchResult.tracks.length > 1) {
          // Tenta filtrar para encontrar versões oficiais
          // Cria uma pontuação para cada faixa baseada em quão "oficial" ela parece ser
          const scoredTracks = searchResult.tracks.map((track) => {
            let score = 0;
            const title = track.title.toLowerCase();
            const author = track.author.toLowerCase();

            // Verificar por sinais de oficialidade
            if (title.includes("official") || title.includes("original"))
              score += 3;
            if (title.includes("audio") || title.includes("music video"))
              score += 2;
            if (author.includes("vevo") || author.includes("official"))
              score += 4;
            if (author.includes("topic")) score += 3; // "Topic" geralmente indica canal oficial do artista

            // Penalizar sinais de cover
            if (title.includes("cover") || title.includes("remix")) score -= 5;
            if (title.includes("karaoke") || title.includes("instrumental"))
              score -= 5;
            if (author.includes("cover") || author.includes("karaoke"))
              score -= 5;

            return { track, score };
          });

          // Ordena por pontuação, com os mais "oficiais" primeiro
          scoredTracks.sort((a, b) => b.score - a.score);

          // Substitui a lista de faixas pela lista ordenada
          searchResult.tracks = scoredTracks.map((item) => item.track);

          console.log(
            `Reordenação aplicada. Track com maior pontuação: "${searchResult.tracks[0].title}" por "${searchResult.tracks[0].author}"`
          );
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
          player.nodes.delete(interaction.guildId);
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

      // Define a cor do embed com base na origem
      let embedColor = "#1DB954"; // Cor verde do Spotify por padrão
      if (sourceName.includes("YouTube")) {
        embedColor = "#FF0000"; // Cor vermelha do YouTube
      }

      // Cria um embed para mostrar o que foi adicionado à fila
      const isPlaylist = searchResult.playlist ? true : false;

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(
          isPlaylist
            ? `🎵 Playlist adicionada à fila (${sourceName})`
            : `🎵 Música adicionada à fila (${sourceName})`
        )
        .setThumbnail(
          searchResult.tracks[0].thumbnail || "https://i.imgur.com/nkKVlHV.png"
        );

      if (isPlaylist) {
        embed
          .setDescription(`**${playlist.title}**`)
          .addFields(
            { name: "Músicas", value: `${searchResult.tracks.length} músicas` },
            { name: "Solicitado por", value: interaction.user.username }
          );
      } else {
        // Adicionar informações sobre uso do YouTube
        let sourceInfo = "";
        if (
          searchEngine.includes("SPOTIFY") &&
          !sourceName.includes("YouTube")
        ) {
          sourceInfo = "\n\n*Buscado no Spotify, reproduzido via YouTube*";
        }

        embed
          .setDescription(`**${searchResult.tracks[0].title}**${sourceInfo}`)
          .addFields(
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

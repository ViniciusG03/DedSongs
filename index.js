// Arquivo: index.js

process.env.YOUTUBE_EXTRACTOR_LIBRARY = "@distube/ytdl-core";

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
} = require("discord.js");
const { Player } = require("discord-player");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const token = process.env.DISCORD_TOKEN;

// Criando o cliente Discord com as permissões necessárias
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Inicializando o player de música com configurações otimizadas
const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  },
  skipFFmpeg: false,
  useLegacyFFmpeg: false,
  connectionTimeout: 60000,
  // Adicione estas opções:
  spotifyBridge: true, // Forçar o uso da bridge
  // Importante: NÃO bloqueie o YouTube
});

// Configurações do Player e Spotify
player.extractors.loadDefault();

// Configurar Spotify com as credenciais
const config = require("./config.json");
if (config.spotify) {
  try {
    console.log("Configurando integração com Spotify...");
    // As credenciais do Spotify são carregadas automaticamente pelo discord-player
    console.log("Configurações do Spotify carregadas com sucesso");
  } catch (spotifyError) {
    console.error("Erro ao configurar Spotify:", spotifyError);
  }
} else {
  console.log(
    "Aviso: Credenciais do Spotify não encontradas no arquivo config.json"
  );
  console.log(
    "O bot pode não funcionar corretamente sem as credenciais do Spotify"
  );
}

// Coleção para armazenar os comandos
client.commands = new Collection();
client.player = player;

// Carregando os comandos da pasta de comandos
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[AVISO] O comando em ${filePath} está com "data" ou "execute" ausentes`
    );
  }
}

// Evento quando o bot estiver pronto
client.once(Events.ClientReady, () => {
  console.log(`Bot está online! Logado como ${client.user.tag}`);
  console.log("Bot de música configurado para usar o Spotify");
});

// Evento para lidar com comandos de barra (/)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Houve um erro ao executar este comando!",
      ephemeral: true,
    });
  }
});

// Eventos do player
player.events.on("playerStart", (queue, track) => {
  try {
    console.log("----- DEPURAÇÃO DE ÁUDIO -----");
    console.log("Faixa iniciada:", track.title);
    console.log("URL da faixa:", track.url);
    console.log("Thumbnail:", track.thumbnail);
    console.log("ID do canal de voz:", queue.channel?.id);
    console.log("Método de extração:", track.extractor || "desconhecido");
    console.log(
      "Estado do player:",
      queue.node.isPlaying() ? "tocando" : "parado"
    );
    console.log("-----------------------------");

    // Verificação e normalização do thumbnail
    let thumbnailUrl = track.thumbnail;
    if (
      !thumbnailUrl ||
      thumbnailUrl === "null" ||
      thumbnailUrl === "undefined"
    ) {
      // Se o Spotify não retornar thumbnail, tenta extrair do YouTube
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

    const embed = new EmbedBuilder()
      .setTitle("🎵 Tocando agora")
      .setDescription(`**${track.title}**`)
      .setThumbnail(thumbnailUrl)
      .setColor("#1DB954") // Cor verde do Spotify
      .addFields(
        { name: "Artista", value: track.author || "Desconhecido" },
        { name: "Duração", value: track.duration || "Desconhecida" },
        {
          name: "Solicitado por",
          value: track.requestedBy?.username || "Desconhecido",
        }
      );

    queue.metadata?.channel
      ?.send({ embeds: [embed] })
      .catch((error) =>
        console.error("Erro ao enviar mensagem de início de reprodução:", error)
      );
  } catch (error) {
    console.error("Erro no evento playerStart:", error);
  }
});

player.events.on("audioTrackAdd", (queue, track) => {
  try {
    queue.metadata?.channel
      ?.send(`🎵 Música **${track.title}** adicionada à fila!`)
      .catch((error) =>
        console.error("Erro ao enviar mensagem de adição de faixa:", error)
      );
  } catch (error) {
    console.error("Erro no evento audioTrackAdd:", error);
  }
});

player.events.on("disconnect", (queue) => {
  try {
    queue.metadata?.channel
      ?.send("❌ Fui desconectado do canal de voz!")
      .catch((error) =>
        console.error("Erro ao enviar mensagem de desconexão:", error)
      );
  } catch (error) {
    console.error("Erro no evento disconnect:", error);
  }
});

player.events.on("emptyChannel", (queue) => {
  try {
    queue.metadata?.channel
      ?.send("❌ Canal vazio! Saindo do canal de voz...")
      .catch((error) =>
        console.error("Erro ao enviar mensagem de canal vazio:", error)
      );
  } catch (error) {
    console.error("Erro no evento emptyChannel:", error);
  }
});

player.events.on("emptyQueue", (queue) => {
  try {
    queue.metadata?.channel
      ?.send("✅ Fila terminada! Não há mais músicas para tocar.")
      .catch((error) =>
        console.error("Erro ao enviar mensagem de fila vazia:", error)
      );
  } catch (error) {
    console.error("Erro no evento emptyQueue:", error);
  }
});

// Erros
player.events.on("error", (queue, error) => {
  console.error(`[Erro no player] ${error.message}`);
  queue.metadata?.channel
    ?.send(`❌ Erro ao reproduzir música: ${error.message}`)
    .catch(console.error);
});

player.events.on("playerError", (queue, error) => {
  console.error("=== ERRO NO PLAYER ===");
  console.error(`Mensagem: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  console.error(
    "Faixa atual:",
    queue.currentTrack ? queue.currentTrack.title : "Nenhuma"
  );
  console.error("======================");

  queue.metadata?.channel
    ?.send(`❌ Erro no player: ${error.message}`)
    .catch(console.error);
});

player.events.on("debug", (message) => {
  console.log(`[Player Debug] ${message}`);
});

client.login(token);

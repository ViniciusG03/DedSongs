// Arquivo: index.js
// Versão simplificada do bot de música focada no Spotify

// Importando as bibliotecas necessárias
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
} = require("discord.js");
const { Player } = require("discord-player");
const { token } = require("./config.json"); // Arquivo de configuração com o token do bot
const fs = require("fs");
const path = require("path");

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
    highWaterMark: 1 << 25, // 32MB buffer
  },
  connectionTimeout: 60000, // 60 segundos de timeout
});

// Configurações do Player e Spotify
const spotifyConfig = require("./spotify-config");

// Configurar extratores e Spotify
const spotifyConfigSuccess = spotifyConfig.setupSpotify(player);

if (spotifyConfigSuccess) {
  console.log("Integração com Spotify configurada com sucesso!");
} else {
  console.log(
    "⚠️ Aviso: Problemas na configuração do Spotify. O bot pode não funcionar como esperado."
  );
  console.log(
    "👉 Certifique-se de configurar as credenciais do Spotify no arquivo config.json"
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
    const embed = new EmbedBuilder()
      .setTitle("🎵 Tocando agora")
      .setDescription(`**${track.title}**`)
      .setThumbnail(track.thumbnail || "https://i.imgur.com/nkKVlHV.png")
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
  console.error(`[Erro no player] ${error.message}`);
  queue.metadata?.channel
    ?.send(`❌ Erro no player: ${error.message}`)
    .catch(console.error);
});

// Iniciando o bot com o token
client.login(token);

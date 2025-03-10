// Arquivo: commands/help.js
// Este comando mostra informações sobre todos os comandos disponíveis

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Mostra todos os comandos disponíveis e como usá-los"),

  async execute(interaction) {
    try {
      // Obtém lista de todos os comandos disponíveis
      const commands = interaction.client.commands;

      // Cria um embed principal com informações gerais
      const helpEmbed = new EmbedBuilder()
        .setColor("#8F00FF") // Roxo
        .setTitle("🎵 Bot de Música - Comandos Disponíveis")
        .setDescription(
          "Aqui estão todos os comandos que você pode usar com este bot de música. " +
            "Use `/` seguido pelo nome do comando para executá-lo."
        )
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({
          text: "Bot de Música para Discord • Use /help para ver esta mensagem novamente",
        });

      // Cria categorias para organizar comandos
      const playbackCommands = [];
      const queueCommands = [];
      const infoCommands = [];
      const utilityCommands = [];

      // Classifica cada comando em uma categoria
      commands.forEach((cmd) => {
        const cmdInfo = {
          name: cmd.data.name,
          description: cmd.data.description,
          options: cmd.data.options || [],
        };

        // Classifica com base no nome/função
        if (
          ["play", "pause", "resume", "skip", "stop"].includes(cmdInfo.name)
        ) {
          playbackCommands.push(cmdInfo);
        } else if (["queue", "volume"].includes(cmdInfo.name)) {
          queueCommands.push(cmdInfo);
        } else if (["nowplaying", "lyrics"].includes(cmdInfo.name)) {
          infoCommands.push(cmdInfo);
        } else {
          // help vai aqui
          utilityCommands.push(cmdInfo);
        }
      });

      // Função auxiliar para formatar as opções do comando
      function formatOptions(options) {
        if (!options || options.length === 0) return "";

        return options
          .map((opt) => {
            const required = opt.required ? "" : " (opcional)";
            return `\`${opt.name}\`: ${opt.description}${required}`;
          })
          .join("\n");
      }

      // Adiciona seção de comandos de reprodução
      if (playbackCommands.length > 0) {
        helpEmbed.addFields({
          name: "🎮 Comandos de Reprodução",
          value: playbackCommands
            .map((cmd) => {
              let value = `*${cmd.description}*\n`;
              if (cmd.options.length > 0) {
                value += "**Parâmetros:**\n" + formatOptions(cmd.options);
              }
              return `**/${cmd.name}** - ${value}`;
            })
            .join("\n\n"),
        });
      }

      // Adiciona seção de comandos de fila
      if (queueCommands.length > 0) {
        helpEmbed.addFields({
          name: "📋 Comandos de Fila",
          value: queueCommands
            .map((cmd) => {
              let value = `*${cmd.description}*\n`;
              if (cmd.options.length > 0) {
                value += "**Parâmetros:**\n" + formatOptions(cmd.options);
              }
              return `**/${cmd.name}** - ${value}`;
            })
            .join("\n\n"),
        });
      }

      // Adiciona seção de comandos de informação
      if (infoCommands.length > 0) {
        helpEmbed.addFields({
          name: "ℹ️ Comandos de Informação",
          value: infoCommands
            .map((cmd) => {
              let value = `*${cmd.description}*\n`;
              if (cmd.options.length > 0) {
                value += "**Parâmetros:**\n" + formatOptions(cmd.options);
              }
              return `**/${cmd.name}** - ${value}`;
            })
            .join("\n\n"),
        });
      }

      // Adiciona seção de comandos utilitários
      if (utilityCommands.length > 0) {
        helpEmbed.addFields({
          name: "🔧 Comandos Utilitários",
          value: utilityCommands
            .map((cmd) => {
              let value = `*${cmd.description}*\n`;
              if (cmd.options.length > 0) {
                value += "**Parâmetros:**\n" + formatOptions(cmd.options);
              }
              return `**/${cmd.name}** - ${value}`;
            })
            .join("\n\n"),
        });
      }

      // Adiciona exemplos de uso para o comando /play
      helpEmbed.addFields({
        name: "📝 Exemplos de Uso",
        value:
          "**Spotify**\n" +
          "`/play consulta:Nome da música`\n" +
          "`/play consulta:https://open.spotify.com/track/ID`\n\n" +
          "**YouTube**\n" +
          "`/play consulta:https://www.youtube.com/watch?v=ID`\n" +
          "`/play consulta:Nome da música youtube:true`\n\n" +
          "**Controles**\n" +
          "`/pause` - Pausa a música atual\n" +
          "`/resume` - Retoma a reprodução\n" +
          "`/skip` - Passa para a próxima música\n" +
          "`/volume porcentagem:80` - Ajusta o volume para 80%",
      });

      await interaction.reply({ embeds: [helpEmbed] });
    } catch (error) {
      console.error("Erro no comando help:", error);
      await interaction.reply({
        content:
          "❌ Houve um erro ao exibir a ajuda. Tente novamente mais tarde.",
        ephemeral: true,
      });
    }
  },
};

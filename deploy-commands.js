const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

// Carrega todos os arquivos de comando
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[AVISO] O comando em ${filePath} não tem a propriedade "data"`
    );
  }
}

// Cria e configura a instância REST
const rest = new REST({ version: "10" }).setToken(token);

// Função para registrar os comandos
(async () => {
  try {
    console.log(`Iniciando o registro de ${commands.length} comandos...`);

    let data;

    if (guildId) {
      // Registra os comandos em um servidor específico (mais rápido, bom para desenvolvimento)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Comandos registrados com sucesso no servidor ${guildId}!`);
    } else {
      // Registra os comandos globalmente (pode levar até uma hora para atualizar)
      data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log("Comandos registrados globalmente com sucesso!");
    }

    console.log(`Registrados ${data.length} comandos.`);
  } catch (error) {
    console.error(error);
  }
})();

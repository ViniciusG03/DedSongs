# Bot de Música para Discord

Um bot de música completo para Discord com suporte a reprodução do YouTube, controle de fila, ajuste de volume e muito mais.

## Funcionalidades

- 🎵 Reprodução de músicas do YouTube por pesquisa ou URL
- 📋 Sistema de fila com visualização detalhada
- ⏯️ Controles completos (play, pause, resume, skip, stop)
- 🔊 Ajuste de volume
- 📊 Informações detalhadas sobre a música atual
- 📝 Busca por letras de músicas (simulado, requer implementação real)

## Pré-requisitos

- [Node.js](https://nodejs.org/) v16.9.0 ou superior
- [Discord.js](https://discord.js.org/) v14
- [FFmpeg](https://ffmpeg.org/) (instalado automaticamente com ffmpeg-static)
- [Bot do Discord criado no Portal do Desenvolvedor](https://discord.com/developers/applications)

## Configuração

1. Clone este repositório:

```bash
git clone https://github.com/seu-usuario/discord-music-bot.git
cd discord-music-bot
```

2. Instale as dependências:

```bash
npm install
```

3. Configuração do bot:
   - Crie um arquivo `config.json` com base no modelo fornecido
   - Adicione seu token e ID do cliente do Discord
   - Opcionalmente, adicione o ID do seu servidor para desenvolvimento

```json
{
  "token": "SEU_TOKEN_AQUI",
  "clientId": "ID_DO_SEU_BOT_AQUI",
  "guildId": "ID_DO_SEU_SERVIDOR_PARA_TESTES"
}
```

4. Registre os comandos no Discord:

```bash
npm run deploy
```

5. Inicie o bot:

```bash
npm start
```

## Permissões necessárias

Ao adicionar o bot ao seu servidor, certifique-se de conceder as seguintes permissões:

- Enviar Mensagens
- Anexar Arquivos
- Incorporar Links
- Usar Comandos de Aplicativos
- Conectar (Voz)
- Falar (Voz)
- Use Voice Activity (Voz)

## Comandos

| Comando     | Descrição                                          |
| ----------- | -------------------------------------------------- |
| /play       | Reproduz uma música do YouTube                     |
| /queue      | Mostra a fila atual de músicas                     |
| /pause      | Pausa a música atual                               |
| /resume     | Retoma a reprodução da música pausada              |
| /skip       | Pula para a próxima música na fila                 |
| /stop       | Para a reprodução e limpa a fila                   |
| /volume     | Ajusta o volume da reprodução (1-100%)             |
| /nowplaying | Mostra detalhes sobre a música atual               |
| /lyrics     | Busca a letra da música atual ou de uma específica |

## Personalização

### Adicionando novos comandos

1. Crie um novo arquivo na pasta `commands/`
2. Siga o padrão dos comandos existentes
3. Execute `npm run deploy` para registrar o novo comando

### Modificando eventos

Os eventos do player estão configurados no arquivo `index.js`. Você pode adicionar ou modificar eventos conforme necessário.

## Hospedagem

Para hospedar o bot 24/7, considere usar serviços como:

- [Heroku](https://heroku.com)
- [Glitch](https://glitch.com)
- [Replit](https://replit.com)
- [Railway](https://railway.app)

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

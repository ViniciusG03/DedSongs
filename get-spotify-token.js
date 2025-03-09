// Arquivo: get-spotify-token.js
// Script para obter o refresh token do Spotify

const express = require("express");
const request = require("request");
// Corrigindo a importação do pacote open
const { default: openBrowser } = await import("open");
const app = express();

// Substitua com suas credenciais do Spotify
const CLIENT_ID = "da58570bd2ba4d078229b6967bf6f006";
const CLIENT_SECRET = "64c9b0337ae34fad928d0276033bffa9";
const REDIRECT_URI = "http://localhost:3000/callback";
const PORT = 3000;

// Escopos necessários para o bot de música
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
].join("%20");

// Rota inicial para iniciar o fluxo de autorização
app.get("/", (req, res) => {
  res.redirect(
    `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`
  );
});

// Rota de callback que será chamada após a autorização
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    res.send("Erro: Nenhum código de autorização recebido.");
    return;
  }

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    json: true,
  };

  request.post(authOptions, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      res.send(`Erro ao obter tokens: ${error || JSON.stringify(body)}`);
      return;
    }

    const access_token = body.access_token;
    const refresh_token = body.refresh_token;

    // Exibe os tokens na página
    res.send(`
      <h1>Tokens do Spotify Obtidos com Sucesso!</h1>
      <p>Adicione estes tokens ao seu arquivo config.json:</p>
      <pre>
"spotify": {
  "clientId": "${CLIENT_ID}",
  "clientSecret": "${CLIENT_SECRET}",
  "refreshToken": "${refresh_token}"
}
      </pre>
      <p><strong>Refresh Token:</strong> ${refresh_token}</p>
      <p><em>Mantenha este token seguro! Ele permite acesso à sua conta do Spotify.</em></p>
      <p>Você pode fechar esta janela e parar o servidor com Ctrl+C no terminal.</p>
    `);

    // Também exibe no console
    console.log("\n===== TOKENS SPOTIFY =====");
    console.log(`Refresh Token: ${refresh_token}`);
    console.log("===========================\n");
    console.log("Copie o refresh token acima para o seu arquivo config.json");
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log("Acesse esta URL no seu navegador para autorização do Spotify:");
  console.log(`http://localhost:${PORT}`);

  // Tenta abrir o navegador automaticamente, mas oferece alternativa manual
  try {
    openBrowser(`http://localhost:${PORT}`);
    console.log("Navegador aberto automaticamente.");
  } catch (error) {
    console.log("Não foi possível abrir o navegador automaticamente.");
    console.log("Por favor, copie e cole a URL acima no seu navegador.");
  }

  console.log("\nINSTRUÇÕES:");
  console.log("1. Faça login no Spotify quando solicitado");
  console.log("2. Autorize o acesso do aplicativo");
  console.log("3. Copie o refresh token que aparecerá na página");
  console.log("4. Adicione o token ao seu arquivo config.json");
  console.log("5. Pressione Ctrl+C para encerrar o servidor quando terminar");
});

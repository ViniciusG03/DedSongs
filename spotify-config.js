// Arquivo: spotify-config.js
// Configuração avançada para integração com Spotify

const { SpotifyExtractor } = require("@discord-player/extractor");
const config = require("./config.json");

/**
 * Configura a integração avançada com o Spotify para o discord-player
 * @param {Player} player - Instância do Player do discord-player
 */
function setupSpotify(player) {
  // Verifica se há credenciais do Spotify configuradas
  if (
    !config.spotify ||
    !config.spotify.clientId ||
    !config.spotify.clientSecret
  ) {
    console.log(
      "⚠️ Aviso: Credenciais do Spotify incompletas. O bot pode não funcionar corretamente."
    );
    return false;
  }

  try {
    // Configura o extrator do Spotify com credenciais
    player.extractors.register(SpotifyExtractor, {
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
      autoResolveYoutubeVideos: false, // Desativar resolução automática para YouTube
      useFallback: false, // Não usar fallback para outra fonte se o Spotify falhar
    });

    console.log("✅ Integração avançada com Spotify configurada com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao configurar extrator do Spotify:", error);
    return false;
  }
}

/**
 * Verifica e corrige os URLs do Spotify para formato compatível
 * @param {string} url - URL ou URI do Spotify
 * @returns {string} URL corrigido
 */
function normalizeSpotifyUrl(url) {
  // Se não for um link ou URI do Spotify, retorna como está
  if (!url.includes("spotify.com") && !url.startsWith("spotify:")) {
    return url;
  }

  let trackId = "";
  let type = "";

  // Extrai ID e tipo de vários formatos de URL/URI
  if (url.includes("/track/")) {
    trackId = url.split("/track/")[1].split("?")[0];
    type = "track";
  } else if (url.includes("/playlist/")) {
    trackId = url.split("/playlist/")[1].split("?")[0];
    type = "playlist";
  } else if (url.includes("/album/")) {
    trackId = url.split("/album/")[1].split("?")[0];
    type = "album";
  } else if (url.startsWith("spotify:track:")) {
    trackId = url.split("spotify:track:")[1];
    type = "track";
  } else if (url.startsWith("spotify:playlist:")) {
    trackId = url.split("spotify:playlist:")[1];
    type = "playlist";
  } else if (url.startsWith("spotify:album:")) {
    trackId = url.split("spotify:album:")[1];
    type = "album";
  }

  // Se foi possível extrair ID e tipo, retorna URL normalizado
  if (trackId && type) {
    return `https://open.spotify.com/${type}/${trackId}`;
  }

  // Se não foi possível extrair, retorna URL original
  return url;
}

module.exports = {
  setupSpotify,
  normalizeSpotifyUrl,
};

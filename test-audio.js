// Arquivo: test-audio.js
// Este script testa os subsistemas de áudio necessários para o bot de música

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

console.log("Iniciando teste de subsistemas de áudio...");

// Função para verificar se um módulo pode ser carregado
function testModule(moduleName) {
  try {
    require(moduleName);
    console.log(`✅ ${moduleName}: Carregado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ ${moduleName}: Falha ao carregar - ${error.message}`);
    return false;
  }
}

// Função para executar um comando e retornar a saída
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro ao executar '${command}': ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`⚠️ Aviso ao executar '${command}': ${stderr}`);
      }
      return resolve(stdout);
    });
  });
}

// Função principal de teste
async function runTests() {
  console.log("\n=== Teste de Dependências ===");

  // Testar dependências principais
  const coreDeps = [
    "@discordjs/opus",
    "discord-player",
    "discord.js",
    "ffmpeg-static",
    "libsodium-wrappers",
    "ytdl-core",
  ];

  let allDepsLoaded = true;
  for (const dep of coreDeps) {
    const success = testModule(dep);
    if (!success) allDepsLoaded = false;
  }

  // Verificar versão do Node.js
  console.log("\n=== Ambiente Node.js ===");
  console.log(`Node.js version: ${process.version}`);

  // Verificar se o FFMPEG está disponível
  console.log("\n=== Teste de FFmpeg ===");
  try {
    const ffmpegPath = require("ffmpeg-static");
    console.log(`FFmpeg encontrado em: ${ffmpegPath}`);

    if (fs.existsSync(ffmpegPath)) {
      console.log("✅ FFmpeg existe no caminho especificado");

      // Tenta executar o FFmpeg
      try {
        const output = await runCommand(`"${ffmpegPath}" -version`);
        console.log(`✅ FFmpeg execução: OK`);
        console.log(`Versão: ${output.split("\n")[0]}`);
      } catch (error) {
        console.error("❌ FFmpeg não pode ser executado");
      }
    } else {
      console.error("❌ FFmpeg não existe no caminho especificado");
    }
  } catch (error) {
    console.error(`❌ Erro ao acessar o caminho do FFmpeg: ${error.message}`);
  }

  // Verificar ytdl-core
  console.log("\n=== Teste de ytdl-core ===");
  try {
    const ytdl = require("ytdl-core");
    console.log(`ytdl-core versão: ${ytdl.version}`);

    // Testar info de um vídeo
    try {
      console.log("Testando obtenção de informações de vídeo...");
      const videoId = "dQw4w9WgXcQ"; // Um vídeo popular que provavelmente estará disponível
      const info = await ytdl.getInfo(videoId);
      console.log(`✅ Obteve informações do vídeo: ${info.videoDetails.title}`);

      // Verificar formatos disponíveis
      const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
      console.log(`Formatos de áudio disponíveis: ${audioFormats.length}`);
      if (audioFormats.length > 0) {
        console.log(
          `✅ Formato de áudio encontrado: ${audioFormats[0].mimeType}`
        );
      } else {
        console.error("❌ Nenhum formato de áudio encontrado");
      }
    } catch (error) {
      console.error(`❌ Erro ao testar ytdl-core: ${error.message}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar ytdl-core: ${error.message}`);
  }

  // Testar permissões de diretório
  console.log("\n=== Teste de Permissões ===");
  const currentDir = process.cwd();
  console.log(`Diretório atual: ${currentDir}`);

  try {
    // Teste de escrita
    const testFile = path.join(currentDir, "test-write.tmp");
    fs.writeFileSync(testFile, "test");
    console.log("✅ Permissão de escrita: OK");
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error(`❌ Erro de permissão de escrita: ${error.message}`);
  }

  console.log("\n=== Teste de Subsistemas de Áudio Concluído ===");
  if (!allDepsLoaded) {
    console.log(
      "\n⚠️ Algumas dependências não puderam ser carregadas. Verifique os erros acima."
    );
  }
}

// Executar os testes
runTests().catch((error) => {
  console.error("Erro ao executar testes:", error);
});

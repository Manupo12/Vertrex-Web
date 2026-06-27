import { sendGroupMessage } from "../src/lib/telegram/client";

async function main() {
  console.log("Enviando mensaje de prueba a Telegram...");
  try {
    const result = await sendGroupMessage("✅ Vertrex Bot conectado al grupo.");
    console.log("Resultado del envío:", result);
  } catch (error: any) {
    console.error("Error al enviar el ping:", error.message);
    process.exit(1);
  }
}

main();

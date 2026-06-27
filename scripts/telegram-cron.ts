import { config } from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno locales (.env.local) antes de importar los módulos del proyecto
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("Iniciando ejecución del resumen diario de tareas de Telegram...");
  try {
    const { runDailyDigest } = await import("../src/lib/telegram/run-digest");
    const result = await runDailyDigest();
    
    if (result.sent) {
      console.log(`✅ Resumen diario enviado con éxito. Se notificaron ${result.sections} secciones de tareas.`);
    } else {
      console.log("ℹ️ No se envió ningún resumen (no se encontraron tareas activas vencidas, por vencer o sin asignar).");
    }
  } catch (error: any) {
    console.error("❌ Error crítico ejecutando el resumen diario de Telegram:", error.message);
    process.exit(1);
  }
  process.exit(0);
}

main();

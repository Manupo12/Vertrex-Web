import { buildTaskDigest, renderDigest } from "./task-digest";
import { sendGroupMessage } from "./client";

/**
 * Genera el resumen diario y lo envía al grupo de Telegram.
 * Retorna si se envió o no, junto con la cantidad de secciones encontradas.
 */
export async function runDailyDigest(now?: Date): Promise<{ sent: boolean; sections: number }> {
  try {
    const sections = await buildTaskDigest(now);
    
    // Si no hay tareas en ninguna sección, no enviamos mensaje
    if (sections.length === 0) {
      return { sent: false, sections: 0 };
    }

    const text = renderDigest(sections, now);
    if (!text) {
      return { sent: false, sections: 0 };
    }

    await sendGroupMessage(text);
    return { sent: true, sections: sections.length };
  } catch (error) {
    console.error("Error al ejecutar el resumen diario de Telegram:", error);
    throw error;
  }
}

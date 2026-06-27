export function isTelegramEnabled(): boolean {
  return (
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED === "true" &&
    !!process.env.TELEGRAM_BOT_TOKEN &&
    !!process.env.TELEGRAM_GROUP_CHAT_ID
  );
}

/**
 * Envía un mensaje al grupo configurado de Telegram con un reintento simple ante errores de red.
 */
export async function sendGroupMessage(text: string): Promise<{ ok: boolean; messageId?: number }> {
  if (!isTelegramEnabled()) {
    return { ok: false };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
    disable_web_page_preview: true,
  };

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(id);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `Error de API Telegram (${response.status}): ${data.description || "Desconocido"}`
        );
      }

      if (data.ok && data.result) {
        return { ok: true, messageId: data.result.message_id };
      }

      throw new Error(`Respuesta inválida de Telegram: ${JSON.stringify(data)}`);
    } catch (error: any) {
      clearTimeout(id);
      if (attempts >= maxAttempts) {
        throw new Error(`Fallo tras ${maxAttempts} intentos: ${error.message}`);
      }
      // Esperar brevemente antes del reintento (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { ok: false };
}

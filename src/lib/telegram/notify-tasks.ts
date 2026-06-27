import { sendGroupMessage } from "./client";
import { mentionFor } from "./mention";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NotifyTaskAssignedParams {
  assignee: { id: string; name: string; telegramUsername: string | null };
  task: { identifier: string; title: string; dueDate: Date | null };
  assignedByName: string;
}

export async function notifyTaskAssigned({
  assignee,
  task,
  assignedByName,
}: NotifyTaskAssignedParams): Promise<void> {
  try {
    const mention = mentionFor(assignee);
    const dueDateStr = task.dueDate
      ? `\n🗓 Vence: ${format(new Date(task.dueDate), "eee d MMM", { locale: es })}`
      : "";

    const text = `📌 Nueva tarea para ${mention}\n${task.identifier} · ${task.title}${dueDateStr}\nAsignada por ${assignedByName}`;

    await sendGroupMessage(text);
  } catch (error) {
    // Silently log error, do not fail parent server actions
    console.error("Error al enviar notificación de asignación a Telegram:", error);
  }
}

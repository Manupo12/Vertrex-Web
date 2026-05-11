import { NextRequest, NextResponse } from "next/server";
import { requireOsUser } from "@/lib/auth/session";

const suggestions: Record<string, string> = {
  semilla: "Investigar viabilidad técnica y de mercado",
  laboratorio: "Crear un prototipo funcional mínimo",
  ejecutar: "Definir milestones del proyecto",
  congelador: "Revisar en 3 meses si sigue siendo relevante",
};

export async function POST(request: NextRequest) {
  await requireOsUser();

  const body = await request.json();
  const { ideaId, ideaStatus } = body;

  const suggestion = suggestions[ideaStatus as string] || "Refinar la idea y definir próximo paso";

  return NextResponse.json({
    suggestion,
    ideaId,
    ideaStatus,
  });
}

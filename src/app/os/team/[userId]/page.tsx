import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/session";
import { createTeamMemberAction, setTelegramUsernameAction, updateTeamMemberPasswordAction } from "@/lib/db/actions/team";
import { formatShortDate } from "@/lib/format";
import { ManageMember } from "./ManageMember";
import { CopyButton } from "./CopyButton";
import { PermissionsEditor } from "./PermissionsEditor";

interface Props { params: Promise<{ userId: string }>; searchParams: Promise<{ pass?: string }> }

export default async function TeamDetailPage({ params, searchParams }: Props) {
  await requireAdminUser();
  const { userId } = await params;
  const { pass } = await searchParams;

  if (userId === "new") {
    return (
      <div>
        <PageHeader title="Nuevo miembro" breadcrumbs={[{ label: "Equipo", href: "/os/team" }, { label: "Nuevo" }]} />
        <Card className="max-w-lg"><CardHeader><CardTitle>Crear miembro</CardTitle></CardHeader><CardContent>
          <form action={async (fd: FormData) => { void createTeamMemberAction(fd); }} className="space-y-4">
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Nombre *</label><input name="name" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Email *</label><input name="email" type="email" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Contrasena *</label><input name="password" type="password" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Rol</label><select name="role" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"><option value="team">Team</option><option value="admin">Admin</option></select></div>
            <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Crear miembro</button>
          </form>
        </CardContent></Card>
      </div>
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) notFound();

  return (
    <div>
      <PageHeader title={user.name} breadcrumbs={[{ label: "Equipo", href: "/os/team" }, { label: user.name }]} badge={<Badge variant={user.role === "admin" ? "purple" : "neutral"}>{user.role}</Badge>} />
      <div className="max-w-lg space-y-4">
        {pass && (
          <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/10">
            <h3 className="font-semibold text-green-500 mb-2">Credenciales generadas</h3>
            <p className="text-sm text-muted-foreground mb-4">Copia esta contrasena. No se volvera a mostrar.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 text-foreground font-mono">{pass}</code>
              <CopyButton text={pass} />
            </div>
          </div>
        )}
        <Card><CardContent className="pt-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Rol</span><Badge variant={user.role === "admin" ? "purple" : "neutral"}>{user.role}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "Activo" : "Inactivo"}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Creado</span><span>{formatShortDate(user.createdAt)}</span></div>
        </CardContent></Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Integración de Telegram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form 
              action={async (fd: FormData) => {
                "use server";
                const username = String(fd.get("telegramUsername") || "");
                await setTelegramUsernameAction(userId, username);
              }} 
              className="flex items-center gap-2"
            >
              <div className="flex-1">
                <input 
                  name="telegramUsername"
                  placeholder="Usuario de Telegram (ej: manuel_v)"
                  defaultValue={user.telegramUsername || ""}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
                Guardar
              </button>
            </form>
            <p className="text-xs text-muted-foreground">
              Ingresa el usuario sin el símbolo @. Esto permite vincular las tareas de este miembro al bot notificador de Telegram.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Cambiar Contraseña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form 
              action={async (fd: FormData) => {
                "use server";
                const pass = String(fd.get("newPassword") || "").trim();
                await updateTeamMemberPasswordAction(userId, pass);
              }} 
              className="flex items-center gap-2"
            >
              <div className="flex-1">
                <input 
                  name="newPassword"
                  type="password"
                  required
                  placeholder="Nueva contraseña (mínimo 6 caracteres)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
                Actualizar
              </button>
            </form>
            <p className="text-xs text-muted-foreground">
              Establece una nueva contraseña de inicio de sesión para este miembro. La actualización es instantánea.
            </p>
          </CardContent>
        </Card>

        <ManageMember userId={user.id} currentRole={user.role} isActive={user.isActive} />
        <PermissionsEditor userId={user.id} />
      </div>
    </div>
  );
}

# vertrex (CLI) — Guía para Agentes

CLI para operar **Vertrex OS** (tareas, proyectos, clientes, agenda, notas, actividad, búsqueda) desde la terminal o desde un agente de IA.

## 1. Instalación y descubrimiento

```bash
# 1. Instalar
npm i -g @vertrex/cli   # (o usar npx desde el repo)

# 2. Listar TODOS los comandos disponibles
vertrex commands --json

# 3. Ver ayuda de un comando
vertrex task create --help
```

Convención: **`vertrex <recurso> <acción> [args] [--flags]`** (sustantivo-verbo, Unix).

Recursos MVP: `task`, `project`, `client`, `agenda`, `note`, `activity`, `search`.
Globales: `login`, `logout`, `whoami`, `commands`, `do`, `auth tokens {list|create|revoke}`.

## 2. Autenticación (cuenta de servicio)

```bash
# Variables de entorno (preferidas para agentes)
export VERTREX_API_URL="https://app.vertrex.example"
export VERTREX_TOKEN="vtx_…tu_PAT…"

# O usa un perfil (multi-cuenta)
vertrex login --email <correo> --api-url <url> --profile agente
# te pedirá password y (si aplica) código 2FA
vertrex whoami
```

- El token se guarda en `~/.config/vertrex/credentials.json` (chmod 600).
- Un **PAT** (Personal Access Token) se crea con `vertrex auth tokens create --name agente-orquestador` o desde la web. Formato: `vtx_<random urlsafe>`. Se muestra **una sola vez**.
- `vertrex auth tokens list` lista los tokens (sin el secreto).
- `vertrex auth tokens revoke <id>` lo invalida.

## 3. Flujos comunes (recetas)

```bash
# 1. Crear una tarea
vertrex task create --title "Revisar propuesta de Budaphone" --project <UUID> --json

# 2. Listar tareas de un proyecto
vertrex task list --project <UUID> --json

# 3. Cambiar estado
vertrex task state <TASK_ID> in_progress

# 4. Asignar a un usuario
vertrex task assign <TASK_ID> --to <USER_UUID>

# 5. Mover a otro proyecto
vertrex task move <TASK_ID> --project <UUID> --cycle <CYCLE_UUID>

# 6. Cerrar
vertrex task state <TASK_ID> done

# 7. Buscar en todo el OS
vertrex search "facturas vencidas" --json

# 8. Crear cliente
vertrex client create --name "Acme S.A." --slug acme --email hola@acme.com

# 9. Listar actividad reciente (auditoría)
vertrex activity list --since 2026-06-01 --entity task --json

# 10. Crear nota de knowledge
vertrex note create --title "Insight: ..." --type note
```

## 4. Reglas de seguridad (léeme)

- **Usa `--dry-run`** antes de cualquier escritura. Imprime el `wouldPOST/PATCH/DELETE` con el body **sin ejecutarlo**.
- Las operaciones **destructivas** (`delete`, `move` que reasigna, `state cancelled`, `assign none`) requieren `--yes` además del flag global por defecto. Sin `--yes` la CLI rechaza con exit 64.
- **Todo se audita** en `activity` con tu usuario real (resuelto del PAT). No hay forma de actuar anónimamente.
- **El RBAC es server-side.** El CLI no es la barrera. Si tu usuario no tiene `projects:write`, el servidor devuelve 403 aunque le mandes `POST /tasks`.
- **Rate limit** por token (100 req/min). Si excedes, el CLI responde 429 (exit 70).
- **Idempotency**: en Fase 2 añadiremos `idempotencyKey` a POST. Hasta entonces, reintentar un `create` puede duplicar.

## 5. Formato de salida

- `--format table|json|yaml|csv` (default `table`).
- `--json` atajo de `--format json`.
- Errores siempre estructurados: `[<code>] <message>`, exit code de `sysexits.h` (64 uso, 69 no disponible, 70 software, 77 sin permiso, 65 datos).

## 6. Para saber más

- `vertrex commands --json` — catálogo vivo (endpoints + descripción).
- `cli/README.md` — instalación, build, contribución.
- `docs/superpowers/specs/2026-06-14-vertrex-cli-design.md` — diseño del CLI.
- `docs/superpowers/plans/2026-06-14-vertrex-cli-mvp.md` — plan de implementación.

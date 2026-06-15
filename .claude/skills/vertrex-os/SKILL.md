---
name: vertrex-os
description: Operar Vertrex OS (tareas, proyectos, clientes, agenda, notas, búsqueda, actividad) desde la terminal usando el CLI `vertrex`. Usar cuando el usuario quiera consultar o editar el OS, "organizar la empresa", listar/crear/mover tareas, asignar trabajo, registrar notas, buscar entidades, ver actividad reciente, o cuando pida acciones de un agente que operen el sistema.
---

# Skill: vertrex-os

Esta skill envuelve el CLI **`vertrex`** (paquete `@vertrex/cli`) que habla con la API `/api/v1/*` de Vertrex OS. Es **AI-native**: el catálogo de comandos es descubrible en runtime.

## Setup

1. **Credenciales**: la skill asume que el agente tiene un Personal Access Token (PAT) en la variable de entorno `VERTREX_TOKEN` y la URL en `VERTREX_API_URL`. Si no, el agente puede llamar `vertrex login` (leerá email/password de variables `VERTREX_EMAIL`/`VERTREX_PASSWORD`, o los pedirá).
2. **Cuenta de servicio**: se recomienda un usuario dedicado con rol acotado y un PAT de larga duración. **Nunca** usar cuentas personales.
3. **Verificación rápida**: `vertrex whoami --json` debe devolver 200 con `{user:{...}, permissions:[...]}`.

## Convenciones

- **Comandos**: `vertrex <recurso> <acción> [args] [--flags]`
- **Recursos MVP**: `task`, `project`, `client`, `agenda`, `note`, `activity`, `search`.
- **Globales**: `login`, `logout`, `whoami`, `commands`, `do`, `auth tokens ...`.
- **Flags globales**: `--format table|json|yaml|csv`, `--json` (atajo), `--profile <nombre>`, `--api-url <url>`, `--dry-run`, `--yes`.
- **Salida**: por defecto `table` para humanos. **Usar `--json` siempre** desde el agente.

## Reglas de seguridad

- **Antes de mutar**: ejecutar con `--dry-run` y mostrar al humano lo que se haría.
- **Destructivo**: `delete`, mover entre proyectos, desasignar → requieren `--yes` adicional a `--dry-run`.
- **RBAC server-side**: el CLI no es la barrera. Si el usuario no tiene permiso, el servidor devuelve 403 y el CLI exit 77.
- **Rate limit**: 100 req/min/token (excede → 429, exit 70). Pausar y reintentar.
- **Auditoría**: toda mutación queda registrada en `activity` con el actor real. No hay forma de actuar anónimo.
- **No asumas IDs**: si necesitas el `projectId` de "Acme", primero `vertrex project list --json | jq '.[]|select(.name|test("Acme"))|{id,name}'`.

## Recetas (las más usadas)

### Tareas
```bash
# Crear
vertrex task create --title "<título>" --project <UUID> --priority 2 --json

# Listar (filtros: --project, --assignee, --state)
vertrex task list --project <UUID> --json

# Cambiar estado (atomic, sin PATCH)
vertrex task state <TASK_ID> in_progress

# Asignar ("me" o UUID o "none")
vertrex task assign <TASK_ID> --to <USER_UUID>

# Mover de proyecto
vertrex task move <TASK_ID> --project <NEW_PROJECT_UUID> --cycle <CYCLE_UUID>

# Cerrar
vertrex task state <TASK_ID> done
```

### Proyectos / clientes / agenda / notas
```bash
vertrex project list --json
vertrex project create --name "Acme v2" --key ACME2 --json
vertrex client list --q "Budaphone" --json
vertrex client create --name "Acme S.A." --slug acme --email hola@acme.com
vertrex agenda list --json
vertrex agenda create --title "Reunión Acme" --start 2026-06-20T10:00:00Z --end 2026-06-20T11:00:00Z
vertrex note create --title "Insight semanal" --type note
vertrex note list --limit 5 --json
```

### Auditoría y búsqueda
```bash
vertrex activity list --since 2026-06-01 --entity task --limit 50 --json
vertrex search "facturas vencidas" --json
```

### Lenguaje natural (conservador)
```bash
# Dry-run: solo muestra el plan
vertrex do "crea una tarea Preparar propuesta para Budaphone"
# Ejecuta el plan
vertrex do "marca tarea ACME-42 como done" --yes
```

Intenciones soportadas por el MVP: crear/cerrar/asignar tareas, crear notas, listar, buscar.

## Descubrir comandos

```bash
vertrex commands --json    # catálogo completo de endpoints
vertrex <topic> --help     # ayuda de un grupo
vertrex <topic> <action> --help
```

## Resolución de problemas

- **401 Unauthorized** → token inválido, expirado o revocado. `vertrex whoami --json` para diagnosticar.
- **403 forbidden** → el usuario del token no tiene el permiso del módulo. Revisar `permissions` en `whoami`.
- **404 not_found** → ID incorrecto. Volver a listar y copiar el `id` (uuid).
- **400 bad_request** → el body no cumple el zod schema. El campo `details` del envelope lista los paths que fallan.
- **429 rate_limited** → bajar el ritmo; esperar 60s.

## Documentación

- `cli/AGENT.md` — referencia completa del CLI.
- `docs/superpowers/specs/2026-06-14-vertrex-cli-design.md` — diseño.
- `docs/superpowers/plans/2026-06-14-vertrex-cli-mvp.md` — plan MVP.

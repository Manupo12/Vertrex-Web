# @vertrex/cli

CLI para operar **Vertrex OS** desde la terminal. Construido con [oclif](https://oclif.io).

## Uso rápido

```bash
# Login
vertrex login

# Comandos (descubribles)
vertrex commands --json

# Tareas
vertrex task list --project <UUID>
vertrex task create --title "..." --project <UUID>
vertrex task state <ID> done
vertrex task assign <ID> --to <USER>

# Recursos
vertrex project list
vertrex client list
vertrex agenda list
vertrex note list
vertrex activity list --since 2026-06-01

# Búsqueda y NL
vertrex search "facturas"
vertrex do "crea una tarea Preparar demo para el viernes"
```

Ver `AGENT.md` para la guía completa pensada para agentes de IA.

## Desarrollo

```bash
# En el repo raíz
npm install               # instala el workspace
cd cli
npm run build             # compila TS → dist/
npm run test              # corre vitest
./bin/run.js --help       # prueba el binario local
```

## Estructura

```
cli/
  bin/run.js              # entrypoint oclif
  src/
    commands/             # un archivo por comando, agrupado por topic
      task/               # task list|get|create|update|state|assign|move|subtask|delete
      project/            # project list|get|create|update|delete
      client/             # client list|get|create|update|delete
      agenda/             # agenda list|get|create|update|delete
      note/               # note list|get|create|update|delete
      activity/list.ts
      search.ts
      do.ts
      commands.ts
      login.ts
      logout.ts
      whoami.ts
    lib/
      base.ts             # BaseCommand con flags globales
      client.ts           # cliente fetch + envelope + exit codes
      config.ts           # credenciales en ~/.config/vertrex/
      output.ts           # formateadores table/json/yaml/csv
      crud.ts             # factories para list/get/delete
      prompt.ts           # readline prompt (con -W off para password)
  AGENT.md
  README.md
```

## Variables de entorno

- `VERTREX_API_URL` — URL base de la API (default: `http://localhost:3000`).
- `VERTREX_PROFILE` — perfil de credenciales a usar (default: `default`).
- `VERTREX_CONFIG_DIR` — directorio alternativo para `credentials.json`.

## Salida y exit codes

- Éxito → `0`
- Error de uso (CLI) → `64` (EX_USAGE)
- Datos inválidos (API 4xx) → `65` (EX_DATAERR)
- Servicio no disponible (404) → `69` (EX_UNAVAILABLE)
- Error interno (5xx) → `70` (EX_SOFTWARE)
- Sin permiso (401/403) → `77` (EX_NOPERM)

## Licencia

Privado.

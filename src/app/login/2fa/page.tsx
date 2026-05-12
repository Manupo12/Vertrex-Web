import { verifyTwoFactorLoginAction } from "./actions";

export default async function TwoFactorPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
          Verificación en dos pasos
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Ingresa el código de 6 dígitos de tu aplicación de autenticación.
        </p>

        <form action={verifyTwoFactorLoginAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId || ""} />
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-muted-foreground mb-1">
              Código TOTP
            </label>
            <input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Verificar e ingresar
          </button>
        </form>
      </div>
    </main>
  );
}

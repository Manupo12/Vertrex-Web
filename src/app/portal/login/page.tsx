import { loginClientAction } from "./actions";
import { ToasterVertrex } from "@/components/ui/toaster";

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Portal de Cliente</h1>
        <p className="mb-6 text-center text-gray-500 text-lg">Ingresa con tu codigo de acceso</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
            {error === "1" ? "El PIN o codigo no coinciden. Revisa los datos e intenta de nuevo." : "Ocurrio un error al iniciar sesion."}
          </div>
        )}

        <form action={loginClientAction} className="space-y-5">
          <div>
            <label htmlFor="slug" className="block text-base font-medium text-gray-700 mb-1">Codigo de cliente</label>
            <input id="slug" name="slug" required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="tu-empresa" />
          </div>
          <div>
            <label htmlFor="pin" className="block text-base font-medium text-gray-700 mb-1">PIN de 6 digitos</label>
            <input id="pin" name="pin" type="password" inputMode="numeric" maxLength={6} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-2xl tracking-[0.3em] text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="000000" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-green-600 px-6 py-3.5 text-lg font-semibold text-white hover:bg-green-700 transition-colors">Entrar a mi portal</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">Si no tienes tu PIN, solicitalo a tu contacto de Vertrex por WhatsApp.</p>
      </div>
      <ToasterVertrex />
    </div>
  );
}

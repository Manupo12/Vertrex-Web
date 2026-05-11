import { loginClientAction } from "./actions";
import { ToasterVertrex } from "@/components/ui/toaster";
import { InfoIcon } from "lucide-react";

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Portal de Cliente</h1>
        <p className="mb-6 text-center text-gray-500 text-lg">Ingresa con tu código de acceso</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
            {error === "not_found" ? "No pudimos encontrar ese cliente. Verifica el código." : 
             error === "invalid_pin" ? "Los datos no coinciden. Revisa el código, email y PIN e intenta de nuevo." : 
             "Ocurrió un error al iniciar sesión."}
          </div>
        )}

        <form action={loginClientAction} className="space-y-5">
          <div>
            <label htmlFor="slug" className="block text-base font-medium text-gray-700 mb-1">Código de cliente *</label>
            <input id="slug" name="slug" required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="tu-empresa" />
          </div>
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input id="email" name="email" type="email" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="juan@tu-empresa.com" />
            <div className="mt-2 flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <InfoIcon className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <p>Si usas un PIN maestro o genérico, puedes dejar el correo en blanco.</p>
            </div>
          </div>
          <div>
            <label htmlFor="pin" className="block text-base font-medium text-gray-700 mb-1">PIN de 6 dígitos *</label>
            <input id="pin" name="pin" type="password" inputMode="numeric" maxLength={6} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-2xl tracking-[0.3em] text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="000000" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-green-600 px-6 py-3.5 text-lg font-semibold text-white hover:bg-green-700 transition-colors">Entrar a mi portal</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">Si perdiste tu acceso, solicítalo a tu contacto de Vertrex.</p>
      </div>
      <ToasterVertrex />
    </div>
  );
}

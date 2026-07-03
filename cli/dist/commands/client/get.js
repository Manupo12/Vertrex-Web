import { makeGetCommand } from "../../lib/crud.js";
export default makeGetCommand((id) => `/api/v1/clients/${id}`, "Obtener detalle de un cliente (por id o slug)");

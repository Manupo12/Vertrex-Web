import { makeGetCommand } from "../../lib/crud.js";
export default makeGetCommand((id) => `/api/v1/agenda/${id}`, "Obtener detalle de un evento de agenda");

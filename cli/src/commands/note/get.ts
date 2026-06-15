import { makeGetCommand } from "../../lib/crud.js";

export default makeGetCommand((id) => `/api/v1/notes/${id}`, "Obtener detalle de una nota");

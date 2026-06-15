import { makeDeleteCommand } from "../../lib/crud.js";

export default makeDeleteCommand((id) => `/api/v1/agenda/${id}`, "Borrar un evento de agenda (destructivo, requiere --yes)");

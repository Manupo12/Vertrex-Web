import { makeDeleteCommand } from "../../lib/crud.js";

export default makeDeleteCommand((id) => `/api/v1/clients/${id}`, "Borrar un cliente (destructivo, requiere --yes)");

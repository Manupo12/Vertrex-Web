import { makeDeleteCommand } from "../../lib/crud.js";

export default makeDeleteCommand((id) => `/api/v1/notes/${id}`, "Borrar una nota (destructivo, requiere --yes)");

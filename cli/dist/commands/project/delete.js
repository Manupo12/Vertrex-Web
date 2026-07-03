import { makeDeleteCommand } from "../../lib/crud.js";
export default makeDeleteCommand((id) => `/api/v1/projects/${id}`, "Borrar un proyecto (destructivo, requiere --yes)");

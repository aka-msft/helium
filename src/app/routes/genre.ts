import { apiPrefix } from "../../config/constants";
import { ServiceLocator } from "../../config/servicelocator";
import * as genres from "../controllers/genre";

/**
 * Genre endpoint routes
 */
export async function registerRoutes(app) {

    const locator = await ServiceLocator.getInstance();
    const telem = locator.getTelemClient();
    telem.trackEvent("register genre routes");

    // Retrieve all genres
    app.get(apiPrefix + "/genres", genres.getAll);
}

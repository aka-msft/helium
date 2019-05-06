import { apiPrefix } from "../../config/constants";
import { ServiceLocator } from "../../config/servicelocator";
import * as actors from "../controllers/actor";

/**
 * Movie endpoint routes
 */
export async function registerRoutes(app) {

    const locator = await ServiceLocator.getInstance();
    const telem = locator.getTelemClient();
    telem.trackEvent("register actor routes");

    // Retrieve all movies
    app.get(apiPrefix + "/actors", actors.getAll);

    // temporarily commenting out creating functionality for demo purposes
    // Create an actor
    app.post(apiPrefix + "/actors", actors.createActor);

    // Retrieve a single actor by id
    app.get(apiPrefix + "/actors/:id", actors.getActorById);
}

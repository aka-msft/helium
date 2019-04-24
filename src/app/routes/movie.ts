import { ServiceLocator } from "../../config/servicelocator";
import * as movies from "../controllers/movie";

/**
 * Movie endpoint routes
 */
export async function registerRoutes(app) {

    const locator = await ServiceLocator.getInstance();
    const telem = locator.getTelemClient();
    telem.trackEvent("register movie routes");

    // @todo move up a level so other entities can inherit
    const apiPrefix = "/api";

    // Retrieve all movies
    app.get(apiPrefix + "/movies", movies.getAll);

    // Create a movie
    app.post(apiPrefix + "/movies", movies.createMovie);

    // Retrieve a single movie by id
    app.get(apiPrefix + "/movies/:id", movies.getMovieById);
}

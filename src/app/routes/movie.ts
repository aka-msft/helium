import { apiPrefix } from "../../config/constants";
import { ServiceLocator } from "../../config/servicelocator";
import * as movies from "../controllers/movie";

/**
 * Movie endpoint routes
 */
export async function registerRoutes(app) {

    const locator = await ServiceLocator.getInstance();
    const telem = locator.getTelemClient();
    telem.trackEvent("register movie routes");

    // Health check - pings CosmosDB
    // TODO: Figure out how to implement health check
    // app.get('/healthz', app);

    // Retrieve all movies
    app.get(apiPrefix + "/movies", movies.getAll);

    // temporarily commenting out creating functionality for demo purposes
    // Create a movie
    // app.post(apiPrefix + "/movies", movies.createMovie);

    // Retrieve a single movie by id
    app.get(apiPrefix + "/movies/:id", movies.getMovieById);
}

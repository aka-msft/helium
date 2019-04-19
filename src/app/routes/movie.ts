import * as movies from "../controllers/movie";

/**
 * Movie endpoint routes
 */
export function registerRoutes(app, telemetryClient) {

    telemetryClient.trackEvent({name: "In Register routes"});
    
    // @todo move up a level so other entities can inherit
    const apiPrefix = "/api";

    // Health check - pings CosmosDB
    // TODO: Figure out how to implement health check
    //app.get('/healthz', app);

    // Retrieve all movies
    app.get(apiPrefix + "/movies", movies.getAll);

    // Create a movie
    app.post(apiPrefix + "/movies", movies.createMovie);

    // Retrieve a single movie by id
    app.get(apiPrefix + "/movies/:id", movies.getMovieById);
}

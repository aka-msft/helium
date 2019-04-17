import * as movies from '../controllers/movie'

export function registerRoutes (app) {

    const apiPrefix = "/api";

    // Health check - pings CosmosDB
    // TODO: Figure out how to implement health check
    //app.get('/healthz', app);

    // Retrieve all movies
    app.get(apiPrefix + '/movies', movies.getAll);

    // Create a movie
    app.post(apiPrefix + '/movies/:name', movies.createMovie);

    // Retrieve a single movie by id
    app.get(apiPrefix + '/movies/:id', movies.getMovieById);
}
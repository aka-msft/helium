import * as genres from "../controllers/genre";

/**
 * Genre endpoint routes
 */
export function registerRoutes(app, telemetryClient) {

    telemetryClient.trackEvent({name: "In Register genre routes"});

    // @todo move up a level so other entities can inherit
    const apiPrefix = "/api";

    // Retrieve all genres
    app.get(apiPrefix + "/genres", genres.getAll);
}

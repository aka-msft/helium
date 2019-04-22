import * as health from "../controllers/system";

/**
 * System endpoint routes
 */
export function registerRoutes(app, telemetryClient) {

    telemetryClient.trackEvent({name: "Registering routes for healthcheck"});

    // health check tells other services if this app is running properly or not
    app.get("/healthz", health.healthcheck);
}

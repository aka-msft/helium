import * as health from "../controllers/system";

/**
 * System endpoint routes
 */
export function registerRoutes(app) {
    // health check tells other services if this app is running properly or not
    app.get("/healthz", health.healthcheck);
}

import { ServiceLocator } from "../../config/servicelocator";
import * as health from "../controllers/system";

/**
 * System endpoint routes
 */
export async function registerRoutes(app) {

    const locator = await ServiceLocator.getInstance();
    const telem = locator.getTelemClient();
    telem.trackEvent("register system routes");

    // health check tells other services if this app is running properly or not
    app.get("/healthz", health.healthcheck);
}

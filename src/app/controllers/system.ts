import { ServiceLocator } from "../../config/servicelocator";

/**
 * Health check controller
 * tells external services if the service is running
 */
export async function healthcheck(req, res) {
    // Stub:
    const locator = await ServiceLocator.getInstance();
    // @todo query cosmos and return 200 if it works
    // const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("healthcheck called");
    return res.send(200, {message: "Successfully reached healthcheck endpoint"});
}

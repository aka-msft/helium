import { DocumentQuery } from "documentdb";
import { ServiceLocator } from "../../config/servicelocator";
import { collection, database } from "../../db/dbconstants";

/**
 * Health check controller
 * tells external services if the service is running
 */
export async function healthcheck(req, res) {
    // Stub:
    const locator = await ServiceLocator.getInstance();
    // @todo query cosmos and return 200 if it works
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("healthcheck called");

    const querySpec: DocumentQuery  = {
        parameters: [],
        query: "SELECT * FROM root",
    };

    try {
        const results = await cosmosDb.queryCollections(database, querySpec);
    } catch (e) {
        return res.send(500, {message: "Application failed to reach database"});
    }

    return res.send(200, {message: "Successfully reached healthcheck endpoint"});
}

import { DocumentQuery } from "documentdb";
import { ServiceLocator } from "../../config/servicelocator";
import { collection, database } from "../../db/dbconstants";

/**
 * returns all genres from cosmos db instance
 * @param req request object
 * @param res response object
 */
export async function getAll(req, res) {

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("get all genres");

    const querySpec = {
        parameters: [],
        query: "SELECT * FROM root where root.type = 'Genre'",
    };

    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

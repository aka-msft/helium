import { DocumentQuery } from "documentdb";
import { ServiceLocator } from "../../config/servicelocator";
import { collection, database } from "../../db/dbconstants";
import { telemetryClient } from "../../server";

/**
 * returns all genres from cosmos db instance
 * @param req request object
 * @param res response object
 */
export async function getAll(req, res) {

    telemetryClient.trackEvent({name: "getAll endpoint"});

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();

    const querySpec = {
        parameters: [],
        query: "SELECT * FROM root where root.type = 'Genre'",
    };

    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

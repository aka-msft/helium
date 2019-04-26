import { DocumentQuery } from "documentdb";
import { ServiceLocator } from "../../config/servicelocator";
import { collection, database } from "../../db/dbconstants";

/**
 * Retrieve and Returns all actors
 * @param req request object
 * @param res response object
 */
export async function getAll(req, res) {

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("get all actors");

    const querySpec = {
        parameters: [],
        query: "SELECT * FROM root where root.type = 'Actor'",
    };

    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

/**
 *  Create a actor
 */

/*
// removing create functionality temporarily for demos
export async function createActor(req, res) {
    telemetryClient.trackEvent({name: "createActor endpoint"});
    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    // TODO (seusher): Add validation based on the model
    const result = await cosmosDb.upsertDocument(database, collection, req.body);
    return res.send(200, result);
}
*/

/**
 * Retrieve and return a single actor by actor ID.
 */
export async function getActorById(req, res) {

    const actorId = req.params.id;

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("get actor by id");

    const querySpec: DocumentQuery  = {
        parameters: [
            {
                name: "@id",
                value: actorId,
            },
        ],
        query: "SELECT * FROM root where root.actorId = @id",
    };

    // actorID isn't the partition key, so any search on it will require a cross-partition query.
    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

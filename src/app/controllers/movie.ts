import { DocumentQuery } from "documentdb";
import { ServiceLocator } from "../../config/servicelocator";
import { collection, database } from "../../db/dbconstants";

/**
 *  Retrieve and return all movies
 *  Filter movies by name "?q=<name>"
 */
export async function getAll(req, res) {

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("get all movies");

    let querySpec: DocumentQuery;

    // Movie name is an optional query param.
    // If not specified, we should query for all movies.
    const movieName: string = req.query.q;
    if (movieName === undefined) {
        querySpec = {
            parameters: [],
            query: "SELECT * FROM root where root.type = 'Movie'",
        };
    } else {
        // Use StartsWith in the title search since the textSearch property always starts with the title.
        // This avoids selecting movies with titles that also appear as Actor names or Genres.
        // Make the movieName lowercase to match the case in the search.
        querySpec = {
            parameters: [
                {
                    name: "@title",
                    value: movieName.toLowerCase(),
                },
            ],
            query: "SELECT * FROM root where StartsWith(root.textSearch, @title) and root.type = 'Movie'",
        };
    }

    // A call to either 'get all movies' or 'get movie by title' requires a cross-partition query.
    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

/**
 *  Create a movie
 */
export async function createMovie(req, res) {

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("create movie");

    // TODO (seusher): Add validation based on the model
    const result = await cosmosDb.upsertDocument(database, collection, req.body);

    return res.send(200, result);
}

/**
 * Retrieve and return a single movie by movie ID.
 */
export async function getMovieById(req, res) {

    const movieId = req.params.id;

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();
    const telem = locator.getTelemClient();

    telem.trackEvent("get movie by id");

    const querySpec: DocumentQuery  = {
        parameters: [
            {
                name: "@id",
                value: movieId,
            },
        ],
        query: "SELECT * FROM root where root.movieId = @id and root.type = 'Movie'",
    };

    // movieId isn't the partition key, so any search on it will require a cross-partition query.
    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

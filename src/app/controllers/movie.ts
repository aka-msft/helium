import { DocumentQuery } from "documentdb";
import { ServiceLocator } from "../../config/servicelocator";

const database = "imdb";
const collection = "movies";

/**
 *  Retrieve and return all movies
 *  Filter movies by name "?q=<name>"
 */
export async function getAll(req, res) {

    const locator = await ServiceLocator.getInstance();
    const cosmosDb = locator.getCosmosDB();

    let querySpec: DocumentQuery;

    // Movie name is an optional query param.
    // If not specified, we should query for all movies.
    const movieName = req.query.q;
    if (movieName === undefined) {
        querySpec = {
            parameters: [],
            query: "SELECT * FROM root",
        };
    } else {
        querySpec = {
            parameters: [
                {
                    name: "@title",
                    value: movieName,
                },
            ],
            query: "SELECT * FROM root where CONTAINS(root.title, @title)",
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

    const querySpec: DocumentQuery  = {
        parameters: [
            {
                name: "@id",
                value: movieId,
            },
        ],
        query: "SELECT * FROM root where root.movieId = @id",
    };

    // movieId isn't the partition key, so any search on it will require a cross-partition query.
    const results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
}

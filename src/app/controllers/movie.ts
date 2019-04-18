import { ServiceLocator } from "../../config/servicelocator";
import { DocumentQuery } from "documentdb";

const database = "imdb";
const collection = "movies";

/**
 *  Retrieve and return all movies 
 *  Filter movies by name "?q=<name>"
 */
export async function getAll(req, res) {

    let locator = await ServiceLocator.getInstance();
    let cosmosDb = locator.getCosmosDB();

    var querySpec: DocumentQuery;

    // Movie name is an optional query param.
    // If not specified, we should query for all movies.
    let movieName = req.query["q"];
    if (movieName == undefined) {
        querySpec = {
            query: 'SELECT * FROM root',
            parameters: []
        };
    } else {
        querySpec = {
            query: 'SELECT * FROM root where CONTAINS(root.title, @title)',
            parameters: [
                {
                    name: '@title',
                    value: movieName
                }
            ]
        };
    }
    
    // A call to either 'get all movies' or 'get movie by title' requires a cross-partition query.
    let results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
};

/**
 *  Create a movie
 */
export async function createMovie(req, res) {

    let locator = await ServiceLocator.getInstance();
    let cosmosDb = locator.getCosmosDB();

    // TODO (seusher): Add validation based on the model
    let result = await cosmosDb.upsertDocument(database, collection, req.body);

    return res.send(200, result)
}

/**
 * Retrieve and return a single movie by movie ID.
 */
export async function getMovieById (req, res) {

    let movieId = req.params.id;

    let locator = await ServiceLocator.getInstance();
    let cosmosDb = locator.getCosmosDB();

    let querySpec: DocumentQuery  = {
        query: 'SELECT * FROM root where root.movieId = @id',
        parameters: [
            {
                name: '@id',
                value: movieId
            }
        ]
    };
    
    // movieId isn't the partition key, so any search on it will require a cross-partition query.
    let results = await cosmosDb.queryDocuments(database, collection, querySpec, { enableCrossPartitionQuery: true });

    return res.send(200, results);
};

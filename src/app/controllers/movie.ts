import Joi = require("@hapi/joi");
import { DocumentQuery } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ITelemProvider } from "../../telem/itelemprovider";

/**
 * controller implementation for our movies endpoint
 */
@Controller("/api/movies")
@injectable()
export class MovieController implements interfaces.Controller {

    private static schema = Joi.object().keys({
        id: Joi.string().required(),
        movieId: Joi.string().required(),
        textSearch: Joi.string().when("title",
            {
                is: Joi.string().regex(/^(?!\s*$).+/).required(), // Matches strings that aren't empty or whitespace
                then: Joi.valid(Joi.ref("$title")).required(),
            }),
        title: Joi.string().required(),
        type: Joi.string().valid("Movie").required(),
    }).unknown(); // unknown allows keys to exist in the object that aren't described in the schema above

    constructor(
        @inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
        @inject("ITelemProvider") private telem: ITelemProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
    }

    /**
     *  Retrieve and return all movies
     *  Filter movies by name "?q=<name>"
     */
    @Get("/")
    public async getAll(req, res) {

        this.telem.trackEvent("get all movies");

        let querySpec: DocumentQuery;

        // Movie name is an optional query param.
        // If not specified, we should query for all movies.
        const movieName: string = req.query.q;
        if (movieName === undefined) {
            querySpec = {
                parameters: [],
                query: `SELECT root.movieId, root.type, root.title, root.year,
                root.runtime, root.genres, root.roles
                FROM root where root.type = 'Movie'`,
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
                query: `SELECT root.movieId, root.type, root.title, root.year,
                root.runtime, root.genres, root.roles
                FROM root where CONTAINS(root.textSearch, @title) and root.type = 'Movie'`,
            };
        }

        const results = await this.cosmosDb.queryDocuments(database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true });

        return res.send(200, results);
    }

    /**
     *  Create a movie
     */
    @Post("/")
    public async createMovie(req, res) {

        this.telem.trackEvent("create movie");

        // Return validation result
        const validation = Joi.validate(req.body, MovieController.schema,
            {
                abortEarly: false,
                context:
                {
                    title: req.body.title !== undefined ? req.body.title.toLowerCase() : "",
                },
            });

        // result.error === null -> valid
        if (validation.error === null) {
            const result = await this.cosmosDb.upsertDocument(database, collection, req.body);

            return res.send(201, result);
        } else {
            return res.send(400,
                {
                    message: validation.error.details.map((err) => err.context.key === "textSearch"
                        ? `"textSearch" must be equal to "${req.body.title.toLowerCase()}"`
                        : err.message),
                    status: 400,
                });
        }
    }

    /**
     * Retrieve and return a single movie by movie ID.
     */
    @Get("/:id")
    public async getMovieById(req, res) {

        const movieId = req.params.id;

        this.telem.trackEvent("get movie by id");

        const querySpec: DocumentQuery = {
            parameters: [
                {
                    name: "@id",
                    value: movieId,
                },
            ],
            query: `SELECT root.movieId, root.type, root.title, root.year,
            root.runtime, root.genres, root.roles
            FROM root where root.id = @id and root.type = 'Movie'`,
        };

        // movieId isn't the partition key, so any search on it will require a cross-partition query.
        const results = await this.cosmosDb.queryDocuments(database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true });

        return res.send(200, results);
    }
}

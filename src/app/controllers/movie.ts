import { DocumentQuery, RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Delete, Get, interfaces, Post } from "inversify-restify-utils";
import { httpStatus } from "../../config/constants";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { Movie } from "../models/movie";

/**
 * controller implementation for our movies endpoint
 */
@Controller("/api/movies")
@injectable()
export class MovieController implements interfaces.Controller {

    constructor(
        @inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
        @inject("ITelemProvider") private telem: ITelemProvider,
        @inject("ILoggingProvider") private logger: ILoggingProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
        this.logger = logger;
    }

    /**
     * @api {get} /api/movies Request All Movies
     * @apiName GetAll
     * @apiGroup Movies
     *
     * @apiDescription
     * Retrieve and return all movies.
     * Filter movies by name "?q=<name>".
     *
     * @apiParam (query) {String} [q] Movie title.
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

        let resCode = httpStatus.OK;
        let results: RetrievedDocument[];
        try {
            results = await this.cosmosDb.queryDocuments(
                database,
                collection,
                querySpec,
                { enableCrossPartitionQuery: true },
            );
        } catch (err) {
            resCode = httpStatus.InternalServerError;
        }
        return res.send(resCode, results);
    }

    /**
     * @api {get} /api/movies/:id Request Movie information
     * @apiName GetMovie
     * @apiGroup Movies
     *
     * @apiDescription
     * Retrieve and return a single movie by movie ID.
     *
     * @apiParam (query) {String} id Movie's unique ID.
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
        let resCode = httpStatus.OK;
        let results: RetrievedDocument[];
        try {
            results = await this.cosmosDb.queryDocuments(
                database,
                collection,
                querySpec,
                { enableCrossPartitionQuery: true },
            );
        } catch (err) {
            resCode = httpStatus.InternalServerError;
        }

        if (!results || !results.length) {
            resCode = httpStatus.NotFound;
        }

        return res.send(resCode, results);
    }

    /**
     * @api {post} /api/movies Create Movie
     * @apiName PostMovie
     * @apiGroup Movies
     *
     * @apiDescription
     * Create a movie.
     *
     * @apiParam (body) {String} id
     * @apiParam (body) {String} movieId
     * @apiParam (body) {String} textSearch
     * @apiParam (body) {String} title
     * @apiParam (body) {String="Movie"} type
     * @apiParam (body) {Number} [key]
     * @apiParam (body) {Number} [year]
     * @apiParam (body) {Number} [rating]
     * @apiParam (body) {Number} [votes]
     * @apiParam (body) {String[]} [genres]
     * @apiParam (body) {Actor[]} [roles]
     */
    @Post("/")
    public async createMovie(req, res) {

        this.telem.trackEvent("create movie");

        const movie: Movie = Object.assign(Object.create(Movie.prototype),
            JSON.parse(JSON.stringify(req.body)));

        movie.validate().then(async (errors) => {
            if (errors.length > 0) {
                return res.send(httpStatus.BadRequest,
                    {
                        message: [].concat.apply([], errors.map((x) =>
                            Object.values(x.constraints))),
                        status: httpStatus.BadRequest,
                    });
            }
        });

        // upsert document, catch errors
        let resCode: number = httpStatus.Created;
        let result: RetrievedDocument;
        try {
            result = await this.cosmosDb.upsertDocument(
                database,
                collection,
                req.body,
            );
        } catch (err) {
            resCode = httpStatus.InternalServerError;
        }
        return res.send(resCode, result);
    }

    /**
     * Delete a single movie by movie ID.
     */
    @Delete("/:id")
    public async deleteMovieById(req, res) {

        const movieId = req.params.id;

        this.telem.trackEvent("delete movie by id");

        // movieId isn't the partition key, so any search on it will require a cross-partition query.
        let resCode = httpStatus.OK;
        let result = "deleted";
        try {
          await this.cosmosDb.deleteDocument(
            database,
            collection,
            movieId,
          );
        } catch (err) {
          if (err.toString().includes("NotFound")) {
            resCode = httpStatus.NotFound;
            result = "A Movie with that ID does not exist";
            } else {
            resCode = httpStatus.InternalServerError;
            result = err.toString();
          }
        }
        return res.send(resCode, result);
    }
}

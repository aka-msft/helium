import { DocumentQuery, RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Delete, Get, interfaces, Post, Put } from "inversify-restify-utils";
import * as HttpStatus from "http-status-codes";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { DateUtilities } from "../../utilities/dateUtilities";
import { Movie } from "../models/movie";
import { getDbConfigValues } from "../../config/dbconfig";
import { movieDoesNotExistError } from "../../config/constants";

/**
 * controller implementation for our movies endpoint
 */
@Controller("/api/movies")
@injectable()
export class MovieController implements interfaces.Controller {

    // Must be type Any so we can return the string in GET API calls.
    private static readonly movieDoesNotExistError: any = "A Movie with that ID does not exist";

    constructor(@inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
                @inject("ITelemProvider") private telem: ITelemProvider,
                @inject("ILoggingProvider") private logger: ILoggingProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
        this.logger = logger;
    }

    // Get database config
    private dbconfig: any = getDbConfigValues(this.logger);

    /**
     * @swagger
     *
     * /api/movies:
     *   get:
     *     description: Retrieve and return all movies.
     *     tags:
     *       - Movies
     *     parameters:
     *       - name: q
     *         description: The movie title to filter by.
     *         in: query
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: List of movie objects
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Movie'
     *       default:
     *         description: Unexpected error
     */
    @Get("/")
    public async getAll(req, res) {
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

        let resCode: number = HttpStatus.OK;
        let results: RetrievedDocument[];
        try {
            results = await this.cosmosDb.queryDocuments(
                this.dbconfig.database,
                this.dbconfig.collection,
                querySpec,
                { enableCrossPartitionQuery: true },
            );
        } catch (err) {
            resCode = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return res.send(resCode, results);
    }

    /**
     * @swagger
     *
     * /api/movies/{id}:
     *   get:
     *     description: Retrieve and return a single movie by movie ID.
     *     tags:
     *       - Movies
     *     parameters:
     *       - name: id
     *         description: The ID of the movie to look for.
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: The movie object
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Movie'
     *       '404':
     *         description: An movie with the specified ID was not found.
     *       default:
     *         description: Unexpected error
     */
    @Get("/:id")
    public async getMovieById(req, res) {
        const movieId: string = req.params.id;

        let resCode: number = HttpStatus.OK;
        let result: RetrievedDocument;
        try {
            result = await this.cosmosDb.getDocument(this.dbconfig.database,
                this.dbconfig.collection,
                this.dbconfig.defaultPartitionKey,
                movieId);
        } catch (err) {
            if (err.toString().includes("NotFound")) {
                resCode = HttpStatus.NOT_FOUND;
                result = movieDoesNotExistError;
            } else {
                resCode = HttpStatus.INTERNAL_SERVER_ERROR;
                result = err.toString();
            }
        }

        return res.send(resCode, result);
    }

    /**
     * @swagger
     *
     * /api/movies:
     *   post:
     *     tags:
     *       - Movies
     *     requestBody:
     *       description: Creates an movie.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Movie'
     *         application/xml:
     *           schema:
     *             $ref: '#/components/schemas/Movie'
     *         application/x-www-form-urlencoded:
     *           schema:
     *             $ref: '#/components/schemas/Movie'
     *         text/plain:
     *           schema:
     *             type: string
     *     responses:
     *       '201':
     *         description: The created movie
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Movie'
     *       default:
     *         description: Unexpected error
     */
    @Post("/")
    public async createMovie(req, res) {

        const movie: Movie = Object.assign(Object.create(Movie.prototype),
            JSON.parse(JSON.stringify(req.body)));

        movie.validate().then(async (errors) => {
            if (errors.length > 0) {
                return res.send(HttpStatus.BAD_REQUEST,
                    {
                        message: [].concat.apply([], errors.map((x) =>
                            Object.values(x.constraints))),
                        status: HttpStatus.BAD_REQUEST,
                    });
            }
        });

        // upsert document, catch errors
        let resCode: number = HttpStatus.CREATED;
        let result: RetrievedDocument;
        try {
            result = await this.cosmosDb.upsertDocument(
                this.dbconfig.database,
                this.dbconfig.collection,
                req.body,
            );
        } catch (err) {
            resCode = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return res.send(resCode, result);
    }

    /**
     * @swagger
     *
     * /api/movies/{id}:
     *   put:
     *     tags:
     *       - Movies
     *     parameters:
     *       - name: id
     *         description: The ID of the movie to patch.
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       description: Update a movie
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Movie'
     *         application/xml:
     *           schema:
     *             $ref: '#/components/schemas/Movie'
     *         application/x-www-form-urlencoded:
     *           schema:
     *             $ref: '#/components/schemas/Movie'
     *         text/plain:
     *           schema:
     *             type: string
     *     responses:
     *       '201':
     *         description: The created movie
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Movie'
     *       default:
     *         description: Unexpected error
     */
    @Put("/:id")
    public async updateMovie(req, res) {
        const movieId: string = req.params.id;
        const movie: Movie = Object.assign(Object.create(Movie.prototype),
            JSON.parse(JSON.stringify(req.body)));

        movie.validate().then(async (errors) => {
            if (errors.length > 0) {
                return res.send(HttpStatus.BAD_REQUEST,
                    {
                        // Unwrap all of the validation errors into an array
                        message: [].concat.apply([], errors.map((x) =>
                            Object.values(x.constraints))),
                        status: HttpStatus.BAD_REQUEST,
                    });
            }
        });

        // update movie id from url param
        movie.id = movieId;

        // upsert document, catch errors
        let resCode: number = HttpStatus.CREATED;
        let result: RetrievedDocument;
        try {
            result = await this.cosmosDb.upsertDocument(
                this.dbconfig.database,
                this.dbconfig.collection,
                movie,
            );
        } catch (err) {
            resCode = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return res.send(resCode, result);
    }

    /**
     * @swagger
     *
     * /api/movies/{id}:
     *   delete:
     *     description: Delete a movie
     *     tags:
     *       - Movies
     *     parameters:
     *       - name: id
     *         description: The ID of the movie to delete.
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '204':
     *         description: The resource was deleted successfully.
     *       '404':
     *         description: A movie with that ID does not exist.
     *       default:
     *         description: Unexpected error
     */
    @Delete("/:id")
    public async deleteMovieById(req, res) {
        const movieId: string = req.params.id;

        // movieId isn't the partition key, so any search on it will require a cross-partition query.
        let resCode: number = HttpStatus.NO_CONTENT;
        let result: string;
        try {
            await this.cosmosDb.deleteDocument(
                this.dbconfig.database,
                this.dbconfig.collection,
                this.dbconfig.defaultPartitionKey,
                movieId,
            );
            return res.send(resCode);
        } catch (err) {
            if (err.toString().includes("NotFound")) {
                resCode = HttpStatus.NOT_FOUND;
                result = movieDoesNotExistError;
            } else {
                resCode = HttpStatus.INTERNAL_SERVER_ERROR;
                result = err.toString();
            }
        }
        return res.send(resCode, result);
    }
}

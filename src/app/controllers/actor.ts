import { DocumentQuery, RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { Request } from "restify";
import { httpStatus } from "../../config/constants";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { Actor } from "../models/actor";

// Controller implementation for our actors endpoint
@Controller("/api/actors")
@injectable()
export class ActorController implements interfaces.Controller {

    // Instantiate the actor controller
    constructor(
        @inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
        @inject("ITelemProvider") private telem: ITelemProvider,
        @inject("ILoggingProvider") private logger: ILoggingProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
        this.logger = logger;
    }

    /**
     * @api {get} /api/actors Request All Actors
     * @apiName GetAll
     * @apiGroup Actors
     *
     * @apiDescription
     * Retrieve and return all actors.
     */
    @Get("/")
    public async getAll(req: Request, res) {

        this.telem.trackEvent("get all actors");
        const querySpec = {
            parameters: [],
            query: `SELECT root.actorId,
                      root.type, root.name, root.birthYear, root.deathYear, root.profession, root.movies
              FROM root
              WHERE root.type = 'Actor'`,
        };

        // make query, catch errors
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
     * @api {get} /api/actors/:id Request Actor information
     * @apiName GetActor
     * @apiGroup Actors
     *
     * @apiDescription
     * Retrieve and return a single actor by actor ID.
     *
     * @apiParam (query) {String} id Actor's unique ID.
     */
    @Get("/:id")
    public async getActorById(req, res) {

        const actorId = req.params.id;

        this.telem.trackEvent("get actor by id");

        const querySpec: DocumentQuery = {
            parameters: [
                {
                    name: "@id",
                    value: actorId,
                },
            ],
            query: `SELECT root.actorId,
                      root.type, root.name, root.birthYear, root.deathYear, root.profession, root.movies
                      FROM root where root.actorId = @id`,
        };

        // actorID isn't the partition key, so any search on it will require a cross-partition query.
        // make query, catch errors
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
     * @api {post} /api/actors Create Actor
     * @apiName PostActor
     * @apiGroup Actors
     *
     * @apiDescription
     * Create an actor.
     *
     * @apiParam (body) {String} id
     * @apiParam (body) {String} actorId
     * @apiParam (body) {String} textSearch
     * @apiParam (body) {String} name
     * @apiParam (body) {String="Actor"} type
     * @apiParam (body) {Number} [key]
     * @apiParam (body) {Number} [birthYear] Year they were born
     * @apiParam (body) {String[]} [profession]
     * @apiParam (body) {Movie[]} [movies]
     */
    @Post("/")
    public async createActor(req, res) {
        this.telem.trackEvent("createActor endpoint");

        const actor: Actor = Object.assign(Object.create(Actor.prototype),
            JSON.parse(JSON.stringify(req.body)));

        actor.validate().then(async (errors) => {
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
}

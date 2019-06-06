import { DocumentQuery, RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { Request } from "restify";
import { httpStatus } from "../../config/constants";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { DateUtilities } from "../../utilities/dateUtilities";
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
     * @swagger
     *
     * /api/actors:
     *   get:
     *     description: Retrieve and return all actors.
     *     tags:
     *       - Actors
     *     responses:
     *       '200':
     *         description: List of actor objects
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Actor'
     *       default:
     *         description: Unexpected error
     */
    @Get("/")
    public async getAll(req: Request, res) {
        const apiStartTime = DateUtilities.getTimestamp();
        const apiName = "Get all actors";

        this.logger.Trace("API server: Endpoint called: " + apiName, req.id());
        this.telem.trackEvent("API server: Endpoint called: " + apiName);
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
        const apiEndTime = DateUtilities.getTimestamp();
        const apiDuration = apiEndTime - apiStartTime;

        // Log API duration metric
        const apiDurationMetricName = "API server: " + apiName + " duration";
        const apiMetric = this.telem.getMetricTelemetryObject(apiDurationMetricName, apiDuration);
        this.telem.trackMetric(apiMetric);

        this.logger.Trace("API server: " + apiName + "  Result: " + resCode, req.id());
        return res.send(resCode, results);
    }

    /**
     * @swagger
     *
     * /api/actors/{id}:
     *   get:
     *     description: Retrieve and return a single actor by actor ID.
     *     tags:
     *       - Actors
     *     parameters:
     *       - name: id
     *         description: The ID of the actor to look for.
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: The actor object
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Actor'
     *       '404':
     *         description: An actor with the specified ID was not found.
     *       default:
     *         description: Unexpected error
     */
    @Get("/:id")
    public async getActorById(req, res) {
        const apiStartTime = DateUtilities.getTimestamp();
        const apiName = "Get actor by Id";
        const actorId = req.params.id;

        this.logger.Trace("API server: Endpoint called: " + apiName, req.getId());
        this.telem.trackEvent("API server: Endpoint called: " + apiName);
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
        const apiEndTime = DateUtilities.getTimestamp();
        const apiDuration = apiEndTime - apiStartTime;

        // Log API duration metric
        const apiDurationMetricName = "API server: " + apiName + " duration";
        const apiMetric = this.telem.getMetricTelemetryObject(apiDurationMetricName, apiDuration);
        this.telem.trackMetric(apiMetric);

        this.logger.Trace("API server: " + apiName + "  Result: " + resCode, req.getId());
        return res.send(resCode, results);

    }

    /**
     * @swagger
     *
     * /api/actors:
     *   post:
     *     tags:
     *       - Actors
     *     requestBody:
     *       description: Creates an actor.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Actor'
     *         application/xml:
     *           schema:
     *             $ref: '#/components/schemas/Actor'
     *         application/x-www-form-urlencoded:
     *           schema:
     *             $ref: '#/components/schemas/Actor'
     *         text/plain:
     *           schema:
     *             type: string
     *     responses:
     *       '201':
     *         description: The created actor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Actor'
     *       default:
     *         description: Unexpected error
     */
    @Post("/")
    public async createActor(req, res) {
        const apiStartTime = DateUtilities.getTimestamp();
        const apiName = "Post actor";

        this.logger.Trace("API server: Endpoint called: " + apiName, req.getId());
        this.telem.trackEvent("API server: Endpoint called: " + apiName);

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
        const apiEndTime = DateUtilities.getTimestamp();
        const apiDuration = apiEndTime - apiStartTime;

        // Log API duration metric
        const apiDurationMetricName = "API server: " + apiName + " duration";
        const apiMetric = this.telem.getMetricTelemetryObject(apiDurationMetricName, apiDuration);
        this.telem.trackMetric(apiMetric);

        this.logger.Trace("API server: " + apiName + "  Result: " + resCode, req.getId());
        return res.send(resCode, result);
    }
}

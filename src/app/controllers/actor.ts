import { DocumentQuery } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { Request } from "restify";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { Actor } from "../models/actor";

/**
 * controller implementation for our actors endpoint
 */
@Controller("/api/actors")
@injectable()
export class ActorController implements interfaces.Controller {

    constructor(
        @inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
        @inject("ITelemProvider") private telem: ITelemProvider,
        @inject("ILoggingProvider") private logger: ILoggingProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
        this.logger = logger;
    }

    /**
     * returns all actors from cosmos db instance
     * @param req request object
     * @param res response object
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

        const results = await this.cosmosDb.queryDocuments(database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true });

        return res.send(200, results);
    }

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
        const results = await this.cosmosDb.queryDocuments(database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true });

        return res.send(200, results);
    }

    /**
     *  Create an actor
     */
    @Post("/")
    public async createActor(req, res) {
        this.telem.trackEvent("createActor endpoint");

        const actor: Actor = Object.assign(Object.create(Actor.prototype),
            JSON.parse(JSON.stringify(req.body)));

        actor.validate().then(async (errors) => {
            if (errors.length > 0) {
                return res.send(400,
                    {
                        message: [].concat.apply([], errors.map((x) =>
                            Object.values(x.constraints))),
                        status: 400,
                    });
            }
        });

        const result = await this.cosmosDb.upsertDocument(database, collection, req.body);
        return res.send(201, result);
    }
}

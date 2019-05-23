import { DocumentQuery, RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { Request } from "restify";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { Actor } from "../models/actor";
import { statusBadRequest, statusCreated, statusInternalServerError, statusOK } from "./constants";

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

        // make query, catch errors
        let resCode = statusOK;
        let results: RetrievedDocument[];
        try {
          results = await this.cosmosDb.queryDocuments(
            database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true },
          );
        } catch (err) {
          resCode = statusInternalServerError;
        }
        return res.send(resCode, results);
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
        // make query, catch errors
        let resCode = statusOK;
        let results: RetrievedDocument[];
        try {
          results = await this.cosmosDb.queryDocuments(
            database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true },
          );
        } catch (err) {
          resCode = statusInternalServerError;
        }
        return res.send(resCode, results);

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
                return res.send(statusBadRequest,
                    {
                        message: [].concat.apply([], errors.map((x) =>
                            Object.values(x.constraints))),
                        status: statusBadRequest,
                    });
            }
        });

        // upsert document, catch errors
        let resCode: number = statusCreated;
        let result: RetrievedDocument;
        try {
          result = await this.cosmosDb.upsertDocument(
            database,
            collection,
            req.body,
          );
        } catch (err) {
          resCode = statusInternalServerError;
        }
        return res.send(resCode, result);
    }
}

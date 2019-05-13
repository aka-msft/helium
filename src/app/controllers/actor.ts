import Joi = require("@hapi/joi");
import { DocumentQuery } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { Request } from "restify";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ITelemProvider } from "../../telem/itelemprovider";

/**
 * controller implementation for our actors endpoint
 */
@Controller("/api/actors")
@injectable()
export class ActorController implements interfaces.Controller {

    private static schema = Joi.object().keys({
        actorId: Joi.string().required(),
        birthYear: Joi.number().min(0).required(),
        id: Joi.string().required(),
        name: Joi.string().required(),
        textSearch: Joi.string().when("name",
            {
                is: Joi.string().regex(/^(?!\s*$).+/).required(), // Matches strings that aren't empty or whitespace
                then: Joi.valid(Joi.ref("$name")).required(),
            }),
        type: Joi.string().valid("Actor").required(),
    }).unknown(); // unknown allows keys to exist in the object that aren't described in the schema above

    constructor(
        @inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
        @inject("ITelemProvider") private telem: ITelemProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
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

        // Return validation result
        const validation = Joi.validate(req.body, ActorController.schema,
            {
                abortEarly: false,
                context:
                {
                    name: req.body.name !== undefined ? req.body.name.toLowerCase() : "",
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
                        ? `"textSearch" must be equal to "${req.body.name.toLowerCase()}"`
                        : err.message),
                    status: 400,
                });
        }
    }
}

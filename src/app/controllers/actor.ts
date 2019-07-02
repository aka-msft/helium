import { DocumentQuery, RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces, Post } from "inversify-restify-utils";
import { Request } from "restify";
import * as HttpStatus from "http-status-codes";
import { collection, database, defaultPartitionKey} from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { Actor } from "../models/actor";
import { actorDoesNotExistError } from "../../config/constants";
import * as passport from "passport";

// Controller implementation for our actors endpoint
@Controller("/api/actors")
@injectable()
export class ActorController implements interfaces.Controller {

    // Instantiate the actor controller
    constructor(@inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
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
     *     parameters:
     *       - name: q
     *         description: The actor name to filter by.
     *         in: query
     *         schema:
     *           type: string
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
    @Get("/",
        passport.authenticate("oauth-bearer", { session: false }),
        function(req, res) {
            var claims = req.authInfo;
            console.log("User info: ", req.user);
            console.log("Validated claims: ", claims);
            res.status(200).json({ name: claims["name"] });
        }
    )
  
    public async getAll(req: Request, res) {
        let querySpec: DocumentQuery;

        // Actor name is an optional query param.
        // If not specified, we should query for all actors.
        const actorName: string = req.query.q;
        if (actorName === undefined) {
            querySpec = {
                parameters: [],
                query: `SELECT root.actorId, root.type, root.name,
                root.birthYear, root.deathYear, root.profession, root.movies
                FROM root
                WHERE root.type = 'Actor'`,
            };
        } else {
            querySpec = {
                parameters: [
                    {
                        name: "@actorname",
                        value: actorName.toLowerCase(),
                    },
                ],
                query: `SELECT root.actorId, root.type, root.name,
                root.birthYear, root.deathYear, root.profession, root.movies
                FROM root
                WHERE CONTAINS(root.textSearch, @actorname) AND root.type = 'Actor'`,
            };
        }

        // make query, catch errors
        let resCode: number = HttpStatus.OK;
        let results: RetrievedDocument[];
        try {
            results = await this.cosmosDb.queryDocuments(
                database,
                collection,
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
        const actorId: string = req.params.id;

        // make query, catch errors
        let resCode: number = HttpStatus.OK;
        let result: RetrievedDocument;
        try {
          result = await this.cosmosDb.getDocument(database,
            collection,
            defaultPartitionKey,
            actorId);
        } catch (err) {
          if (err.toString().includes("NotFound")) {
            resCode = HttpStatus.NOT_FOUND;
            result = actorDoesNotExistError;
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
        const actor: Actor = Object.assign(Object.create(Actor.prototype),
            JSON.parse(JSON.stringify(req.body)));

        actor.validate().then(async (errors) => {
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

        // upsert document, catch errors
        let resCode: number = HttpStatus.CREATED;
        let result: RetrievedDocument;
        try {
            result = await this.cosmosDb.upsertDocument(
                database,
                collection,
                req.body,
            );
        } catch (err) {
            resCode = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return res.send(resCode, result);
    }
}

import { RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces } from "inversify-restify-utils";
import { Request } from "restify";
import * as HttpStatus from "http-status-codes";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { DateUtilities } from "../../utilities/dateUtilities";
import { getDbConfigValues } from "../../config/dbconfig";

/**
 * controller implementation for our genres endpoint
 */
@Controller("/api/genres")
@injectable()
export class GenreController implements interfaces.Controller {

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
     * /api/genres:
     *   get:
     *     description: Retrieve and return all genres.
     *     tags:
     *       - Genres
     *     responses:
     *       '200':
     *         description: List of genres objects
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: string
     *       default:
     *         description: Unexpected error
     */
    @Get("/")
    public async getAll(req: Request, res) {
        const querySpec = {
            parameters: [],
            query: "SELECT VALUE root.id FROM root where root.type = 'Genre'",
        };

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
}

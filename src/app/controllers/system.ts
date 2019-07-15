import { DocumentQuery } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces } from "inversify-restify-utils";
import * as HttpStatus from "http-status-codes";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { DateUtilities } from "../../utilities/dateUtilities";
import { getDbConfigValues } from "../../config/dbconfig";

/**
 * controller implementation for our system endpoint
 */
@Controller("/api/healthz")
@injectable()
export class SystemController implements interfaces.Controller {

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
     * /api/healthz:
     *   get:
     *     description: Tells external services if the service is running.
     *     tags:
     *       - System
     *     responses:
     *       '200':
     *         description: Successfully reached healthcheck endpoint
     *         content:
     *           application/json:
     *             schema:
     *               type: string
     *       default:
     *         description: Unexpected error
     */
    @Get("/")
    public async healthcheck(req, res) {
        let resCode: number = HttpStatus.OK;
        let resMessage: string = "Successfully reached healthcheck endpoint";

        const querySpec: DocumentQuery = {
            parameters: [],
            query: "SELECT * FROM root",
        };

        try {
            const results = await this.cosmosDb.queryCollections(this.dbconfig.database, querySpec);
        } catch (e) {
            resCode = HttpStatus.INTERNAL_SERVER_ERROR;
            resMessage = "Application failed to reach database: " + e;
        }

        return res.send(resCode, { message: resMessage });
    }
}

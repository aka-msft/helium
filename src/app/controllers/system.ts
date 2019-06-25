import { DocumentQuery } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces } from "inversify-restify-utils";
import { httpStatus } from "../../config/constants";
import { database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";
import { DateUtilities } from "../../utilities/dateUtilities";

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
        let resCode = httpStatus.OK;
        let resMessage = "Successfully reached healthcheck endpoint";

        const querySpec: DocumentQuery = {
            parameters: [],
            query: "SELECT * FROM root",
        };

        try {
            const results = await this.cosmosDb.queryCollections(database, querySpec);
        } catch (e) {
            resCode = httpStatus.InternalServerError;
            resMessage = "Application failed to reach database: " + e;
        }

        return res.send(resCode, { message: resMessage });
    }
}

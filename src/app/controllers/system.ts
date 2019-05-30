import { DocumentQuery } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces } from "inversify-restify-utils";
import { httpStatus } from "../../config/constants";
import { database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";

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
     * @api {get} /api/healthz Health Check
     * @apiName GetHealthCheck
     * @apiGroup System
     *
     * @apiDescription
     * Tells external services if the service is running.
     *
     * @apiError InternalServerError An error was thrown while trying to query the database
     *
     * @apiErrorExample {json} Error Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       message: "Application failed to reach database: <code>e</code>"
     *     }
     *
     * @apiSuccessExample {json} Success Response:
     *     HTTP/1.1 200 OK
     *     {
     *       message: "Successfully reached healthcheck endpoint",
     *     }
     */
    @Get("/")
    public async healthcheck(req, res) {
        this.telem.trackEvent("healthcheck called");
        const querySpec: DocumentQuery = {
            parameters: [],
            query: "SELECT * FROM root",
        };

        try {
            const results = await this.cosmosDb.queryCollections(database, querySpec);
        } catch (e) {
            return res.send(httpStatus.InternalServerError, { message: "Application failed to reach database: " + e });
        }

        return res.send(httpStatus.OK, { message: "Successfully reached healthcheck endpoint" });
    }
}

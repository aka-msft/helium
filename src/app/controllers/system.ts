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
     * @api {get} /api/healthz Health Check
     * @apiName GetHealthCheck
     * @apiGroup System
     *
     * @apiDescription
     * Tells external services if the service is running.
     *
     * @apiError (500 InternalServerError) InternalServerError An error was thrown while trying to query the database
     *
     * @apiErrorExample {json} Error Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       message: "Application failed to reach database: <code>e</code>"
     *     }
     *
     * @apiSuccess (200 OK) {String} message The message
     *
     * @apiSuccessExample {json} Success Response:
     *     HTTP/1.1 200 OK
     *     {
     *       message: "Successfully reached healthcheck endpoint",
     *     }
     */
    @Get("/")
    public async healthcheck(req, res) {
        const apiStartTime = DateUtilities.getTimestamp();
        const apiName = "Healthcheck";

        let resCode = httpStatus.OK;
        let resMessage = "Successfully reached healthcheck endpoint";

        this.logger.Trace("API server: Endpoint called: " + apiName, req.getId());
        this.telem.trackEvent("API server: Endpoint called: " + apiName);

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
        const apiEndTime = DateUtilities.getTimestamp();
        const apiDuration = apiEndTime - apiStartTime;

        // Log API duration metric
        const apiDurationMetricName = "API server: " + apiName + " duration";
        const apiMetric = this.telem.getMetricTelemetryObject(apiDurationMetricName, apiDuration);
        this.telem.trackMetric(apiMetric);
        this.logger.Trace("API server: " + apiName + "  Result: " + resCode, req.getId());

        return res.send(resCode, { message: resMessage });
    }
}

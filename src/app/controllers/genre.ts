import { RetrievedDocument } from "documentdb";
import { inject, injectable } from "inversify";
import { Controller, Get, interfaces } from "inversify-restify-utils";
import { Request } from "restify";
import { httpStatus } from "../../config/constants";
import { collection, database } from "../../db/dbconstants";
import { IDatabaseProvider } from "../../db/idatabaseprovider";
import { ILoggingProvider } from "../../logging/iLoggingProvider";
import { ITelemProvider } from "../../telem/itelemprovider";

/**
 * controller implementation for our genres endpoint
 */
@Controller("/api/genres")
@injectable()
export class GenreController implements interfaces.Controller {

    constructor(
        @inject("IDatabaseProvider") private cosmosDb: IDatabaseProvider,
        @inject("ITelemProvider") private telem: ITelemProvider,
        @inject("ILoggingProvider") private logger: ILoggingProvider) {
        this.cosmosDb = cosmosDb;
        this.telem = telem;
        this.logger = logger;
    }

    /**
     * @api {get} /api/genres Request All Genres
     * @apiName GetAll
     * @apiGroup Genres
     *
     * @apiDescription
     * Retrieve and return all genres.
     */
    @Get("/")
    public async getAll(req: Request, res) {
        this.telem.trackEvent("get all genres");

        const querySpec = {
            parameters: [],
            query: "SELECT root.id, root.type, root.genre FROM root where root.type = 'Genre'",
        };

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
        return res.send(resCode, results);
    }
}

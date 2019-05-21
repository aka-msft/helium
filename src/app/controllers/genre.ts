import { inject, injectable } from "inversify";
import { Controller, Get, interfaces } from "inversify-restify-utils";
import { Request } from "restify";
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
     * returns all actors from cosmos db instance
     * @param req request object
     * @param res response object
     */
    @Get("/")
    public async getAll(req: Request, res) {
        this.telem.trackEvent("get all genres");

        const querySpec = {
            parameters: [],
            query: "SELECT root.id, root.type, root.genre FROM root where root.type = 'Genre'",
        };

        const results = await this.cosmosDb.queryDocuments(database,
            collection,
            querySpec,
            { enableCrossPartitionQuery: true });

        return res.send(200, results);
    }
}

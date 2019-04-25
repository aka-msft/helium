import * as ApplicationInsights from "applicationinsights";
import * as bodyParser from "body-parser";
import * as restify from "restify";
import * as actorRoutes from "./app/routes/genre";
import * as genreRoutes from "./app/routes/genre";
import * as movieRoutes from "./app/routes/movie";
import * as systemRoutes from "./app/routes/system";
import { ServiceLocator } from "./config/servicelocator";

(async () => {
    const locator = await ServiceLocator.getInstance();

    const telem = locator.getTelemClient();

    const port = process.env.PORT || 3000;

    // create restify server
    telem.trackEvent("server start");
    const server = restify.createServer();

    // parse requests of content-type - application/x-www-form-urlencoded
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(restify.plugins.queryParser({ mapParams: false }));

    // parse requests of content-type - application/json
    server.use(bodyParser.json());

    // define a simple route
    server.get("/", (req, res) => {
        res.json({message: "Welcome to the MovieInfo reference application."});
    });

    telem.trackEvent("Registering routes");
    systemRoutes.registerRoutes(server);
    movieRoutes.registerRoutes(server);
    genreRoutes.registerRoutes(server);
    actorRoutes.registerRoutes(server);

    // listen for requests
    telem.trackEvent("Listening for requests");
    server.listen(port, () => {
        console.log("Server is listening on port " + port);
    });
})();

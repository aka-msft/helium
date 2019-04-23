import * as ApplicationInsights from "applicationinsights";
import * as bodyParser from "body-parser";
import * as restify from "restify";
import * as genreRoutes from "./app/routes/genre";
import * as movieRoutes from "./app/routes/movie";
import * as systemRoutes from "./app/routes/system";

// TODO: Update this later to pick up from key vault
const AppInsightsInstrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

// Setup Application insights with the automatic collection and dependency tracking enabled
ApplicationInsights.setup(AppInsightsInstrumentationKey)
.setAutoDependencyCorrelation(true)
.setAutoCollectRequests(true)
.setAutoCollectPerformance(true)
.setAutoCollectExceptions(true)
.setAutoCollectDependencies(true)
.setAutoCollectConsole(true)
.setUseDiskRetryCaching(true)
.start();

// Create the Application insights telemetry client to write custom events to
export const telemetryClient = ApplicationInsights.defaultClient;

const port = process.env.PORT || 3000;

// create restify server
telemetryClient.trackEvent({name: "Server start"});
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

telemetryClient.trackEvent({name: "Registering routes"});
systemRoutes.registerRoutes(server, telemetryClient);
movieRoutes.registerRoutes(server, telemetryClient);
genreRoutes.registerRoutes(server, telemetryClient);

// listen for requests
telemetryClient.trackEvent({name: "Listening for requests"});
server.listen(port, () => {
    console.log("Server is listening on port " + port);
});

// Debugging:
// console.dir(server.router)

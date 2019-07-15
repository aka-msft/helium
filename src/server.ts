// import { telemetryTypeToBaseType } from "applicationinsights/out/Declarations/Contracts";
import * as bodyParser from "body-parser";
import { Container } from "inversify";
import { interfaces, InversifyRestifyServer, TYPE } from "inversify-restify-utils";
import "reflect-metadata";
import * as restify from "restify";
import * as swaggerJSDoc from "swagger-jsdoc";
import { ActorController } from "./app/controllers/actor";
import { GenreController } from "./app/controllers/genre";
import { MovieController } from "./app/controllers/movie";
import { SystemController } from "./app/controllers/system";
import { CosmosDBProvider } from "./db/cosmosdbprovider";
import { IDatabaseProvider } from "./db/idatabaseprovider";
import { BunyanLogger } from "./logging/bunyanLogProvider";
import { ILoggingProvider } from "./logging/iLoggingProvider";
import { AppInsightsProvider } from "./telem/appinsightsprovider";
import { ITelemProvider } from "./telem/itelemprovider";
// import { DateUtilities } from "./utilities/dateUtilities";
import EndpointLogger from "./middleware/EndpointLogger";
import { BearerStrategy } from "passport-azure-ad";
import * as passport from "passport";
import { authcreds } from "./config/authcreds";
import { getConfigValues } from "./config/config";
import { html } from "./swagger-html";

(async () => {
    /**
     * Create an Inversion of Control container using Inversify
     */
    const iocContainer: Container = new Container();

    /**
     * Bind the logging provider implementation that you want to use to the container
     */
    iocContainer.bind<ILoggingProvider>("ILoggingProvider").to(BunyanLogger).inSingletonScope();
    const log: ILoggingProvider = iocContainer.get<ILoggingProvider>("ILoggingProvider");

    const config: any = await getConfigValues(log);

    /**
     *  Bind the Controller classes for the Controllers you want in your server
     */
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(ActorController).whenTargetNamed("ActorController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(GenreController).whenTargetNamed("GenreController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(MovieController).whenTargetNamed("MovieController");
    iocContainer.bind<interfaces.Controller>(TYPE.Controller).to(SystemController).whenTargetNamed("SystemController");

    /**
     * Bind the database provider & telemetry provider implementation that you want to use.
     * Also, bind the configuration parameters for the providers.
     */
    iocContainer.bind<IDatabaseProvider>("IDatabaseProvider").to(CosmosDBProvider).inSingletonScope();
    iocContainer.bind<string>("string").toConstantValue(config.cosmosDbUrl).whenTargetNamed("cosmosDbUrl");
    iocContainer.bind<string>("string").toConstantValue(config.cosmosDbKey).whenTargetNamed("cosmosDbKey");
    iocContainer.bind<string>("string").toConstantValue(config.insightsKey).whenTargetNamed("instrumentationKey");

    iocContainer.bind<ITelemProvider>("ITelemProvider").to(AppInsightsProvider).inSingletonScope();
    const telem: ITelemProvider = iocContainer.get<ITelemProvider>("ITelemProvider");

    // Auth

    var options = {
        identityMetadata: authcreds.identityMetadata, // Required
        clientID: authcreds.clientID, // Required
        //validateIssuer: authcreds.validateIssuer, // Conditional
        issuer: config.creds.issuer, // Conditional
        passReqToCallback: authcreds.passReqToCallback, // Required
        //isB2C: authcreds.isB2C, // Conditional
        //policyName: authcreds.policyName, // Conditional
        //allowMultiAudiencesInToken: authcreds.allowMultiAudiencesInToken, // Conditional
        audience: authcreds.audience, // Optional
        loggingLevel: authcreds.loggingLevel, // Optional
        //loggingNoPII: authcreds.loggingNoPII, // Optional
        //clockSkew: authcreds.clockSkew, // Optional
        //scope: authcreds.scope // Optional
        };
        
        var bearerStrategy = new BearerStrategy(options, function(token, done) {
            log.Trace(token, "was the token retrieved");
            done(null, {}, token);
        });

    // Sample from: http://www.passportjs.org/packages/passport-azure-ad/
    // Getting some red squigglies
    //   var bearerStrategy = new BearerStrategy(options,
    //     function(token, done) {
    //       log.Trace('verifying the user');
    //       log.Trace(token, 'was the token retreived');
    //       findById(token.oid, function(err, user) {
    //         if (err) {
    //           return done(err);
    //         }
    //         if (!user) {
    //           // "Auto-registration"
    //           log.info('User was added automatically as they were new. Their oid is: ', token.oid);
    //           users.push(token);
    //           owner = token.oid;
    //           return done(null, token);
    //         }
    //         owner = token.oid;
    //         return done(null, user, token);
    //       });
    //     }
    //   );

    const port: number = parseInt(process.env.PORT, 10) || 3000;

    // create restify server
    const server = new InversifyRestifyServer(iocContainer);

    log.Trace("Created the Restify server");

    try {
    // listen for requests
    server.setConfig((app) => {
        /**
         * Parse requests of content-type - application/x-www-form-urlencoded
         */
        app.use(bodyParser.urlencoded({ extended: true }));

        /**
         * Parses HTTP query string and makes it available in req.query.
         * Setting mapParams to false prevents additional params in query to be merged in req.Params
         */
        app.use(restify.plugins.queryParser({ mapParams: false }));

        /**
         * Set Content-Type as json for reading and parsing the HTTP request body
         */

        app.use(bodyParser.json());

        /**
         * Configure the requestlogger plugin to use Bunyan for correlating child loggers
         */
        app.use(restify.plugins.requestLogger());

        /**
         * Configure middleware function to be called for every endpoint.
         * This function logs the endpoint being called and measures duration taken for the call.
         */
        app.use(EndpointLogger(iocContainer));
        app.use(passport.initialize());
        passport.use(bearerStrategy);

        // Enable CORS for * because this is a demo project
        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header(
                "Access-Control-Allow-Headers",
                "Authorization, Origin, X-Requested-With, Content-Type, Accept"
            );
            next();
        });

        const options: any = {
            // Path to the API docs
            apis: [`${__dirname}/app/models/*.js`, `${__dirname}/app/controllers/*.js`],
            definition: {
                info: {
                    title: "Helium", // Title (required)
                    version: "1.0.0", // Version (required)
                },
                openapi: "3.0.2", // Specification (optional, defaults to swagger: '2.0')
            },
        };

        // Initialize swagger-jsdoc -> returns validated swagger spec in json format
        const swaggerSpec: any = swaggerJSDoc(options);

        log.Trace("Setting up swagger.json to serve statically");
        app.get("/swagger.json", (req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.send(swaggerSpec);
        });

        log.Trace("Setting up index.html to serve static");
        app.get("/",
        function(req, res) {
            var claims = req.authInfo;
            console.log("User info: ", req.user);
            console.log("Validated claims: ", claims);

            res.writeHead(200, {
                "Content-Length": Buffer.byteLength(html),
                "Content-Type": "text/html",
            });
            res.write(html);
            res.end();
        });

        log.Trace("Setting up node modules to serve statically");
        app.get("/node_modules/swagger-ui-dist/*", restify.plugins.serveStatic({
            directory: __dirname + "/..",
        }));
    }).build().listen(config.port, () => {
        log.Trace("Server is listening on port " + config.port);
        telem.trackEvent("API Server: Server started on port " + config.port);
    });

    } catch (err) {
        log.Error(Error(err), "Error in setting up the server!");
    }
})();

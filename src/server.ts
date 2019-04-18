import * as movieRoutes from "./app/routes/movie"
import * as systemRoutes from "./app/routes/system"
import * as restify from 'restify';
import * as bodyParser from 'body-parser';

const port = process.env.PORT || 3000;

// create restify server
const server = restify.createServer();

// parse requests of content-type - application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: true }))
server.use(restify.plugins.queryParser({ mapParams: false }));

// parse requests of content-type - application/json
server.use(bodyParser.json())

// define a simple route
server.get('/', (req, res) => {
    res.json({"message": "Welcome to the MovieInfo reference application."});
});

systemRoutes.registerRoutes(server);
movieRoutes.registerRoutes(server);

// listen for requests
server.listen(port, () => {
    console.log("Server is listening on port 3000");
});

// Debugging:
// console.dir(server.router)

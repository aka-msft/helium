import { DocumentClient, DocumentQuery, FeedOptions, RetrievedDocument } from "documentdb";
import { inject, injectable, named } from "inversify";
import { ILoggingProvider } from "../logging/iLoggingProvider";
import { ITelemProvider } from "../telem/itelemprovider";
import { DateUtilities } from "../utilities/dateUtilities";

/**
 * Handles executing queries against CosmosDB
 */
@injectable()
export class CosmosDBProvider {

    /**
     * Builds a db link. Generates this over querying CosmosDB for performance reasons.
     * @param database The name of the database the collection is in.
     */
    private static _buildDBLink(database: string): string {
        return `/dbs/${database}`;
    }

    /**
     * Builds a collection link. Generates this over querying CosmosDB for performance reasons.
     * @param database The name of the database the collection is in.
     * @param collection The name of the collection.
     */
    private static _buildCollectionLink(database: string, collection: string): string {
        return `/dbs/${database}/colls/${collection}`;
    }

    /**
     * Builds a document link. Generates this over querying CosmosDB for performance reasons.
     * @param database The name of the database the collection is in.
     * @param collection The name of the collection.
     * @param document The id of the document.
     */
    private static _buildDocumentLink(database: string, collection: string, document: string): string {
        return `/dbs/${database}/colls/${collection}/docs/${document}`;
    }

    private docDbClient: DocumentClient;

    /**
     * Creates a new instance of the CosmosDB class.
     * @param url The url of the CosmosDB.
     * @param accessKey The CosmosDB access key (primary of secondary).
     * @param telem Telemetry provider used for metrics/events.
     * @param logger Logging provider user for tracing/logging.
     */
    constructor(
        @inject("string") @named("cosmosDbUrl") private url: string,
        @inject("string") @named("cosmosDbKey") accessKey: string,
        @inject("ITelemProvider") private telem: ITelemProvider,
        @inject("ILoggingProvider") private logger: ILoggingProvider) {
        this.docDbClient = new DocumentClient(url, {
            masterKey: accessKey,
        });
        this.url = url;
        this.telem = telem;
        this.logger = logger;
    }

    /**
     * Runs the given query against CosmosDB.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param query The query to select the documents.
     */
    public async queryDocuments(
        database: string,
        collection: string,
        query: DocumentQuery,
        options?: FeedOptions): Promise<RetrievedDocument[]> {

        // Wrap all functionality in a promise to avoid forcing the caller to use callbacks
        return new Promise((resolve, reject) => {
            const collectionLink = CosmosDBProvider._buildCollectionLink(database, collection);

            // Get the timestamp immediately before the call to queryDocuments
            const queryStartTimeMs = DateUtilities.getTimestamp();

            this.docDbClient.queryDocuments(collectionLink, query, options).toArray((err, results, headers) => {
                this.logger.Trace("In CosmosDB queryDocuments");

                // Get the timestamp for when the query completes
                const queryEndTimeMs = DateUtilities.getTimestamp();

                // Calculate query duration = difference between end and start timestamps
                const queryDurationMs = queryEndTimeMs - queryStartTimeMs;

                // Set values for dependency telemetry.
                const dependencyTypeName = "CosmosDB";
                const name = this.url;

                // TODO: Figure out how to extract the part of the query after the '?' in the request
                const data = query.toString();

                const resultCode = (err == null) ? "" : err.code.toString();
                const success = (err == null) ? true : false;
                const duration = queryDurationMs;

                // Get an object to track dependency information from the telemetry provider.
                const dependencyTelem = this.telem.getDependencyTrackingObject(
                    dependencyTypeName,
                    name,
                    data,
                    resultCode,
                    success,
                    duration,
                );

                // Track DependencyTelemetry for query
                this.telem.trackDependency(dependencyTelem);

                // Get an object to track query time metric
                const metricTelem = this.telem.getMetricTelemetryObject(
                    "CosmosDB: QueryDocuments Duration",
                    queryDurationMs,
                );

                // Track CosmosDB query time metric
                this.telem.trackMetric(metricTelem);

                // Check for and log the db op RU cost
                if (headers["x-ms-request-charge"]) {
                    this.logger.Trace(`QueryDocument Resource Unit Cost: ${headers["x-ms-request-charge"]}`);
                }
                this.logger.Trace("Returning from query documents: Result: " + resultCode);

                if (err == null) {
                    resolve(results);
                } else {
                    reject(`${err.code}: ${err.body}`);
                }
            });
        });
    }

    /**
     * Delete the given document.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param document ID of document to be deleted.
     * @param options Optional options, not currently implemented.
     */
    public async deleteDocument(
        database: string,
        collection: string,
        document: string,
        options?: FeedOptions): Promise<string> {

        // Wrap all functionality in a promise to avoid forcing the caller to use callbacks
        return new Promise((resolve, reject) => {
            const documentLink = CosmosDBProvider._buildDocumentLink(database, collection, document);

            this.logger.Trace("In CosmosDB deleteDocument");
            const deleteStartTimeMs = DateUtilities.getTimestamp();
            this.docDbClient.deleteDocument(
                documentLink,
                { partitionKey: "0" },
                (err, resource, headers) => {
                    // Check for and log the db op RU cost
                    if (headers["x-ms-request-charge"]) {
                        this.logger.Trace(`QueryDocument Resource Unit Cost: ${headers["x-ms-request-charge"]}`);
                    }
                    const deleteEndTimeMs = DateUtilities.getTimestamp();
                    const deleteDuration = deleteEndTimeMs - deleteStartTimeMs;

                    // Get an object to track delete time metric
                    const metricTelem = this.telem.getMetricTelemetryObject(
                        "CosmosDB: deleteDocument Duration",
                        deleteDuration,
                    );

                    // Track CosmosDB query time metric
                    this.telem.trackMetric(metricTelem);

                    if (err) {
                        this.logger.Error(Error(err.body), "Error in deleteDocument");
                        reject(`${err.code}: ${err.body}`);
                    } else {
                        this.logger.Trace("deleteDocument returned success");
                        resolve("done");
                    }
                });
        });
    }

    /**
     * Runs the given query against CosmosDB.
     * @param database The database the document is in.
     * @param query The query to select the documents.
     */
    public async queryCollections(
        database: string,
        query: DocumentQuery): Promise<RetrievedDocument[]> {

        // Wrap all functionality in a promise to avoid forcing the caller to use callbacks
        return new Promise((resolve, reject) => {
            const dbLink = CosmosDBProvider._buildDBLink(database);

            this.logger.Trace("In CosmosDB queryCollections");
            const queryCollectionsStartTime = DateUtilities.getTimestamp();
            this.docDbClient.queryCollections(dbLink, query).toArray((err, results, headers) => {
                // Check for and log the db op RU cost
                if (headers["x-ms-request-charge"]) {
                    this.logger.Trace(`QueryDocument Resource Unit Cost: ${headers["x-ms-request-charge"]}`);
                }
                const queryCollectionsEndTime = DateUtilities.getTimestamp();
                const queryCollectionsDuration = queryCollectionsEndTime - queryCollectionsStartTime;

                // Get an object to track delete time metric
                const metricTelem = this.telem.getMetricTelemetryObject(
                    "CosmosDB: queryCollections Duration",
                    queryCollectionsDuration,
                );

                // Track CosmosDB query time metric
                this.telem.trackMetric(metricTelem);

                if (err == null) {
                    this.logger.Trace("queryCollections returned success");
                    resolve(results);
                } else {
                    this.logger.Error(Error(err.body), "queryCollections returned error");
                    reject(`${err.code}: ${err.body}`);
                }
            });
        });
    }

    /**
     * Upserts a document in CosmosDB.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param content The content of the document to insert.
     */
    public async upsertDocument(database: string, collection: string, content: any): Promise<RetrievedDocument> {

        // Wrap all functionality in a promise to avoid forcing the caller to use callbacks
        return new Promise((resolve, reject) => {
            this.logger.Trace("In CosmosDB upsertDocument");

            const upsertDocumentStartTime = DateUtilities.getTimestamp();
            const collectionLink = CosmosDBProvider._buildCollectionLink(database, collection);
            this.docDbClient.upsertDocument(collectionLink, content, (err, result, headers) => {
                // Check for and log the db op RU cost
                if (headers["x-ms-request-charge"]) {
                    this.logger.Trace(`QueryDocument Resource Unit Cost: ${headers["x-ms-request-charge"]}`);
                }

                const upsertDocumentEndTime = DateUtilities.getTimestamp();
                const upsertDocumentDuration = upsertDocumentEndTime - upsertDocumentStartTime;

                // Get an object to track upsertDocument time metric
                const metricTelem = this.telem.getMetricTelemetryObject(
                    "CosmosDB: upsertDocument Duration",
                    upsertDocumentDuration,
                );

                // Track CosmosDB query time metric
                this.telem.trackMetric(metricTelem);
                if (err == null) {
                    this.logger.Trace("Returning from upsert documents successfully");
                    resolve(result);
                } else {
                    this.logger.Error(Error(err.body), "upsertDocument returned error");
                    reject(err);
                }
            });
        });
    }
}

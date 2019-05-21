import { DocumentClient, DocumentQuery, FeedOptions, RetrievedDocument } from "documentdb";
import { inject, injectable, named } from "inversify";
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

    private docDbClient: DocumentClient;

    /**
     * Creates a new instance of the CosmosDB class.
     * @param url The url of the CosmosDB.
     * @param accessKey The CosmosDB access key (primary of secondary).
     */
    constructor(
        @inject("string") @named("cosmosDbUrl") private url: string,
        @inject("string") @named("cosmosDbKey") accessKey: string,
        @inject("ITelemProvider") private telem: ITelemProvider) {
        this.docDbClient = new DocumentClient(url, {
            masterKey: accessKey,
        });
        this.url = url;
        this.telem = telem;

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

            this.docDbClient.queryDocuments(collectionLink, query, options).toArray((err, results) => {

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

                if (err == null) {
                    resolve(results);
                } else {
                    reject(`${err.code}: ${err.body}`);
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

            this.docDbClient.queryCollections(dbLink, query).toArray((err, results) => {
                if (err == null) {
                    resolve(results);
                } else {
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
            const collectionLink = CosmosDBProvider._buildCollectionLink(database, collection);
            this.docDbClient.upsertDocument(collectionLink, content, (err, result) => {
                if (err == null) {
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }
}

import {DocumentClient, DocumentQuery, FeedOptions, RetrievedDocument} from "documentdb";

/**
 * Handles executing queries against CosmosDB
 */
export class CosmosDBProvider {

    private _docDbClient: DocumentClient;

    /**
     * Creates a new instance of the CosmosDB class.
     * @param url The url of the CosmosDB.
     * @param accessKey The CosmosDB access key (primary of secondary).
     */
    constructor(url: string, accessKey: string) {
        this._docDbClient = new DocumentClient(url, {
            masterKey: accessKey
        });
    }

    /**
     * Runs the given query against CosmosDB.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param query The query to select the documents.
     */
    async queryDocuments(database: string, collection: string, query: DocumentQuery, options?: FeedOptions): Promise<RetrievedDocument[]> {

        // Wrap all functionality in a promise to avoid forcing the caller to use callbacks
        return new Promise((resolve, reject) => {
            let collectionLink = CosmosDBProvider._buildCollectionLink(database, collection);
    
            this._docDbClient.queryDocuments(collectionLink, query, options).toArray((err, results) => {
                    if(err == null) {
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
    async upsertDocument(database: string, collection: string, content: any): Promise<RetrievedDocument> {

        // Wrap all functionality in a promise to avoid forcing the caller to use callbacks
        return new Promise((resolve, reject) => {
            let collectionLink = CosmosDBProvider._buildCollectionLink(database, collection);
            this._docDbClient.upsertDocument(collectionLink, content, (err, result) => {
                if (err == null) {
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Builds a collection link. Generates this over querying CosmosDB for performance reasons.
     * @param database The name of the database the collection is in.
     * @param collection The name of the collection.
     */
    private static _buildCollectionLink(database: string, collection: string): string {
        return `/dbs/${database}/colls/${collection}`;
    }
}
import {DocumentQuery, FeedOptions, RetrievedDocument} from "documentdb";

export interface IDatabaseProvider {
    /**
     * Runs the given query against CosmosDB.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param query The query to select the documents.
     */
    queryDocuments(database: string,
                   collection: string,
                   query: DocumentQuery,
                   options?: FeedOptions): Promise<RetrievedDocument[]>;
    /**
     * Upserts a document in CosmosDB.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param content The content of the document to insert.
     */
    upsertDocument(database: string,
                   collection: string,
                   content: any): Promise<RetrievedDocument>;

    /**
     * Runs the given query against CosmosDB.
     * @param database The database the document is in.
     * @param collection The collection the document is in.
     * @param document The document to be deleted's id.
     * @param options Optional options object.
     */
    deleteDocument(
        database: string,
        collection: string,
        document: string,
        options?: FeedOptions): Promise<string>;

    /**
     * Runs the given query against CosmosDB.
     * @param database The database the document is in.
     * @param query The query to select the documents.
     */
    queryCollections(database: string,
                     query: DocumentQuery): Promise<RetrievedDocument[]>;

}

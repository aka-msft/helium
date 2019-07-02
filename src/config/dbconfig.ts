import { ILoggingProvider } from "../logging/iLoggingProvider";

// Gets configuration details needed to query database.
export function getDbConfigValues(
    log: ILoggingProvider) {
    let database: string;
    let collection: string;
    let defaultPartitionKey: string;

    database = process.env.DB_NAME;

    if (!database) {
        log.Trace("No DB_NAME environment variable set, setting to default of 'imdb'.");
        database = "imdb";
    }

    collection = process.env.DB_COLLECTION;

    if (!collection) {
        log.Trace("No DB_COLLECTION environment variable set, setting to default of 'movies'.");
        collection = "movies";
    }

    log.Trace("Setting DEFAULT_PARTITION_KEY to default of '0'.");
    defaultPartitionKey = "0";

    return {
        database,
        collection,
        defaultPartitionKey,
    };
}

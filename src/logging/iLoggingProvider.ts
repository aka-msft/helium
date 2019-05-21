/**
 * Logging and Tracing Provider Interface
 * that abstracts logging/tracing
 */

export interface ILoggingProvider {

    /**
     * Logs tracing information
     * @param object object whose fields you want to add to logs
     * @param message Message to log
     */
    Trace(object: any, message: string): void;
    /**
     * Logs an error with the error code and the error message string specified
     * @param error error to log
     * @param errormessage Message to log
     */
    Error(error: Error, errormessage: string): void;
}

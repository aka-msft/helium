import * as restify from "restify";
import { ILoggingProvider } from "../logging/iLoggingProvider";
import { Container } from "inversify";
import { ITelemProvider } from "../telem/itelemprovider";

/**
 * Authorization for Helium endpoints.
 */

export default function authorize(container: Container) {
    const log: ILoggingProvider = container.get<ILoggingProvider>("ILoggingProvider");
    const telem: ITelemProvider = container.get<ITelemProvider>("ITelemProvider");

    // Return a function with the correct middleware signature
    return function authorize(req: restify.Request, res: restify.Response, next) {
        const authHeader = req.header('Authorization');

        // Just log the claims for now
        if (authHeader != undefined) {
            log.Trace(`Authorization header retrieved: ${authHeader}`);
        }
        else {
            log.Trace('No authorization header found in request.');
        }

        // call next middleware
        next();
    }
}
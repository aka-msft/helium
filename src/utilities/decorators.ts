/**
 * Utilities for logging functions.
 */

import { ILoggingProvider } from "../logging/iLoggingProvider";
import { ITelemProvider } from "../telem/itelemprovider";

export function Log(target, name, descriptor) {
    const original = descriptor.value;
    if (typeof original === "function") {
      descriptor.value = function(...args) {
        console.log("DEBUGGING - DELETE ME: Decorator start");
        console.log(`Arguments: ${args}`);

        const httpHeaderIndex = 0;
        const httpHeaderString: string = String(args[httpHeaderIndex]);
        console.log(`HTTP Header: ${httpHeaderString}`);

        // Insert initial logging and timestamp here
        // TODO: Timestamp and duration calculations - DateUtilities
        // TODO: Consider using regex pattern matching for HTTP headers
        // TODO: Also investigate if there are any other ways to tell which endpoint was called
        //       aside from searching within the HTTP header
        // TODO: Extract logging (ILoggingProvider) and telemetry (ITelemProvider)
        //       from controller files and insert here.
        // TODO: Make sure we don't lose any important request information in this refactor,
        //       such as correlation id, request id, etc.
        if (httpHeaderString.indexOf("GET /api/movies HTTP") !== -1) {
          console.log("Switch statement: /api/movies endpoint called");
        }
        // ...etc for all endpoints

        try {
          const result = original.apply(this, args);

          // Insert final logging and timestamp here

          console.log(`Result: ${result}`);
          console.log("DEBUGGING - DELETE ME: Decorator finish");
          return result;
        } catch (e) {
          console.log(`Error: ${e}`);
          console.log("DEBUGGING - DELETE ME: Decorator error");
          throw e;
        }
      }
    }
    return descriptor;
  }

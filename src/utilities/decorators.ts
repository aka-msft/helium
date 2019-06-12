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
        console.log(`Descriptor name: ${descriptor.name}`);
        console.log(`Descriptor value: ${descriptor.value}`);

        // const httpHeaderArgIndex = 0;
        const httpHeaderArgString: string = String(args[0]);

        if (httpHeaderArgString.indexOf("GET /api/movies HTTP") !== -1) {
          console.log("Switch statement: /api/movies endpoint called");
        }

        // Insert initial logging and timestamp here

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

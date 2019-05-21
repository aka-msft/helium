import * as bunyan from "bunyan";
import { inject, injectable, named } from "inversify";

@injectable()
export class BunyanLogger {
  private Logger: bunyan;

  /**
   * Creates a new instance of the Bunyan Logger.
   */

  /**
   * Log levels:
   * -----------
   * "fatal" (60):
   *   The service/app is going to stop or become unusable now. An operator should definitely look into this soon.
   * "error" (50):
   *   Fatal for a particular request, but the service/app continues servicing other requests.
   *   An operator should look at this soon(ish).
   * "warn" (40):
   *   A note on something that should probably be looked at by an operator eventually.
   * "info" (30):
   *   Detail on regular operation.
   * "debug" (20):
   *   Anything else, i.e. too verbose to be included in "info" level.
   * "trace" (10):
   *   Logging from external libraries used by your app or very detailed application logging.
   */
  constructor() {
    this.Logger = bunyan.createLogger({
      name: "bunyanLog",
      serializers: {
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res,
      },
      streams: [
        {
          level: bunyan.TRACE,  // logs "trace" level and everything above
          stream: process.stdout,
        },
        {
          level: bunyan.ERROR,
          stream: process.stderr, // logs "error" and "fatal" levels
        },
      ],
    });
  }

  public Trace(object: any, message: string) {
    this.Logger.trace(object, message);
  }

  public Error(error: Error, errormessage: string) {
    this.Logger.error(error, errormessage);
  }
}

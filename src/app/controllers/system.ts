import {telemetryClient} from '../../server'

/**
 * Health check controller
 * tells external services if the service is running
 */
export function healthcheck(req, res) {
    // Stub:
    telemetryClient.trackEvent({name: "healthcheck endpoint"})
    return res.send(200, {message: 'Successfully reached healthcheck endpoint.'});
};

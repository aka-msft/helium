/**
 * Health check controller
 * tells external services if the service is running
 */
export function healthcheck(req, res) {
    // Stub:
    return res.send(200, {message: "Successfully reached healthcheck endpoint."});
}

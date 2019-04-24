import * as ApplicationInsights from "applicationinsights";

/**
 * Handles sending telemetry data via AppInsights
 */
export class AppInsightsProvider {

    private telemClient: ApplicationInsights.TelemetryClient;

    /**
     * Creates a new instance of the App Insights client.
     * @param insturmentationKey The key needed to register your app with App Insights
     */
    constructor(insturmentationKey: string) {
        // Setup Application insights with the automatic collection and dependency tracking enabled
        ApplicationInsights.setup(insturmentationKey)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .start();

        // Create the Application insights telemetry client to write custom events to
        this.telemClient = ApplicationInsights.defaultClient;
    }

    /**
     * Sends an event with the given name to App Insights
     * @param eventName Name of event to track
     */
    public trackEvent(eventName: string) {
        this.telemClient.trackEvent({name: eventName});
    }

}

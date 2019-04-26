import * as ApplicationInsights from "applicationinsights";
import { DependencyTelemetry } from "applicationinsights/out/Declarations/Contracts/TelemetryTypes/DependencyTelemetry";

/**
 * Handles sending telemetry data via AppInsights
 */
export class AppInsightsProvider {

    private telemClient: ApplicationInsights.TelemetryClient;

    /**
     * Creates a new instance of the App Insights client.
     * @param instrumentationKey The key needed to register your app with App Insights
     */
    constructor(instrumentationKey: string) {
        // Setup Application insights with the automatic collection and dependency tracking enabled
        ApplicationInsights.setup(instrumentationKey)
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

    /**
     * Send quantifiable metrics to App Insights
     * TelemetryClient.TrackDependency class and properties:
     *      https://docs.microsoft.com/en-us/dotnet/api/microsoft.applicationinsights
     *      .datacontracts.dependencytelemetry?view=azure-dotnet
     */

    public trackDependency(dependency: DependencyTelemetry) {

        this.telemClient.trackDependency(dependency);
    }

    public getDependencyTrackingObject(
        dtn: string,
        n: string,
        d: string,
        rc: string,
        s: boolean,
        dur: number): DependencyTelemetry {

        // Declare and initialize a DependencyTelemetry object for sending metrics to AppInsights
        const dependencyTelem: DependencyTelemetry = {
            data: d,
            dependencyTypeName: dtn,
            duration: dur,
            name: n,
            resultCode: rc,
            success: s,
        };

        // Return the DependencyTelemetry object
        return dependencyTelem;
    }
}

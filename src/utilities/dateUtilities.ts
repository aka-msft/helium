/**
 * Utilities for date/time functions.
 */
export class DateUtilities {

    public static getTimestamp(): number {
        return Date.now();
    }

    public static getTimer() {
        const start = Date.now();

        return () => {
            return Date.now() - start;
        };
    }
}

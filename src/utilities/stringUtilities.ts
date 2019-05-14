/**
 * Utilities for strings.
 */
export class StringUtilities {

    // get random generated string
    public static getRandomString(): string {
        const randomString = Math.random().toString(36).substring(7);
        return randomString;
    }
}

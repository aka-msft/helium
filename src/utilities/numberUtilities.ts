/**
 * Utilities for numbers.
 */
export class NumberUtilities {

    // Get a random number between 0 and randomNumberMax
    public static getRandomNumber(): number {
        const randomNumber = Math.floor(Math.random() * this.randomNumberMax);
        return randomNumber;
    }

    private static randomNumberMax = 10000;
}

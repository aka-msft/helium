/**
 * Utilities for numbers.
 */
export class NumberUtilities {

    private randomNumberMax = 10000;

    // Get a random number between 0 and randomNumberMax
    public getRandomNumber(): number {
        const randomNumber = Math.floor(Math.random() * this.randomNumberMax);
        return randomNumber;
    }
}

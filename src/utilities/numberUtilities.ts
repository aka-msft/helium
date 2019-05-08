/**
 * Utilities for numbers.
 */
export class NumberUtilities {
    // get random generated number
    public getRandomNumber(): number {
        const randomNumber = Math.floor(Math.random() * 2000);
        return randomNumber;
    }
}

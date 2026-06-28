export default class NumberUtil {
    static generateRandomNumberArbitrary(min, max): number {
        return Math.floor(Math.random() * (max - min) + min);
    }
}
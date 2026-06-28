export default class MaskUtil {
    static remove(value: string): string {
        return value.replace(/[^0-9]+/g, '');
    }

    static format(value: string): number {
      if(!value) return 0;
      if(typeof value === 'number') return value;
      const number = value.replace('R$', '').replace('.', '').replace('.', '').replace('.', '').replace(',', '.');
      return Number(number);
    }
}
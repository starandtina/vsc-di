import {createDecorator} from '../../instantiation'

export interface IFibonacciService {
  readonly _serviceBrand: undefined;

  calc: (n:number) => void;
}


export const IFibonacciService = createDecorator<IFibonacciService>('echo');


export class FibonacciService implements IFibonacciService {
  // DI接管服务约束
  readonly _serviceBrand: undefined;

  constructor() {
    console.log('FibonacciService created by DI');
  }

  calc(n: number) {
    const sqrt5 = Math.sqrt(5);
    const phi = (1 + sqrt5) / 2;
    const psi = (1 - sqrt5) / 2;

    return Math.round((1 / sqrt5) * (Math.pow(phi, n) - Math.pow(psi, n)));
  }
}
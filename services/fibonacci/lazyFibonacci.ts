import { createDecorator } from '../../instantiation';
import { LazyServiceLoader } from '../../asyncServiceLoader/lazyServiceLoader'
import { IFibonacciService } from './fibonacci'

export interface ILazyFibonacciService {
  readonly _serviceBrand: undefined;

  getInstance(): Promise<IFibonacciService>;
}

export class LazyFibonacciService extends LazyServiceLoader<IFibonacciService> {
  async _getModule() {
    return (await import(/* webpackChunkName: "bundle_fibonacci_service" */ './fibonacci')).FibonacciService;
  }
}

export const ILazyFibonacciService = createDecorator<ILazyFibonacciService>('fibonacci');
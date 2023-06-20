import type { BrandedService,IInstantiationService } from '../instantiation';
import { ServiceCollection } from '../serviceCollection';

//
// 异步service基类约束
// 本质上是一个容器类，可以在指定的时刻通过instantiationService创建instance
// 注意，LazyService是一个service容器，它需要被di接管，一定拥有serviceBrand
//
export abstract class AsyncServiceBase<T extends BrandedService> {
  // DI接管服务约束
  readonly _serviceBrand: undefined;
  protected _instance?: T;
  private _instantiationService: IInstantiationService;

  constructor(instantiationService: IInstantiationService) {
    this._instantiationService = instantiationService;
  }

  protected createInstance(ctor: new (...args: any[]) => T, ...rest: any[]): T {
    if (this._instance) {
      return this._instance;
    }
    const child = this._instantiationService.createChild(new ServiceCollection());
    this._instance = child.createInstance(ctor, rest);
    return this._instance;
  }
}

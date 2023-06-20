import type { BrandedService, IDisposable, CancelablePromise } from '../instantiation';
import { IInstantiationService, createCancelablePromise } from '../instantiation';
import { AsyncServiceBase } from './base';

export interface ILazyServiceLoader<T> {
  readonly _serviceBrand: undefined;
  getInstance: (...rest: any[]) => Promise<T>;
  loaded: boolean;
}

type ILoaderResult<T> = {
  default: new (...args: any[]) => T;
};
type ILoaderResult0<T> = new (...args: any[]) => T;

export abstract class LazyServiceLoader<T extends BrandedService>
  extends AsyncServiceBase<T>
  implements IDisposable, ILazyServiceLoader<T>
{
  private _loadModulePromise?: CancelablePromise<new (...args: any[]) => T>;

  constructor(@IInstantiationService instantiationService: IInstantiationService) {
    super(instantiationService);
  }

  get loaded() {
    return Boolean(this._instance);
  }

  // 创建模块实例
  async getInstance(...rest: any[]): Promise<T> {
    // 已加载但未完成，等待promise完成
    if (this._instance) {
      return this._instance;
    }

    this._instance = await this._getInstance(rest);
    return this._instance!;
  }

  // 销毁
  dispose() {
    this._loadModulePromise?.cancel();
  }

  // 加载模块
  protected _loadModule(): Promise<new (...args: unknown[]) => T> {
    if (this._loadModulePromise) {
      return this._loadModulePromise!;
    }

    this._loadModulePromise = createCancelablePromise(async () => {
      const module = await this._getModule();
      if ((module as ILoaderResult<T>).default) {
        return (module as ILoaderResult<T>).default;
      } else {
        return module as ILoaderResult0<T>;
      }
    });
    return this._loadModulePromise;
  }

  // 加载module，获取实例
  private async _getInstance(...rest: any[]): Promise<T> {
    const ctor = await this._loadModule();
    return this.createInstance(ctor, rest);
  }

  // 获取模块的纯虚函数
  // 派生类必须复写
  protected abstract _getModule(): Promise<ILoaderResult<T> | ILoaderResult0<T>>;
}

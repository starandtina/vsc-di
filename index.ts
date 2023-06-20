import { SyncDescriptor } from './descriptors';
import { createDecorator } from './instantiation';
import { InstantiationService } from './instantiationService';
import { ServiceCollection } from './serviceCollection';
import {
  registerSingleton,
  getSingletonServiceDescriptors,
  InstantiationType,
} from './extensions';
import { ILazyFibonacciService, LazyFibonacciService } from './services/fibonacci/lazyFibonacci'
import { IFibonacciService } from './services/fibonacci/fibonacci';


// 定义模块的接口
interface IServiceA {}
interface IServiceB {}
interface IServiceC {
  hello(): void;
}
interface IServiceD {}

// 定义模块的 identifier
const IServiceA = createDecorator<IServiceA>('serviceA');
const IServiceB = createDecorator<IServiceB>('serviceB');
const IServiceC = createDecorator<IServiceC>('serviceC');
const IServiceD = createDecorator<IServiceD>('serviceD');

// 具体类的实现
class AService implements IServiceA {
  // 声明依赖 `@IServiceB`
  constructor(
    @IServiceB private readonly b: IServiceB,
    @IServiceD private readonly d: IServiceD,
    @ILazyFibonacciService private readonly lazyFibonacciService: ILazyFibonacciService,
  ) {
    let i = 0;
    setInterval(() => {
      i++;
      if (i > 5) {
        this._printFib(i);
      } else {
        console.log('AService Called');
      }
    }, 1000) as any as number;
  }
  private async _printFib(n: number) {
    const fibService = await this.lazyFibonacciService.getInstance();
    console.log(`AService calc ${n} fib: ${fibService.calc(n)}`);
  }
}

class BService implements IServiceB {
  _serviceBrand: undefined;
  // 声明依赖 `@IServiceC`
  constructor(@IServiceC private readonly c: IServiceC) {}
}

class CService implements IServiceC {
  _serviceBrand: undefined;
  // 声明依赖 `@IServiceD`
  constructor(@IServiceD private readonly d: IServiceD) {}
  hello() {
    console.log('hello');
  }
}

class DService implements IServiceD {
  world() {
    console.log('world');
  }
}

// 定义模块的储存器 Map，key 是模块的 identifier，value 是模块实例或是 `SyncDescriptor`
const serviceCollection = new ServiceCollection();
serviceCollection.set(IServiceB, new SyncDescriptor<IServiceB>(BService));
serviceCollection.set(IServiceC, new SyncDescriptor<IServiceC>(CService));
// serviceCollection.set(IServiceD, new SyncDescriptor<IServiceD>(DService))
serviceCollection.set(ILazyFibonacciService, new SyncDescriptor<ILazyFibonacciService>(LazyFibonacciService));
const instantiationService = new InstantiationService(serviceCollection);
const childInstantiationService = instantiationService.createChild(
  new ServiceCollection([IServiceD, new SyncDescriptor<IServiceD>(DService)])
);
instantiationService.createInstance(AService).b.c.hello();
// childInstantiationService
//   .createInstance(new SyncDescriptor<IServiceA>(AService))
//   .b.c.hello();

// 定义模块的储存器 Map，key 是模块的 identifier，value 是模块实例或是 `SyncDescriptor`
// const serviceCollection = new ServiceCollection();
// 实例化容器
// const instantiationService = new InstantiationService(serviceCollection);

// registerSingleton(IServiceB, new SyncDescriptor<IServiceB>(BService));
// registerSingleton(IServiceC, CService, InstantiationType.Eager);
// registerSingleton(IServiceD, DService, InstantiationType.Eager);

// 获取所有全局单例模块，然后保存到 `serviceCollection` 中
// const contributedServices = getSingletonServiceDescriptors();
// for (let [id, descriptor] of contributedServices) {
//   serviceCollection.set(id, descriptor);
// }
// instantiationService.createInstance(AService).b.c.hello();

// 创建 `AService` 实例，并调用 `CService` 的方法 `hello`
// instantiationService.createInstance(AService).b.c.hello();
// instantiationService.createInstance(AService).d.world();

// instantiationService.invokeFunction((accessor) => {
//   const service = accessor.get(IServiceC);

//   service.hello();
// });

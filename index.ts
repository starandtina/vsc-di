import { SyncDescriptor } from './descriptors';
import { createDecorator } from './instantiation';
import { InstantiationService } from './instantiationService';
import { ServiceCollection } from './serviceCollection';
import {
  registerSingleton,
  getSingletonServiceDescriptors,
  InstantiationType,
} from './extensions';

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
    @IServiceD private readonly d: IServiceD
  ) {}
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

const instantiantService = new InstantiationService(serviceCollection);
const childInstantiantService = instantiantService.createChild(
  new ServiceCollection([IServiceD, new SyncDescriptor<IServiceD>(DService)])
);
// instantiantService.createInstance(AService).b.c.hello();
childInstantiantService
  .createInstance(new SyncDescriptor<IServiceA>(AService))
  .b.c.hello();

// 定义模块的储存器 Map，key 是模块的 identifier，value 是模块实例或是 `SyncDescriptor`
// const serviceCollection = new ServiceCollection();
// 实例化容器
// const instantiantService = new InstantiationService(serviceCollection);

// registerSingleton(IServiceB, new SyncDescriptor<IServiceB>(BService));
// registerSingleton(IServiceC, CService, InstantiationType.Eager);
// registerSingleton(IServiceD, DService, InstantiationType.Eager);

// 获取所有全局单例模块，然后保存到 `serviceCollection` 中
// const contributedServices = getSingletonServiceDescriptors();
// for (let [id, descriptor] of contributedServices) {
//   serviceCollection.set(id, descriptor);
// }
// instantiantService.createInstance(AService).b.c.hello();

// 创建 `AService` 实例，并调用 `CService` 的方法 `hello`
// instantiantService.createInstance(AService).b.c.hello();
// instantiantService.createInstance(AService).d.world();

// instantiantService.invokeFunction((accessor) => {
//   const service = accessor.get(IServiceC);

//   service.hello();
// });

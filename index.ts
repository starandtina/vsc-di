// let str = ''

// function id(target: Function, key: string, index: number): any {
//   str += 'Decorated! ';
// };

// class Klass {
//   constructor(@id private param: any) {}
// }

// str += 'Ready! '

// const k = new Klass('123')

// str += 'Initialized!'

// const appDiv: HTMLElement = document.getElementById('app');
// appDiv.innerHTML = `<h1>Decorator: When?</h1><p>${str}</p>`;

import { SyncDescriptor } from './descriptors';
import { createDecorator } from './instantiation';
import { InstantiationService } from './instantiationService';
import { ServiceCollection } from './serviceCollection';
import {
  registerSingleton,
  getSingletonServiceDescriptors,
} from './extensions';

interface IServiceA {}
interface IServiceB {}
interface IServiceC {
  hello(): void;
}

const IServiceA = createDecorator<IServiceA>('serviceA');
const IServiceB = createDecorator<IServiceB>('serviceB');
const IServiceC = createDecorator<IServiceC>('serviceC');

class A implements IServiceA {
  constructor(foo: string, @IServiceB private readonly b: IServiceB) {}
}

class B implements IServiceB {
  constructor(@IServiceC private readonly c: IServiceC) {}
}

class CService implements IServiceC {
  _serviceBrand: undefined;
  // constructor(public readonly foo: string) {}
  hello() {
    console.log(' hello world=1');
  }
}

const instantiationService = new ServiceCollection();
const instantiantService = new InstantiationService(instantiationService);
instantiationService.set(IServiceB, new SyncDescriptor<IServiceB>(B));
// serviceCollection.set(IC, new SyncDescriptor<IC>(C, ['foooo']));

registerSingleton(IServiceC, CService, true);

// All Contributed Services
const contributedServices = getSingletonServiceDescriptors();
for (let [id, descriptor] of contributedServices) {
  instantiationService.set(id, descriptor);
}

instantiantService.createInstance(A, 'foo').b.c.hello();
instantiantService.invokeFunction((accessor) => {
  const service = accessor.get(IServiceC);

  service.hello();
});

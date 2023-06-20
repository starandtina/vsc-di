/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as descriptors from './descriptors';
import { ServiceCollection } from './serviceCollection';

// ------ internal util

export namespace _util {
  export const serviceIds = new Map<string, ServiceIdentifier<any>>();

  export const DI_TARGET = '$di$target';
  export const DI_DEPENDENCIES = '$di$dependencies';

  export function getServiceDependencies(
    ctor: any
  ): { id: ServiceIdentifier<any>; index: number; optional: boolean }[] {
    return ctor[DI_DEPENDENCIES] || [];
  }
}

// --- interfaces ------

export type BrandedService = { _serviceBrand: undefined };

export interface IConstructorSignature<T, Args extends any[] = []> {
  new <Services extends BrandedService[]>(...args: [...Args, ...Services]): T;
}

export interface ServicesAccessor {
  get<T>(id: ServiceIdentifier<T>): T;
}

export const IInstantiationService = createDecorator<IInstantiationService>(
  'instantiationService'
);

/**
 * Given a list of arguments as a tuple, attempt to extract the leading, non-service arguments
 * to their own tuple.
 */
export type GetLeadingNonServiceArgs<TArgs extends any[]> = TArgs extends []
  ? []
  : TArgs extends [...infer TFirst, BrandedService]
  ? GetLeadingNonServiceArgs<TFirst>
  : TArgs;

export interface IInstantiationService {
  readonly _serviceBrand: undefined;

  /**
   * Synchronously creates an instance that is denoted by the descriptor
   */
  createInstance<T>(descriptor: descriptors.SyncDescriptor0<T>): T;
  createInstance<
    Ctor extends new (...args: any[]) => any,
    R extends InstanceType<Ctor>
  >(
    ctor: Ctor,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>
  ): R;

  /**
   * Calls a function with a service accessor.
   */
  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R;

  /**
   * Creates a child of this service which inherits all current services
   * and adds/overwrites the given services.
   */
  createChild(services: ServiceCollection): IInstantiationService;
}

/**
 * Identifies a service of type `T`.
 */
export interface ServiceIdentifier<T> {
  (...args: any[]): void;
  type: T;
}

function storeServiceDependency(
  id: Function,
  target: Function,
  index: number,
  optional: boolean
): void {
  if ((target as any)[_util.DI_TARGET] === target) {
    (target as any)[_util.DI_DEPENDENCIES].push({ id, index, optional });
  } else {
    (target as any)[_util.DI_DEPENDENCIES] = [{ id, index, optional }];
    (target as any)[_util.DI_TARGET] = target;
  }
}

/**
 * The *only* valid way to create a {{ServiceIdentifier}}.
 */
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
  if (_util.serviceIds.has(serviceId)) {
    return _util.serviceIds.get(serviceId)!;
  }

  const id = <any>function (target: Function, key: string, index: number): any {
    if (arguments.length !== 3) {
      throw new Error(
        '@IServiceName-decorator can only be used to decorate a parameter'
      );
    }
    storeServiceDependency(id, target, index, false);
  };

  id.toString = () => serviceId;

  _util.serviceIds.set(serviceId, id);
  return id;
}

export function refineServiceDecorator<T1, T extends T1>(
  serviceIdentifier: ServiceIdentifier<T1>
): ServiceIdentifier<T> {
  return <ServiceIdentifier<T>>serviceIdentifier;
}

/**
 * Mark a service dependency as optional.
 */
export function optional<T>(serviceIdentifier: ServiceIdentifier<T>) {
  return function (target: Function, key: string, index: number) {
    if (arguments.length !== 3) {
      throw new Error(
        '@optional-decorator can only be used to decorate a parameter'
      );
    }
    storeServiceDependency(serviceIdentifier, target, index, true);
  };
}

export interface IDisposable {
	dispose(): void;
}

export interface CancelablePromise<T> extends Promise<T> {
	cancel(): void;
}

export interface CancellationToken {

	/**
	 * A flag signalling is cancellation has been requested.
	 */
	readonly isCancellationRequested: boolean;

	/**
	 * An event which fires when cancellation is requested. This event
	 * only ever fires `once` as cancellation can only happen once. Listeners
	 * that are registered after cancellation will be called (next event loop run),
	 * but also only once.
	 *
	 * @event
	 */
	readonly onCancellationRequested: (listener: (e: any) => any, thisArgs?: any, disposables?: IDisposable[]) => IDisposable;
}

export interface Event<T> {
	(listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}
export namespace Event {
	export const None: Event<any> = () => Object.freeze<IDisposable>({ dispose() { } });
}
const shortcutEvent: Event<any> = Object.freeze(function (callback, context?): IDisposable {
	const handle = setTimeout(callback.bind(context), 0);
	return { dispose() { clearTimeout(handle); } };
});

export namespace CancellationToken {

	export function isCancellationToken(thing: unknown): thing is CancellationToken {
		if (thing === CancellationToken.None || thing === CancellationToken.Cancelled) {
			return true;
		}
		// if (thing instanceof MutableToken) {
		// 	return true;
		// }
		if (!thing || typeof thing !== 'object') {
			return false;
		}
		return typeof (thing as CancellationToken).isCancellationRequested === 'boolean'
			&& typeof (thing as CancellationToken).onCancellationRequested === 'function';
	}


	export const None = Object.freeze<CancellationToken>({
		isCancellationRequested: false,
		onCancellationRequested: Event.None
	});

	export const Cancelled = Object.freeze<CancellationToken>({
		isCancellationRequested: true,
		onCancellationRequested: shortcutEvent
	});
}


const canceledName = 'Canceled';
export class CancellationError extends Error {
	constructor() {
		super(canceledName);
		this.name = this.message;
	}
}

export class CancellationTokenSource {

	private _token?: CancellationToken = undefined;
	private _parentListener?: IDisposable = undefined;

	constructor(parent?: CancellationToken) {
		this._parentListener = parent && parent.onCancellationRequested(this.cancel, this);
	}

	get token(): CancellationToken {
		if (!this._token) {
			// be lazy and create the token only when
			// actually needed
			this._token = CancellationToken.None
		}
		return this._token;
	}

	cancel(): void {
		if (!this._token) {
			// save an object by returning the default
			// cancelled token when cancellation happens
			// before someone asks for the token
			this._token = CancellationToken.Cancelled;

		} 
    // else if (this._token instanceof MutableToken) {
		// 	// actually cancel
		// 	this._token.cancel();
		// }
	}

	dispose(cancel: boolean = false): void {
		if (cancel) {
			this.cancel();
		}
		this._parentListener?.dispose();
		if (!this._token) {
			// ensure to initialize with an empty token if we had none
			this._token = CancellationToken.None;

		} 
    // else if (this._token instanceof MutableToken) {
		// 	// actually dispose
		// 	this._token.dispose();
		// }
	}
}


export function createCancelablePromise<T>(callback: (token: CancellationToken) => Promise<T>): CancelablePromise<T> {
	const source = new CancellationTokenSource();

	const thenable = callback(source.token);
	const promise = new Promise<T>((resolve, reject) => {
		const subscription = source.token.onCancellationRequested(() => {
			subscription.dispose();
			source.dispose();
			reject(new CancellationError());
		});
		Promise.resolve(thenable).then(value => {
			subscription.dispose();
			source.dispose();
			resolve(value);
		}, err => {
			subscription.dispose();
			source.dispose();
			reject(err);
		});
	});

	return <CancelablePromise<T>>new class {
		cancel() {
			source.cancel();
		}
		then<TResult1 = T, TResult2 = never>(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
			return promise.then(resolve, reject);
		}
		catch<TResult = never>(reject?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
			return this.then(undefined, reject);
		}
		finally(onfinally?: (() => void) | undefined | null): Promise<T> {
			return promise.finally(onfinally);
		}
	};
}
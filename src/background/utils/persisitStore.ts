/* eslint-disable @typescript-eslint/ban-types */
import { debounce } from 'debounce';

import { storage } from '@/background/webapi';

const persistStorage = (name: string, obj: object) => {
  debounce(storage.set(name, obj), 1000);
};

interface CreatePersistStoreParams<T> {
  name: string;
  template?: T;
  fromStorage?: boolean;
}

const createPersistStore = async <T extends object>({
  name,
  template = Object.create(null),
  fromStorage = true
}: CreatePersistStoreParams<T>): Promise<T> => {
  let tpl = template;

  if (fromStorage) {
    const storageCache = await storage.get(name);
    tpl = storageCache || template;
    if (!storageCache) {
      await storage.set(name, tpl);
    }
  }

  const createProxy = <A extends object>(obj: A): A =>
    new Proxy(obj, {
      set(target, prop, value) {
        target[prop] = value;

        persistStorage(name, target);

        return true;
      },

      deleteProperty(target, prop) {
        if (Reflect.has(target, prop)) {
          Reflect.deleteProperty(target, prop);

          persistStorage(name, target);
        }

        return true;
      }
    });
  return createProxy<T>(tpl);
};

export default createPersistStore;

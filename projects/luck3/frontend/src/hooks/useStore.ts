import { useEffect, useRef } from 'react';
import { type Snapshot, useSnapshot } from 'valtio';

export function useStore<
  T extends {
    state: Record<string, any>;
    onMounted?: (initialArgs?: object) => void;
    onUnMounted?: () => void;
  }
>(
  StoreCtor: new () => T,
  initialArgs?: object
): { store: T; snapshot: Snapshot<T['state']> } {
  const storeRef = useRef<T>(null);

  if (!storeRef.current) {
    storeRef.current = new StoreCtor();
  }
  const store = storeRef.current;

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      store?.onMounted?.(initialArgs);
    }
    return () => {
      store?.onUnMounted?.();
    };
  }, []);

  const snapshot = useSnapshot<T['state']>(store.state);

  return { store, snapshot };
}

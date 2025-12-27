import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type QueryKey = ReadonlyArray<unknown>;

const QueryClientContext = createContext<QueryClient | null>(null);

const serializeQueryKey = (key: QueryKey): string => JSON.stringify(key);

type Listener = () => void;

export class QueryClient {
  private store = new Map<string, unknown>();
  private listeners = new Map<string, Set<Listener>>();

  getQueryData<T>(queryKey: QueryKey): T | undefined {
    return this.store.get(serializeQueryKey(queryKey)) as T | undefined;
  }

  setQueryData<T>(queryKey: QueryKey, updater: T | ((old?: T) => T)): void {
    const serialized = serializeQueryKey(queryKey);
    const previous = this.getQueryData<T>(queryKey);
    const next = typeof updater === "function" ? (updater as (old?: T) => T)(previous) : updater;
    this.store.set(serialized, next);
    this.notify(serialized);
  }

  async fetchQuery<TData>({ queryKey, queryFn }: { queryKey: QueryKey; queryFn: () => Promise<TData> }): Promise<TData> {
    const data = await queryFn();
    this.setQueryData(queryKey, data);
    return data;
  }

  invalidateQueries({ queryKey }: { queryKey?: QueryKey }): void {
    if (queryKey) {
      this.notify(serializeQueryKey(queryKey));
      return;
    }
    this.listeners.forEach((subscriptions) => {
      subscriptions.forEach((listener) => listener());
    });
  }

  subscribe(queryKey: string, listener: Listener): () => void {
    const current = this.listeners.get(queryKey) ?? new Set<Listener>();
    current.add(listener);
    this.listeners.set(queryKey, current);
    return () => {
      const updated = this.listeners.get(queryKey);
      updated?.delete(listener);
      if (updated && updated.size === 0) {
        this.listeners.delete(queryKey);
      }
    };
  }

  private notify(queryKey: string): void {
    const listeners = this.listeners.get(queryKey);
    listeners?.forEach((listener) => listener());
  }
}

export const QueryClientProvider: React.FC<{ client: QueryClient; children: React.ReactNode }> = ({ client, children }) => (
  <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>
);

export const useQueryClient = (): QueryClient => {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error("useQueryClient must be used within a QueryClientProvider");
  }
  return client;
};

export type UseQueryOptions<TData> = {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
};

export type UseQueryResult<TData> = {
  data: TData | undefined;
  isPending: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error?: unknown;
  refetch: () => Promise<void>;
};

export function useQuery<TData>(options: UseQueryOptions<TData>): UseQueryResult<TData> {
  const client = useQueryClient();
  const { queryKey, queryFn, enabled = true } = options;
  const serializedKey = useMemo(() => serializeQueryKey(queryKey), [queryKey]);
  const stableQueryKey = useMemo(() => queryKey, [serializedKey]);
  const initialData = useMemo(() => client.getQueryData<TData>(stableQueryKey), [client, serializedKey, stableQueryKey]);
  const isFetchingRef = useRef(false);
  const [state, setState] = useState<UseQueryResult<TData>>({
    data: initialData,
    isPending: enabled && initialData === undefined,
    isLoading: enabled && initialData === undefined,
    isFetching: false,
    error: undefined,
    refetch: async () => undefined,
  });

  const execute = useCallback(async () => {
    if (!enabled) return;
    isFetchingRef.current = true;
    setState((prev) => ({ ...prev, isPending: prev.data === undefined, isLoading: prev.data === undefined, isFetching: true }));
    try {
      const data = await client.fetchQuery({ queryKey: stableQueryKey, queryFn });
      setState((prev) => ({ ...prev, data, isPending: false, isLoading: false, isFetching: false, error: undefined }));
    } catch (error) {
      setState((prev) => ({ ...prev, error, isPending: false, isLoading: false, isFetching: false }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [client, enabled, queryFn, serializedKey, stableQueryKey]);

  const executeRef = useRef(execute);
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    const unsubscribe = client.subscribe(serializedKey, () => {
      if (isFetchingRef.current) return;
      void executeRef.current();
    });
    return unsubscribe;
  }, [client, serializedKey]);

  useEffect(() => {
    void execute();
  }, [execute]);

  return useMemo(
    () => ({
      ...state,
      refetch: async () => executeRef.current(),
    }),
    [state],
  );
}

export type UseMutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: unknown, variables: TVariables) => void;
};

export type UseMutationResult<TData, TVariables> = {
  mutate: (variables: TVariables) => void;
  isPending: boolean;
  data?: TData;
};

export function useMutation<TData, TVariables = void>(options: UseMutationOptions<TData, TVariables>): UseMutationResult<TData, TVariables> {
  const [isPending, setIsPending] = useState(false);
  const [data, setData] = useState<TData | undefined>(undefined);

  const mutate = (variables: TVariables) => {
    setIsPending(true);
    options
      .mutationFn(variables)
      .then((data) => {
        setData(data);
        options.onSuccess?.(data, variables);
      })
      .catch((error) => {
        options.onError?.(error, variables);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return { mutate, isPending, data };
}

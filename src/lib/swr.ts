import useSWR, { SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

export function useApi<T = any>(key: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(key, key ? fetcher : null, { revalidateOnFocus: false, ...config });
}



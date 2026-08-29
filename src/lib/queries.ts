import { queryOptions } from "@tanstack/react-query";
import { getStorefront } from "./storefront.functions";

export const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
  staleTime: 30_000,
});

export type Storefront = Awaited<ReturnType<typeof getStorefront>>;

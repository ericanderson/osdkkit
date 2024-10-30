import type { ObjectOrInterfaceDefinition } from "@osdk/api";
import type { Osdk, PageResult } from "@osdk/client";
import React from "react";

export function useCombinedPages<T extends ObjectOrInterfaceDefinition>(
  data: PageResult<Osdk.Instance<T, never, any>>[] | undefined,
): Osdk.Instance<T>[] {
  return React.useMemo(() => {
    if (!data) {
      return [];
    }
    return ([] as Osdk.Instance<T>[]).concat(...data.map(p => p.data));
  }, [data]);
}

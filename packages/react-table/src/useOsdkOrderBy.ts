import type { ObjectOrInterfaceDefinition, PropertyKeys } from "@osdk/api";
import type { SortingState } from "@tanstack/react-table";
import React from "react";

export function useOsdkOrderBy<X extends ObjectOrInterfaceDefinition>(
  sorting: SortingState,
): Record<PropertyKeys<X>, "asc" | "desc" | undefined> {
  return React.useMemo(() => {
    return Object.fromEntries(
      sorting.map(s => [s.id, s.desc ? "desc" : "asc"] as const),
    );
  }, [sorting]) as Record<PropertyKeys<X>, "asc" | "desc" | undefined>;
}

import type {
  FetchPageArgs,
  InterfaceDefinition,
  ObjectOrInterfaceDefinition,
  ObjectSet,
  Osdk,
  PageResult,
  PropertyKeys,
  WhereClause,
} from "@osdk/api";
import type { Client } from "@osdk/client";
import { useOsdkClient } from "@osdkkit/react";
import React from "react";
import type { SWRInfiniteResponse } from "swr/infinite";
import useSWRInfinite from "swr/infinite";

type Key<T extends ObjectOrInterfaceDefinition> = [
  Client,
  "list",
  T,
  | undefined
  | (Pick<FetchPageArgs<T, any, any, any>, "$orderBy"> & {
    $where?: WhereClause<T>;
  }),
  string | undefined,
];

function createKeyGetter<T extends ObjectOrInterfaceDefinition>(
  client: Client,
  def: T,
  args?: Pick<FetchPageArgs<T, any, any, any>, "$orderBy"> & {
    $where?: WhereClause<T>;
  },
) {
  return function getKey(
    _pageIndex: number,
    previousData: null | PageResult<Osdk.Instance<T, never, PropertyKeys<T>>>,
  ): null | Key<T> {
    if (previousData && !previousData.nextPageToken) return null;
    return [
      client,
      "list",
      def,
      args,
      previousData?.nextPageToken,
    ];
  };
}

async function osdkFetcher<Q extends ObjectOrInterfaceDefinition>(
  key: Key<Q>,
): Promise<PageResult<Osdk.Instance<Q>>> {
  const [client, , objDef, args, $nextPageToken] = key;
  let objectSet: ObjectSet<Q> = client(objDef as InterfaceDefinition) as any;
  if (args?.$where) {
    objectSet = objectSet.where(args.$where);
  }
  return (await objectSet.fetchPage({
    ...args,
    $pageSize: 10,
    $nextPageToken: $nextPageToken,
  })) as any as PageResult<Osdk.Instance<Q>>;
}

export function useOsdkPages<T extends ObjectOrInterfaceDefinition>(
  objDef: T,
  args?: Pick<FetchPageArgs<T, any, any, any>, "$orderBy"> & {
    $where?: WhereClause<T>;
  },
): SWRInfiniteResponse<PageResult<Osdk.Instance<T>>, any> {
  const client = useOsdkClient();
  const keyGetter = React.useMemo(() => createKeyGetter(client, objDef, args), [
    client,
    objDef,
    args,
  ]);
  return useSWRInfinite(
    keyGetter,
    osdkFetcher<T>,
  );
}

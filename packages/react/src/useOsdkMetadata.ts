import type {
  InterfaceDefinition,
  InterfaceMetadata,
  ObjectMetadata,
  ObjectOrInterfaceDefinition,
  ObjectTypeDefinition,
} from "@osdk/api";
import React from "react";
import { useOsdkClient } from "./useOsdkClient.js";

type MetadataFor<T extends ObjectOrInterfaceDefinition> = T extends
  InterfaceDefinition ? InterfaceMetadata
  : T extends ObjectTypeDefinition ? ObjectMetadata
  : never;

export function useOsdkMetadata<T extends ObjectOrInterfaceDefinition>(
  type: T,
): {
  loading: boolean;
  metadata?: MetadataFor<T>;
} {
  const client = useOsdkClient();
  const [metadata, setMetadata] = React.useState<
    MetadataFor<T> | undefined
  >(undefined);

  if (!metadata) {
    client.fetchMetadata(type).then((fetchedMetadata) => {
      setMetadata(fetchedMetadata as MetadataFor<T>);
    });
    return { loading: true };
  }

  return { loading: false, metadata };
}

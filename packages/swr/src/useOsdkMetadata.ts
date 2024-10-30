import type {
  InterfaceDefinition,
  InterfaceMetadata,
  ObjectMetadata,
  ObjectOrInterfaceDefinition,
  ObjectTypeDefinition,
} from "@osdk/api";
import { useOsdkClient } from "@osdkkit/react";
import type { SWRResponse } from "swr";
import useSWR from "swr";

export function useOsdkMetadata<T extends ObjectOrInterfaceDefinition>(
  type: T,
): SWRResponse<
  T extends InterfaceDefinition ? InterfaceMetadata
    : T extends ObjectTypeDefinition ? ObjectMetadata
    : never,
  any,
  any
> {
  const client = useOsdkClient();
  return useSWR([type], () => (client.fetchMetadata(type) as any));
}

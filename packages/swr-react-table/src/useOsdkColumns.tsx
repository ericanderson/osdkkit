import type { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import { BooleanCell, StringCell } from "@osdkkit/react-table";
import { useOsdkMetadata } from "@osdkkit/swr";
import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

export function useOsdkColumns<T extends ObjectOrInterfaceDefinition>(
  type: T,
): { data?: ColumnDef<Osdk.Instance<T>>[]; isLoading: boolean; error?: Error } {
  const { data, error, isLoading } = useOsdkMetadata(type);

  const transformed = React.useMemo<ColumnDef<Osdk.Instance<T>>[] | undefined>(
    () =>
      data
        ? [
          {
            accessorKey: "$title",
            header: "Title",
            enableSorting: false,
            cell: props => <div>{props.getValue() as string}</div>, // fixme
          } as ColumnDef<Osdk.Instance<T>, any>,
          ...((type.type === "interface")
            ? [{
              accessorKey: "$objectType",
              header: "Object Type",
              cell: StringCell,
              enableSorting: false,
            }] as ColumnDef<Osdk.Instance<T>, any>[]
            : []),
          ...Object.entries(data.properties).map<
            ColumnDef<Osdk.Instance<T>, any>
          >(
            ([propName, propMetadata]) => {
              return {
                accessorKey: propName,
                header: propMetadata.displayName ?? propName,
                cell: propMetadata.type === "boolean"
                  ? BooleanCell
                  : StringCell,
                enableSorting: true,
              };
            },
          ),
        ]
        : undefined,
    [data, type.type],
  );

  return { data: transformed, error, isLoading };
}

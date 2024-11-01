import type { CellContext } from "@tanstack/react-table";

export function BooleanCell(props: CellContext<any, boolean>): "Yes" | "No" {
  return props.getValue() ? "Yes" : "No";
}

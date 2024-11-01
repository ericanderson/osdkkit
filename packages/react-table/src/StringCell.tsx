import type { CellContext } from "@tanstack/react-table";

export function StringCell(props: CellContext<any, string>): string {
  return props.getValue();
}

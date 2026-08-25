import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface DataTableColumn<T> {
  /** Stable key, also used for the React key of the cell */
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: "left" | "right"
  /** Hidden below the md breakpoint to keep narrow screens readable */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
}

export const DataTable = <T,>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No data for this period yet.",
}: DataTableProps<T>) => {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.align === "right" ? "text-right" : ""} ${
                  column.hideOnMobile ? "hidden md:table-cell" : ""
                }`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={`${column.align === "right" ? "text-right" : ""} ${
                    column.hideOnMobile ? "hidden md:table-cell" : ""
                  }`}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

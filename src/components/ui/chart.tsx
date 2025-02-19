import * as React from "react"
import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts"
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
  }
>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={
        {
          "--color-desktop": config.desktop?.color,
          "--color-mobile": config.mobile?.color,
        } as React.CSSProperties
      }
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ChartTooltipContentProps
  extends Pick<
    TooltipProps<ValueType, NameType>,
    "active" | "payload" | "label"
  > {
  className?: string
  nameKey?: string
  labelFormatter?: (value: string) => string
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  nameKey = "name",
  labelFormatter = (value) => value,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-sm",
        className
      )}
    >
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {labelFormatter(label)}
          </div>
        </div>
        <div className="grid gap-1">
          {payload.map((item: any, index: number) => {
            return (
              <div
                key={`item-${index}`}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="text-sm font-medium">
                    {item[nameKey]}
                  </span>
                </div>
                <div className="text-sm font-medium">
                  {item.value.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const ChartTooltip = Tooltip 
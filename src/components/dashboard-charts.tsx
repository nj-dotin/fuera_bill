"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface DashboardChartsProps {
  data: {
    month: string
    sales: number
    expenses: number
  }[]
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="w-full h-[320px] bg-card/40 backdrop-blur-md rounded-xl p-4 border border-border/40 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -10,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.58 0.23 24)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="oklch(0.58 0.23 24)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="month"
            stroke="rgba(255, 255, 255, 0.4)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.4)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}k`}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(20, 20, 22, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", fontWeight: "bold" }}
            itemStyle={{ fontSize: "13px" }}
            formatter={(value: any) => [formatCurrency(Number(value)), ""]}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground font-medium capitalize">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="sales"
            name="sales"
            stroke="oklch(0.58 0.23 24)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSales)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="expenses"
            stroke="#94a3b8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorExpenses)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

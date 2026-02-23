"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function UsageLimits() {
  const limits = [
    { name: "OpenAI API", used: 8000, total: 10000, unit: "requests", color: "from-yellow-500 to-orange-500" },
    { name: "Supabase Storage", used: 5, total: 10, unit: "GB", color: "from-green-500 to-emerald-500" },
    { name: "Vercel Build", used: 3000, total: 10000, unit: "hours", color: "from-indigo-500 to-purple-500" },
  ]

  return (
    <Card className="bg-[#13131a] border-[#27273a] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-slate-100">
          📊 Usage Limits
        </CardTitle>
        <a 
          href="/settings/usage" 
          className="text-sm text-indigo-400 hover:text-cyan-400 transition-colors"
        >
          ดูรายละเอียด →
        </a>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-5">
          {limits.map((limit) => {
            const percentage = Math.round((limit.used / limit.total) * 100)
            return (
              <div key={limit.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">{limit.name}</span>
                  <span className="text-slate-500">
                    {limit.used.toLocaleString()} / {limit.total.toLocaleString()} {limit.unit}
                  </span>
                </div>
                <div className="h-2 bg-[#27273a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${limit.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

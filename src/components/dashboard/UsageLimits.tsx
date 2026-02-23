"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function UsageLimits() {
  // Mock data - ต่อไปจะดึงจาก API จริง
  const limits = [
    { name: "OpenAI API", used: 8000, total: 10000, unit: "requests" },
    { name: "Supabase Storage", used: 5, total: 10, unit: "GB" },
    { name: "Vercel Build", used: 3000, total: 10000, unit: "hours" },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">📊 Usage Limits</CardTitle>
        <a href="/settings/usage" className="text-sm text-blue-600 hover:underline">
          ดูรายละเอียด
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {limits.map((limit) => {
            const percentage = Math.round((limit.used / limit.total) * 100)
            return (
              <div key={limit.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{limit.name}</span>
                  <span className="text-gray-500">
                    {limit.used.toLocaleString()} / {limit.total.toLocaleString()} {limit.unit}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      percentage > 80 ? "bg-red-500" : percentage > 50 ? "bg-yellow-500" : "bg-green-500"
                    }`}
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

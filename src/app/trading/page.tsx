"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import { useSidebar } from '@/context/SidebarContext'

interface TradingAccount {
  account_id: string | number;
  account_name: string;
  equity: number;
  balance: number;
  is_usc: boolean;
  is_demo: boolean;
  updated_at: string;
  total_lots?: number;
}

interface DailySnapshot {
  account_id: string;
  date: string;
  equity: number;
  balance: number;
}

export default function TradingPage() {
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [snapshots, setSnapshots] = useState<Record<string, DailySnapshot>>({})
  const [goldPrice, setGoldPrice] = useState<number | null>(null)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [thbRate, setThbRate] = useState<number | null>(null)
  const [now, setNow] = useState(new Date())
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [cols, setCols] = useState<number>(3)
  const [sortConfig, setSortConfig] = useState<{ key: 'equity' | 'dd' | 'name' | 'daily'; direction: 'asc' | 'desc' }>({
    key: 'equity',
    direction: 'desc'
  })
  const [deleteTarget, setDeleteTarget] = useState<TradingAccount | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    setIsMounted(true)
    if (window.innerWidth < 768) setViewMode('table')
    fetchAccounts()
    fetchTodaySnapshots()
    fetchPrices()
    const timer = setInterval(() => setNow(new Date()), 10000)
    const priceTimer = setInterval(fetchPrices, 30000)
    const channel = supabase.channel('trading_aot_manager')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_accounts' }, () => fetchAccounts())
      .subscribe()
    return () => { clearInterval(timer); clearInterval(priceTimer); supabase.removeChannel(channel) }
  }, [])

  const fetchPrices = async () => {
    try {
      const [goldRes, btcRes, thbRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT'),
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
        fetch('https://api.frankfurter.app/latest?from=USD&to=THB'),
      ])
      const goldData = await goldRes.json()
      const btcData = await btcRes.json()
      const thbData = await thbRes.json()
      if (goldData.price) setGoldPrice(parseFloat(goldData.price))
      if (btcData.price) setBtcPrice(parseFloat(btcData.price))
      if (thbData.rates?.THB) setThbRate(thbData.rates.THB)
    } catch (e) { console.error("Price API Error:", e) }
  }

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('trading_accounts').select('*')
    if (!error && data) {
      const uniqueData = (data as TradingAccount[]).reduce((acc: TradingAccount[], current) => {
        const x = acc.find(item => item.account_id === current.account_id)
        if (!x) return acc.concat([current])
        if (new Date(current.updated_at) > new Date(x.updated_at))
          return acc.map(item => item.account_id === current.account_id ? current : item)
        return acc
      }, [])
      setAccounts(uniqueData)
    }
  }

  const fetchTodaySnapshots = async () => {
    const bangkokNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    const today = bangkokNow.toISOString().split('T')[0]
    const { data } = await supabase.from('trading_daily_snapshots').select('*').eq('date', today)
    if (data) {
      const map: Record<string, DailySnapshot> = {}
      data.forEach((s: DailySnapshot) => { map[s.account_id] = s })
      setSnapshots(map)
    }
  }

  const getDailyPnL = (acc: TradingAccount) => {
    const snap = snapshots[String(acc.account_id)]
    if (!snap || snap.equity === 0) return null
    const currentEq = acc.is_usc ? acc.equity / 100 : acc.equity
    const snapEq = acc.is_usc ? snap.equity / 100 : snap.equity
    const pct = ((currentEq - snapEq) / Math.abs(snapEq)) * 100
    const diff = currentEq - snapEq
    return { pct, diff }
  }

  const sortedAccounts = useMemo(() => {
    const sortableItems = [...accounts]
    sortableItems.sort((a, b) => {
      let aVal: number, bVal: number
      if (sortConfig.key === 'equity') {
        aVal = a.is_usc ? a.equity / 100 : a.equity
        bVal = b.is_usc ? b.equity / 100 : b.equity
      } else if (sortConfig.key === 'dd') {
        aVal = a.balance > 0 ? ((a.equity - a.balance) / a.balance) * 100 : 0
        bVal = b.balance > 0 ? ((b.equity - b.balance) / b.balance) * 100 : 0
      } else if (sortConfig.key === 'daily') {
        aVal = getDailyPnL(a)?.pct ?? 0
        bVal = getDailyPnL(b)?.pct ?? 0
      } else {
        aVal = a.account_name.toLowerCase() < b.account_name.toLowerCase() ? -1 : 1
        bVal = 0
      }
      if (sortConfig.key === 'name') return sortConfig.direction === 'asc' ? (aVal as any) : -(aVal as any)
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sortableItems
  }, [accounts, sortConfig, snapshots])

  const requestSort = (key: 'equity' | 'dd' | 'name' | 'daily') => {
    let direction: 'asc' | 'desc' = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc'
    setSortConfig({ key, direction })
  }

  const toggleCurrency = async (acc: TradingAccount) => {
    const newIsUsc = !acc.is_usc
    await supabase.from('trading_accounts').update({ is_usc: newIsUsc }).eq('account_id', acc.account_id)
    setAccounts(prev => prev.map(a => a.account_id === acc.account_id ? { ...a, is_usc: newIsUsc } : a))
  }

  const deleteAccount = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('trading_accounts').delete().eq('account_id', deleteTarget.account_id)
    if (!error) setAccounts(prev => prev.filter(a => a.account_id !== deleteTarget.account_id))
    setDeleteTarget(null)
  }

  const isStale = (updatedAt: string) => {
    if (!updatedAt) return true
    const diff = Math.abs((now.getTime() - new Date(updatedAt).getTime()) / 1000)
    const actualDiff = diff > 20000 ? Math.abs(diff - 25200) : diff
    return actualDiff > 180
  }

  const totalEquityUSD = accounts.reduce((sum, a) => a.is_demo ? sum : sum + (a.is_usc ? a.equity / 100 : a.equity), 0)
  const totalDailyPnL = accounts.reduce((sum, a) => {
    if (a.is_demo) return sum
    return sum + (getDailyPnL(a)?.diff ?? 0)
  }, 0)

  if (!isMounted) return (
    <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-midnight-950 flex">
      <Sidebar />
      <main className="flex-1 min-w-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-midnight-950/80 backdrop-blur-xl border-b border-white/[0.04] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Trading Dashboard</h1>
            <p className="text-xs text-slate-500">AOT Terminal — Live Portfolio Monitor</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{"Today's P&L"}</p>
              <p className={`text-lg font-mono font-bold ${totalDailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalDailyPnL >= 0 ? '+' : ''}{totalDailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs opacity-60">USD</span>
              </p>
            </div>
            <div className="text-right border-l border-slate-800 pl-6">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Net Equity</p>
              <p className="text-xl font-mono font-bold text-white">
                {totalEquityUSD.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-xs text-slate-400">USD</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#020617] min-h-[calc(100vh-65px)] font-sans uppercase tracking-tight text-slate-200">

          {/* Controls + Price Ticker */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-2xl border border-slate-800/50">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>CARDS</button>
                <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>TABLE</button>
              </div>
              {viewMode === 'grid' && (
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 ml-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button key={n} onClick={() => setCols(n)} className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${cols === n ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{n}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-2xl">
                <span className="text-[8px] font-black text-amber-400 tracking-widest">XAUUSD</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-500 font-bold">USD</span>
                  <span className="text-sm font-mono font-bold text-white">{goldPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---.--'}</span>
                </div>
                {thbRate && goldPrice && (
                  <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
                    <span className="text-[8px] text-slate-500 font-bold">THB</span>
                    <span className="text-sm font-mono font-bold text-amber-300">{(goldPrice * thbRate).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-2xl">
                <span className="text-[8px] font-black text-orange-400 tracking-widest">BTCUSDT</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-500 font-bold">USD</span>
                  <span className="text-sm font-mono font-bold text-white">{btcPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---.--'}</span>
                </div>
                {thbRate && btcPrice && (
                  <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
                    <span className="text-[8px] text-slate-500 font-bold">THB</span>
                    <span className="text-sm font-mono font-bold text-orange-300">{(btcPrice * thbRate).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-slate-950 text-[9px] font-black text-slate-500 border-b border-slate-800">
                  <tr>
                    <th onClick={() => requestSort('name')} className="p-4 w-[22%] cursor-pointer hover:text-white transition-colors">NAME {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('equity')} className="p-4 text-right w-[26%] cursor-pointer hover:text-white transition-colors">EQUITY/BAL {sortConfig.key === 'equity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('daily')} className="p-4 text-center w-[22%] text-emerald-400 cursor-pointer hover:text-emerald-200 transition-colors">{"TODAY'S P&L"} {sortConfig.key === 'daily' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('dd')} className="p-4 text-center w-[15%] text-red-400 cursor-pointer hover:text-red-200 transition-colors">DD% {sortConfig.key === 'dd' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-4 text-center w-[15%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-[11px] md:text-sm">
                  {sortedAccounts.map((acc) => {
                    const dd = acc.balance > 0 ? ((acc.equity - acc.balance) / acc.balance) * 100 : 0
                    const daily = getDailyPnL(acc)
                    return (
                      <tr key={acc.account_id} className={`hover:bg-slate-800/30 transition-colors ${acc.is_demo ? 'opacity-60' : ''}`}>
                        <td className="p-4 overflow-hidden">
                          <p className="font-bold text-white truncate">{acc.account_name}</p>
                          <p className="text-[8px] text-slate-500 font-mono">ID: {acc.account_id}</p>
                        </td>
                        <td className="p-4 text-right font-mono font-bold">
                          <div className="text-white">{acc.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[8px] text-slate-500">{acc.is_usc ? 'USC' : 'USD'}</span></div>
                          <div className="text-[9px] text-slate-500 opacity-60">{acc.balance.toLocaleString()}</div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold">
                          {daily ? (
                            <div className={daily.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              <div>{daily.pct >= 0 ? '+' : ''}{daily.pct.toFixed(2)}%</div>
                              <div className="text-[9px] opacity-70">{daily.diff >= 0 ? '+' : ''}{daily.diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                          ) : <span className="text-slate-600 text-[9px]">—</span>}
                        </td>
                        <td className={`p-4 text-center font-mono font-bold ${dd < 0 ? 'text-red-500' : 'text-emerald-400'}`}>{dd.toFixed(1)}%</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => toggleCurrency(acc)} className={`px-2.5 py-1 rounded-lg border text-[9px] font-black transition-all ${acc.is_usc ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}`}>{acc.is_usc ? 'USC' : 'USD'}</button>
                            <button onClick={() => setDeleteTarget(acc)} className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black hover:bg-red-500/20 hover:border-red-500/40 transition-all">DEL</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '1.5rem' }}>
              {sortedAccounts.map((acc) => {
                const offline = isStale(acc.updated_at)
                const dd = acc.balance > 0 ? ((acc.equity - acc.balance) / acc.balance) * 100 : 0
                const unit = acc.is_usc ? 'USC' : 'USD'
                const color = acc.is_usc ? 'text-amber-500' : 'text-blue-400'
                const daily = getDailyPnL(acc)
                return (
                  <div key={acc.account_id} className={`bg-slate-900 border-2 rounded-[2rem] p-6 shadow-2xl transition-all duration-500 ${offline ? 'border-red-500/40' : 'border-slate-800 hover:border-blue-500/50'} ${acc.is_demo ? 'opacity-80 shadow-none' : ''}`}>
                    <div className="flex justify-between items-start mb-5 uppercase">
                      <div>
                        <h2 className={`text-base font-black truncate ${cols >= 3 ? 'max-w-[120px]' : 'max-w-[200px]'} ${offline ? 'text-red-400' : 'text-white'}`}>{acc.account_name}</h2>
                        <p className="text-[9px] text-slate-500 font-mono">ID: {acc.account_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCurrency(acc)} className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black transition-all ${acc.is_usc ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}`}>{acc.is_usc ? 'USC' : 'USD'}</button>
                        <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black ${offline ? 'text-red-500 border-red-500/20' : 'text-emerald-400 border-emerald-500/20'}`}>{offline ? 'OFFLINE' : 'LIVE'}</div>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <p className={`${color} text-[9px] font-black mb-1 opacity-80 uppercase tracking-widest`}>Equity</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`${cols >= 3 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl'} font-mono font-black text-white leading-none tracking-tighter`}>
                          {acc.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`${color} text-sm md:text-xl font-black`}>{unit}</span>
                      </div>
                      <div className="mt-2 text-[11px] font-mono font-bold text-slate-400 uppercase">BAL: {acc.balance.toLocaleString()} {unit}</div>
                    </div>

                    {/* Daily P&L */}
                    <div className={`p-3 rounded-xl border text-center mb-3 ${daily ? (daily.pct >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20') : 'bg-slate-950/40 border-slate-800/50'}`}>
                      <p className="text-[8px] text-slate-500 font-black mb-1 uppercase tracking-widest">{"Today's P&L"}</p>
                      {daily ? (
                        <div className={`font-mono font-bold ${daily.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          <span className="text-lg">{daily.pct >= 0 ? '+' : ''}{daily.pct.toFixed(2)}%</span>
                          <span className="text-[10px] ml-2 opacity-70">{daily.diff >= 0 ? '+' : ''}{daily.diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ) : <span className="text-slate-600 text-[10px]">No snapshot yet</span>}
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 text-center mb-4">
                      <p className="text-[8px] text-slate-500 font-black mb-1 uppercase tracking-widest">Drawdown</p>
                      <p className={`text-xl font-bold font-mono ${dd < 0 ? 'text-red-500' : 'text-emerald-400'}`}>{dd.toFixed(2)}%</p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 border-t border-slate-800/40 pt-4 uppercase">
                      <span>LOTS: {acc.total_lots?.toFixed(2) || '0.00'}</span>
                      <button onClick={() => setDeleteTarget(acc)} className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black hover:bg-red-500/20 hover:border-red-500/40 transition-all">DELETE</button>
                      <span className="font-mono opacity-60">{new Date(acc.updated_at).toLocaleTimeString('th-TH', { hour12: false })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* DELETE MODAL */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
            <div className="bg-slate-900 border-2 border-red-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">CONFIRM DELETE</h3>
                <p className="text-sm text-slate-400 mt-2">You are about to delete</p>
                <p className="text-base font-black text-red-400 mt-1">{deleteTarget.account_name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {deleteTarget.account_id}</p>
                <p className="text-xs text-slate-500 mt-3">This action is permanent and cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-all">CANCEL</button>
                <button onClick={deleteAccount} className="flex-1 py-3 rounded-2xl bg-red-600 border border-red-500 text-white text-sm font-bold hover:bg-red-500 transition-all">DELETE</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

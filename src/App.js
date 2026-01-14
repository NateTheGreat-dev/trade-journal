import React, { useState, useEffect } from 'react';
import { Camera, Plus, TrendingUp, TrendingDown, BarChart3, Filter, X, Edit2, Trash2, Clock, Settings, Download, Upload, Calendar } from 'lucide-react';
import './TradingJournal.css';

export default function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showChecklistSettings, setShowChecklistSettings] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [editingTrade, setEditingTrade] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [cryptoPrices, setCryptoPrices] = useState({ BTC: null, ETH: null, SOL: null });
  const [checklistItems, setChecklistItems] = useState([
    'Confirmed trend direction',
    'On a trendline',
    'On a trendline with a golden pocket fib',
    'Swept liquidity',
    'Clean price action',
    'Support and resistance'
  ]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const [newTrade, setNewTrade] = useState({
    screenshot: null,
    screenshotPreview: null,
    category: '',
    tags: '',
    outcome: '',
    pnl: '',
    notes: '',
    checklist: {},
    timestamp: Date.now(),
    hour: new Date().getHours()
  });

  useEffect(() => {
    const saved = localStorage.getItem('tradingJournalData');
    if (saved) {
      setTrades(JSON.parse(saved));
    }
    
    const savedChecklist = localStorage.getItem('checklistItems');
    if (savedChecklist) {
      setChecklistItems(JSON.parse(savedChecklist));
    }
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      localStorage.setItem('tradingJournalData', JSON.stringify(trades));
    }
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('checklistItems', JSON.stringify(checklistItems));
  }, [checklistItems]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
        );
        const data = await response.json();
        
        const btc = data.bitcoin?.usd;
        const eth = data.ethereum?.usd;
        const sol = data.solana?.usd;
        
        setCryptoPrices({
          BTC: btc && !isNaN(btc) ? btc.toFixed(2) : cryptoPrices.BTC,
          ETH: eth && !isNaN(eth) ? eth.toFixed(2) : cryptoPrices.ETH,
          SOL: sol && !isNaN(sol) ? sol.toFixed(2) : cryptoPrices.SOL
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [cryptoPrices]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTrade({
          ...newTrade,
          screenshot: reader.result,
          screenshotPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTrade = () => {
    if (!newTrade.screenshot) {
      alert('Please upload a screenshot');
      return;
    }

    const trade = {
      ...newTrade,
      id: Date.now(),
      timestamp: Date.now(),
      hour: new Date().getHours()
    };

    setTrades([trade, ...trades]);
    setNewTrade({
      screenshot: null,
      screenshotPreview: null,
      category: '',
      tags: '',
      outcome: '',
      pnl: '',
      notes: '',
      checklist: {},
      timestamp: Date.now(),
      hour: new Date().getHours()
    });
    setShowAddModal(false);
  };

  const updateTrade = (id, updates) => {
    setTrades(trades.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingTrade(null);
  };

  const deleteTrade = (id) => {
    if (window.confirm('Delete this trade?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  const exportData = () => {
    const backup = {
      trades: trades,
      checklistItems: checklistItems,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          if (backup.trades && Array.isArray(backup.trades)) {
            if (window.confirm(`Import ${backup.trades.length} trades? This will replace your current data.`)) {
              setTrades(backup.trades);
              if (backup.checklistItems) {
                setChecklistItems(backup.checklistItems);
              }
              alert('Data imported successfully!');
            }
          } else {
            alert('Invalid backup file format');
          }
        } catch (error) {
          alert('Error reading backup file: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const calculateStats = () => {
    const total = trades.length;
    const wins = trades.filter(t => t.outcome === 'win').length;
    const losses = trades.filter(t => t.outcome === 'loss').length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

    const aPlus = trades.filter(t => t.category === 'A+');
    const aPlusWins = aPlus.filter(t => t.outcome === 'win').length;
    const aPlusRate = aPlus.length > 0 ? ((aPlusWins / aPlus.length) * 100).toFixed(1) : 0;

    const bPlus = trades.filter(t => t.category === 'B+');
    const bPlusWins = bPlus.filter(t => t.outcome === 'win').length;
    const bPlusRate = bPlus.length > 0 ? ((bPlusWins / bPlus.length) * 100).toFixed(1) : 0;

    const cPlus = trades.filter(t => t.category === 'C+');
    const cPlusWins = cPlus.filter(t => t.outcome === 'win').length;
    const cPlusRate = cPlus.length > 0 ? ((cPlusWins / cPlus.length) * 100).toFixed(1) : 0;

    const dPlus = trades.filter(t => t.category === 'D+');
    const dPlusWins = dPlus.filter(t => t.outcome === 'win').length;
    const dPlusRate = dPlus.length > 0 ? ((dPlusWins / dPlus.length) * 100).toFixed(1) : 0;

    const fGrade = trades.filter(t => t.category === 'F');
    const fWins = fGrade.filter(t => t.outcome === 'win').length;
    const fRate = fGrade.length > 0 ? ((fWins / fGrade.length) * 100).toFixed(1) : 0;

    const today = new Date().toDateString();
    const todayTrades = trades.filter(t => new Date(t.timestamp).toDateString() === today).length;

    const last7Days = trades.filter(t => Date.now() - t.timestamp < 7 * 24 * 60 * 60 * 1000);
    const avgPerDay = last7Days.length > 0 ? (last7Days.length / 7).toFixed(1) : 0;

    let currentStreak = 0;
    let streakType = '';
    for (let trade of trades) {
      if (!trade.outcome) break;
      if (currentStreak === 0) {
        currentStreak = 1;
        streakType = trade.outcome;
      } else if (trade.outcome === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }

    const hourlyStats = {};
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { total: 0, wins: 0, rate: 0 };
    }
    
    trades.forEach(trade => {
      const hour = trade.hour || new Date(trade.timestamp).getHours();
      if (hourlyStats[hour]) {
        hourlyStats[hour].total++;
        if (trade.outcome === 'win') {
          hourlyStats[hour].wins++;
        }
      }
    });

    Object.keys(hourlyStats).forEach(hour => {
      const stats = hourlyStats[hour];
      if (stats.total > 0) {
        stats.rate = ((stats.wins / stats.total) * 100).toFixed(1);
      }
    });

    const checklistCorrelation = {};
    checklistItems.forEach(item => {
      const tradesWithItem = trades.filter(t => t.checklist && t.checklist[item]);
      const winsWithItem = tradesWithItem.filter(t => t.outcome === 'win').length;
      const rate = tradesWithItem.length > 0 ? ((winsWithItem / tradesWithItem.length) * 100).toFixed(1) : 0;
      checklistCorrelation[item] = {
        total: tradesWithItem.length,
        wins: winsWithItem,
        rate: rate
      };
    });

    return {
      total,
      wins,
      losses,
      winRate,
      aPlus: { total: aPlus.length, wins: aPlusWins, rate: aPlusRate },
      bPlus: { total: bPlus.length, wins: bPlusWins, rate: bPlusRate },
      cPlus: { total: cPlus.length, wins: cPlusWins, rate: cPlusRate },
      dPlus: { total: dPlus.length, wins: dPlusWins, rate: dPlusRate },
      fGrade: { total: fGrade.length, wins: fWins, rate: fRate },
      todayTrades,
      avgPerDay,
      currentStreak,
      streakType,
      hourlyStats,
      checklistCorrelation
    };
  };

  const filteredTrades = trades.filter(trade => {
    if (filterCategory !== 'all' && trade.category !== filterCategory) return false;
    if (filterOutcome !== 'all' && trade.outcome !== filterOutcome) return false;
    return true;
  });

  const getCalendarData = () => {
    const dailyPnL = {};
    trades.forEach(trade => {
      if (trade.pnl && trade.timestamp) {
        const date = new Date(trade.timestamp);
        const dateKey = date.toLocaleDateString();
        if (!dailyPnL[dateKey]) {
          dailyPnL[dateKey] = { total: 0, trades: 0, date: date };
        }
        dailyPnL[dateKey].total += parseFloat(trade.pnl) || 0;
        dailyPnL[dateKey].trades += 1;
      }
    });
    return dailyPnL;
  };

  const generateCalendarGrid = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    let day = 1;
    
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDayOfWeek) {
          week.push(null);
        } else if (day > daysInMonth) {
          week.push(null);
        } else {
          week.push(day);
          day++;
        }
      }
      calendar.push(week);
      if (day > daysInMonth) break;
    }
    
    return calendar;
  };

  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const getCalendarDataForDay = (day) => {
    if (!day) return null;
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    const dateKey = date.toLocaleDateString();
    return getCalendarData()[dateKey] || null;
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Journal</h1>
            <p className="text-gray-400">Track your trades and improve your discipline</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-3 bg-gray-800 px-3 py-2 rounded-lg text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">BTC:</span> 
                <span className="font-bold text-green-400 whitespace-nowrap">
                  ${cryptoPrices.BTC ? Number(cryptoPrices.BTC).toLocaleString() : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">ETH:</span> 
                <span className="font-bold text-green-400 whitespace-nowrap">
                  ${cryptoPrices.ETH ? Number(cryptoPrices.ETH).toLocaleString() : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">SOL:</span> 
                <span className="font-bold text-green-400 whitespace-nowrap">
                  ${cryptoPrices.SOL ? Number(cryptoPrices.SOL).toLocaleString() : 'Loading...'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors text-sm"
                title="Export backup"
              >
                <Download size={18} />
              </button>
              <label className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm" title="Import backup">
                <Upload size={18} />
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
            
            <button
              onClick={() => setShowChecklistSettings(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Settings size={20} />
              Checklist
            </button>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Calendar size={20} />
              Calendar
            </button>
            <button
              onClick={() => setShowStatsModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <BarChart3 size={20} />
              Stats
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Trade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Today's Trades</div>
            <div className="text-2xl font-bold">{stats.todayTrades}</div>
            <div className="text-gray-500 text-xs">Avg: {stats.avgPerDay}/day</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Win Rate</div>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <div className="text-gray-500 text-xs">{stats.wins}W-{stats.losses}L</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">A+ Setups</div>
            <div className="text-2xl font-bold text-green-400">{stats.aPlus.rate}%</div>
            <div className="text-gray-500 text-xs">{stats.aPlus.wins}W-{stats.aPlus.total - stats.aPlus.wins}L</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">B+ Setups</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.bPlus.rate}%</div>
            <div className="text-gray-500 text-xs">{stats.bPlus.wins}W-{stats.bPlus.total - stats.bPlus.wins}L</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">C+ Setups</div>
            <div className="text-2xl font-bold text-orange-400">{stats.cPlus.rate}%</div>
            <div className="text-gray-500 text-xs">{stats.cPlus.wins}W-{stats.cPlus.total - stats.cPlus.wins}L</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Streak</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.currentStreak}
              {stats.streakType === 'win' ? <TrendingUp className="text-green-400" size={20} /> : 
               stats.streakType === 'loss' ? <TrendingDown className="text-red-400" size={20} /> : null}
            </div>
            <div className="text-gray-500 text-xs">
              {stats.streakType === 'win' ? 'Wins' : stats.streakType === 'loss' ? 'Losses' : 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="A+">A+ Only</option>
              <option value="B+">B+ Only</option>
              <option value="C+">C+ Only</option>
              <option value="D+">D+ Only</option>
              <option value="F">F Only</option>
            </select>
          </div>
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Wins Only</option>
            <option value="loss">Losses Only</option>
          </select>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Camera size={48} className="mx-auto mb-4 opacity-50" />
            <p>No trades yet. Add your first trade to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredTrades.map(trade => (
              <div key={trade.id} className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 ring-blue-500 transition-all">
                <div className="relative cursor-pointer" onClick={() => setFullscreenImage(trade.screenshot)}>
                  <img src={trade.screenshot} alt="Trade screenshot" className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {trade.category && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        trade.category === 'A+' ? 'bg-green-600' : 
                        trade.category === 'B+' ? 'bg-yellow-600' :
                        trade.category === 'C+' ? 'bg-orange-600' :
                        trade.category === 'D+' ? 'bg-red-600' :
                        trade.category === 'F' ? 'bg-red-800' : 'bg-gray-600'
                      }`}>
                        {trade.category}
                      </span>
                    )}
                    {trade.outcome && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        trade.outcome === 'win' ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {trade.outcome === 'win' ? 'W' : 'L'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-400 mb-2">
                    {new Date(trade.timestamp).toLocaleString()}
                  </div>
                  {trade.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {trade.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {trade.pnl && (
                    <div className={`text-sm font-bold mb-2 ${
                      parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {parseFloat(trade.pnl) >= 0 ? '+' : ''}{trade.pnl}%
                    </div>
                  )}
                  {trade.notes && (
                    <div className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {trade.notes}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTrade(trade)}
                      className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center justify-center gap-1"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTrade(trade.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Add New Trade</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Screenshot *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full"
                    />
                    {newTrade.screenshotPreview && (
                      <img src={newTrade.screenshotPreview} alt="Preview" className="mt-2 w-full h-48 object-cover rounded" />
                    )}
                  </div>

                  {checklistItems.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-900 to-gray-700 p-5 rounded-lg border-2 border-blue-600">
                      <label className="block text-sm font-bold mb-4 text-blue-200 flex items-center gap-2">
                        <Settings size={18} />
                        Pre-Trade Checklist
                      </label>
                      <div className="space-y-3">
                        {checklistItems.map((item, index) => (
                          <label key={index} className="flex items-start gap-3 p-3 bg-gray-800 bg-opacity-50 rounded hover:bg-opacity-70 transition-all cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={newTrade.checklist[item] || false}
                              onChange={(e) => setNewTrade({
                                ...newTrade,
                                checklist: { ...newTrade.checklist, [item]: e.target.checked }
                              })}
                              className="w-5 h-5 mt-0.5 accent-blue-500"
                            />
                            <span className="text-gray-200 group-hover:text-white transition-colors flex-1">{item}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 text-xs text-blue-300 italic">
                        ✓ Check all items that apply to this trade setup
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newTrade.category}
                      onChange={(e) => setNewTrade({ ...newTrade, category: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="">Select category</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="C+">C+</option>
                      <option value="D+">D+</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={newTrade.tags}
                      onChange={(e) => setNewTrade({ ...newTrade, tags: e.target.value })}
                      placeholder="breakout, momentum, support"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Outcome</label>
                    <select
                      value={newTrade.outcome}
                      onChange={(e) => setNewTrade({ ...newTrade, outcome: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="">Select outcome</option>
                      <option value="win">Win</option>
                      <option value="loss">Loss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">P&L (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTrade.pnl}
                      onChange={(e) => setNewTrade({ ...newTrade, pnl: e.target.value })}
                      placeholder="2.5 or -1.2"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={newTrade.notes}
                      onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                      placeholder="What were you thinking? How did you feel?"
                      rows="3"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addTrade}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-medium"
                  >
                    Add Trade
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 bg-gray-700 hover:bg-gray-600 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Edit Trade</h2>
                  <button onClick={() => setEditingTrade(null)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <img src={editingTrade.screenshot} alt="Trade" className="w-full h-48 object-cover rounded mb-4" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={editingTrade.category}
                      onChange={(e) => setEditingTrade({ ...editingTrade, category: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="">Select category</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="C+">C+</option>
                      <option value="D+">D+</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={editingTrade.tags}
                      onChange={(e) => setEditingTrade({ ...editingTrade, tags: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Outcome</label>
                    <select
                      value={editingTrade.outcome}
                      onChange={(e) => setEditingTrade({ ...editingTrade, outcome: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="">Select outcome</option>
                      <option value="win">Win</option>
                      <option value="loss">Loss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">P&L (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTrade.pnl}
                      onChange={(e) => setEditingTrade({ ...editingTrade, pnl: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={editingTrade.notes}
                      onChange={(e) => setEditingTrade({ ...editingTrade, notes: e.target.value })}
                      rows="3"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => updateTrade(editingTrade.id, editingTrade)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingTrade(null)}
                    className="px-6 bg-gray-700 hover:bg-gray-600 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showStatsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Detailed Statistics</h2>
                  <button onClick={() => setShowStatsModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Overall Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Trades:</span>
                        <span className="font-bold">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Wins:</span>
                        <span className="font-bold text-green-400">{stats.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Losses:</span>
                        <span className="font-bold text-red-400">{stats.losses}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-3">
                        <span className="text-gray-300">Win Rate:</span>
                        <span className="font-bold text-xl">{stats.winRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Trading Activity</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Today:</span>
                        <span className="font-bold">{stats.todayTrades} trades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">7-Day Average:</span>
                        <span className="font-bold">{stats.avgPerDay} trades/day</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-3">
                        <span className="text-gray-300">Current Streak:</span>
                        <span className="font-bold">
                          {stats.currentStreak} {stats.streakType === 'win' ? 'Wins' : stats.streakType === 'loss' ? 'Losses' : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Win Rate by Hour of Day
                  </h3>
                  <div className="grid grid-cols-12 gap-2">
                    {Object.entries(stats.hourlyStats).map(([hour, data]) => {
                      const heightPercent = data.total > 0 ? Math.max(10, (parseFloat(data.rate) / 100) * 100) : 0;
                      const hasData = data.total > 0;
                      return (
                        <div key={hour} className="flex flex-col items-center">
                          <div className="text-xs mb-1 h-8 flex items-end">
                            {hasData && (
                              <div className="text-center">
                                <div className="font-bold text-xs">{data.rate}%</div>
                                <div className="text-gray-500 text-xs">{data.total}t</div>
                              </div>
                            )}
                          </div>
                          <div 
                            className={`w-full rounded ${
                              !hasData ? 'bg-gray-600' :
                              parseFloat(data.rate) >= 60 ? 'bg-green-500' :
                              parseFloat(data.rate) >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ height: hasData ? `${heightPercent}px` : '4px' }}
                          />
                          <div className="text-xs mt-1 text-gray-400">
                            {hour}h
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-400 mt-4">
                    Each bar shows your win rate for that hour. Taller green bars = better performance.
                  </p>
                </div>

                {Object.keys(stats.checklistCorrelation).length > 0 && (
                  <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">Checklist Item Performance</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.checklistCorrelation).map(([item, data]) => (
                        <div key={item} className="flex items-center justify-between">
                          <span className="text-gray-300 flex-1">{item}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">{data.total} trades</span>
                            <span className={`font-bold ${
                              parseFloat(data.rate) >= 60 ? 'text-green-400' :
                              parseFloat(data.rate) >= 40 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {data.rate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">A+ Setups</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total:</span>
                        <span className="font-bold">{stats.aPlus.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Rate:</span>
                        <span className="font-bold text-green-400">{stats.aPlus.rate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">B+ Setups</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total:</span>
                        <span className="font-bold">{stats.bPlus.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Rate:</span>
                        <span className="font-bold text-yellow-400">{stats.bPlus.rate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">C+ Setups</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total:</span>
                        <span className="font-bold">{stats.cPlus.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Rate:</span>
                        <span className="font-bold text-orange-400">{stats.cPlus.rate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">D+ Setups</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total:</span>
                        <span className="font-bold">{stats.dPlus.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Rate:</span>
                        <span className="font-bold text-red-400">{stats.dPlus.rate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">F Grade</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total:</span>
                        <span className="font-bold">{stats.fGrade.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Rate:</span>
                        <span className="font-bold text-red-600">{stats.fGrade.rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowStatsModal(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {fullscreenImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-6 z-50"
            onClick={() => setFullscreenImage(null)}
          >
            <button 
              onClick={() => setFullscreenImage(null)} 
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Trade screenshot fullscreen" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {showCalendarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar size={28} />
                    P&L Calendar
                  </h2>
                  <button onClick={() => setShowCalendarModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Previous
                  </button>
                  <h3 className="text-xl font-semibold">
                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Next
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-bold text-gray-300 text-sm py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {generateCalendarGrid(calendarDate.getFullYear(), calendarDate.getMonth()).map((week, weekIndex) => (
                      <React.Fragment key={weekIndex}>
                        {week.map((day, dayIndex) => {
                          const dayData = getCalendarDataForDay(day);
                          const isToday = day && 
                            new Date().getDate() === day && 
                            new Date().getMonth() === calendarDate.getMonth() &&
                            new Date().getFullYear() === calendarDate.getFullYear();
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`min-h-24 p-2 rounded border-2 ${
                                !day ? 'bg-gray-800 border-gray-800' :
                                isToday ? 'border-blue-500' :
                                dayData ? 
                                  dayData.total > 0 ? 'bg-green-900 bg-opacity-40 border-green-700' :
                                  dayData.total < 0 ? 'bg-red-900 bg-opacity-40 border-red-700' :
                                  'bg-gray-800 border-gray-700'
                                : 'bg-gray-800 border-gray-700'
                              }`}
                            >
                              {day && (
                                <>
                                  <div className="text-sm font-semibold mb-1">{day}</div>
                                  {dayData && (
                                    <>
                                      <div className={`text-lg font-bold ${
                                        dayData.total > 0 ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {dayData.total > 0 ? '+' : ''}{dayData.total.toFixed(2)}%
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {dayData.trades} trade{dayData.trades !== 1 ? 's' : ''}
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="w-full mt-6 bg-gray-700 hover:bg-gray-600 py-3 rounded font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showChecklistSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings size={28} />
                    Pre-Trade Checklist Settings
                  </h2>
                  <button onClick={() => setShowChecklistSettings(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <p className="text-gray-400 text-sm mb-6 bg-blue-900 bg-opacity-30 p-3 rounded border-l-4 border-blue-500">
                  Customize the checklist items that appear when adding a new trade. The app will track which items correlate with winning trades.
                </p>

                <div className="space-y-3 mb-6">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-700 to-gray-600 p-4 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all group">
                      <span className="text-gray-200 font-medium">{item}</span>
                      <button
                        onClick={() => removeChecklistItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 p-2 rounded transition-all"
                        title="Remove item"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    placeholder="Add new checklist item..."
                    className="flex-1 bg-gray-700 border-2 border-gray-600 focus:border-blue-500 rounded px-4 py-3 transition-colors"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                <button
                  onClick={() => setShowChecklistSettings(false)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-3 rounded font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
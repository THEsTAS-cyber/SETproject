"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useFavorites } from "../useFavorites";

interface PriceEntry {
  id: number; region: string; currency: string;
  current_price: number | null; original_price: number | null;
  discount_percent: number | null; collected_at: string; store_url: string | null;
}
interface Game {
  id: number; name: string; cover_url: string | null;
  platforms: string[]; price_entries: PriceEntry[];
}

const RUB_RATES: Record<string, number> = {
  RUB: 1, USD: 92, EUR: 100, UAH: 2.2, GBP: 118, PLN: 23,
  TRY: 2.5, JPY: 0.6, BRL: 16, AUD: 60,
};
const REGION_NAMES: Record<string, string> = {
  ua: "🇺🇦 Украина", us: "🇺 США", gb: "🇬 Великобритания",
  de: "🇩 Германия", fr: "🇫 Франция", pl: "🇵🇱 Польша",
  tr: "🇹🇷 Турция", jp: "🇯🇵 Япония", br: "🇧🇷 Бразилия", au: "🇦🇺 Австралия",
};

function convertToRub(price: number, currency: string) { return price * (RUB_RATES[currency] || 1); }
function formatCurrency(price: number, currency: string) {
  const s: Record<string, string> = { USD:"$",EUR:"€",UAH:"₴",GBP:"£",PLN:"zł",TRY:"₺",JPY:"¥",BRL:"R$",AUD:"A$",RUB:"₽" };
  return `${price.toFixed(2)} ${s[currency] || currency}`;
}

export default function GamesPage() {
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name"|"cheapest">("cheapest");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { favIds, toggle: toggleFav } = useFavorites(token);

  useEffect(() => {
    fetch("/api/games").then(r => r.json()).then(d => { setGames(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const getBest = (g: Game) => {
    const v = g.price_entries.filter(e => e.current_price != null);
    if (!v.length) return null;
    let best: PriceEntry | null = null, bestRub = Infinity;
    for (const e of v) { const r = convertToRub(e.current_price!, e.currency); if (r < bestRub) { bestRub = r; best = e; } }
    return best ? { entry: best, rub: bestRub } : null;
  };

  const filtered = games
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const aB = getBest(a), bB = getBest(b);
      return (aB?.rub ?? Infinity) - (bB?.rub ?? Infinity);
    });

  if (loading) return <div className="loading">Загрузка игр...</div>;

  return (
    <div className="page">
      <h1 className="title">🎮 Каталог игр PS Store</h1>
      <p className="subtitle">{games.length} игр • {Object.keys(RUB_RATES).length} валют</p>
      <div className="controls">
        <input type="text" placeholder="🔍 Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
        <div className="sort-buttons">
          <button className={`sort-btn ${sortBy==="cheapest"?"active":""}`} onClick={() => setSortBy("cheapest")}>💰 По цене</button>
          <button className={`sort-btn ${sortBy==="name"?"active":""}`} onClick={() => setSortBy("name")}>🔤 По названию</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty">{games.length === 0 ? "📭 Каталог пуст." : "🔍 Ничего не найдено."}</div>
      ) : (
        <div className="grid">
          {filtered.map(g => {
            const best = getBest(g);
            const isExp = expandedId === g.id;
            const isFav = favIds.has(g.id);
            const prices = g.price_entries.filter(e => e.current_price != null)
              .map(e => ({...e, rub: convertToRub(e.current_price!, e.currency)}))
              .sort((a, b) => a.rub - b.rub);
            return (
              <div key={g.id} className="card">
                <div className="cover-wrapper">
                  {g.cover_url ? <img src={g.cover_url} alt={g.name} className="cover" /> : <div className="cover-placeholder">🎮</div>}
                  {g.platforms.length > 0 && <div className="platforms">{g.platforms.map(p => <span key={p} className="platform-badge">{p}</span>)}</div>}
                  {token && (
                    <button className={`fav-btn ${isFav?"fav-active":""}`} onClick={() => toggleFav(g.id)} title="В избранное">
                      {isFav ? "❤️" : "🤍"}
                    </button>
                  )}
                </div>
                <h2 className="game-name">{g.name}</h2>
                {best && (
                  <div className="best-price">
                    <span className="best-label">Лучшая:</span>
                    <span className="best-value">{formatCurrency(best.entry.current_price!, best.entry.currency)}</span>
                    <span className="best-region">{REGION_NAMES[best.entry.region] || best.entry.region}</span>
                    <span className="best-rub">≈ {best.rub.toFixed(0)} ₽</span>
                    {best.entry.store_url && <a href={best.entry.store_url} target="_blank" rel="noopener noreferrer" className="best-link">🛒 PS Store</a>}
                  </div>
                )}
                {prices.length > 1 && (
                  <div className="all-prices">
                    <button className="toggle-btn" onClick={() => setExpandedId(isExp ? null : g.id)}>
                      {isExp ? "▲" : "▼"} Все цены ({prices.length})
                    </button>
                    {isExp && (
                      <div className="prices-list">
                        {prices.map(e => {
                          const isBest = best && e.id === best.entry.id;
                          return (
                            <div key={e.id} className={`price-row ${isBest?"price-best":""}`}>
                              <span className="price-region">{REGION_NAMES[e.region] || e.region}</span>
                              <span className="price-amount">{formatCurrency(e.current_price!, e.currency)}</span>
                              <span className="price-rub">≈ {e.rub.toFixed(0)} ₽</span>
                              {e.store_url && <a href={e.store_url} target="_blank" rel="noopener noreferrer" className="price-link">🔗</a>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {!best && <div className="no-price">Цена недоступна</div>}
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .page{max-width:1400px;margin:0 auto;padding:2rem}
        .title{font-size:2rem;font-weight:800;margin-bottom:.5rem;color:#1a1a2e}
        .subtitle{color:#666;margin-bottom:1.5rem;font-size:.95rem}
        .controls{display:flex;gap:1rem;margin-bottom:2rem;flex-wrap:wrap;align-items:center}
        .search-input{flex:1;min-width:250px;padding:.75rem 1rem;border:2px solid #e0e0e0;border-radius:12px;font-size:1rem}
        .search-input:focus{outline:none;border-color:#6c5ce7}
        .sort-buttons{display:flex;gap:.5rem}
        .sort-btn{padding:.75rem 1.25rem;border:2px solid #e0e0e0;border-radius:12px;background:#fff;cursor:pointer;font-size:.9rem;font-weight:600;transition:all .2s}
        .sort-btn.active{background:#6c5ce7;color:#fff;border-color:#6c5ce7}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
        .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);transition:transform .2s,box-shadow .2s}
        .card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.12)}
        .cover-wrapper{position:relative}
        .cover{width:100%;height:170px;object-fit:cover;display:block}
        .cover-placeholder{width:100%;height:170px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:3rem}
        .platforms{position:absolute;top:8px;right:8px;display:flex;gap:4px}
        .platform-badge{background:rgba(0,0,0,.7);color:#fff;padding:2px 8px;border-radius:6px;font-size:.7rem;font-weight:700}
        .fav-btn{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.5);border:none;border-radius:50%;width:36px;height:36px;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .fav-btn:hover{transform:scale(1.15)}
        .fav-active{background:rgba(255,255,255,.9)}
        .game-name{padding:1rem 1rem .5rem;font-size:1.05rem;font-weight:700;color:#1a1a2e;line-height:1.3;min-height:3.2em;overflow:hidden}
        .best-price{margin:.5rem 1rem;padding:.75rem;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:10px;border:2px solid #4caf50;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
        .best-label{font-size:.75rem;font-weight:600;color:#2e7d32;text-transform:uppercase}
        .best-value{font-size:1.15rem;font-weight:800;color:#1b5e20}
        .best-region{font-size:.8rem;color:#388e3c}
        .best-rub{font-size:.85rem;font-weight:600;color:#2e7d32;margin-left:auto}
        .best-link{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#1b5e20;color:#fff;text-decoration:none;border-radius:6px;font-size:.8rem;font-weight:600}
        .all-prices{margin:.5rem 1rem 1rem}
        .toggle-btn{width:100%;padding:.5rem;background:#f0f0f0;border:none;border-radius:8px;cursor:pointer;font-size:.85rem;font-weight:600;color:#6c5ce7}
        .prices-list{margin-top:.5rem;display:flex;flex-direction:column;gap:4px}
        .price-row{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:#f8f9fa;font-size:.82rem}
        .price-best{background:#e8f5e9;border:1px solid #4caf50;font-weight:600}
        .price-region{flex:1}
        .price-amount{font-weight:600;margin-right:.5rem}
        .price-rub{color:#666;min-width:70px;text-align:right}
        .price-link{text-decoration:none;font-size:1rem;margin-left:6px}
        .no-price{margin:.5rem 1rem 1rem;padding:.5rem;background:#f5f5f5;border-radius:8px;text-align:center;color:#999;font-size:.85rem}
        .loading,.empty{text-align:center;padding:4rem 2rem;font-size:1.1rem;color:#666}
        @media(max-width:640px){.page{padding:1rem}.title{font-size:1.5rem}.grid{grid-template-columns:1fr}.controls{flex-direction:column}.sort-buttons{width:100%}.sort-btn{flex:1}}
      `}</style>
    </div>
  );
}

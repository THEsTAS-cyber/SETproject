"use client";

import { useEffect, useState } from "react";

interface PriceEntry {
  id: number;
  region: string;
  currency: string;
  current_price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  collected_at: string;
  store_url: string | null;
}

interface Game {
  id: number;
  name: string;
  cover_url: string | null;
  platforms: string[];
  price_entries: PriceEntry[];
}

// Approximate exchange rates to RUB (updated periodically)
const RUB_RATES: Record<string, number> = {
  RUB: 1,
  USD: 92,
  EUR: 100,
  UAH: 2.2,
  GBP: 118,
  PLN: 23,
  TRY: 2.5,
  JPY: 0.6,
  BRL: 16,
  AUD: 60,
};

const REGION_NAMES: Record<string, string> = {
  ua: "🇺 Украина",
  us: "🇺 США",
  gb: "🇬 Великобритания",
  de: "🇩 Германия",
  fr: "🇫 Франция",
  pl: "🇵 Польша",
  tr: "🇹 Турция",
  jp: "🇯🇵 Япония",
  br: "🇧 Бразилия",
  au: "🇦 Австралия",
};

function convertToRub(price: number, currency: string): number {
  const rate = RUB_RATES[currency] || 1;
  return price * rate;
}

function formatCurrency(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", UAH: "₴", GBP: "£", PLN: "zł",
    TRY: "₺", JPY: "¥", BRL: "R$", AUD: "A$", RUB: "₽",
  };
  const symbol = symbols[currency] || currency;
  return `${price.toFixed(2)} ${symbol}`;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "cheapest">("cheapest");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getBestPriceEntry = (game: Game): PriceEntry | null => {
    const validPrices = game.price_entries.filter(
      (e) => e.current_price !== null && e.current_price !== undefined
    );
    if (validPrices.length === 0) return null;

    let best: PriceEntry | null = null;
    let bestRub = Infinity;

    for (const entry of validPrices) {
      const rub = convertToRub(entry.current_price!, entry.currency);
      if (rub < bestRub) {
        bestRub = rub;
        best = entry;
      }
    }
    return best;
  };

  const filteredGames = games
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const aBest = getBestPriceEntry(a);
      const bBest = getBestPriceEntry(b);
      const aRub = aBest ? convertToRub(aBest.current_price!, aBest.currency) : Infinity;
      const bRub = bBest ? convertToRub(bBest.current_price!, bBest.currency) : Infinity;
      return aRub - bRub;
    });

  if (loading) return <div className="loading">Загрузка игр...</div>;

  return (
    <div className="page">
      <h1 className="title">🎮 Каталог игр PS Store</h1>
      <p className="subtitle">
        {games.length} игр • цены в {Object.keys(RUB_RATES).length} валютах • лучшая цена подсвечена
      </p>

      <div className="controls">
        <input
          type="text"
          placeholder="🔍 Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="sort-buttons">
          <button
            className={`sort-btn ${sortBy === "cheapest" ? "active" : ""}`}
            onClick={() => setSortBy("cheapest")}
          >
            💰 По выгодной цене
          </button>
          <button
            className={`sort-btn ${sortBy === "name" ? "active" : ""}`}
            onClick={() => setSortBy("name")}
          >
            🔤 По названию
          </button>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="empty">
          {games.length === 0
            ? "📭 Каталог пуст. Синхронизация цен может занять несколько минут."
            : "🔍 Ничего не найдено."}
        </div>
      ) : (
        <div className="grid">
          {filteredGames.map((game) => {
            const bestEntry = getBestPriceEntry(game);
            const bestRub = bestEntry
              ? convertToRub(bestEntry.current_price!, bestEntry.currency)
              : null;
            const isExpanded = expandedId === game.id;

            const allPrices = game.price_entries
              .filter((e) => e.current_price !== null && e.current_price !== undefined)
              .map((e) => ({
                ...e,
                rubEquivalent: convertToRub(e.current_price!, e.currency),
              }))
              .sort((a, b) => a.rubEquivalent - b.rubEquivalent);

            return (
              <div key={game.id} className="card">
                <div className="cover-wrapper">
                  {game.cover_url ? (
                    <img src={game.cover_url} alt={game.name} className="cover" />
                  ) : (
                    <div className="cover-placeholder">🎮</div>
                  )}
                  {game.platforms.length > 0 && (
                    <div className="platforms">
                      {game.platforms.map((p) => (
                        <span key={p} className="platform-badge">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h2 className="game-name">{game.name}</h2>

                {bestEntry && bestRub !== null && (
                  <div className="best-price">
                    <span className="best-label">Лучшая цена:</span>
                    <span className="best-value">
                      {formatCurrency(bestEntry.current_price!, bestEntry.currency)}
                    </span>
                    <span className="best-region">
                      {REGION_NAMES[bestEntry.region] || bestEntry.region}
                    </span>
                    <span className="best-rub">≈ {bestRub.toFixed(0)} ₽</span>
                    {bestEntry.store_url && (
                      <a
                        href={bestEntry.store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="best-link"
                      >
                        🛒 PS Store
                      </a>
                    )}
                  </div>
                )}

                {allPrices.length > 1 && (
                  <div className="all-prices">
                    <button
                      className="toggle-btn"
                      onClick={() => setExpandedId(isExpanded ? null : game.id)}
                    >
                      {isExpanded ? "▲" : "▼"} Все цены ({allPrices.length})
                    </button>
                    {isExpanded && (
                      <div className="prices-list">
                        {allPrices.map((entry) => {
                          const isBest = bestEntry && entry.id === bestEntry.id;
                          return (
                            <div
                              key={entry.id}
                              className={`price-row ${isBest ? "price-best" : ""}`}
                            >
                              <span className="price-region">
                                {REGION_NAMES[entry.region] || entry.region}
                              </span>
                              <span className="price-amount">
                                {formatCurrency(entry.current_price!, entry.currency)}
                              </span>
                              <span className="price-rub">
                                ≈ {entry.rubEquivalent.toFixed(0)} ₽
                              </span>
                              {entry.store_url && (
                                <a
                                  href={entry.store_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="price-link"
                                  title="Открыть в PS Store"
                                >
                                  🔗
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!bestEntry && (
                  <div className="no-price">Цена недоступна</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .title {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        .subtitle {
          color: #666;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }
        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .search-input {
          flex: 1;
          min-width: 250px;
          padding: 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: #6c5ce7;
        }
        .sort-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .sort-btn {
          padding: 0.75rem 1.25rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          background: #fff;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .sort-btn:hover {
          border-color: #6c5ce7;
        }
        .sort-btn.active {
          background: #6c5ce7;
          color: #fff;
          border-color: #6c5ce7;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .cover-wrapper {
          position: relative;
        }
        .cover {
          width: 100%;
          height: 170px;
          object-fit: cover;
          display: block;
        }
        .cover-placeholder {
          width: 100%;
          height: 170px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
        }
        .platforms {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
        }
        .platform-badge {
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .game-name {
          padding: 1rem 1rem 0.5rem;
          font-size: 1.05rem;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1.3;
          min-height: 3.2em;
          overflow: hidden;
        }
        .best-price {
          margin: 0.5rem 1rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-radius: 10px;
          border: 2px solid #4caf50;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .best-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #2e7d32;
          text-transform: uppercase;
        }
        .best-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1b5e20;
        }
        .best-region {
          font-size: 0.8rem;
          color: #388e3c;
        }
        .best-rub {
          font-size: 0.85rem;
          font-weight: 600;
          color: #2e7d32;
          margin-left: auto;
        }
        .best-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: #1b5e20;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        .best-link:hover {
          background: #2e7d32;
        }
        .all-prices {
          margin: 0.5rem 1rem 1rem;
        }
        .toggle-btn {
          width: 100%;
          padding: 0.5rem;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6c5ce7;
          transition: background 0.2s;
        }
        .toggle-btn:hover {
          background: #e0e0e0;
        }
        .prices-list {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          background: #f8f9fa;
          font-size: 0.82rem;
        }
        .price-best {
          background: #e8f5e9;
          border: 1px solid #4caf50;
          font-weight: 600;
        }
        .price-region {
          flex: 1;
        }
        .price-amount {
          font-weight: 600;
          margin-right: 0.5rem;
        }
        .price-rub {
          color: #666;
          min-width: 70px;
          text-align: right;
        }
        .price-link {
          text-decoration: none;
          font-size: 1rem;
          margin-left: 6px;
          transition: transform 0.2s;
        }
        .price-link:hover {
          transform: scale(1.2);
        }
        .no-price {
          margin: 0.5rem 1rem 1rem;
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 8px;
          text-align: center;
          color: #999;
          font-size: 0.85rem;
        }
        .loading, .empty {
          text-align: center;
          padding: 4rem 2rem;
          font-size: 1.1rem;
          color: #666;
        }
        @media (max-width: 640px) {
          .page {
            padding: 1rem;
          }
          .title {
            font-size: 1.5rem;
          }
          .grid {
            grid-template-columns: 1fr;
          }
          .controls {
            flex-direction: column;
          }
          .sort-buttons {
            width: 100%;
          }
          .sort-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";

interface PriceEntry {
  id: number;
  region: string;
  currency: string;
  current_price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  store_url: string | null;
}

interface Game {
  id: number;
  name: string;
  cover_url: string | null;
  platforms: string[];
  price_entries: PriceEntry[];
}

const RUB_RATES: Record<string, number> = {
  RUB: 1, USD: 92, EUR: 100, UAH: 2.2, GBP: 118, PLN: 23,
  TRY: 2.5, JPY: 0.6, BRL: 16, AUD: 60,
};

const REGION_NAMES: Record<string, string> = {
  ua: "🇺🇦 Украина", us: "🇺🇸 США", gb: "🇬🇧 Великобритания",
  de: "🇩🇪 Германия", fr: "🇫🇷 Франция", pl: "🇵🇱 Польша",
  tr: "🇹🇷 Турция", jp: "🇯🇵 Япония", br: "🇧🇷 Бразилия", au: "🇦🇺 Австралия",
};

function convertToRub(price: number, currency: string): number {
  return price * (RUB_RATES[currency] || 1);
}

function formatCurrency(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", UAH: "₴", GBP: "£", PLN: "zł",
    TRY: "₺", JPY: "¥", BRL: "R$", AUD: "A$", RUB: "₽",
  };
  return `${price.toFixed(2)} ${symbols[currency] || currency}`;
}

export default function FavoritesPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/auth/login");
      return;
    }
    if (token) {
      fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : [])
        .then((data) => { setGames(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [token, authLoading, router]);

  const removeFavorite = async (gameId: number) => {
    if (!token) return;
    await fetch(`/api/favorites/${gameId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const getBestPrice = (game: Game) => {
    const valid = game.price_entries.filter((e) => e.current_price != null);
    if (!valid.length) return null;
    return valid.reduce((best, e) => {
      const rub = convertToRub(e.current_price!, e.currency);
      return rub < best.rub ? { entry: e, rub } : best;
    }, { entry: valid[0], rub: convertToRub(valid[0].current_price!, valid[0].currency) });
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page">
      <h1 className="title">⭐ Избранное</h1>
      {games.length === 0 ? (
        <div className="empty">
          <p>У вас пока нет избранных игр.</p>
          <a href="/games" className="browse-link">Перейти в каталог →</a>
        </div>
      ) : (
        <div className="grid">
          {games.map((game) => {
            const best = getBestPrice(game);
            const isExpanded = expandedId === game.id;
            return (
              <div key={game.id} className="card">
                {game.cover_url && <img src={game.cover_url} alt={game.name} className="cover" />}
                <h2 className="game-name">{game.name}</h2>
                {best && (
                  <div className="best-price">
                    <span className="best-value">
                      {formatCurrency(best.entry.current_price!, best.entry.currency)}
                    </span>
                    <span className="best-region">
                      {REGION_NAMES[best.entry.region] || best.entry.region}
                    </span>
                    <span className="best-rub">≈ {best.rub.toFixed(0)} ₽</span>
                  </div>
                )}
                <button
                  className="toggle-btn"
                  onClick={() => setExpandedId(isExpanded ? null : game.id)}
                >
                  {isExpanded ? "▲" : "▼"} Все цены
                </button>
                {isExpanded && (
                  <div className="prices-list">
                    {game.price_entries
                      .filter((e) => e.current_price != null)
                      .sort((a, b) => convertToRub(a.current_price!, a.currency) - convertToRub(b.current_price!, b.currency))
                      .map((entry) => (
                        <div key={entry.id} className="price-row">
                          <span className="price-region">{REGION_NAMES[entry.region] || entry.region}</span>
                          <span className="price-amount">{formatCurrency(entry.current_price!, entry.currency)}</span>
                          {entry.store_url && (
                            <a href={entry.store_url} target="_blank" rel="noopener noreferrer" className="price-link">🔗</a>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                <button className="remove-btn" onClick={() => removeFavorite(game.id)}>
                  ❤️‍🔥 Удалить из избранного
                </button>
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .page { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .title { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; color: #1a1a2e; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .cover { width: 100%; height: 170px; object-fit: cover; }
        .game-name { padding: 1rem 1rem 0.5rem; font-size: 1.05rem; font-weight: 700; color: #1a1a2e; }
        .best-price { margin: 0 1rem; padding: 0.75rem; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 10px; border: 2px solid #4caf50; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .best-value { font-size: 1.15rem; font-weight: 800; color: #1b5e20; }
        .best-region { font-size: 0.8rem; color: #388e3c; }
        .best-rub { font-size: 0.85rem; font-weight: 600; color: #2e7d32; margin-left: auto; }
        .toggle-btn { width: 100%; padding: 0.5rem; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #6c5ce7; margin: 0.5rem 0; }
        .prices-list { margin: 0 1rem 1rem; display: flex; flex-direction: column; gap: 4px; }
        .price-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 8px; background: #f8f9fa; font-size: 0.82rem; }
        .price-link { text-decoration: none; font-size: 1rem; margin-left: 6px; }
        .remove-btn { margin: 0 1rem 1rem; width: calc(100% - 2rem); padding: 0.5rem; background: #ffebee; border: 1px solid #ef5350; border-radius: 8px; color: #c62828; font-weight: 600; cursor: pointer; }
        .empty { text-align: center; padding: 4rem; color: #666; font-size: 1.1rem; }
        .browse-link { display: inline-block; margin-top: 1rem; color: #6c5ce7; font-weight: 600; }
        .loading { text-align: center; padding: 4rem; color: #666; }
      `}</style>
    </div>
  );
}

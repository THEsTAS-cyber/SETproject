"use client";

import { useEffect, useState } from "react";

interface Game {
  id: number;
  title: string;
  description: string | null;
  price: number;
  cover_url: string | null;
  genres: string[];
  rating: number | null;
  store_url: string | null;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Game Catalog</h1>
      {games.length === 0 ? (
        <p>No games yet.</p>
      ) : (
        <div className="grid">
          {games.map((g) => (
            <div key={g.id} className="card">
              {g.cover_url && (
                <img src={g.cover_url} alt={g.title} className="cover" />
              )}
              <h2>{g.title}</h2>
              <p className="price">${g.price.toFixed(2)}</p>
              <p className="genres">{g.genres.join(", ")}</p>
              {g.store_url && (
                <a href={g.store_url} target="_blank" rel="noreferrer">
                  PS Store
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .cover {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        .price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #6c5ce7;
        }
        .genres {
          color: #666;
          font-size: 0.875rem;
        }
        a {
          display: inline-block;
          margin-top: 0.5rem;
          color: #6c5ce7;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

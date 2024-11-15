// app/page.js
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();
  const [cars, setCars] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");

  // Fetch all cars on initial load
  useEffect(() => {
    if (session?.accessToken) {
      fetchCars();
    }
  }, [session]);

  const fetchCars = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/cars", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      setCars(res.data);
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError("Failed to load cars");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError("Please enter a keyword to search");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:4000/api/cars/search/${encodeURIComponent(keyword)}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      setCars(res.data);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed");
    }
  };

  return (
    <div className="container mx-auto mt-5">
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSearch} className="flex mb-5">
        <input
          type="text"
          placeholder="Search cars..."
          className="w-full p-2 border rounded-l"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 rounded-r">
          Search
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cars.map((car) => (
          <Link legacyBehavior key={car.id} href={`/cars/${car.id}`}>
            <a className="border rounded p-4 hover:shadow-lg">
              <h2 className="text-xl font-bold">{car.title}</h2>
              <p>{car.description}</p>
              {car.images[0] && (
                <img
                  src={`http://localhost:4000/${car.images[0].url}`}
                  alt={car.title}
                  className="mt-2 w-full h-48 object-cover"
                />
              )}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

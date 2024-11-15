// app/cars/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function CarDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [car, setCar] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (session?.accessToken) {
      fetchCar();
    }
  }, [session]);

  const fetchCar = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/cars/${id}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      setCar(res.data);
    } catch (err) {
      setError('Failed to load car');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:4000/api/cars/${id}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      router.push('/');
    } catch (err) {
      setError('Failed to delete car');
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!car) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto mt-5">
      <h1 className="text-2xl font-bold mb-2">{car.title}</h1>
      <p className="mb-4">{car.description}</p>
      <div className="mb-4">
        <strong>Tags:</strong> {car.tags.map((tag) => tag.name).join(', ')}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {car.images.map((image) => (
          <img
            key={image.id}
            src={`http://localhost:4000/${image.url}`}
            alt={car.title}
            className="w-full h-48 object-cover"
          />
        ))}
      </div>
      <div className="flex space-x-4">
        <Link legacyBehavior href={`/cars/${id}/edit`}>
          <a className="bg-blue-500 text-white px-4 py-2 rounded">Edit</a>
        </Link>
        <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded">
          Delete
        </button>
      </div>
    </div>
  );
}

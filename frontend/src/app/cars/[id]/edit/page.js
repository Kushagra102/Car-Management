// app/cars/[id]/edit/page.js
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function EditCarPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [car, setCar] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);
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
      setTitle(res.data.title);
      setDescription(res.data.description);
      setTags(res.data.tags.map((tag) => tag.name).join(', '));
    } catch (err) {
      setError('Failed to load car');
    }
  };

  const handleFileChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length > 10) {
      setError('You can upload up to 10 images');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      await axios.put(`http://localhost:4000/api/cars/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      router.push(`/cars/${id}`);
    } catch (err) {
      setError('Failed to update car');
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!car) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto max-w-md mt-10">
      <h1 className="text-2xl font-bold mb-5">Edit Car</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          className="w-full p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          className="w-full p-2 border rounded"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          required
        />
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Update Car
        </button>
      </form>
    </div>
  );
}

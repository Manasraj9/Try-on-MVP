'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { storage, db } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [clothingItems, setClothingItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch clothing items
  const fetchClothingItems = async () => {
    try {
      const clothingRef = collection(db, 'clothingItems');
      const querySnapshot = await getDocs(clothingRef);
      
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      
      setClothingItems(items);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClothingItems();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setNewItem(prev => ({ ...prev, image: file }));
      
      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.name || !newItem.category || !newItem.image) {
      alert('Please fill all fields and upload an image');
      return;
    }
    
    setUploadLoading(true);
    
    try {
      // Upload image to Firebase Storage
      const filename = `clothing/${Date.now()}_${newItem.image.name}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, newItem.image);
      const imageUrl = await getDownloadURL(storageRef);
      
      // Add item to Firestore
      await addDoc(collection(db, 'clothingItems'), {
        name: newItem.name,
        category: newItem.category,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString(),
      });
      
      // Reset form
      setNewItem({
        name: '',
        category: '',
        image: null,
      });
      setImagePreview('');
      
      // Refresh clothing items
      fetchClothingItems();
      
      alert('Clothing item added successfully!');
    } catch (error) {
      console.error('Error adding clothing item:', error);
      alert('Failed to add clothing item: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'clothingItems', item.id));
      
      // Delete image from Storage
      if (item.imageUrl) {
        // Extract the path from the URL
        const imageRef = ref(storage, item.imageUrl);
        try {
          await deleteObject(imageRef);
        } catch (storageError) {
          console.error('Error deleting image from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }
      
      // Refresh clothing items
      fetchClothingItems();
      
      alert('Clothing item deleted successfully!');
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      alert('Failed to delete clothing item: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add New Clothing Item */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Clothing Item</h2>
          
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newItem.name}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={newItem.category}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a category</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Jackets">Jackets</option>
                <option value="Shirts">Shirts</option>
                <option value="Dresses">Dresses</option>
                <option value="Pants">Pants</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image
              </label>
              
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                    hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/40"
                />
              </div>
              
              {imagePreview && (
                <div className="mt-2 relative h-48 w-full bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                  <Image 
                    src={imagePreview} 
                    alt="Preview" 
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {uploadLoading ? 'Adding...' : 'Add Clothing Item'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Manage Existing Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Manage Clothing Items</h2>
          
          {clothingItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clothingItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 dark:border-gray-700">
                  <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mb-2">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No clothing items available. Add some items to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { storage, db } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import ClothingSelector from '../../components/ClothingSelector';
import TryOnCanvas from '../../components/TryOnCanvas';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [userImage, setUserImage] = useState(null);
  const [userImageUrl, setUserImageUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [tryOnHistory, setTryOnHistory] = useState([]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch user's profile image if exists
  useEffect(() => {
    if (user) {
      const fetchUserImage = async () => {
        try {
          const imageRef = ref(storage, `users/${user.uid}/profile.jpg`);
          const url = await getDownloadURL(imageRef);
          setUserImageUrl(url);
        } catch (error) {
          // User doesn't have an image yet, that's okay
          console.log('No profile image found');
        }
      };

      fetchUserImage();
    }
  }, [user]);

  // Fetch clothing items from Firestore
  useEffect(() => {
    const fetchClothingItems = async () => {
      try {
        // Fetch real clothing items from Firestore
        const clothingRef = collection(db, 'clothingItems');
        const querySnapshot = await getDocs(clothingRef);
        
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        
        // If no items in Firestore yet, add some initial items
        if (items.length === 0) {
          const initialItems = [
            {
              name: 'Blue T-Shirt',
              category: 'T-Shirts',
              imageUrl: '/clothes/tshirt_blue.svg',
            },
            {
              name: 'Red Hoodie',
              category: 'Hoodies',
              imageUrl: '/clothes/hoodie_red.svg',
            },
            {
              name: 'Black Jacket',
              category: 'Jackets',
              imageUrl: '/clothes/jacket_black.svg',
            },
            {
              name: 'Purple Dress',
              category: 'Dresses',
              imageUrl: '/clothes/dress_purple.svg',
            },
          ];
          
          // Add initial items to Firestore
          for (const item of initialItems) {
            await addDoc(collection(db, 'clothingItems'), {
              ...item,
              createdAt: new Date().toISOString()
            });
          }
          
          // Fetch again after adding initial items
          const newQuerySnapshot = await getDocs(clothingRef);
          newQuerySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
        }
        
        setClothingItems(items);
      } catch (error) {
        console.error('Error fetching clothing items:', error);
      }
    };

    fetchClothingItems();
  }, []);

  // Fetch user's try-on history
  useEffect(() => {
    if (user) {
      const fetchTryOnHistory = async () => {
        try {
          const q = query(
            collection(db, 'tryOnHistory'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const history = [];
          
          querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() });
          });
          
          setTryOnHistory(history);
        } catch (error) {
          console.error('Error fetching try-on history:', error);
        }
      };

      fetchTryOnHistory();
    }
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setUserImage(file);
      
      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);
      setUserImageUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!userImage || !user) return;
    
    setUploadLoading(true);
    
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, userImage);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      setUserImageUrl(downloadURL);
      
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSelectClothing = (item) => {
    setSelectedClothing(item);
  };

  const handleSaveLook = async (combinedImageUrl) => {
    if (!user || !selectedClothing) return;
    
    try {
      // Save the combined image to Firebase Storage
      const imageData = await fetch(combinedImageUrl);
      const blob = await imageData.blob();
      
      const filename = `tryons/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save record to Firestore
      const historyRef = collection(db, 'tryOnHistory');
      await addDoc(historyRef, {
        userId: user.uid,
        clothingId: selectedClothing.id,
        clothingName: selectedClothing.name,
        imageUrl: downloadURL,
        createdAt: new Date().toISOString(),
      });
      
      // Refresh history
      const q = query(
        collection(db, 'tryOnHistory'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      
      setTryOnHistory(history);
      
      alert('Look saved successfully!');
    } catch (error) {
      console.error('Error saving look:', error);
      alert('Failed to save look: ' + error.message);
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
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Virtual Try-On Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Image Upload */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Photo</h2>
            
            <div className="mb-4">
              <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                {userImageUrl ? (
                  <Image 
                    src={userImageUrl} 
                    alt="Your photo" 
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    No photo uploaded
                  </div>
                )}
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                  hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/40"
              />
              
              <button
                onClick={handleUpload}
                disabled={!userImage || uploadLoading}
                className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {uploadLoading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Your Try-On History</h3>
              
              {tryOnHistory.length > 0 ? (
                <div className="space-y-4">
                  {tryOnHistory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 dark:border-gray-700">
                      <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                        <Image 
                          src={item.imageUrl} 
                          alt={item.clothingName} 
                          fill
                          style={{ objectFit: 'contain' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <p className="text-sm font-medium">{item.clothingName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  You haven't tried on any clothes yet.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Middle Column - Try-On Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Try-On Preview</h2>
            
            <TryOnCanvas 
              userImage={userImageUrl} 
              selectedClothing={selectedClothing}
              onSave={handleSaveLook}
            />
            
            {!userImageUrl && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md">
                <p>Please upload your photo first to use the try-on feature.</p>
              </div>
            )}
            
            {userImageUrl && !selectedClothing && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md">
                <p>Select a clothing item from the right to try it on.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Clothing Items */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Available Clothing</h2>
            
            <ClothingSelector 
              clothingItems={clothingItems} 
              onSelect={handleSelectClothing} 
              selectedClothing={selectedClothing}
            />
            
            {clothingItems.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No clothing items available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
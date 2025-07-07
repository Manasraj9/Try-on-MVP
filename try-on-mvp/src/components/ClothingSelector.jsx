'use client';

import { useState } from 'react';
import Image from 'next/image';

const ClothingSelector = ({ clothingItems, onSelect, selectedClothing }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Get unique categories from clothing items
  const categories = ['All', ...new Set(clothingItems.map(item => item.category))];
  
  // Filter items by active category
  const filteredItems = activeCategory === 'All' 
    ? clothingItems 
    : clothingItems.filter(item => item.category === activeCategory);

  return (
    <div className="w-full">
      {/* Category tabs */}
      <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${activeCategory === category 
              ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Clothing items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedClothing?.id === item.id 
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500' 
              : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700 dark:hover:border-indigo-700'}`}
            onClick={() => onSelect(item)}
          >
            <div className="relative h-48 w-full mb-2 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
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
              className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
            >
              Try Now
            </button>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No clothing items found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default ClothingSelector;
'use client';

import Image from 'next/image';

const ClothingItem = ({ item, onSelect, isSelected }) => {
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'}`}
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
  );
};

export default ClothingItem;
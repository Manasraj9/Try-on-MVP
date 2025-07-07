'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

const TryOnPreview = ({ userImage, selectedClothing, onSave }) => {
  const [combinedImage, setCombinedImage] = useState(null);
  const [adjustments, setAdjustments] = useState({
    scale: 0.8,
    offsetY: 0.25,
    offsetX: 0,
  });
  const canvasRef = useRef(null);

  // Function to combine images with current adjustments
  const combineImages = () => {
    if (!userImage || !selectedClothing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const userImg = new Image();
    const clothingImg = new Image();

    userImg.onload = () => {
      // Set canvas dimensions to match user image
      canvas.width = userImg.width;
      canvas.height = userImg.height;
      
      // Draw user image first
      ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height);
      
      // Load clothing image
      clothingImg.src = selectedClothing.imageUrl;
    };

    clothingImg.onload = () => {
      // Clear canvas and redraw user image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height);
      
      // Calculate positioning based on adjustments
      const clothingWidth = canvas.width * adjustments.scale;
      const clothingHeight = (clothingImg.height / clothingImg.width) * clothingWidth;
      
      // Center horizontally with offset
      const x = (canvas.width - clothingWidth) / 2 + (adjustments.offsetX * canvas.width);
      // Position vertically based on offsetY
      const y = canvas.height * adjustments.offsetY;
      
      // Draw clothing on top
      ctx.drawImage(clothingImg, x, y, clothingWidth, clothingHeight);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setCombinedImage(dataUrl);
    };

    userImg.src = userImage;
  };

  // Combine images when component mounts or when userImage/selectedClothing changes
  useEffect(() => {
    combineImages();
  }, [userImage, selectedClothing]);
  
  // Recombine images when adjustments change
  useEffect(() => {
    if (userImage && selectedClothing) {
      combineImages();
    }
  }, [adjustments]);

  const handleSave = () => {
    if (combinedImage && onSave) {
      onSave(combinedImage);
    }
  };

  const handleAdjustment = (type, value) => {
    setAdjustments(prev => ({
      ...prev,
      [type]: parseFloat(value)
    }));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {combinedImage ? (
          <Image 
            src={combinedImage} 
            alt="Try-on preview" 
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : userImage ? (
          <Image 
            src={userImage} 
            alt="User image" 
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            Upload your photo to start
          </div>
        )}
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {userImage && selectedClothing && (
        <div className="mt-4 w-full max-w-md">
          <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Adjust Fit</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Size</label>
              <input 
                type="range" 
                min="0.5" 
                max="1.2" 
                step="0.05"
                value={adjustments.scale}
                onChange={(e) => handleAdjustment('scale', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Vertical Position</label>
              <input 
                type="range" 
                min="0.1" 
                max="0.5" 
                step="0.01"
                value={adjustments.offsetY}
                onChange={(e) => handleAdjustment('offsetY', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Horizontal Position</label>
              <input 
                type="range" 
                min="-0.2" 
                max="0.2" 
                step="0.01"
                value={adjustments.offsetX}
                onChange={(e) => handleAdjustment('offsetX', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      )}
      
      {combinedImage && (
        <button
          onClick={handleSave}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Save This Look
        </button>
      )}
    </div>
  );
};

export default TryOnPreview;
'use client';

import { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import Image from 'next/image';

const TryOnCanvas = ({ userImage, selectedClothing, onSave }) => {
  const [segmentedImage, setSegmentedImage] = useState(null);
  const [combinedImage, setCombinedImage] = useState(null);
  const [bodyPixModel, setBodyPixModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustments, setAdjustments] = useState({
    scale: 0.8,
    offsetY: 0.25,
    offsetX: 0,
  });
  
  const canvasRef = useRef(null);
  const segmentationCanvasRef = useRef(null);
  const combinedCanvasRef = useRef(null);

  // Load BodyPix model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Load the model with lower resolution for better performance
        const net = await bodyPix.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2
        });
        setBodyPixModel(net);
        console.log('BodyPix model loaded successfully');
      } catch (error) {
        console.error('Failed to load BodyPix model:', error);
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      // Dispose of any tensors when component unmounts
      if (tf.getBackend()) {
        tf.disposeVariables();
      }
    };
  }, []);

  // Process the user image when it changes or when model is loaded
  useEffect(() => {
    if (!userImage || !bodyPixModel) return;
    
    const processImage = async () => {
      setIsProcessing(true);
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = userImage;
        
        img.onload = async () => {
          // Set up segmentation canvas
          const segCanvas = segmentationCanvasRef.current;
          segCanvas.width = img.width;
          segCanvas.height = img.height;
          const segCtx = segCanvas.getContext('2d');
          
          // Draw the original image
          segCtx.drawImage(img, 0, 0);
          
          // Perform segmentation
          const segmentation = await bodyPixModel.segmentPerson(segCanvas, {
            flipHorizontal: false,
            internalResolution: 'medium',
            segmentationThreshold: 0.7,
          });
          
          // Extract person from background
          const mask = bodyPix.toMask(segmentation, { r: 0, g: 0, b: 0, a: 0 }, { r: 255, g: 255, b: 255, a: 255 });
          
          // Apply the mask to the original image
          const imageData = segCtx.getImageData(0, 0, segCanvas.width, segCanvas.height);
          const maskData = new ImageData(mask, segCanvas.width, segCanvas.height);
          
          // Create a new canvas for the segmented image
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = segCanvas.width;
          tempCanvas.height = segCanvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          
          // Draw the original image
          tempCtx.putImageData(imageData, 0, 0);
          
          // Apply the mask using 'destination-in' compositing
          tempCtx.globalCompositeOperation = 'destination-in';
          tempCtx.putImageData(maskData, 0, 0);
          
          // Convert to data URL
          const segmentedDataUrl = tempCanvas.toDataURL('image/png');
          setSegmentedImage(segmentedDataUrl);
          
          // If there's a selected clothing, combine the images
          if (selectedClothing) {
            combineImages(segmentedDataUrl);
          }
          
          setIsProcessing(false);
        };
      } catch (error) {
        console.error('Error processing image:', error);
        setIsProcessing(false);
      }
    };
    
    processImage();
  }, [userImage, bodyPixModel]);

  // Combine segmented user image with clothing when selected clothing changes
  useEffect(() => {
    if (segmentedImage && selectedClothing) {
      combineImages(segmentedImage);
    }
  }, [selectedClothing, segmentedImage]);
  
  // Recombine images when adjustments change
  useEffect(() => {
    if (segmentedImage && selectedClothing) {
      combineImages(segmentedImage);
    }
  }, [adjustments]);

  // Function to combine segmented user image with clothing
  const combineImages = (segmentedImageUrl) => {
    if (!segmentedImageUrl || !selectedClothing) return;

    const canvas = combinedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const userImg = new Image();
    const clothingImg = new Image();

    userImg.onload = () => {
      // Set canvas dimensions to match user image
      canvas.width = userImg.width;
      canvas.height = userImg.height;
      
      // Draw segmented user image first
      ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height);
      
      // Load clothing image
      clothingImg.src = selectedClothing.imageUrl;
    };

    clothingImg.onload = () => {
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

    userImg.src = segmentedImageUrl;
  };

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
      {/* Main display area */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-indigo-500">Processing image...</p>
          </div>
        ) : combinedImage ? (
          <Image 
            src={combinedImage} 
            alt="Try-on preview" 
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : segmentedImage ? (
          <Image 
            src={segmentedImage} 
            alt="Segmented image" 
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
      
      {/* Hidden canvases for image processing */}
      <canvas ref={segmentationCanvasRef} style={{ display: 'none' }} />
      <canvas ref={combinedCanvasRef} style={{ display: 'none' }} />
      
      {/* Adjustment controls */}
      {userImage && selectedClothing && !isProcessing && (
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
      
      {/* Save button */}
      {combinedImage && !isProcessing && (
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

export default TryOnCanvas;
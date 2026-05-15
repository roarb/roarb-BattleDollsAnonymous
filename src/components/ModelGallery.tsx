import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ImageIcon, Upload, Trash2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const STATUS_ORDER = ['Assembled', 'Primed', 'Basic Paint', 'Completed'];

interface ModelGalleryProps {
  model: {
    id: string;
    modelName: string;
    status: string;
    images?: Record<string, string>;
  };
  isOpen: boolean;
  onClose: () => void;
  onImagesUpdated: () => void;
}

export function ModelGallery({ model, isOpen, onClose, onImagesUpdated }: ModelGalleryProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [leftStatus, setLeftStatus] = useState('Assembled');
  const [rightStatus, setRightStatus] = useState('Painted');
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [localImages, setLocalImages] = useState<Record<string, string>>(model.images || {});

  useEffect(() => {
    setLocalImages(model.images || {});
  }, [model.images]);

  // Auto-pick best comparison pair from available images
  useEffect(() => {
    const available = STATUS_ORDER.filter(s => localImages[s]);
    if (available.length >= 2) {
      setLeftStatus(available[0]);
      setRightStatus(available[available.length - 1]);
    } else if (available.length === 1) {
      setLeftStatus(available[0]);
    }
  }, [localImages]);

  const handleUpload = async (status: string, file: File) => {
    if (!user) return;
    setUploading(status);
    try {
      // Compress image client-side
      const compressed = await compressImage(file, 1200, 0.85);
      const storageRef = ref(storage, `users/${user.uid}/collection/${model.id}/${status}.jpg`);
      await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);

      const newImages = { ...localImages, [status]: url };
      setLocalImages(newImages);

      await updateDoc(doc(db, 'collection', model.id), {
        [`images.${status}`]: url
      });
      onImagesUpdated();
    } catch (error) {
      console.error('Upload error:', error);
      handleFirestoreError(error, OperationType.UPDATE, 'collection');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (status: string) => {
    if (!user) return;
    try {
      const storageRef = ref(storage, `users/${user.uid}/collection/${model.id}/${status}.jpg`);
      await deleteObject(storageRef).catch(() => {}); // ignore if file missing

      const newImages = { ...localImages };
      delete newImages[status];
      setLocalImages(newImages);

      await updateDoc(doc(db, 'collection', model.id), {
        [`images.${status}`]: null
      });
      onImagesUpdated();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(2, Math.min(98, pos)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  const leftImage = localImages[leftStatus];
  const rightImage = localImages[rightStatus];
  const hasComparison = leftImage && rightImage;
  const availableStatuses = STATUS_ORDER.filter(s => localImages[s]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">{model.modelName}</h2>
            <p className="text-sm text-zinc-400 mt-1">Progress photos — upload images for each hobby stage</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Grid */}
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Upload by Stage</h3>
          <div className="grid grid-cols-5 gap-3">
            {STATUS_ORDER.map(status => (
              <div key={status} className="flex flex-col items-center">
                <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500/50 transition-colors overflow-hidden group">
                  {localImages[status] ? (
                    <>
                      <img src={localImages[status]} alt={status} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <label className="cursor-pointer p-2 bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors">
                          <Upload className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleUpload(status, e.target.files[0])}
                          />
                        </label>
                        <button
                          onClick={() => handleDelete(status)}
                          className="p-2 bg-red-600/80 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-zinc-600 hover:text-blue-400 transition-colors">
                      {uploading === status ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading === status}
                        onChange={e => e.target.files?.[0] && handleUpload(status, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium uppercase tracking-wider ${
                  localImages[status] ? 'text-blue-400' : 'text-zinc-600'
                }`}>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Slider */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Compare Progress</h3>
            {availableStatuses.length >= 2 && (
              <div className="flex items-center space-x-2 text-xs">
                <select
                  value={leftStatus}
                  onChange={e => setLeftStatus(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
                <select
                  value={rightStatus}
                  onChange={e => setRightStatus(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {hasComparison ? (
            <div
              ref={sliderRef}
              className="relative w-full aspect-video rounded-xl overflow-hidden cursor-col-resize select-none border border-zinc-800"
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              {/* Right image (full, underneath) */}
              <img src={rightImage} alt={rightStatus} className="absolute inset-0 w-full h-full object-cover" />

              {/* Left image (clipped) */}
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                <img src={leftImage} alt={leftStatus} className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: sliderRef.current ? `${sliderRef.current.offsetWidth}px` : '100%' }} />
              </div>

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-col-resize z-10"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="flex items-center space-x-0.5">
                    <ChevronLeft className="w-3 h-3 text-zinc-800" />
                    <ChevronRight className="w-3 h-3 text-zinc-800" />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded-md text-xs text-white font-medium backdrop-blur-sm z-20">
                {leftStatus}
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded-md text-xs text-white font-medium backdrop-blur-sm z-20">
                {rightStatus}
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600">
              <ImageIcon className="w-10 h-10 mb-2" />
              <p className="text-sm">Upload at least 2 stage photos to enable comparison</p>
              <p className="text-xs text-zinc-700 mt-1">{availableStatuses.length} of 2 minimum uploaded</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || new Blob()),
        'image/jpeg',
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

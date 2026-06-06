import React, { useState, useRef } from "react";

interface CanvasDragCropState {
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  pan: { x: number; y: number };
  setPan: (p: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  isDragging: boolean;
  setIsDragging: (d: boolean) => void;
  dragStart: { x: number; y: number };
  setDragStart: (s: { x: number; y: number }) => void;
  cropModeActive: boolean;
  setCropModeActive: (a: boolean) => void;
  cropSelection: { x: number; y: number; w: number; h: number } | null;
  setCropSelection: (s: { x: number; y: number; w: number; h: number } | null) => void;
  selectedImage: string | null;
}

export function useCanvasDragCrop(
  state: CanvasDragCropState,
  runArenaCompare: (imageSource: string, filename: string, customUpload?: boolean) => Promise<void>
) {
  const {
    zoom,
    setZoom,
    pan,
    setPan,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    cropModeActive,
    setCropModeActive,
    cropSelection,
    setCropSelection,
    selectedImage
  } = state;

  const [isDrawingCrop, setIsDrawingCrop] = useState<boolean>(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cropModeActive && imageWrapperRef.current) {
      const rect = imageWrapperRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      setIsDrawingCrop(true);
      setCropStart({ x, y });
      setCropSelection({ x, y, w: 0, h: 0 });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cropModeActive) {
      if (!isDrawingCrop || !cropStart || !imageWrapperRef.current) return;
      const rect = imageWrapperRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / zoom;
      const currentY = (e.clientY - rect.top) / zoom;
      const maxW = rect.width / zoom;
      const maxH = rect.height / zoom;
      const x = Math.max(0, Math.min(maxW, currentX));
      const y = Math.max(0, Math.min(maxH, currentY));
      const left = Math.min(cropStart.x, x);
      const top = Math.min(cropStart.y, y);
      const width = Math.abs(cropStart.x - x);
      const height = Math.abs(cropStart.y - y);
      setCropSelection({ x: left, y: top, w: width, h: height });
    } else {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    if (cropModeActive) {
      setIsDrawingCrop(false);
    } else {
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    let nextZoom = zoom + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    nextZoom = Math.max(0.5, Math.min(nextZoom, 4));
    setZoom(nextZoom);
  };

  const handleCropAndAnalyze = () => {
    if (!cropSelection || !selectedImage || !imageWrapperRef.current) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const wrapperRect = imageWrapperRef.current!.getBoundingClientRect();
      const renderedW = wrapperRect.width / zoom;
      const renderedH = wrapperRect.height / zoom;
      
      const scaleX = img.naturalWidth / renderedW;
      const scaleY = img.naturalHeight / renderedH;

      const cropX = cropSelection.x * scaleX;
      const cropY = cropSelection.y * scaleY;
      const cropW = cropSelection.w * scaleX;
      const cropH = cropSelection.h * scaleY;

      canvas.width = cropW;
      canvas.height = cropH;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        try {
          const croppedBase64 = canvas.toDataURL("image/jpeg");
          runArenaCompare(croppedBase64, `crop_${Date.now()}.jpg`, true);
          setCropModeActive(false);
          setCropSelection(null);
        } catch (err) {
          console.error("Failed to crop image:", err);
        }
      }
    };
    img.src = selectedImage;
  };

  return {
    imageWrapperRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleCropAndAnalyze
  };
}

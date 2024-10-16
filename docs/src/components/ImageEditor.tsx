"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload } from 'lucide-react';

const backgrounds = [
  { name: "Deca", url: "https://assets.suggestfeature.com/assets/deca.jpg" },
  { name: "Duo", url: "https://assets.suggestfeature.com/assets/duo.jpg" },
  { name: "Hecta", url: "https://assets.suggestfeature.com/assets/hecta.jpg" },
  { name: "Nihil", url: "https://assets.suggestfeature.com/assets/nihil.jpg" },
  { name: "Nona", url: "https://assets.suggestfeature.com/assets/nona.jpg" },
  { name: "Octa", url: "https://assets.suggestfeature.com/assets/octa.jpg" },
  { name: "Penta", url: "https://assets.suggestfeature.com/assets/penta.jpg" },
  { name: "Quattuor", url: "https://assets.suggestfeature.com/assets/quattuor.jpg" },
  { name: "Septa", url: "https://assets.suggestfeature.com/assets/septa.jpg" },
  { name: "Tres", url: "https://assets.suggestfeature.com/assets/tres.jpg" },
  { name: "Uno", url: "https://assets.suggestfeature.com/assets/uno.jpg" },
];

const ImageEditor = () => {
  const [mainImage, setMainImage] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [scale, setScale] = useState(85);
  const [borderRadius, setBorderRadius] = useState(3);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 3840, height: 2160 });
  const [activeTab, setActiveTab] = useState("preset");

  useEffect(() => {
    const defaultBg = backgrounds.find(bg => bg.name === "Uno");
    if (defaultBg) {
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = defaultBg.url;
    }
  }, []);

  const loadImage = (file, setImageFunc) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageFunc(img);
        if (!mainImage) {
          const aspectRatio = img.width / img.height;
          const newHeight = Math.round(canvasSize.width / aspectRatio);
          setCanvasSize(prev => ({ ...prev, height: newHeight }));
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e, isBackground = false) => {
    const file = e.target.files[0];
    loadImage(file, isBackground ? setBgImage : setMainImage);
  };

  const handleBackgroundChange = (e) => {
    setBgColor(e.target.value);
    setBgImage(null);
  };

  const handleScaleChange = (value) => {
    setScale(value[0]);
  };

  const handleBorderRadiusChange = (value) => {
    setBorderRadius(value[0]);
  };

  const handleBackgroundSelect = (url) => {
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = url;
  };

  useEffect(() => {
    if (!mainImage) return; // Exit if there's no main image

    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if canvas is not available

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Exit if context is not available

    const render = () => {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (bgImage) {
        const bgAspectRatio = bgImage.width / bgImage.height;
        const canvasAspectRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, drawX, drawY;

        if (bgAspectRatio > canvasAspectRatio) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * bgAspectRatio;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / bgAspectRatio;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (mainImage) {
        const scaleFactor = scale / 100;
        const { width, height } = fitImageOnCanvas(mainImage, canvas, scaleFactor);
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;

        ctx.save();
        roundedImage(ctx, x, y, width, height, (borderRadius / 100) * Math.min(width, height) / 2);
        ctx.clip();
        ctx.drawImage(mainImage, x, y, width, height);
        ctx.restore();
      }
    };

    render();
  }, [mainImage, bgImage, bgColor, scale, borderRadius, canvasSize]);

  const fitImageOnCanvas = (img, canvas, scaleFactor = 1) => {
    const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    return {
      width: img.width * ratio * scaleFactor,
      height: img.height * ratio * scaleFactor
    };
  };

  const roundedImage = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex h-screen">
      <div className="w-3/4 p-4 bg-gray-100 flex items-center justify-center">
        {mainImage ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain border border-gray-300 rounded-lg"
          />
        ) : (
          <label htmlFor="mainImageUpload" className="cursor-pointer">
            {/* Screenshot Beautifier */}
            <div className=' flex w-full items-center justify-center mb-2'>
              <img src="/logo-light.jpeg" className="mr-3 h-6 md:h-9" alt="Suggest Feature Logo" />
              <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Screenshot Beautifier</span>
            </div>
            <div className="w-full h-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-lg p-12">
              <Upload size={48} className="text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700">Click to Upload Screenshot</span>
              {/* <span className="text-sm text-gray-500 mt-2">or drag and drop</span> */}
            </div>
          </label>
        )}
        <input
          id="mainImageUpload"
          type="file"
          onChange={(e) => handleImageUpload(e)}
          accept="image/*"
          className="hidden"
        />
      </div>
      <div className="w-1/4 p-4 bg-white overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Background Selection</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <Popover>
              <PopoverTrigger asChild>
                <TabsTrigger value="color">Color</TabsTrigger>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <Input
                  type="color"
                  value={bgColor}
                  onChange={handleBackgroundChange}
                  className="w-full h-10"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <TabsTrigger value="image">Image</TabsTrigger>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <input
                  type="file"
                  onChange={(e) => handleImageUpload(e, true)}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <TabsTrigger value="preset">Preset</TabsTrigger>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <div className="grid grid-cols-3 gap-2 p-2">
                  {backgrounds.map((bg) => (
                    <div
                      key={bg.name}
                      className="w-full aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleBackgroundSelect(bg.url)}
                    >
                      <img
                        src={bg.url}
                        alt={bg.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </TabsList>
        </Tabs>

        <h2 className="text-lg font-semibold mb-2">Image Properties</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Image Size</label>
          <Slider
            value={[scale]}
            onValueChange={handleScaleChange}
            max={200}
            step={1}
            className="w-full"
          />
          <span className="text-sm text-gray-500">{scale}%</span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
          <Slider
            value={[borderRadius]}
            onValueChange={handleBorderRadiusChange}
            max={100}
            step={1}
            className="w-full"
          />
          <span className="text-sm text-gray-500">{borderRadius}%</span>
        </div>

        <Button onClick={handleDownload} className="w-full">
          Download Image
        </Button>
      </div>
    </div>
  );
};

export default ImageEditor;

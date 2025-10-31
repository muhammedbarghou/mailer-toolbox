'use client'
import { useRef, useState, useEffect, MouseEvent, ChangeEvent } from "react";
import { Upload, Copy, Trash2, Download, Eye, EyeOff, Undo, Grid, ZoomIn, ZoomOut, Map } from "lucide-react";
import { toast } from "sonner";

interface Area {
  id: number;
  shape: "rect";
  coords: number[];
  href: string;
  title: string;
  target: string;
  color?: string;
}

export default function ImageMapEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<number[] | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const colors = [
    "rgba(59, 130, 246, 0.3)", // blue
    "rgba(239, 68, 68, 0.3)", // red
    "rgba(34, 197, 94, 0.3)", // green
    "rgba(251, 146, 60, 0.3)", // orange
    "rgba(168, 85, 247, 0.3)", // purple
    "rgba(236, 72, 153, 0.3)", // pink
  ];


  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setAreas([]);
      setZoom(1);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect([x, y, x, y]);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setCurrentRect([startPoint.x, startPoint.y, x, y]);
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / zoom;
    const endY = (e.clientY - rect.top) / zoom;
    setDrawing(false);

    // Only create area if it has meaningful size
    if (Math.abs(endX - startPoint.x) > 5 && Math.abs(endY - startPoint.y) > 5) {
      const newArea: Area = {
        id: Date.now(),
        shape: "rect",
        coords: [
          Math.min(startPoint.x, endX),
          Math.min(startPoint.y, endY),
          Math.max(startPoint.x, endX),
          Math.max(startPoint.y, endY)
        ],
        href: "",
        title: "",
        target: "_self",
        color: colors[areas.length % colors.length],
      };
      setAreas([...areas, newArea]);
      setSelectedArea(newArea.id);
    }
    setCurrentRect(null);
  };

  // Draw rectangles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageRef.current) return;

    canvas.width = imageRef.current.width * zoom;
    canvas.height = imageRef.current.height * zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      ctx.lineWidth = 1;
      const gridSize = 50 * zoom;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    if (!showOverlay) return;

    // Draw existing areas
    areas.forEach((area) => {
      const [x1, y1, x2, y2] = area.coords.map(c => c * zoom);
      const isSelected = selectedArea === area.id;
      
      ctx.fillStyle = area.color || "rgba(59, 130, 246, 0.3)";
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      
      ctx.strokeStyle = isSelected ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 0.7)";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Draw label
      if (area.title || area.href) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x1, y1 - 20 * zoom, (area.title || area.href).length * 6 * zoom + 10, 18 * zoom);
        ctx.fillStyle = "white";
        ctx.font = `${12 * zoom}px sans-serif`;
        ctx.fillText(area.title || area.href, x1 + 5, y1 - 6 * zoom);
      }
    });

    // Draw current rectangle being drawn
    if (drawing && currentRect) {
      const [x1, y1, x2, y2] = currentRect.map(c => c * zoom);
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);
    }
  }, [areas, drawing, currentRect, showOverlay, showGrid, selectedArea, zoom]);

  const deleteArea = (id: number) => {
    setAreas(areas.filter(a => a.id !== id));
    if (selectedArea === id) setSelectedArea(null);
    toast.message("Area deleted");
  };

  const clearAll = () => {
    if (confirm("Clear all areas?")) {
      setAreas([]);
      setSelectedArea(null);
      toast.message("All areas cleared");
    }
  };

  const exportHTML = () => {
    if (!imageSrc || areas.length === 0) {
      toast.error("No areas to export");
      return;
    }
    const mapName = "image-map";
    const html = `
<img src="your-image.jpg" usemap="#${mapName}" alt="Interactive Image Map">

<map name="${mapName}">
${areas
  .map(
    (a) =>
      `  <area target="${a.target}" alt="${a.title}" title="${a.title}" href="${a.href}" coords="${a.coords
        .map((n) => Math.round(n))
        .join(",")}" shape="${a.shape}">`
  )
  .join("\n")}
</map>`;
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard!");
  };

  const downloadHTML = () => {
    if (!imageSrc || areas.length === 0) {
      toast.success("No areas to download");
      return;
    }
    const mapName = "image-map";
    const html = `
  <img src="your-image.jpg" usemap="#${mapName}" alt="Interactive Image Map">
  
  <map name="${mapName}">
${areas
  .map(
    (a) =>
      `    <area target="${a.target}" alt="${a.title}" title="${a.title}" href="${a.href}" coords="${a.coords
        .map((n) => Math.round(n))
        .join(",")}" shape="${a.shape}">`
  )
  .join("\n")}
  </map>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-map.html";
    a.click();
    toast("HTML file downloaded!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Map className="text-white" size={36} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Image Map Editor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create interactive HTML image maps by drawing clickable areas on your images
            </p>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-100/50 transition-all hover:border-indigo-400">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-indigo-600" />
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {imageSrc && (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    showOverlay
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {showOverlay ? <Eye size={18} /> : <EyeOff size={18} />}
                  {showOverlay ? "Hide" : "Show"} Areas
                </button>
                
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    showGrid
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <Grid size={18} />
                  Grid
                </button>

                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-semibold transition-all"
                  disabled={zoom >= 2}
                >
                  <ZoomIn size={18} />
                  Zoom In
                </button>

                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-semibold transition-all"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut size={18} />
                  Zoom Out
                </button>

                <span className="flex items-center px-4 py-2 bg-white rounded-lg border border-gray-300 font-semibold text-gray-700">
                  {Math.round(zoom * 100)}%
                </span>

                {areas.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold transition-all ml-auto"
                  >
                    <Trash2 size={18} />
                    Clear All
                  </button>
                )}
              </div>

              {/* Canvas Container */}
              <div 
                ref={containerRef}
                className="mb-8 overflow-auto border-2 border-gray-300 rounded-xl bg-gray-100 max-h-[600px]"
              >
                <div className="relative inline-block">
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Map"
                    className="block"
                    style={{ width: `${zoom * 100}%` }}
                    onLoad={() => {
                      const img = imageRef.current;
                      const canvas = canvasRef.current;
                      if (img && canvas) {
                        canvas.width = img.naturalWidth * zoom;
                        canvas.height = img.naturalHeight * zoom;
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                      if (drawing) {
                        setDrawing(false);
                        setCurrentRect(null);
                      }
                    }}
                    className="absolute top-0 left-0 cursor-crosshair"
                  />
                </div>
              </div>

              {/* Areas List */}
              {areas.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Clickable Areas ({areas.length})
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {areas.map((area, i) => (
                      <div
                        key={area.id}
                        onClick={() => setSelectedArea(area.id)}
                        className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                          selectedArea === area.id
                            ? "border-indigo-500 bg-indigo-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-6 h-6 rounded-lg flex-shrink-0 mt-1"
                            style={{ backgroundColor: area.color }}
                          />
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Link URL
                              </label>
                              <input
                                type="text"
                                placeholder="https://example.com"
                                value={area.href}
                                onChange={(e) => {
                                  const copy = [...areas];
                                  copy[i].href = e.target.value;
                                  setAreas(copy);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Title/Alt Text
                              </label>
                              <input
                                type="text"
                                placeholder="Area description"
                                value={area.title}
                                onChange={(e) => {
                                  const copy = [...areas];
                                  copy[i].title = e.target.value;
                                  setAreas(copy);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Target
                              </label>
                              <select
                                value={area.target}
                                onChange={(e) => {
                                  const copy = [...areas];
                                  copy[i].target = e.target.value;
                                  setAreas(copy);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="_self">Same Window</option>
                                <option value="_blank">New Window</option>
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArea(area.id);
                            }}
                            className="flex-shrink-0 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                            aria-label="Delete area"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="mt-2 text-xs font-mono text-gray-500 ml-9">
                          Coords: {area.coords.map((n) => Math.round(n)).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Section */}
              {areas.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={exportHTML}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Copy size={20} />
                    Copy HTML Code
                  </button>
                  
                  <button
                    onClick={downloadHTML}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Download size={20} />
                    Download HTML File
                  </button>
                </div>
              )}
            </>
          )}

          {/* Instructions */}
          {!imageSrc && (
            <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
              <h3 className="text-lg font-bold text-indigo-900 mb-3">How to use:</h3>
              <ol className="space-y-2 text-gray-700">
                <li>1. Upload an image using the area above</li>
                <li>2. Click and drag on the image to create clickable areas</li>
                <li>3. Fill in the link URL and title for each area</li>
                <li>4. Export your HTML code or download as a file</li>
              </ol>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}




'use client'
import { useRef, useState, useEffect, MouseEvent, ChangeEvent, useCallback } from "react";
import { Upload, Copy, Trash2, Download, Eye, EyeOff, Grid, ZoomIn, ZoomOut, Map, Square, Circle, Hexagon, Move, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ShapeType = "rect" | "circle" | "poly";

interface Area {
  id: number;
  shape: ShapeType;
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
  const [currentShape, setCurrentShape] = useState<number[] | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<ShapeType>("rect");
  const [mode, setMode] = useState<"draw" | "select">("draw");
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [editingArea, setEditingArea] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  
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
      setImageDimensions(null);
    }
  };

  const getCanvasCoordinates = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  }, [zoom]);

  const isPointInArea = useCallback((x: number, y: number, area: Area): boolean => {
    if (area.shape === "rect") {
      const [x1, y1, x2, y2] = area.coords;
      return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    } else if (area.shape === "circle") {
      const [cx, cy, r] = area.coords;
      const dx = x - cx;
      const dy = y - cy;
      return dx * dx + dy * dy <= r * r;
    } else if (area.shape === "poly") {
      // Ray casting algorithm for polygon
      let inside = false;
      for (let i = 0, j = area.coords.length - 2; i < area.coords.length; j = i, i += 2) {
        const xi = area.coords[i];
        const yi = area.coords[i + 1];
        const xj = area.coords[j];
        const yj = area.coords[j + 1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    return false;
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    
    const { x, y } = getCanvasCoordinates(e);

    if (mode === "select") {
      // Check if clicking on an existing area
      let clickedArea: Area | null = null;
      for (let i = areas.length - 1; i >= 0; i--) {
        if (isPointInArea(x, y, areas[i])) {
          clickedArea = areas[i];
          setSelectedArea(areas[i].id);
          setEditingArea(areas[i].id);
          // Calculate offset for dragging
          if (clickedArea.shape === "rect") {
            const [x1, y1] = clickedArea.coords;
            setDragOffset({ x: x - x1, y: y - y1 });
          } else if (clickedArea.shape === "circle") {
            const [cx, cy] = clickedArea.coords;
            setDragOffset({ x: x - cx, y: y - cy });
          }
          setDrawing(true);
          return;
        }
      }
      if (!clickedArea) {
        setSelectedArea(null);
        setEditingArea(null);
      }
      return;
    }

    // Drawing mode
    if (tool === "poly") {
      if (!isDrawingPolygon) {
        setIsDrawingPolygon(true);
        setPolygonPoints([{ x, y }]);
      } else {
        // Add point to polygon
        setPolygonPoints([...polygonPoints, { x, y }]);
      }
    } else {
      setDrawing(true);
      setStartPoint({ x, y });
      if (tool === "rect") {
        setCurrentShape([x, y, x, y]);
      } else if (tool === "circle") {
        setCurrentShape([x, y, 0]);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    const { x, y } = getCanvasCoordinates(e);

    if (mode === "select" && drawing && editingArea !== null && dragOffset) {
      const area = areas.find(a => a.id === editingArea);
      if (!area) return;

      const updatedAreas = areas.map(a => {
        if (a.id === editingArea) {
          const newCoords = [...a.coords];
          if (a.shape === "rect") {
            const [x1, y1, x2, y2] = a.coords;
            const width = x2 - x1;
            const height = y2 - y1;
            newCoords[0] = x - dragOffset.x;
            newCoords[1] = y - dragOffset.y;
            newCoords[2] = newCoords[0] + width;
            newCoords[3] = newCoords[1] + height;
          } else if (a.shape === "circle") {
            newCoords[0] = x - dragOffset.x;
            newCoords[1] = y - dragOffset.y;
          } else if (a.shape === "poly") {
            // Move all points by the same offset
            const dx = x - dragOffset.x - a.coords[0];
            const dy = y - dragOffset.y - a.coords[1];
            for (let i = 0; i < newCoords.length; i += 2) {
              newCoords[i] += dx;
              newCoords[i + 1] += dy;
            }
          }
          return { ...a, coords: newCoords };
        }
        return a;
      });
      setAreas(updatedAreas);
      return;
    }

    if (!drawing || !startPoint) return;

    if (tool === "rect") {
      setCurrentShape([startPoint.x, startPoint.y, x, y]);
    } else if (tool === "circle") {
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setCurrentShape([startPoint.x, startPoint.y, radius]);
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPoint) {
      if (mode === "select") {
        setDrawing(false);
        setEditingArea(null);
        setDragOffset(null);
      }
      return;
    }

    if (tool === "poly") return; // Polygon is completed with double-click or button

    const { x, y } = getCanvasCoordinates(e);
    setDrawing(false);

    if (tool === "rect") {
      const minX = Math.min(startPoint.x, x);
      const minY = Math.min(startPoint.y, y);
      const maxX = Math.max(startPoint.x, x);
      const maxY = Math.max(startPoint.y, y);
      
      if (Math.abs(maxX - minX) > 5 && Math.abs(maxY - minY) > 5) {
        const newArea: Area = {
          id: Date.now(),
          shape: "rect",
          coords: [minX, minY, maxX, maxY],
          href: "",
          title: "",
          target: "_self",
          color: colors[areas.length % colors.length],
        };
        setAreas([...areas, newArea]);
        setSelectedArea(newArea.id);
      }
    } else if (tool === "circle") {
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      if (radius > 5) {
        const newArea: Area = {
          id: Date.now(),
          shape: "circle",
          coords: [startPoint.x, startPoint.y, radius],
          href: "",
          title: "",
          target: "_self",
          color: colors[areas.length % colors.length],
        };
        setAreas([...areas, newArea]);
        setSelectedArea(newArea.id);
      }
    }

    setCurrentShape(null);
    setStartPoint(null);
  };

  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (tool === "poly" && isDrawingPolygon && polygonPoints.length >= 3) {
      // Complete polygon
      const coords = polygonPoints.flatMap(p => [p.x, p.y]);
      const newArea: Area = {
        id: Date.now(),
        shape: "poly",
        coords,
        href: "",
        title: "",
        target: "_self",
        color: colors[areas.length % colors.length],
      };
      setAreas([...areas, newArea]);
      setSelectedArea(newArea.id);
      setPolygonPoints([]);
      setIsDrawingPolygon(false);
      toast.success("Polygon completed!");
    }
  };

  const finishPolygon = () => {
    if (polygonPoints.length >= 3) {
      const coords = polygonPoints.flatMap(p => [p.x, p.y]);
      const newArea: Area = {
        id: Date.now(),
        shape: "poly",
        coords,
        href: "",
        title: "",
        target: "_self",
        color: colors[areas.length % colors.length],
      };
      setAreas([...areas, newArea]);
      setSelectedArea(newArea.id);
      setPolygonPoints([]);
      setIsDrawingPolygon(false);
      toast.success("Polygon completed!");
    } else {
      toast.error("Polygon needs at least 3 points");
    }
  };

  const cancelPolygon = () => {
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
    toast.info("Polygon drawing cancelled");
  };

  // Draw shapes on canvas
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

    if (!showOverlay) {
      // Still draw polygon points if drawing
      if (isDrawingPolygon && polygonPoints.length > 0) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
        polygonPoints.forEach((point, i) => {
          ctx.beginPath();
          ctx.arc(point.x * zoom, point.y * zoom, 4 * zoom, 0, Math.PI * 2);
          ctx.fill();
          if (i > 0) {
            ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(polygonPoints[i - 1].x * zoom, polygonPoints[i - 1].y * zoom);
            ctx.lineTo(point.x * zoom, point.y * zoom);
            ctx.stroke();
          }
        });
      }
      return;
    }

    // Draw existing areas
    areas.forEach((area) => {
      const isSelected = selectedArea === area.id;
      const color = area.color || "rgba(59, 130, 246, 0.3)";
      const strokeColor = isSelected ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 0.7)";
      const lineWidth = isSelected ? 3 : 2;

      ctx.fillStyle = color;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      if (area.shape === "rect") {
        const [x1, y1, x2, y2] = area.coords.map(c => c * zoom);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        
        // Draw label
        if (area.title || area.href) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x1, y1 - 20 * zoom, (area.title || area.href).length * 6 * zoom + 10, 18 * zoom);
          ctx.fillStyle = "white";
          ctx.font = `${12 * zoom}px sans-serif`;
          ctx.fillText(area.title || area.href, x1 + 5, y1 - 6 * zoom);
        }
      } else if (area.shape === "circle") {
        const [cx, cy, r] = area.coords.map(c => c * zoom);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        if (area.title || area.href) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          const text = area.title || area.href;
          ctx.fillRect(cx - (text.length * 3 * zoom), cy - r - 20 * zoom, text.length * 6 * zoom + 10, 18 * zoom);
          ctx.fillStyle = "white";
          ctx.font = `${12 * zoom}px sans-serif`;
          ctx.fillText(text, cx - (text.length * 3 * zoom) + 5, cy - r - 6 * zoom);
        }
      } else if (area.shape === "poly") {
        if (area.coords.length >= 6) {
          ctx.beginPath();
          ctx.moveTo(area.coords[0] * zoom, area.coords[1] * zoom);
          for (let i = 2; i < area.coords.length; i += 2) {
            ctx.lineTo(area.coords[i] * zoom, area.coords[i + 1] * zoom);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    });

    // Draw current shape being drawn
    if (drawing && currentShape && tool !== "poly") {
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      if (tool === "rect") {
        const [x1, y1, x2, y2] = currentShape.map(c => c * zoom);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      } else if (tool === "circle") {
        const [cx, cy, r] = currentShape.map(c => c * zoom);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw polygon points
    if (isDrawingPolygon && polygonPoints.length > 0) {
      ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
      polygonPoints.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x * zoom, point.y * zoom, 4 * zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw line to previous point
        if (i > 0) {
          ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(polygonPoints[i - 1].x * zoom, polygonPoints[i - 1].y * zoom);
          ctx.lineTo(point.x * zoom, point.y * zoom);
          ctx.stroke();
        }
      });
    }
  }, [areas, drawing, currentShape, showOverlay, showGrid, selectedArea, zoom, tool, polygonPoints, isDrawingPolygon]);

  // Update canvas size when zoom changes
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (img && canvas && imageDimensions) {
      canvas.width = imageDimensions.width * zoom;
      canvas.height = imageDimensions.height * zoom;
    }
  }, [zoom, imageDimensions]);

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
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Image Map</title>
</head>
<body>
    <img src="your-image.jpg" usemap="#${mapName}" alt="Interactive Image Map">
    
    <map name="${mapName}">
${areas
  .map(
    (a) =>
      `        <area target="${a.target}" alt="${a.title || ""}" title="${a.title || ""}" href="${a.href || "#"}" coords="${a.coords
        .map((n) => Math.round(n))
        .join(",")}" shape="${a.shape}">`
  )
  .join("\n")}
    </map>
</body>
</html>`;
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard!");
  };

  const downloadHTML = () => {
    if (!imageSrc || areas.length === 0) {
      toast.error("No areas to download");
      return;
    }
    const mapName = "image-map";
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Image Map</title>
</head>
<body>
    <img src="your-image.jpg" usemap="#${mapName}" alt="Interactive Image Map">
    
    <map name="${mapName}">
${areas
  .map(
    (a) =>
      `        <area target="${a.target}" alt="${a.title || ""}" title="${a.title || ""}" href="${a.href || "#"}" coords="${a.coords
        .map((n) => Math.round(n))
        .join(",")}" shape="${a.shape}">`
  )
  .join("\n")}
    </map>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-map.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl shadow-2xl p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Map className="text-white" size={36} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold  mb-3">
              Image Map Editor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create interactive HTML image maps by drawing clickable areas on your images
            </p>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer  transition-all hover:border-gray-400">
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
              <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl border b0">
                {/* Mode Selection */}
                <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
                  <span className="text-sm font-semibold ">Mode:</span>
                  <Button
                    variant={mode === "draw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setMode("draw");
                      setEditingArea(null);
                      setDrawing(false);
                    }}
                    className="gap-2"
                  >
                    <Edit2 size={16} />
                    Draw
                  </Button>
                  <Button
                    variant={mode === "select" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setMode("select");
                      setIsDrawingPolygon(false);
                      setPolygonPoints([]);
                    }}
                    className="gap-2"
                  >
                    <Move size={16} />
                    Select
                  </Button>
                </div>

                {/* Shape Selection (only in draw mode) */}
                {mode === "draw" && (
                  <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
                    <span className="text-sm font-semibold ">Shape:</span>
                    <Button
                      variant={tool === "rect" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTool("rect");
                        setIsDrawingPolygon(false);
                        setPolygonPoints([]);
                      }}
                      className="gap-2"
                    >
                      <Square size={16} />
                      Rectangle
                    </Button>
                    <Button
                      variant={tool === "circle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTool("circle");
                        setIsDrawingPolygon(false);
                        setPolygonPoints([]);
                      }}
                      className="gap-2"
                    >
                      <Circle size={16} />
                      Circle
                    </Button>
                    <Button
                      variant={tool === "poly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTool("poly");
                        setIsDrawingPolygon(true);
                        setPolygonPoints([]);
                      }}
                      className="gap-2"
                    >
                      <Hexagon size={16} />
                      Polygon
                    </Button>
                  </div>
                )}

                {/* Polygon Controls */}
                {tool === "poly" && isDrawingPolygon && (
                  <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
                    <span className="text-xs ">
                      Points: {polygonPoints.length} (Double-click to finish)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={finishPolygon}
                      disabled={polygonPoints.length < 3}
                      className="gap-2"
                    >
                      Finish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelPolygon}
                      className="gap-2"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <Button
                  variant={showOverlay ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="gap-2"
                >
                  {showOverlay ? <Eye size={18} /> : <EyeOff size={18} />}
                  {showOverlay ? "Hide" : "Show"} Areas
                </Button>
                
                <Button
                  variant={showGrid ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className="gap-2"
                >
                  <Grid size={18} />
                  Grid
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  disabled={zoom >= 2}
                  className="gap-2"
                >
                  <ZoomIn size={18} />
                  Zoom In
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  disabled={zoom <= 0.5}
                  className="gap-2"
                >
                  <ZoomOut size={18} />
                  Zoom Out
                </Button>

                <span className="flex items-center px-4 py-2 rounded-lg border border-gray-300 font-semibold ">
                  {Math.round(zoom * 100)}%
                </span>

                {areas.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearAll}
                    className="gap-2 ml-auto"
                  >
                    <Trash2 size={18} />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Canvas Container */}
              <div 
                ref={containerRef}
                className="mb-8 overflow-auto border-2 border-gray-300 rounded-xl  max-h-[600px]"
              >
                <div className="relative inline-block">
                  {imageSrc && (
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="Map"
                      className="block max-w-none"
                      style={{ 
                        width: imageDimensions ? `${imageDimensions.width * zoom}px` : 'auto',
                        height: imageDimensions ? `${imageDimensions.height * zoom}px` : 'auto',
                        display: 'block'
                      }}
                      onLoad={() => {
                        const img = imageRef.current;
                        const canvas = canvasRef.current;
                        if (img && canvas && img.naturalWidth && img.naturalHeight) {
                          setImageDimensions({
                            width: img.naturalWidth,
                            height: img.naturalHeight
                          });
                          canvas.width = img.naturalWidth * zoom;
                          canvas.height = img.naturalHeight * zoom;
                        }
                      }}
                    />
                  )}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                    onMouseLeave={() => {
                      if (drawing && mode === "draw") {
                        setDrawing(false);
                        setCurrentShape(null);
                        setStartPoint(null);
                      } else if (mode === "select") {
                        setDrawing(false);
                        setEditingArea(null);
                        setDragOffset(null);
                      }
                    }}
                    className="absolute top-0 left-0 pointer-events-auto"
                    style={{ cursor: mode === "draw" ? "crosshair" : "move" }}
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
                            ? "border-indigo-500  shadow-lg"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-6 h-6 rounded-lg shrink-0 mt-1"
                            style={{ backgroundColor: area.color }}
                          />
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold  mb-1">
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
                              <label className="block text-xs font-semibold  mb-1">
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
                              <label className="block text-xs font-semibold  mb-1">
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
                            className="shrink-0 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                            aria-label="Delete area"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="mt-2 text-xs font-mono  ml-9">
                          <span className="font-semibold">Shape:</span> {area.shape} | 
                          <span className="font-semibold ml-2">Coords:</span> {area.coords.map((n) => Math.round(n)).join(", ")}
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
                    className="flex items-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Copy size={20} />
                    Copy HTML Code
                  </button>
                  
                  <button
                    onClick={downloadHTML}
                    className="flex items-center gap-2 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
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




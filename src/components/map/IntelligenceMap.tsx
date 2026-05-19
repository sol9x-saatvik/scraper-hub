import { useEffect, useMemo, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { getGeoPosts, getGeoCountries, type PostGeo, type GeoCountry } from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Layers, MapPin, Activity, ShieldAlert, Globe, ChevronLeft, ChevronRight, Filter, Search, Info, ListFilter, X, Plus, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

type DisplayMode = "pins" | "heatmap";

interface LocationGroup {
  lat: number;
  lng: number;
  locationName: string;
  country: string;
  platform: string;
  posts: PostGeo[];
  keywords: string[];
  harmfulCount: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  Twitter: "#1DA1F2",
  Instagram: "#E1306C",
  Reddit: "#FF4500",
  Facebook: "#4267B2",
  Web: "#6B7280",
};

function platformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.Web;
}

interface IntelligenceMapProps {
  height?: string;
}

export function IntelligenceMap({ height = "500px" }: IntelligenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mode, setMode] = useState<DisplayMode>("pins");
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(
    new Set(["Twitter", "Instagram", "Reddit", "Facebook", "Web"])
  );
  const [harmfulOnly, setHarmfulOnly] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const { data: geoPosts = [] } = useQuery<PostGeo[]>({
    queryKey: ["geoPosts"],
    queryFn: getGeoPosts,
    refetchInterval: 30_000,
  });

  const { data: countries = [] } = useQuery<GeoCountry[]>({
    queryKey: ["geoCountries"],
    queryFn: getGeoCountries,
    refetchInterval: 30_000,
  });

  const filteredPosts = useMemo(() => {
    return geoPosts.filter((p) => {
      const pPlatform = (p.platform ?? "").toLowerCase();
      const platformMatches = [...enabledPlatforms].some((ep) => ep.toLowerCase() === pPlatform);
      if (!platformMatches) return false;
      if (harmfulOnly && !p.isHarmful) return false;
      if (selectedCountry && p.country !== selectedCountry) return false;
      return true;
    });
  }, [geoPosts, enabledPlatforms, harmfulOnly, selectedCountry]);

  const locations = useMemo(() => {
    const groups = filteredPosts
      .filter((p) => p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)))
      .reduce((acc, post) => {
        const key = `${post.locationName}`;
        if (!acc[key]) {
          acc[key] = {
            lat: Number(post.latitude),
            lng: Number(post.longitude),
            locationName: post.locationName,
            country: post.country,
            platform: post.platform,
            posts: [],
            keywords: [],
            harmfulCount: 0,
          };
        }
        acc[key].posts.push(post);
        if (post.keyword && !acc[key].keywords.includes(post.keyword)) acc[key].keywords.push(post.keyword);
        if (post.isHarmful) acc[key].harmfulCount++;
        return acc;
      }, {} as Record<string, LocationGroup>);
    return Object.values(groups);
  }, [filteredPosts]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [0, 20],
      zoom: 1.2,
      projection: { name: "globe" },
    });

    map.on("load", () => {
      // Set water color to the desired vibrant but desaturated blue
      if (map.getLayer("water")) {
        map.setPaintProperty("water", "fill-color", "#4EC4FF");
      }

      // Atmospheric fog configuration for a blue-tinted halo effect
      if (map.setFog) {
        map.setFog({
          color: "rgba(78, 196, 255, 0.3)", // Soft blue atmosphere
          "high-color": "rgba(36, 92, 223, 0.15)", // Deeper space transition
          "horizon-blend": 0.3, // Wide, natural transition
          "space-color": "rgb(4, 7, 12)", // Very dark blue-black space
          "star-intensity": 0.15,
        });
      }

      map.addSource("posts-heatmap", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "posts-heat",
        type: "heatmap",
        source: "posts-heatmap",
        maxzoom: 9,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 10, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(33,102,172,0)",
            0.2, "rgb(103,169,207)",
            0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)",
            0.8, "rgb(239,138,98)",
            1, "rgb(178,24,43)"
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
        },
      });

      mapRef.current = map;
      setIsMapLoaded(true);
    });

    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mode === "pins") {
      try {
        if (map.getStyle() && map.getLayer("posts-heat")) {
          map.setLayoutProperty("posts-heat", "visibility", "none");
        }
      } catch (e) { }

      locations.forEach((g) => {
        const postCount = g.posts.length;
        const size = Math.min(10 + postCount * 2, 30);
        const color = platformColor(g.platform);

        const el = document.createElement("div");
        el.className = "maplibre-marker-custom";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = color;
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 15px rgba(0,0,0,0.4)";
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s ease-out";

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: "custom-osint-popup" }).setHTML(`
          <div class="p-3 bg-background rounded-lg border border-border shadow-xl">
            <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">${g.platform}</p>
            <p class="text-xs font-bold text-foreground mb-2">${g.locationName}</p>
            <div class="flex items-center justify-between gap-4 border-t pt-2 mt-2">
              <span class="text-[10px] font-bold text-muted-foreground">Signals</span>
              <span class="text-xs font-black text-primary">${postCount}</span>
            </div>
            ${g.harmfulCount > 0 ? `
              <div class="flex items-center justify-between gap-4 mt-1">
                <span class="text-[10px] font-bold text-destructive">Harmful</span>
                <span class="text-xs font-black text-destructive">${g.harmfulCount}</span>
              </div>
            ` : ""}
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([g.lng, g.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    } else {
      try {
        if (map.getStyle() && map.getLayer("posts-heat")) {
          map.setLayoutProperty("posts-heat", "visibility", "visible");
        }
      } catch (e) { }

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: locations.map((g) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [g.lng, g.lat] },
          properties: { count: g.posts.length },
        })),
      };
      const source = map.getSource("posts-heatmap") as mapboxgl.GeoJSONSource;
      if (source) source.setData(geojson);
    }
  }, [locations, mode, isMapLoaded]);

  useEffect(() => {
    if (!selectedCountry || !mapRef.current || !isMapLoaded) return;
    const match = locations.find((g) => g.country === selectedCountry);
    if (match) {
      mapRef.current.flyTo({ center: [match.lng, match.lat], zoom: 5, duration: 2000, essential: true });
    }
  }, [selectedCountry, locations, isMapLoaded]);

  function togglePlatform(platform: string) {
    setEnabledPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  const allPlatforms = ["Twitter", "Instagram", "Reddit", "Facebook", "Web"];

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-[#020408]" style={{ height }}>
      {/* Background Starscape */}
      <div className="absolute inset-0 z-0 opacity-40" style={{
        backgroundImage: `radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)), 
                           radial-gradient(1.5px 1.5px at 140px 70px, #fff, rgba(0,0,0,0)), 
                           radial-gradient(1px 1px at 50px 160px, #eee, rgba(0,0,0,0)), 
                           radial-gradient(2px 2px at 280px 120px, #fff, rgba(0,0,0,0)), 
                           radial-gradient(1px 1px at 310px 210px, #eee, rgba(0,0,0,0)),
                           radial-gradient(1px 1px at 450px 400px, #fff, rgba(0,0,0,0))`,
        backgroundSize: "400px 400px"
      }}
      />

      {/* Atmospheric Glow behind Globe */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-[#4EC4FF]/10 blur-[150px] pointer-events-none z-0" />

      {/* Map Instance */}
      <div ref={mapContainerRef} className="relative h-full w-full z-10" />

      {/* Interface Overlay - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 w-48">
        <div className="bg-background/80 backdrop-blur-md border border-border p-1 rounded-lg flex shadow-2xl">
          <Button
            variant={mode === "pins" ? "default" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-[10px] font-bold uppercase gap-1.5"
            onClick={() => setMode("pins")}
          >
            <MapPin className="h-3 w-3" /> Signals
          </Button>
          <Button
            variant={mode === "heatmap" ? "default" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-[10px] font-bold uppercase gap-1.5"
            onClick={() => setMode("heatmap")}
          >
            <Activity className="h-3 w-3" /> Heatmap
          </Button>
        </div>

        <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-lg shadow-2xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Stream</p>
          <div className="space-y-2">
            {allPlatforms.map((pl) => (
              <div key={pl} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: platformColor(pl) }} />
                  <Label className="text-[11px] font-medium cursor-pointer" onClick={() => togglePlatform(pl)}>{pl}</Label>
                </div>
                <Checkbox
                  checked={enabledPlatforms.has(pl)}
                  onCheckedChange={() => togglePlatform(pl)}
                  className="h-3.5 w-3.5"
                />
              </div>
            ))}
          </div>
          <Separator className="bg-border/50" />
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-black text-destructive uppercase tracking-tighter">High Risk Only</Label>
            <Switch checked={harmfulOnly} onCheckedChange={setHarmfulOnly} className="scale-75" />
          </div>
        </div>
      </div>

      {/* Intelligence Sidebar - Left */}
      <div className={cn(
        "absolute top-4 bottom-4 z-20 flex flex-col bg-background/80 backdrop-blur-md border border-border shadow-2xl transition-all duration-300 rounded-xl overflow-hidden",
        sidebarOpen ? "left-4 w-56" : "left-4 w-12"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-12 border-b border-border rounded-none text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        </Button>

        {sidebarOpen && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-border/50 bg-accent/5">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Regional Intelligence</span>
              </div>
              <p className="text-[11px] font-medium">{countries.length} Jurisdictions Active</p>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {selectedCountry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-[10px] text-primary h-7 uppercase font-bold"
                    onClick={() => setSelectedCountry(null)}
                  >
                    ✕ Clear Filter
                  </Button>
                )}
                {countries.map((c) => {
                  const harmfulInCountry = geoPosts.filter((p) => p.country === c.country && p.isHarmful).length;
                  const isActive = selectedCountry === c.country;

                  return (
                    <Button
                      key={c.country}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-between h-8 px-2 text-[11px] font-medium group",
                        isActive && "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
                      )}
                      onClick={() => setSelectedCountry(isActive ? null : c.country)}
                    >
                      <span className="truncate">{c.country}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] opacity-40 group-hover:opacity-100">{c.count}</span>
                        {harmfulInCountry > 0 && (
                          <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[8px] border-none shadow-none">{harmfulInCountry}</Badge>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-md border border-border px-1.5 py-1.5 rounded-full shadow-2xl">
        <Button variant="ghost" size="sm" className="h-8 rounded-full gap-2 px-3">
          <ListFilter className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold">Filters</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] min-w-[1.25rem]">{enabledPlatforms.size}</Badge>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-border/50" />
        <div className="flex items-center gap-4 px-3">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Regions</span>
            <span className="text-xs font-bold">{countries.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Signals</span>
            <span className="text-xs font-bold">{filteredPosts.length}</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-4 bg-border/50" />
        <Button 
          variant="destructive" 
          size="sm" 
          className="h-8 rounded-full gap-2 px-4 bg-destructive/10 hover:bg-destructive/20 text-destructive border-none"
          onClick={() => {
            setEnabledPlatforms(new Set(["Twitter", "Instagram", "Reddit", "Facebook", "Web"]));
            setHarmfulOnly(false);
            setSelectedCountry(null);
          }}
        >
          <X className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold">Clear Filters</span>
        </Button>
      </div>

      {/* Map Controls - Right Center */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 flex flex-col gap-2 bg-background/80 backdrop-blur-md border border-border p-1 rounded-lg shadow-2xl">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mapRef.current?.zoomIn()}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mapRef.current?.zoomOut()}>
                <X className="h-4 w-4 rotate-45" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>
          <Separator className="bg-border/50" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mapRef.current?.flyTo({ center: [0, 20], zoom: 1.2 })}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Intelligence Legend - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center cursor-help shadow-2xl">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background/95 border-border p-3 w-48 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Intelligence Source Legend</p>
              <div className="space-y-1.5">
                {Object.entries(PLATFORM_COLORS).map(([pl, col]) => (
                  <div key={pl} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col }} />
                    <span className="text-[10px] font-medium">{pl}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

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
import { Layers, MapPin, Activity, ShieldAlert, Globe, ChevronLeft, ChevronRight, Filter, Search, Info, ListFilter, X, Plus, Minus, RotateCcw, Twitter, Instagram, Facebook, Linkedin, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const PLATFORM_ICONS: Record<string, any> = {
  Twitter: Twitter,
  Instagram: Instagram,
  Reddit: Activity,
  Facebook: Facebook,
  Web: Globe,
};

function platformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.Web;
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICONS[platform] ?? Globe;
  return <Icon className={className} />;
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

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, className: "custom-osint-popup" }).setHTML(`
          <div class="min-w-[200px] bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl overflow-hidden">
            <div class="px-3 py-2 border-b border-border/50 bg-accent/20 flex items-center justify-between">
              <p class="text-xs font-black text-foreground">${g.locationName}</p>
              <span class="text-[9px] font-bold text-muted-foreground">${g.country}</span>
            </div>
            <div class="p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-primary">${g.platform}</span>
                </div>
                <span class="text-xs font-black">${postCount} Signals</span>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-border/30">
                <span class="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                <span class="text-[10px] font-black ${g.harmfulCount > 0 ? 'text-destructive' : 'text-success'}">
                  ${g.harmfulCount > 0 ? 'HIGH RISK' : 'SECURE'}
                </span>
              </div>
            </div>
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


      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-background/80 backdrop-blur-md border border-border p-1 rounded-lg shadow-2xl flex flex-col gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mapRef.current?.zoomIn()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Zoom In</TooltipContent>
            </Tooltip>
            <Separator className="bg-border/50" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mapRef.current?.zoomOut()}>
                  <Minus className="h-4 w-4" />
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
            <Separator className="bg-border/50" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="left" className="w-48 bg-background/95 backdrop-blur-md border-border p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Intelligence Legend</p>
                    <div className="space-y-1.5">
                      {Object.entries(PLATFORM_COLORS).map(([pl, col]) => (
                        <div key={pl} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col }} />
                          <span className="text-[10px] font-medium">{pl}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="left">Map Info</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Floating Bottom Filter Bar - Full Width */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between bg-background/80 backdrop-blur-md border border-border px-4 py-2 rounded-xl shadow-2xl">
        <div className="flex items-center gap-6">
          {/* Data Counters */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Active Jurisdictions</span>
              <span className="text-sm font-bold">{countries.length}</span>
            </div>
            <Separator orientation="vertical" className="h-8 bg-border/50" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Intelligence Signals</span>
              <span className="text-sm font-bold text-primary">{filteredPosts.length}</span>
            </div>
            <Separator orientation="vertical" className="h-8 bg-border/50" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">High Risk Threats</span>
              <span className="text-sm font-bold text-destructive">{filteredPosts.filter(p => p.isHarmful).length}</span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 bg-border/50" />

          {/* Detailed Filters */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 gap-2 px-3 rounded-lg text-[11px] font-bold">
                  <ListFilter className="h-3.5 w-3.5" />
                  Source Filter
                  {enabledPlatforms.size < 5 && <Badge className="h-4 px-1 text-[9px]">{enabledPlatforms.size}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Filter by Source</p>
                <div className="space-y-2">
                  {["Twitter", "Instagram", "Reddit", "Facebook", "Web"].map((pl) => (
                    <div key={pl} className="flex items-center justify-between hover:bg-accent/30 p-1 rounded-md transition-colors cursor-pointer group" onClick={() => togglePlatform(pl)}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-7 w-7 rounded-lg flex items-center justify-center border border-border/50 transition-all group-hover:scale-110"
                          style={{ 
                            backgroundColor: enabledPlatforms.has(pl) ? `${platformColor(pl)}15` : 'transparent',
                            color: enabledPlatforms.has(pl) ? platformColor(pl) : 'currentColor'
                          }}
                        >
                          <PlatformIcon platform={pl} className="h-4 w-4" />
                        </div>
                        <Label className="text-[11px] font-bold cursor-pointer">{pl}</Label>
                      </div>
                      <Checkbox
                        checked={enabledPlatforms.has(pl)}
                        onCheckedChange={() => togglePlatform(pl)}
                        className="h-3.5 w-3.5"
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 gap-2 px-3 rounded-lg text-[11px] font-bold">
                  <Globe className="h-3.5 w-3.5" />
                  Jurisdiction
                  {selectedCountry && <Badge className="h-4 px-1 text-[9px] truncate max-w-[80px]">{selectedCountry}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <div className="p-3 border-b border-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Region</p>
                </div>
                <ScrollArea className="h-64">
                  <div className="p-1 space-y-1">
                    {countries.map((c) => (
                      <div key={c.country} className="space-y-1">
                        <Button
                          variant={selectedCountry === c.country ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-between h-9 px-3 text-[11px] font-bold rounded-lg transition-all",
                            selectedCountry === c.country && "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                          onClick={() => setSelectedCountry(selectedCountry === c.country ? null : c.country)}
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 opacity-50" />
                            {c.country}
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1 h-4 bg-background/50 border-border/30">
                            {c.count}
                          </Badge>
                        </Button>
                        
                        {selectedCountry === c.country && (
                          <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-primary/20 ml-4 mb-2">
                            {c.cities.map(city => (
                              <div key={city} className="flex items-center justify-between py-1 px-2 rounded hover:bg-accent/30 cursor-default group">
                                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{city}</span>
                                <div className="h-1 w-1 rounded-full bg-primary/30" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2 bg-background/50 px-3 py-1 rounded-lg border border-border/50">
              <Label className="text-[10px] font-black uppercase text-destructive tracking-tighter">High Risk</Label>
              <Switch checked={harmfulOnly} onCheckedChange={setHarmfulOnly} className="scale-75" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(enabledPlatforms.size < 5 || harmfulOnly || selectedCountry) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-2 text-muted-foreground hover:text-foreground text-[11px]"
              onClick={() => {
                setEnabledPlatforms(new Set(["Twitter", "Instagram", "Reddit", "Facebook", "Web"]));
                setHarmfulOnly(false);
                setSelectedCountry(null);
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </Button>
          )}
          <Separator orientation="vertical" className="h-6 bg-border/50 mx-2" />
          <Button variant="default" size="sm" className="h-8 rounded-lg font-bold text-[11px] px-4">
            Analyze Signals
          </Button>
        </div>
      </div>
    </div>
  );
}

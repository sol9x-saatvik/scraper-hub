import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useQuery } from "@tanstack/react-query";
import { getGeoPosts, getGeoCountries, type PostGeo, type GeoCountry } from "@/services/api";
import { cn } from "@/lib/utils";

// Fix default leaflet marker icon 404 using local Vite-resolved assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Twitter:   "#1DA1F2",
  Instagram: "#E1306C",
  Reddit:    "#FF4500",
  Facebook:  "#4267B2",
  Web:       "#6B7280",
};

function platformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.Web;
}

// ── FlyTo helper component ────────────────────────────────────────────────────
function FlyToCountry({ country, locations }: { country: string | null; locations: LocationGroup[] }) {
  const map = useMap();
  useEffect(() => {
    if (!country) return;
    const match = locations.find((g) => g.country === country);
    if (match) map.flyTo([match.lat, match.lng], 5, { duration: 1.2 });
  }, [country, locations, map]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

interface IntelligenceMapProps {
  height?: string;
}

export function IntelligenceMap({ height = "500px" }: IntelligenceMapProps) {
  const [mode, setMode] = useState<DisplayMode>("pins");
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(
    new Set(["Twitter", "Instagram", "Reddit", "Facebook", "Web"])
  );
  const [harmfulOnly, setHarmfulOnly] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: geoPosts = [], error: geoError } = useQuery<PostGeo[]>({
    queryKey: ["geoPosts"],
    queryFn: async () => {
      const posts = await getGeoPosts();
      console.log("[IntelligenceMap] /api/geo/posts →", posts.length, "records",
        posts.length > 0 ? `(first lat=${posts[0].latitude}, lng=${posts[0].longitude}, platform=${posts[0].platform})` : "");
      return posts;
    },
    refetchInterval: 30_000,
  });

  if (geoError) console.error("[IntelligenceMap] geo fetch error:", geoError);

  const { data: countries = [] } = useQuery<GeoCountry[]>({
    queryKey: ["geoCountries"],
    queryFn: getGeoCountries,
    refetchInterval: 30_000,
  });

  const filteredPosts = useMemo(() => {
    return geoPosts.filter((p) => {
      // Case-insensitive platform match — MongoDB value may differ in casing
      const pPlatform = (p.platform ?? "").toLowerCase();
      const platformMatches = [...enabledPlatforms].some((ep) => ep.toLowerCase() === pPlatform);
      if (!platformMatches) return false;
      if (harmfulOnly && !p.isHarmful) return false;
      if (selectedCountry && p.country !== selectedCountry) return false;
      return true;
    });
  }, [geoPosts, enabledPlatforms, harmfulOnly, selectedCountry]);

  const groupedLocations = useMemo(() => {
    if (filteredPosts.length > 0) {
      const s = filteredPosts[0];
      console.log("[IntelligenceMap] coordinate sample — lat:", s.latitude,
        "typeof:", typeof s.latitude, "| lng:", s.longitude, "typeof:", typeof s.longitude);
    }
    return filteredPosts
      // Use explicit null/undefined check — do NOT use falsy (0 is a valid coordinate)
      .filter((p) => p.latitude != null && p.longitude != null &&
                     !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)))
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
  }, [filteredPosts]);

  const locations = useMemo(() => Object.values(groupedLocations), [groupedLocations]);

  const maxCount = useMemo(
    () => Math.max(1, ...locations.map((g) => g.posts.length)),
    [locations]
  );

  function togglePlatform(platform: string) {
    setEnabledPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  const allPlatforms = ["Twitter", "Instagram", "Reddit", "Facebook", "Web"];

  console.log("geoPosts from query:", geoPosts);
  console.log("filtered posts:", filteredPosts);
  console.log("grouped locations:", groupedLocations);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ height }}>
      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <FlyToCountry country={selectedCountry} locations={locations} />

        {mode === "pins" &&
          locations.map((g) => {
            const postCount = g.posts.length;
            const radius = Math.min(6 + postCount * 2, 20);
            const color = platformColor(g.platform);
            return (
              <CircleMarker
                key={g.locationName}
                center={[g.lat, g.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 160, fontSize: 12, lineHeight: 1.6 }}>
                    <strong>{g.keywords[0] ?? "—"}</strong><br />
                    {g.locationName}<br />
                    {postCount} post{postCount !== 1 ? "s" : ""}<br />
                    Platform: {g.platform}<br />
                    Users: {[...new Set(g.posts.map((p) => p.user))].slice(0, 3).join(", ")}
                    {g.harmfulCount > 0 && (
                      <><br /><span style={{ color: "#ef4444" }}>{g.harmfulCount} harmful</span></>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {mode === "heatmap" &&
          locations.map((g) => {
            const postCount = g.posts.length;
            const radius = Math.min(20 + postCount * 5, 60);
            const fillColor = postCount > 10 ? "#ef4444" : postCount > 5 ? "#f97316" : "#22c55e";
            return (
              <CircleMarker
                key={g.locationName}
                center={[g.lat, g.lng]}
                radius={radius}
                pathOptions={{
                  color: "transparent",
                  fillColor,
                  fillOpacity: 0.3,
                  weight: 0,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <strong>{g.locationName}</strong><br />
                    {postCount} post{postCount !== 1 ? "s" : ""}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Controls overlay — top right */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Mode toggle */}
        <div className="flex rounded-md overflow-hidden border border-border shadow-lg">
          {(["pins", "heatmap"] as DisplayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "pins" ? "Pins" : "Heatmap"}
            </button>
          ))}
        </div>

        {/* Platform filters */}
        <div className="bg-card border border-border rounded-md p-2 shadow-lg space-y-1.5">
          {allPlatforms.map((pl) => (
            <label key={pl} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledPlatforms.has(pl)}
                onChange={() => togglePlatform(pl)}
                className="rounded"
              />
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: platformColor(pl) }}
              />
              <span className="text-xs text-card-foreground">{pl}</span>
            </label>
          ))}
        </div>

        {/* Harmful only toggle */}
        <label className="flex items-center gap-2 bg-card border border-border rounded-md px-2.5 py-1.5 shadow-lg cursor-pointer">
          <input
            type="checkbox"
            checked={harmfulOnly}
            onChange={(e) => setHarmfulOnly(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-red-400 font-medium">Harmful only</span>
        </label>
      </div>

      {/* Country sidebar — right */}
      <div
        className={cn(
          "absolute top-3 bottom-3 z-[1000] flex flex-col bg-card/95 border border-border rounded-md shadow-lg transition-all overflow-hidden",
          sidebarOpen ? "left-3 w-44" : "left-3 w-8"
        )}
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="shrink-0 w-full flex items-center justify-center py-2 border-b border-border text-muted-foreground hover:text-foreground text-xs"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-1">Countries</p>
            {selectedCountry && (
              <button
                onClick={() => setSelectedCountry(null)}
                className="w-full text-left text-xs text-primary px-1 py-0.5 mb-1 hover:underline"
              >
                ✕ Clear filter
              </button>
            )}
            {countries.map((c) => {
              const harmfulInCountry = geoPosts.filter((p) => p.country === c.country && p.isHarmful).length;
              return (
                <button
                  key={c.country}
                  onClick={() => setSelectedCountry(c.country === selectedCountry ? null : c.country)}
                  className={cn(
                    "w-full text-left flex items-center justify-between px-1 py-1 rounded text-xs hover:bg-accent transition-colors",
                    selectedCountry === c.country && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="truncate">{c.country}</span>
                  <span className="shrink-0 ml-1 text-muted-foreground">
                    {c.count}
                    {harmfulInCountry > 0 && (
                      <span className="text-red-400 ml-1">({harmfulInCountry})</span>
                    )}
                  </span>
                </button>
              );
            })}
            {countries.length === 0 && (
              <p className="text-[11px] text-muted-foreground px-1">No geo data yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

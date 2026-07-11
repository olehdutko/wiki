import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/api.service';

interface MapItem {
  itemId: number;
  ukr_name: string;
  eng_name?: string | null;
  rus_name?: string | null;
  territoryId: number;
  territoryName: string;
  lat: number;
  lng: number;
  primary_image_url: string | null;
}

const popupContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 220
};

const popupImageStyle: React.CSSProperties = {
  width: 80,
  height: 80,
  objectFit: 'cover',
  borderRadius: 4
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createPreviewIcon(imageUrl: string | null): L.DivIcon {
  const safeUrl = escapeHtml(imageUrl || '/marker-default.png');
  return L.divIcon({
    className: 'world-map-preview',
    html: `<img src="${safeUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.4);" />`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}



export const WorldMapPage: React.FC = () => {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiService.get<{ data: MapItem[] }>('/weapons/map');
        setItems(res.data || []);
      } catch (e) {
        setError('Не вдалося завантажити дані для мапи');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Запобігаємо накладанню маркерів на одній точці
  const usedPositions = new Map<string, number>();
  const markers = items.map((item) => {
    const baseLat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat;
    const baseLng = typeof item.lng === 'string' ? parseFloat(item.lng) : item.lng;
    const key = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
    const count = usedPositions.get(key) || 0;
    usedPositions.set(key, count + 1);
    const angle = count * 0.7;
    const offsetLat = Math.cos(angle) * 0.045;
    const offsetLng = Math.sin(angle) * 0.045;
    return { ...item, lat: baseLat + offsetLat, lng: baseLng + offsetLng };
  });

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[48.5, 31.5]}
        zoom={4}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((item) => (
          <Marker
            key={`${item.itemId}-${item.territoryId}`}
            position={[item.lat, item.lng]}
            icon={createPreviewIcon(item.primary_image_url)}
          >
            <Popup>
              <div style={popupContentStyle}>
                {item.primary_image_url ? (
                  <img
                    src={item.primary_image_url}
                    alt={item.ukr_name}
                    style={popupImageStyle}
                    onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'grey.300',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  </Box>
                )}
                <div>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.ukr_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.territoryName}</Typography>
                  <br />
                  <a
                    href={`/weapons/${item.itemId}/`}
                    style={{ fontSize: 14, marginTop: 8, display: 'inline-block' }}
                  >
                    Перейти до айтема
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

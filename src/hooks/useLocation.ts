import { useState } from 'react';
import i18n from '../i18n';

export const useLocation = () => {
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [address, setAddress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const detectLocation = (onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        const handlePositionSuccess = (latitude: number, longitude: number, source: string) => {
            console.log(`Accuracy Source: ${source}`);
            setLocation({ lat: latitude, lng: longitude });
            // Universal link that works better on mobile devices (Android/iOS)
            const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

            navigator.clipboard.writeText(googleMapsLink)
                .then(() => {
                    console.log('Location link copied to clipboard');
                    if (onSuccess) onSuccess();
                })
                .catch(() => {
                    if (onSuccess) onSuccess();
                });

            setAddress(googleMapsLink);
            setLoading(false);
        };

        const fetchIpLocation = async () => {
            try {
                // Use HTTP compatible service when on HTTP to avoid Mixed Content errors
                const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
                const apiUrl = protocol === 'https:'
                    ? 'https://ipapi.co/json/'
                    : 'http://ip-api.com/json';

                const response = await fetch(apiUrl);
                const data = await response.json();

                // Handle different response formats
                const lat = data.latitude || data.lat;
                const lon = data.longitude || data.lon;

                if (lat && lon) {
                    handlePositionSuccess(lat, lon, 'NETWORK_ESTIMATE');
                } else {
                    throw new Error('IP Fallback Failed');
                }
            } catch (e) {
                setError(i18n.t('gps_error_secure'));
                setLoading(false);
            }
        };

        const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';

        if (!isSecure) {
            console.log('Detected insecure context: Using HTTP-friendly Network Fallback.');
            fetchIpLocation();
            return;
        }

        if (!navigator.geolocation) {
            fetchIpLocation();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                handlePositionSuccess(position.coords.latitude, position.coords.longitude, 'HIGH_ACCURACY_GPS');
            },
            (err) => {
                console.warn('GPS failed, trying IP fallback:', err.message);
                fetchIpLocation();
            },
            { timeout: 7000, enableHighAccuracy: true }
        );
    };

    return { location, address, setAddress, error, loading, detectLocation };
};

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
            const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

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
                // Try to get a rough location so at least we have something
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.latitude && data.longitude) {
                    handlePositionSuccess(data.latitude, data.longitude, 'NETWORK_ESTIMATE');
                } else {
                    throw new Error('IP Fallback Failed');
                }
            } catch (e) {
                // If even the IP fallback fails, show the professional security notice
                setError(i18n.t('gps_error_secure'));
                setLoading(false);
            }
        };

        // Check for Secure Context (Required for GPS)
        const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';

        if (!isSecure) {
            console.warn('Insecure Origin: Browser blocks GPS hardware.');
            // On insecure origins, we immediately show the specialized error message
            setError(i18n.t('gps_error_secure'));
            // Still try the background IP fallback so they don't have to type everything
            fetchIpLocation();
            return;
        }

        if (!navigator.geolocation) {
            setError('الجهاز لا يدعم تحديد الموقع');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                handlePositionSuccess(position.coords.latitude, position.coords.longitude, 'HIGH_ACCURACY_GPS');
            },
            (err) => {
                console.warn('GPS Denied/Failed, using fallback:', err.message);
                fetchIpLocation();
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    return { location, address, setAddress, error, loading, detectLocation };
};

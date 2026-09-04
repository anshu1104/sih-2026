export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class LocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationError";
  }
}

export const detectLocation = (): Promise<GPSLocation> => {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new LocationError("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new LocationError("Location permission is required when taking a photo. Please allow location access and try again."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new LocationError("Unable to detect your current location. Please make sure Location Services are enabled and try again."));
            break;
          case error.TIMEOUT:
            reject(new LocationError("Location detection timed out. Please try again."));
            break;
          default:
            reject(new LocationError("An unknown error occurred while getting location."));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

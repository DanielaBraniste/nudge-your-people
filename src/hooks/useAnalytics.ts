import { useEffect, useRef, useState } from 'react';

interface AnalyticsData {
  timeSpent: number;
  peopleAdded: number;
  catchUpDetails: string;
  pwaInstalled: boolean;
  device: string;
  location: string;
  timestamp: string;
}

export const useAnalytics = () => {
  const startTime = useRef(Date.now());
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'Tablet';
    
    const os = /Windows/.test(ua) ? 'Windows' :
               /Mac/.test(ua) ? 'MacOS' :
               /Android/.test(ua) ? 'Android' :
               /iOS|iPhone|iPad/.test(ua) ? 'iOS' :
               'Unknown';
    
    return `${device} - ${os}`;
  };

  const getLocation = async () => {
    try {
      // Using a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`;
    } catch (error) {
      console.error('Error getting location:', error);
      return 'Unknown';
    }
  };

  const isPWAInstalled = () => {
    // Check if app is in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  };

  const getCatchUpDetails = () => {
    try {
      const storedPeople = localStorage.getItem('catchUpPeople');
      if (!storedPeople) return 'No people added';
      
      const people = JSON.parse(storedPeople);
      const scheduledNotifications = JSON.parse(
        localStorage.getItem('scheduledNotifications') || '{}'
      );
      
      const details = people.map((person: any) => {
        const notification = scheduledNotifications[person.id];
        return `${person.name}: ${person.frequency} - ${notification?.formattedTime || 'Not scheduled'}`;
      }).join(' | ');
      
      return details || 'No details available';
    } catch (error) {
      return 'Error getting details';
    }
  };

  const submitAnalytics = async () => {
    if (hasSubmitted) return; // Prevent duplicate submissions
    
    try {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000); // seconds
      const storedPeople = localStorage.getItem('catchUpPeople');
      const peopleCount = storedPeople ? JSON.parse(storedPeople).length : 0;
      
      const location = await getLocation();
      
      const analyticsData: AnalyticsData = {
        timeSpent,
        peopleAdded: peopleCount,
        catchUpDetails: getCatchUpDetails(),
        pwaInstalled: isPWAInstalled(),
        device: getDeviceInfo(),
        location,
        timestamp: new Date().toISOString(),
      };

      // Submit to Netlify form
      const formData = new FormData();
      formData.append('form-name', 'analytics');
      formData.append('timeSpent', `${analyticsData.timeSpent} seconds`);
      formData.append('peopleAdded', analyticsData.peopleAdded.toString());
      formData.append('catchUpDetails', analyticsData.catchUpDetails);
      formData.append('pwaInstalled', analyticsData.pwaInstalled ? 'Yes' : 'No');
      formData.append('device', analyticsData.device);
      formData.append('location', analyticsData.location);
      formData.append('timestamp', analyticsData.timestamp);

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });

      setHasSubmitted(true);
      console.log('Analytics submitted successfully');
    } catch (error) {
      console.error('Error submitting analytics:', error);
    }
  };

  useEffect(() => {
    // Submit analytics when user leaves the page
    const handleBeforeUnload = () => {
      submitAnalytics();
    };

    // Submit analytics after 30 seconds on the page
    const timeoutId = setTimeout(() => {
      submitAnalytics();
    }, 30000);

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(timeoutId);
    };
  }, []);

  // Also submit when user adds their first person
  const trackPersonAdded = () => {
    const storedPeople = localStorage.getItem('catchUpPeople');
    const peopleCount = storedPeople ? JSON.parse(storedPeople).length : 0;
    
    // Submit analytics when they add their first person
    if (peopleCount === 1 && !hasSubmitted) {
      setTimeout(() => submitAnalytics(), 2000);
    }
  };

  return { submitAnalytics, trackPersonAdded };
};

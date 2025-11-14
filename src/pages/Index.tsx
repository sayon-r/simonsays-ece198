import { useEffect, useState } from "react";
import { Activity, Thermometer, Droplets, Zap } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { RealtimeChart } from "@/components/RealtimeChart";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface LatestReading {
  sensor_type: string;
  value: number;
  unit: string;
}

const Index = () => {
  const [latestReadings, setLatestReadings] = useState<LatestReading[]>([]);

  useEffect(() => {
    const fetchLatestReadings = async () => {
      const { data } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        // Get latest reading for each sensor type
        const readingsByType = data.reduce((acc, reading) => {
          if (!acc[reading.sensor_type]) {
            acc[reading.sensor_type] = {
              sensor_type: reading.sensor_type,
              value: Number(reading.value),
              unit: reading.unit || '',
            };
          }
          return acc;
        }, {} as Record<string, LatestReading>);

        setLatestReadings(Object.values(readingsByType));
      }
    };

    fetchLatestReadings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('latest-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
        },
        () => {
          fetchLatestReadings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSensorIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      temperature: <Thermometer className="h-6 w-6" />,
      humidity: <Droplets className="h-6 w-6" />,
      voltage: <Zap className="h-6 w-6" />,
    };
    return iconMap[type.toLowerCase()] || <Activity className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold glow-text">Arduino Sensor Dashboard</h1>
          <p className="text-muted-foreground">Real-time data visualization from your Arduino sensors</p>
        </div>

        {/* API Endpoint Card */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-2">Arduino Setup</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Send data from your Arduino using HTTP POST requests to:
          </p>
          <code className="block bg-secondary p-3 rounded-lg text-sm text-primary font-mono overflow-x-auto">
            https://pjkrvjwyojzjkwyrpbwo.supabase.co/functions/v1/arduino-data
          </code>
          <p className="text-xs text-muted-foreground mt-4">
            Example payload: <code className="text-accent">{"{ \"sensor_type\": \"temperature\", \"value\": 25.5, \"unit\": \"°C\" }"}</code>
          </p>
        </Card>

        {/* Sensor Cards Grid */}
        {latestReadings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestReadings.map((reading) => (
              <SensorCard
                key={reading.sensor_type}
                title={reading.sensor_type.charAt(0).toUpperCase() + reading.sensor_type.slice(1)}
                value={reading.value.toFixed(2)}
                unit={reading.unit}
                icon={getSensorIcon(reading.sensor_type)}
                trend="stable"
              />
            ))}
          </div>
        )}

        {/* Charts Grid */}
        {latestReadings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {latestReadings.map((reading) => (
              <RealtimeChart
                key={`chart-${reading.sensor_type}`}
                sensorType={reading.sensor_type}
                title={`${reading.sensor_type.charAt(0).toUpperCase() + reading.sensor_type.slice(1)} Over Time`}
                chartType={reading.sensor_type.toLowerCase() === 'temperature' ? 'area' : 'line'}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {latestReadings.length === 0 && (
          <Card className="glass-card p-12 text-center">
            <Activity className="h-16 w-16 mx-auto text-primary mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground">
              Waiting for Arduino to send sensor data...
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
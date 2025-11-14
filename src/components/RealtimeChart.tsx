import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface ChartDataPoint {
  time: string;
  value: number;
}

interface RealtimeChartProps {
  sensorType: string;
  title: string;
  chartType?: "line" | "area";
}

export const RealtimeChart = ({ sensorType, title, chartType = "area" }: RealtimeChartProps) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      const { data: readings } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('sensor_type', sensorType)
        .order('created_at', { ascending: false })
        .limit(20);

      if (readings) {
        const chartData = readings.reverse().map(reading => ({
          time: new Date(reading.created_at).toLocaleTimeString(),
          value: Number(reading.value),
        }));
        setData(chartData);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sensor-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `sensor_type=eq.${sensorType}`,
        },
        (payload) => {
          const newReading = payload.new as any;
          setData(prev => {
            const newData = [...prev, {
              time: new Date(newReading.created_at).toLocaleTimeString(),
              value: Number(newReading.value),
            }];
            // Keep only last 20 readings
            return newData.slice(-20);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sensorType]);

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name={title}
            />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${sensorType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill={`url(#gradient-${sensorType})`}
              strokeWidth={2}
              name={title}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

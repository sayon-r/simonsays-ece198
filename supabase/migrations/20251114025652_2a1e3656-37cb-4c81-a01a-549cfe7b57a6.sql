-- Create sensor_readings table to store Arduino data
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_sensor_readings_created_at ON public.sensor_readings(created_at DESC);
CREATE INDEX idx_sensor_readings_sensor_type ON public.sensor_readings(sensor_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for frontend to display data)
CREATE POLICY "Allow public read access" ON public.sensor_readings
  FOR SELECT
  USING (true);

-- Create policy to allow public insert access (for Arduino to send data)
CREATE POLICY "Allow public insert access" ON public.sensor_readings
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for live updates
ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
const SUPABASE_URL = "https://hqsuxsdseipyhatpxukw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxc3V4c2RzZWlweWhhdHB4dWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzIzNDcsImV4cCI6MjA3NjgwODM0N30.F3oT7yNDVfr-23fwcVTZcUX6OFZzgK9Twr7VebCvRIw";

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
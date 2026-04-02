// 共用 Supabase client，所有頁面 import 這個
export const supabase = window.supabase.createClient(
  'https://ouqvgowpjivtriymntfs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cXZnb3dwaml2dHJpeW1udGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTI1MzEsImV4cCI6MjA5MDYyODUzMX0.X7eBWavBvOu71yQ9dcO448vFhLCBUzeHfnuBUbZZtRk'
);

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_PUBLIC_KEY = process.env.SUPABASE_PUBLIC_KEY || "";
let supabaseClient = null;

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
  console.warn(
    "Supabase environment variables are missing; registration submission is disabled."
  );
} else if (window.supabase && typeof window.supabase.createClient === "function") {
	supabaseClient = window.supabase.createClient(
		SUPABASE_URL,
		SUPABASE_PUBLIC_KEY
	);
} else {
	console.warn("Supabase SDK is not loaded; registration submission is disabled.");
}

window.supabaseClient = supabaseClient;
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://pmpzwpauifrivpmvaold.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcHp3cGF1aWZyaXZwbXZhb2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMjY3MjMsImV4cCI6MjEwNzgwMjcyM30.PFuP5dVYEGDBMkaP7Q_8oaghgoR3t7fbDBOKD73ZBWQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

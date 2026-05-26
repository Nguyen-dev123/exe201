import { useState } from "react";
import api from "../lib/api";

export default function TestPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      const response = await api.get("/");
      setResult("✅ Backend connected: " + JSON.stringify(response.data));
    } catch (error) {
      setResult("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/register", {
        name: "Test User",
        email: "test" + Date.now() + "@example.com",
        password: "123456",
      });
      setResult("✅ Register success: " + JSON.stringify(response.data));
    } catch (error) {
      setResult(
        "❌ Register error: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: "test@example.com",
        password: "123456",
      });
      setResult("✅ Login success: " + JSON.stringify(response.data));
    } catch (error) {
      setResult(
        "❌ Login error: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Backend Connection</h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={testBackend}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50"
          >
            Test Backend Connection
          </button>

          <button
            onClick={testRegister}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 ml-4"
          >
            Test Register
          </button>

          <button
            onClick={testLogin}
            disabled={loading}
            className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-semibold disabled:opacity-50 ml-4"
          >
            Test Login
          </button>
        </div>

        {loading && <div className="text-white/60">Loading...</div>}

        {result && (
          <div className="bg-dark-card border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Result:</h2>
            <pre className="text-sm text-white/80 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-dark-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Debug Info:</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>API URL:</strong>{" "}
              {import.meta.env.VITE_API_URL || "http://localhost:3000"}
            </p>
            <p>
              <strong>Current URL:</strong> {window.location.href}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

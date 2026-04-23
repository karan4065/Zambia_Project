import React, { useState, useEffect, useCallback } from "react";
import "./styles/App.css";
import { useNavigate } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Report from "./pages/Report";
import Student from "./pages/Student";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Hostel from "./pages/Hostel";
import Marks from "./pages/Marks";
import ProtectedRoute from "./components/ProtectedRoute";
import SessionProtectedRoute from "./components/SessionProtectedRoute";
import Search from "./pages/Search";
import Control from "./pages/Control";
import Inventory from "./pages/Inventory";
import Bus from "./pages/Bus";
import Chatbot from "./components/Chatbot";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { handleInstitutionLogo, handleInstitutionName, installmentArr, standardList } from "./store/store";
import { fetchInstallments, getAllStandards, fetchColleges, getInstitutionNameAndLogo, getAllSessions } from "./apis/api";
import { getCredentials } from "./apis/api";
import axios from "axios";

interface Auth {
  token: string;
  role: "teacher" | "admin";
  college?: string;
  username?: string;
}
const App: React.FC = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<Auth | null>(null);
  const setInstallments = useSetRecoilState(installmentArr);
  const setStandards = useSetRecoilState(standardList);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);
  const setInstitutionName = useSetRecoilState(handleInstitutionName);
  const setInstitutionLogo = useSetRecoilState(handleInstitutionLogo);
  const InstitueName = useRecoilValue(handleInstitutionName);
  const InstitueLogo = useRecoilValue(handleInstitutionLogo);

  const [sessions, setSessions] = useState<{ id: number; year: string }[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>(localStorage.getItem("selectedSession") || "");
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const loadColleges = useCallback(async () => {
    try {
      const colleges = await fetchColleges();
      setAvailableColleges(colleges);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionData = await getAllSessions();
        setSessions(sessionData);

        // If no session is selected in localStorage, pick the latest one
        if (!localStorage.getItem("selectedSession") && sessionData.length > 0) {
          const latest = sessionData[0].year;
          localStorage.setItem("selectedSession", latest);
          setSelectedSession(latest);
          // Set on backend
          await axios.get(`http://${window.location.hostname}:5000/setSession?year=${latest}`);
          window.location.reload();
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchInstitutionalData = async () => {
      const year = localStorage.getItem("selectedSession");
      const college = localStorage.getItem("userCollege");
      if (year) {
        try {
          const data = await getInstitutionNameAndLogo(year, college || undefined);
          setInstitutionName(data.Institution_name || "School");
          // Add cache buster to logo URL
          const logoUrl = data.SchoolLogo ? `${data.SchoolLogo}?t=${Date.now()}` : "";
          setInstitutionLogo(logoUrl);
        } catch (err) {
          console.error("Error fetching institution data:", err);
        }
      }
    };
    fetchInstitutionalData();

    const handler = async (e: any) => {
      const updatedYear = e?.detail?.year;
      const currentYear = localStorage.getItem("selectedSession") || "";
      // If no year specific provided, or if it matches current year, refresh
      if (!updatedYear || updatedYear === currentYear) {
        await fetchInstitutionalData();
      }
    };
    window.addEventListener('controlUpdated', handler as EventListener);
    window.addEventListener('collegesUpdated', loadColleges as EventListener);
    return () => {
      window.removeEventListener('controlUpdated', handler as EventListener);
      window.removeEventListener('collegesUpdated', loadColleges as EventListener);
    };
  }, [selectedSession, setInstitutionLogo, setInstitutionName, loadColleges]);

  const handleSessionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSession = e.target.value;
    localStorage.setItem("selectedSession", newSession);
    setSelectedSession(newSession);
    try {
      await axios.get(`http://${window.location.hostname}:5000/setSession?year=${newSession}`);
      window.location.reload();
    } catch (err) {
      console.error("Error setting session:", err);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    // Immediately restore auth state from localStorage (fast path for page refresh)
    if (token && userRole) {
      setAuth({ token, role: userRole as "teacher" | "admin" });
      setIsLoading(false);

      // Validate token in background (optional verification)
      fetchRole(token);
    } else {
      setIsLoading(false);
    }

    // populate global installments into recoil store
    (async () => {
      try {
        const data = await fetchInstallments();
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => (d.installments ? d.installments : d));
          setInstallments(mapped);
        }
      } catch (err) {
        console.error("Error fetching installments on app load:", err);
      }
    })();
    // populate global standards into recoil store
    (async () => {
      try {
        const all = await getAllStandards();
        // getAllStandards returns response.data from /control/standards
        // it may be an array of objects [{id,std,...}] or an object containing array
        let arr: any = [];
        if (Array.isArray(all)) {
          arr = all;
        } else if (all && Array.isArray(all.standard)) {
          arr = all.standard;
        }
        const mappedStandards = arr.map((s: any) => (s.std ? s.std : s));
        setStandards(mappedStandards);
      } catch (err) {
        console.error("Error fetching standards on app load:", err);
      }
    })();
    // fetch colleges for login dropdown
    loadColleges();
  }, [loadColleges]);

  const fetchRole = async (token: string) => {
    try {
      const response = await axios.post(`http://${window.location.hostname}:5000/validate-token`, { token }, {
        headers: { "Content-Type": "application/json" },
      });

      // Token is still valid, update auth state
      const data: Auth = response.data;
      setAuth(data);
    } catch (error) {
      // Background validation failed, but user is already authenticated from localStorage
      // Log the error but don't force logout
      if (axios.isAxiosError(error)) {
        console.warn("Token validation failed (background check):", error.response?.data || error.message);
      } else {
        console.warn("Token validation failed (background check):", error);
      }
      // If token validation fails, it might indicate server restart or token corruption
      // In production, you might want to prompt user to re-login on next action
    }
  };


  const login = async () => {
    const usernameElement = document.getElementById("username") as HTMLInputElement | null;
    const passwordElement = document.getElementById("password") as HTMLInputElement | null;
    const roleElement = document.getElementById("loginRole") as HTMLSelectElement | null;
    const collegeElement = document.getElementById("loginCollege") as HTMLSelectElement | null;
    
    const username = usernameElement?.value || "";
    const password = passwordElement?.value || "";
    const selectedRole = roleElement?.value || "admin";
    const selectedCollege = collegeElement?.value || "";

    if (!username || !password || !selectedCollege) {
      alert("All fields are required.");
      return;
    }

    try {
      const response = await getCredentials(username, password, selectedRole, selectedCollege);
      
      if (response.token && response.role) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("userRole", response.role);
        localStorage.setItem("username", response.username);
        localStorage.setItem("userCollege", response.college || "");
        setAuth({ ...response, role: response.role as "admin" | "teacher" });
        setIsLoading(false);
      }
      window.location.reload(); // Reload to refresh all state with new college
    } catch (error: any) {
      alert(error.message || "Login failed. Please try again.");
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    if (localStorage.getItem("selectedSession")) {
      localStorage.removeItem("selectedSession");
    }
    navigate("/");
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
        <div style={{ textAlign: "center", padding: "40px", borderRadius: "20px", background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)", boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}>
          <h2 style={{ color: "#313970", fontSize: "24px", marginBottom: "10px" }}>Loading...</h2>
          <p style={{ color: "#666" }}>Authenticating your session...</p>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh", 
        background: "radial-gradient(circle at top right, #4f46e5, transparent), radial-gradient(circle at bottom left, #7c3aed, transparent), #1e1b4b",
        fontFamily: "'Inter', sans-serif",
        padding: "20px"
      }}>
        <div style={{ 
          padding: "48px 40px", 
          borderRadius: "32px", 
          backgroundColor: "rgba(255, 255, 255, 0.98)", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          width: "100%",
          maxWidth: "440px",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle decorative element */}
          <div style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "6px", 
            background: "linear-gradient(90deg, #6366f1, #a855f7)" 
          }} />

          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ 
              fontSize: "30px", 
              fontWeight: "700", 
              color: "#1e1b4b", 
              margin: "0 0 10px 0",
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: "-0.01em" 
            }}>School Management System</h2>
            <p style={{ color: "#64748b", fontSize: "15px", fontWeight: "500" }}>Sign in to continue to your dashboard</p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>Username</label>
            <div style={{ position: "relative" }}>
              <input 
                type="text" 
                placeholder="Enter your username" 
                id="username" 
                style={{ 
                  width: "100%", 
                  padding: "14px 16px", 
                  borderRadius: "14px", 
                  border: "2px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                  fontSize: "16px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  outline: "none",
                  color: "#1e293b"
                }} 
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#f1f5f9";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              id="password" 
              style={{ 
                width: "100%", 
                padding: "14px 16px", 
                borderRadius: "14px", 
                border: "2px solid #f1f5f9",
                backgroundColor: "#f8fafc",
                fontSize: "16px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                outline: "none",
                color: "#1e293b"
              }} 
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99, 102, 241, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Role</label>
              <select 
                id="loginRole" 
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "12px", 
                  border: "2px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                  outline: "none",
                  fontWeight: "600",
                  color: "#334155"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#f1f5f9"}
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>College</label>
              <select 
                id="loginCollege" 
                defaultValue=""
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "12px", 
                  border: "2px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                  outline: "none",
                  fontWeight: "600",
                  color: "#334155"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#f1f5f9"}
              >
                <option value="" disabled>Select</option>
                {availableColleges.map((col: any) => (
                  <option key={typeof col === 'string' ? col : col.id} value={typeof col === 'string' ? col : col.name}>
                    {typeof col === 'string' ? col : col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            style={{ 
              width: "100%", 
              padding: "16px", 
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", 
              color: "white", 
              border: "none", 
              borderRadius: "16px", 
              cursor: "pointer", 
              fontSize: "16px",
              fontWeight: "700",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.4)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontFamily: "'Poppins', sans-serif"
            }}
            onClick={(e) => {
              e.preventDefault();
              login();
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 12px 20px -5px rgba(79, 70, 229, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(79, 70, 229, 0.4)";
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
          >
            Sign In
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "#313970",
          color: "white",
          height: "60px",
          padding: "10px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>BANNER ACTIVE</div>
        <button
          style={{
            fontFamily: "Times New Roman",
            fontSize: "16px",
            color: "white",
            marginTop: "0",
            padding: "0",
            border: "none",
          }}
          onClick={() => setIsNavbarOpen(!isNavbarOpen)}
        >
          {isNavbarOpen ? <div>Close</div> : <div>Open</div>}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {InstitueLogo ? (
            <img
              src={InstitueLogo}
              style={{ height: "45px", width: "auto", objectFit: "contain", borderRadius: "5px" }}
              alt="School Logo"
            />
          ) : null}
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "white", margin: 0 }}>
            {InstitueName || "School Name"}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "500" }}>Session:</label>
            <select
              value={selectedSession}
              onChange={handleSessionChange}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="" disabled style={{ color: "black" }}>Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.year} style={{ color: "black" }}>
                  {s.year}
                </option>
              ))}
            </select>
          </div>
          <div>ERP - Pallotii</div>
        </div>
      </div>

      <div className="App">
        {isNavbarOpen && <Navbar auth={auth} logout={logout} />}
        <div className="content-wrapper">
          <Routes>
            {/* If user hits /, it will redirect to /Dashboard for admin, and /Attendance for teacher */}
            <Route path="/" element={auth?.role === "admin" ? <Navigate to="/Dashboard" /> : <Navigate to="/Attendance" />} />
            <Route
              path="/Dashboard"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <Report />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Fee Incompleted Student Backup"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Report />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Student"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin", "teacher"]}>
                  <SessionProtectedRoute>
                    <Student />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Search"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin", "teacher"]}>
                  <SessionProtectedRoute>
                    <Search />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Attendance"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["teacher", "admin"]}>
                  <SessionProtectedRoute>
                    <Attendance />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Fees"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Fees />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Hostel"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Hostel />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Marks"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["teacher", "admin"]}>
                  <SessionProtectedRoute>
                    <Marks />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/control"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Control />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Inventory"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Inventory />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Bus"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Bus />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default App;

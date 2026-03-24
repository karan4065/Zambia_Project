import "./styles/App.css";
import { useState, useEffect } from "react";
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
import { fetchInstallments, getAllStandards } from "./apis/api";
import { getCredentials } from "./apis/api";
import axios from "axios";

interface Auth {
  token: string;
  role: "teacher" | "admin";
}
const App: React.FC = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<Auth | null>(null);
  const setInstallments = useSetRecoilState(installmentArr);
  const setStandards = useSetRecoilState(standardList);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);
  const InstitueName = useRecoilValue(handleInstitutionName);
  const InstitueLogo = useRecoilValue(handleInstitutionLogo);

  const [sessions, setSessions] = useState<{ id: number; year: string }[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>(localStorage.getItem("selectedSession") || "");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get("http://localhost:5000/getSessions");
        const sessionData = response.data;
        setSessions(sessionData);

        // If no session is selected in localStorage, pick the latest one
        if (!localStorage.getItem("selectedSession") && sessionData.length > 0) {
          const latest = sessionData[0].year;
          localStorage.setItem("selectedSession", latest);
          setSelectedSession(latest);
          // Set on backend
          await axios.get(`http://localhost:5000/setSession?year=${latest}`);
          window.location.reload();
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  const handleSessionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSession = e.target.value;
    localStorage.setItem("selectedSession", newSession);
    setSelectedSession(newSession);
    try {
      await axios.get(`http://localhost:5000/setSession?year=${newSession}`);
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
  }, []);

  const fetchRole = async (token: string) => {
    try {
      const response = await axios.post("http://localhost:5000/validate-token", { token }, {
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
    const username = usernameElement?.value || "";
    const password = passwordElement?.value || "";

    if (!username || !password) {
      alert("Username and password cannot be empty.");
      return;
    }

    try {
      const response = await getCredentials(username, password);
      if (response.message) {
        alert(response.message);
        return;
      }

      if (response.token && response.role) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("userRole", response.role);
        setAuth(response);
        setIsLoading(false);
      }
    } catch (error) {
      alert("Login failed. Please try again.");
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Loading...</h2>
          <p>Authenticating your session...</p>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <form className="login" action="">
        <div>
          <input className="studentInput" type="text" placeholder="Username" id="username" /><br />
          <input className="studentInput" type="password" placeholder="Password" id="password" /><br />
          <button
            onClick={(e) => {
              e.preventDefault();
              login();
            }}
          >
            Login
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: "#313970",
          color: "white",
          height: "60px",
          padding: "10px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
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
            {/* If user hits /, it will redirect to /Dashboard as home page */}
            <Route path="/" element={<Navigate to="/Dashboard" />} />
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
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                  <SessionProtectedRoute>
                    <Student />
                  </SessionProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Search"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
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

import { NavLink } from "react-router-dom";
import "../styles/navbar.css";
import { SetStateAction, useState, useEffect } from "react";
import { getCurrentSession, fetchControlConfig } from "../apis/api";
import axios from "axios";

interface NavbarProps {
  auth: { token: string; role: "teacher" | "admin" } | null;
  logout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ auth, logout }) => {
  const links = [
    { name: "Dashboard", roles: ["admin"] },

    { name: "Student", roles: ["admin"] },
    { name: "Search", roles: ["admin"] },
    { name: "Attendance", roles: ["teacher", "admin"] },
    { name: "Fees", roles: ["admin"] },
    { name: "Hostel", roles: ["admin"] },
    { name: "Marks", roles: ["teacher", "admin"] },
    { name: "Control", roles: ["admin"] },
    { name: "Inventory", roles: ["admin"] },
    { name: "Bus", roles: ["admin"] },
  ];

  // Initialize state with value from localStorage if available
  const savedSession = localStorage.getItem("selectedSession");
  const [selectYear, setSelectedYear] = useState(
    savedSession || "2024-2025"
  );
  const [years, setYears] = useState<string[]>([]);
  const [sessionSelected, setSessionSelected] = useState(!!savedSession);
  const [schoolName, setSchoolName] = useState<string>("School");

  useEffect(() => {
    // On component mount, check if there's a saved session and load available sessions
    const saved = localStorage.getItem("selectedSession");
    if (saved) {
      setSelectedYear(saved);
      setSessionSelected(true);
    }

    const loadSessions = async () => {
      try {
        const resp = await getCurrentSession();
        const data = resp.data || [];
        const yearsArr = Array.isArray(data) ? data.map((s: any) => s.year || s) : [];
        setYears(yearsArr.length ? yearsArr : ["2024-2025"]);
        // Fetch school name for saved session
        const sessionToUse = saved || yearsArr[0];
        const cfg = await fetchControlConfig(sessionToUse);
        setSchoolName(cfg?.Institution_name || "School");
      } catch (err) {
        console.error("Failed to load sessions:", err);
        setYears(["2024-2025"]);
      }
    };

    loadSessions();
    const handler = async (e: any) => {
      const updatedYear = e?.detail?.year;
      if (updatedYear && updatedYear === selectYear) {
        const cfg = await fetchControlConfig(selectYear as string);
        setSchoolName(cfg?.Institution_name || "School");
      }
    };
    window.addEventListener('controlUpdated', handler as EventListener);
    return () => window.removeEventListener('controlUpdated', handler as EventListener);
  }, []);

  const handleYearChange = (event: { target: { value: SetStateAction<string> } }) => {
    const selectedValue = event.target.value;
    setSelectedYear(selectedValue);
  };

  const submitSession = async () => {
    try {
      if (!selectYear) {
        alert("Please select a session before proceeding.");
        return;
      }

      const response = await axios.get(`http://localhost:5000/setSession`, {
        params: { year: selectYear },
      });

      if (response.status === 200) {
        alert(response.data.message);
        localStorage.setItem("selectedSession", selectYear);
        setSessionSelected(true); // Mark session as selected
        // Load control config for selected session
        const cfg = await fetchControlConfig(selectYear as string);
        setSchoolName(cfg?.Institution_name || "School");
        // Removed window.location.reload() - let React handle state update instead
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (e) {
      console.error("Error setting session:", e);
      alert("Failed to set session. Please try again later.");
    }
  };

  return (
    <div className="navbar">
      {!sessionSelected ? (
        <div className="session-warning">
          <h3 style={{color:"#AF1763"}}>Please select a <br /> session to continue.</h3>
          <label>Select Year</label>
          <select
            value={selectYear}
            onChange={handleYearChange}
            style={{ width: "150px" }}
          >
            <option value="">Select Session</option>
            {years.length==0 ? (
              <option value="2024-2025">2024-2025</option>
            ) :years.map((ele, key) => (
              <option key={key} value={ele}>
                {ele}
              </option>
            ))}
          </select>
          <button
            style={{ maxWidth: "max-content" }}
            onClick={submitSession}
          >
            Select Session
          </button>
          <button className="logout" onClick={logout}>
            Logout
          </button>
        </div>
      ) : (
        <>
          <label>Select Year</label>
          <select
            value={selectYear}
            onChange={handleYearChange}
            style={{ width: "150px" }}
          >
            {years.map((ele, key) => (
              <option key={key} value={ele}>
                {ele}
              </option>
            ))}
          </select>
          <button style={{ maxWidth: "max-content" }} onClick={submitSession}>
            Select Session
          </button>
          <ul style={{ paddingLeft: "5px" }}>
            {auth &&
              links
                .filter((link) => link.roles.includes(auth.role))
                .map((link) => (
                  <li key={`link-${link.name}`}>
                    <NavLink
                      className={({ isActive }) => (isActive ? "active" : "")}
                      to={`/${link.name}`}
                      style={{ fontSize: "20px" }}
                    >
                      {link.name}
                    </NavLink>
                  </li>
                ))}
          </ul>
          {auth && (
            <button className="logout" onClick={logout}>
              Logout
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Navbar;

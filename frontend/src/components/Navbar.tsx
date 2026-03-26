import { NavLink } from "react-router-dom";
import "../styles/navbar.css";
import { SetStateAction, useState, useEffect } from "react";
import { getCurrentSession, fetchControlConfig } from "../apis/api";
import { useSetRecoilState } from "recoil";
import { handleInstitutionName, handleInstitutionLogo } from "../store/store";
import axios from "axios";

interface NavbarProps {
  auth: { token: string; role: "teacher" | "admin" } | null;
  logout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ auth, logout }) => {
  const links = [
    { name: "Dashboard", roles: ["admin"] },
    { name: "Student", roles: ["admin", "teacher"] },
    { name: "Search", roles: ["admin", "teacher"] },
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
    savedSession || ""
  );
  const [years, setYears] = useState<string[]>([]);
  const [sessionSelected, setSessionSelected] = useState(!!savedSession);
  const setSchoolName = useSetRecoilState(handleInstitutionName);
  const setSchoolLogo = useSetRecoilState(handleInstitutionLogo);

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
        setYears(yearsArr);
        // Fetch school name and logo for saved session
        const sessionToUse = saved || yearsArr[0];
        const cfg = await fetchControlConfig(sessionToUse);
        setSchoolName(cfg?.Institution_name || "School");
        setSchoolLogo(cfg?.SchoolLogo || "");
      } catch (err) {
        console.error("Failed to load sessions:", err);
        setYears([]);
      }
    };

    loadSessions();
  }, []);

  const handleYearChange = async (event: { target: { value: SetStateAction<string> } }) => {
    const selectedValue = event.target.value;
    setSelectedYear(selectedValue);
    // preview name immediately, fetch config for this session
    try {
      const cfg = await fetchControlConfig(selectedValue as string);
      setSchoolName(cfg?.Institution_name || "School");
      setSchoolLogo(cfg?.SchoolLogo || "");
    } catch (err) {
      console.error("Failed to load config on selection change", err);
      setSchoolName("School");
    }
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
        setSchoolLogo(cfg?.SchoolLogo || "");
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
          <button style={{ width: "150px", padding: "8px", marginTop: "12px", backgroundColor: "#313970",color:"white" }} onClick={submitSession}>
            Select Session
          </button>
          <button style={{ width: "150px", padding: "8px", marginTop: "12px", backgroundColor: "#dc2626", color: "white" }} onClick={logout}>
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
          <button style={{ width: "150px", padding: "10px", marginTop: "15px", backgroundColor: "#313970", color: "white" }} onClick={submitSession}>
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
            <button style={{ width: "150px", padding: "10px", marginTop: "15px", backgroundColor: "#dc2626", color: "white" }} onClick={logout}>
              Logout
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Navbar;

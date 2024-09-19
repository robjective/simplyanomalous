// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
} from "react-router-dom";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabContent from "./TabContent";
import AnomalyDisplay from "./AnomalyDisplay";
import "./App.css";

function SupervisorRoute({ supervisors, setSelectedSupervisors }) {
  const { supervisorName, districtId } = useParams();

  const supervisor = supervisors.find(
    (sup) =>
      sup.sup_name.replace(/\s+/g, "-").toLowerCase() === supervisorName
  );

  return (
    <TabContent
      district={supervisor ? supervisor.sup_dist_num : districtId}
      setSelectedSupervisors={setSelectedSupervisors}
    />
  );
}

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("citywide");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch supervisors from an API
  useEffect(() => {
    const fetchSupervisors = async () => {
      const data = await fetch("/api/supervisors").then((res) => res.json());
      setSupervisors([
        { sup_name: "Citywide", sup_dist_num: "citywide" },
        { sup_name: "London Breed", sup_dist_num: "mayor" },
        ...data,
      ]);
    };

    fetchSupervisors();
  }, []);

  // Define the handleSupervisorChange function
  const handleSupervisorChange = (event, newSupervisor) => {
    if (newSupervisor !== null) {
      setSelectedSupervisor(newSupervisor);
    }
  };

  // Handle scrolling and show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll to the top of the page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll to the "learn-more" section
  const scrollToLearnMore = () => {
    const element = document.getElementById("learn-more");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Router>
      <div className="App p-5">
        <header>
          <div className="header-container">
            <h1>Transparent San Francisco</h1>
            <span className="badge">Beta</span>
            <p>
              Transparency and accountability through open data. <a href="#" onClick={scrollToLearnMore}>Learn More</a>
            </p>
          </div>
        </header>

        {/* Supervisor Tabs - Scrollable on Mobile */}
        <div className="supervisor-tabs overflow-x-auto py-5">
          <Tabs
            value={supervisors.some((sup) => sup.sup_dist_num === selectedSupervisor) ? selectedSupervisor : "citywide"}
            onChange={handleSupervisorChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="supervisor selection"
            // Custom styles for the Tabs container
            sx={{
              "& .MuiTabs-scrollButtons": {
                display: "flex",
                alignItems: "center",
              },
            }}
          >
            <Tab
              key="citywide"
              label={
                <div className="flex flex-col items-center">
                  <span className="text-sm">Citywide&nbsp;</span>
                  <span className="text-base">London Breed</span>
                </div>
              }
              value="citywide"
              href="/"
              // Custom styles for the Tab
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                backgroundColor: selectedSupervisor === "citywide" ? "#ADD8E6" : "#FFFFFF", // Light blue when selected, light grey otherwise
                color: selectedSupervisor === "citywide" ? "#000" : "#555", // Dark text when selected, lighter otherwise
                padding: "6px 16px",
                minHeight: "unset",
                "&.Mui-selected": {
                  backgroundColor: "#ADD8E6", // Light blue
                  color: "#000", // Black text
                },
                "&:not(.Mui-selected)": {
                  backgroundColor: "#FFFFFF", // Light grey
                  color: "#555", // Grey text
                },
                marginRight: "8px",
              }}
            />
            {supervisors
              .sort((a, b) => {
                if (a.sup_dist_num === "citywide" || a.sup_dist_num === "mayor")
                  return -1;
                if (b.sup_dist_num === "citywide" || b.sup_dist_num === "mayor")
                  return 1;
                return parseInt(a.sup_dist_num) - parseInt(b.sup_dist_num);
              })
              .map((supervisor) => (
                <Tab
                  key={supervisor.sup_dist_num}
                  label={
                    <div className="flex flex-col items-center">
                      {supervisor.sup_dist_num !== "citywide" &&
                      supervisor.sup_dist_num !== "mayor" ? (
                        <span className="text-sm">
                          {`D${parseInt(supervisor.sup_dist_num)} `}
                        </span>
                      ) : (
                        <span className="text-sm">{supervisor.sup_name}</span>
                      )}
                      <span className="text-base text-center">
                        {supervisor.sup_name}
                      </span>
                    </div>
                  }
                  value={supervisor.sup_dist_num}
                  href={
                    supervisor.sup_dist_num === "citywide" ||
                    supervisor.sup_dist_num === "mayor"
                      ? "/"
                      : `/${supervisor.sup_name
                          .replace(/\s+/g, "-")
                          .toLowerCase()}/district/${supervisor.sup_dist_num}`
                  }
                  // Custom styles for the Tab
                  sx={{
                    textTransform: "none",
                    borderRadius: "50px",
                    backgroundColor: selectedSupervisor === supervisor.sup_dist_num ? "#ADD8E6" : "#f0f0f0", // Light blue when selected, light grey otherwise
                    color: selectedSupervisor === supervisor.sup_dist_num ? "#000" : "#555", // Dark text when selected, lighter otherwise
                    padding: "6px 16px",
                    minHeight: "unset",
                    "&.Mui-selected": {
                      backgroundColor: "#ADD8E6", // Light blue
                      color: "#000", // Black text
                    },
                    "&:not(.Mui-selected)": {
                      backgroundColor: "#f0f0f0", // Light grey
                      color: "#555", // Grey text
                    },
                    marginRight: "8px",
                  }}
                />
              ))}
          </Tabs>
        </div>

        <LocationSync setSelectedSupervisor={setSelectedSupervisor} supervisors={supervisors} />

        <div className="date-selector">
          {/* Your date selector component here */}
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <TabContent
                district={null}
                setSelectedSupervisors={setSupervisors}
                activeTab="dashboard"
              />
            }
          />
          <Route
            path="/Details"
            element={
              <TabContent
                district={null}
                setSelectedSupervisors={setSupervisors}
                activeTab="details"
              />
            }
          />
          <Route path="/Trends" element={<AnomalyDisplay />} />
          <Route
            path="/:supervisorName/district/:districtId"
            element={
              <SupervisorRoute
                supervisors={supervisors}
                setSelectedSupervisors={setSupervisors}
              />
            }
          />
          <Route
            path="/:supervisorName/district/:districtId/Details"
            element={
              <SupervisorRoute
                supervisors={supervisors}
                setSelectedSupervisors={setSupervisors}
              />
            }
          />
          <Route
            path="/:supervisorName/district/:districtId/Trends"
            element={
              <SupervisorRoute
                supervisors={supervisors}
                setSelectedSupervisors={setSupervisors}
              />
            }
          />
        </Routes>

        {/* Learn More Section */}
        <div id="learn-more" className="learn-more-section py-10">
          <div id="rationale" className="rationale-section py-10">
            <h2>Our Mission</h2>
            <p>
               Our mission is to promote public accountability and improve civic discourse by making complex public data easy for everyone to access and understand. 
            </p>
          </div>

          
            <h2>About Us</h2>
            <p>
              Transparent San Francisco is an open source and community-driven project to provide insight into the performance of the city. Our project is built entirely on top of San Francisco's publicly available city data. We use advanced technology to analyze city data and spot trends. 
       
              We believe in the power of collaboration and transparency. Our source code is openly available for anyone interested in understanding how Transparent SF operates or contributing to its development. You can download the source code from our <a href="https://github.com/your-repo-link" target="_blank" rel="noopener noreferrer">GitHub repository</a> and join our community of contributors to help enhance the project.
            </p>
       

          <div id="contact" className="contact-section py-10">
            <h2>Stay Updated</h2>
            <form action="https://your-email-service.com/submit" method="POST" className="email-form">
              <label htmlFor="email">Subscribe to Updates:</label>
              <input type="email" id="email" name="email" placeholder="Your email address" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <footer>
          <nav>
            <a href="/Details">Details</a> | <a href="/Trends">Trends</a>
          </nav>
        </footer>

        {showScrollTop && (
          <button onClick={scrollToTop} className="scroll-to-top">
            ↑ Top
          </button>
        )}
      </div>
    </Router>
  );
}

// Component to handle location change
function LocationSync({ setSelectedSupervisor, supervisors }) {
  const location = useLocation();

  useEffect(() => {
    const pathParts = location.pathname.split("/");
    if (pathParts.length > 1) {
      const supervisorPart = pathParts[1];
      const selectedSupervisor = supervisors.find(
        (sup) =>
          sup.sup_name.replace(/\s+/g, "-").toLowerCase() === supervisorPart
      );
      if (selectedSupervisor) {
        setSelectedSupervisor(selectedSupervisor.sup_dist_num);
      } else if (location.pathname === "/") {
        setSelectedSupervisor("citywide");
      }
    }
  }, [location.pathname, supervisors, setSelectedSupervisor]);

  return null;
}

export default App;

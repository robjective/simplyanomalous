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
      {/* Full-width header */}
      <header className="header-full-width">
  <div className="header-container">
    <div className="header-title-container">
      <h1 className="header-title">Transparent SF</h1>
      <div className="beta-label">BETA</div>
    </div>
    <div className="subhead">
      Accountability through open data,{" "}
      <a href="#" onClick={scrollToLearnMore}>
        learn more.
      </a>
    </div>
  </div>
</header>


      {/* Full-width Tabs */}
      <div className="tabs-full-width supervisor-tabs overflow-x-auto py-5">
        <Tabs
          value={
            supervisors.some((sup) => sup.sup_dist_num === selectedSupervisor)
              ? selectedSupervisor
              : "citywide"
          }
          onChange={handleSupervisorChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="supervisor selection"
          sx={{
            "& .MuiTabs-scrollButtons": {
              display: "flex",
              alignItems: "center",
            },
          }}
        >
          {/* Tabs */}
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
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              backgroundColor:
                selectedSupervisor === "citywide" ? "#ADD8E6" : "#FFFFFF",
              color: selectedSupervisor === "citywide" ? "#000" : "#555",
              padding: "6px 16px",
              minHeight: "unset",
              "&.Mui-selected": {
                backgroundColor: "#ADD8E6",
                color: "#000",
              },
              "&:not(.Mui-selected)": {
                backgroundColor: "#FFFFFF",
                color: "#555",
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
                sx={{
                  textTransform: "none",
                  borderRadius: "50px",
                  backgroundColor:
                    selectedSupervisor === supervisor.sup_dist_num
                      ? "#ADD8E6"
                      : "#f0f0f0",
                  color:
                    selectedSupervisor === supervisor.sup_dist_num
                      ? "#000"
                      : "#555",
                  padding: "6px 16px",
                  minHeight: "unset",
                  "&.Mui-selected": {
                    backgroundColor: "#ADD8E6",
                    color: "#000",
                  },
                  "&:not(.Mui-selected)": {
                    backgroundColor: "#f0f0f0",
                    color: "#555",
                  },
                  marginRight: "8px",
                }}
              />
            ))}
        </Tabs>
      </div>

      {/* Main content with side padding */}
      <div className="main-content">
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
          {/* Learn More content */}
        </div>
      
      <div id="learn-more" className="learn-more-section py-10">
          <div id="rationale" className="rationale-section py-10">
            <h2>Transparent SF</h2>
            <p>
            Our mission is to make public data clear and easy to understand, empowering communities to hold officials accountable for their results. As an open-source project built on San Francisco's open data, we invite you to join us in building a more transparent city."
            </p>
          </div>
          <div id="rationale" className="rationale-section py-10">
          <h2>Methodology</h2>
            <p>
  The crime dashboard is powered by data from <a href="https://data.sfgov.org/">San Francisco's Open Data Portal</a>, which provides public access to various datasets for transparency. Specifically, we use the <a href="https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783">Police Incident Reports dataset</a> that records incidents reported to the police. For more detailed information on this dataset, you can visit the <a href="https://sfdigitalservices.gitbook.io/dataset-explainers/sfpd-incident-report-2018-to-present">Police Incident Data Explainer</a>.
</p>

<p>
  This dashboard shows only the initial reports of incidents, excluding any follow-ups or supplemental records, to provide a clearer view of distinct crime events. Data is filtered by date and neighborhood to easily show trends and comparisons.
</p>

<p>
  Please note that certain violent crimes, such as rape and homicide, are often kept confidential and excluded from the public dataset for privacy and safety reasons. For more accurate data on these types of crimes, refer to the official <a href="https://www.sanfranciscopolice.org/stay-safe/crime-data/compstat">CompStat Reports</a>.
</p>
          </div>
          <div id="contact" className="contact-section py-10">
            <h2>Stay Updated</h2>
            <form
              action="https://your-email-service.com/submit"
              method="POST"
              className="email-form"
            >
              <label htmlFor="email">Subscribe to Updates:</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Your email address"
                required
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer>
        <nav>
          <a href="/Details">Details</a> | <a href="/Trends">Trends</a>
        </nav>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="scroll-to-top">
          ↑ Top
        </button>
      )}
    </Router>
  );
}

export default App;

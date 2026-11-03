import React, { useState } from "react";
import api from "./api";

function ContactFiltersPage() {

  const [openSection, setOpenSection] = useState(null);

  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 31,

    minHeight: 4.7,
    maxHeight: 5.6,

    country: "Open to All",

    religion: "Hindu",

    community: "Goswami, Brahmin-Goswami",

    motherTongue: "Open to All",

    maritalStatus: "Never Married"
  });

  const [message, setMessage] = useState("");

  const toggleSection = (section) => {
    setMessage("");
    setOpenSection(
      openSection === section ? null : section
    );
  };

  const saveFilters = async (fieldName) => {
    try {
      localStorage.setItem(
        "contactFilters",
        JSON.stringify(filters)
      );
  
      setMessage(`${fieldName} updated successfully.`);
  
      // Message 15 seconds ke baad automatically hide
      setTimeout(() => {
        setMessage("");
      }, 15000);
  
    } catch (error) {
      setMessage(`Unable to update ${fieldName}.`);
  
      setTimeout(() => {
        setMessage("");
      }, 15000);
    }
  };


  /* ================= AGE ================= */

  const agePanel = (
    <div className="cf-expanded-panel">

      <p className="cf-panel-description">
        Select a minimum age range of 3 years to get relevant matches
      </p>

      <div className="cf-selected-label">
        Selected Age range
      </div>

      <div className="cf-selected-value">
        {filters.minAge} to {filters.maxAge} yrs
      </div>

      <div className="cf-range-area">

        <div className="cf-range-labels">

          <span>{filters.minAge} yrs</span>

          <span>71 yrs</span>

        </div>

        <input
          type="range"
          min="18"
          max="68"
          value={filters.minAge}
          onChange={(e) => {

            const value = Number(e.target.value);

            setFilters({
              ...filters,
              minAge: Math.min(value, filters.maxAge - 3)
            });

          }}
        />

        <input
          type="range"
          min="21"
          max="71"
          value={filters.maxAge}
          onChange={(e) => {

            const value = Number(e.target.value);

            setFilters({
              ...filters,
              maxAge: Math.max(value, filters.minAge + 3)
            });

          }}
        />

      </div>

      <div className="cf-action-row">

        <button
          className="cf-cancel-btn"
          onClick={() => setOpenSection(null)}
        >
          Cancel
        </button>

        <button
          className="cf-submit-btn"
          onClick={() => saveFilters("Age")}
        >
          Submit
        </button>

      </div>

    </div>
  );


  /* ================= HEIGHT ================= */

  const heightPanel = (
    <div className="cf-expanded-panel">

      <p className="cf-panel-description">
        Select a minimum height range of 6 inches to get relevant matches
      </p>

      <div className="cf-selected-label">
        Selected Height range
      </div>

      <div className="cf-selected-value">
        {filters.minHeight.toFixed(1).replace(".", "'")} ft
        {" to "}
        {filters.maxHeight.toFixed(1).replace(".", "'")} ft
      </div>

      <div className="cf-height-slider">

        <input
          type="range"
          min="4.5"
          max="6.5"
          step="0.1"
          value={filters.minHeight}
          onChange={(e) => {

            const value = Number(e.target.value);

            setFilters({
              ...filters,
              minHeight: Math.min(
                value,
                filters.maxHeight - 0.6
              )
            });

          }}
        />

        <input
          type="range"
          min="5.1"
          max="7"
          step="0.1"
          value={filters.maxHeight}
          onChange={(e) => {

            const value = Number(e.target.value);

            setFilters({
              ...filters,
              maxHeight: Math.max(
                value,
                filters.minHeight + 0.6
              )
            });

          }}
        />

      </div>

      <div className="cf-height-minmax">
        <span>4' 5"</span>
        <span>7' 0"</span>
      </div>

      <div className="cf-action-row">

        <button
          className="cf-cancel-btn"
          onClick={() => setOpenSection(null)}
        >
          Cancel
        </button>

        <button
          className="cf-submit-btn"
         onClick={() => saveFilters("Height")}
        >
          Submit
        </button>

      </div>

    </div>
  );


  /* ================= COUNTRY ================= */

  const countryPanel = (
    <div className="cf-expanded-panel">

      <div className="cf-selected-label">
        Selected Country
      </div>

      <div className="cf-country-box">

        <span className="cf-country-chip">
          {filters.country}

          <button
            onClick={() =>
              setFilters({
                ...filters,
                country: ""
              })
            }
          >
            ×
          </button>

        </span>

        <input
          type="text"
          placeholder="Search Country..."
          onChange={(e) => {

            if (e.target.value) {

              setFilters({
                ...filters,
                country: e.target.value
              });

            }

          }}
        />

        <span className="cf-down-arrow">
          ▾
        </span>

      </div>

      <div className="cf-action-row">

        <button
          className="cf-cancel-btn"
          onClick={() => setOpenSection(null)}
        >
          Cancel
        </button>

        <button
  className="cf-submit-btn"
  onClick={() => saveFilters("Country")}
>
  Submit
</button>

      </div>

    </div>
  );


  /* ================= NORMAL SELECT PANEL ================= */

  const selectionPanel = (
    title,
    options,
    field
  ) => (

    <div className="cf-expanded-panel">

      <div className="cf-option-list">

        {options.map((option) => (

          <button
            key={option}
            className={
              filters[field] === option
                ? "cf-option selected"
                : "cf-option"
            }
            onClick={() => {

              setFilters({
                ...filters,
                [field]: option
              });

            }}
          >

            <span className="cf-radio">

              {filters[field] === option
                ? "✓"
                : ""}

            </span>

            <span>
              {option}
            </span>

          </button>

        ))}

      </div>

      <div className="cf-action-row">

        <button
          className="cf-cancel-btn"
          onClick={() => setOpenSection(null)}
        >
          Cancel
        </button>

        <button
  className="cf-submit-btn"
  onClick={() => saveFilters(title)}
>
  Submit
</button>

      </div>

    </div>

  );


  return (

    <div className="contact-filters-page">

      <div className="contact-filters-container">


        {/* HEADER */}

        <div className="cf-page-header">

          <div className="cf-eyebrow">
            MY GOSWAMIJODI
          </div>

          <h1>
            Contact Filters
          </h1>

          <p>
            Who can contact me?
          </p>

          <p className="cf-subtitle">
            Only Members matching the below criteria will
            get to see your contact details.
          </p>

          <div className="cf-tap-text">
            Tap on the field to edit
          </div>

        </div>


        {/* MESSAGE */}

        {message && (

          <div className="cf-success-message">
            ✓ {message}
          </div>

        )}


        {/* AGE */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() => toggleSection("age")}
          >

            <span className="cf-icon age-icon">
              ▣
            </span>

            <span className="cf-section-title">
              Age
            </span>

            <span className="cf-section-value">
              {filters.minAge} - {filters.maxAge}
            </span>

            <span className="cf-arrow">
              {openSection === "age" ? "⌃" : "⌄"}
            </span>

          </button>

          {openSection === "age" && agePanel}

        </div>


        {/* HEIGHT */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() => toggleSection("height")}
          >

            <span className="cf-icon height-icon">
              ↕
            </span>

            <span className="cf-section-title">
              Height
            </span>

            <span className="cf-section-value">
  {Math.floor(filters.minHeight)}'{" "}
  {Math.round((filters.minHeight % 1) * 10)}"
  {" - "}
  {Math.floor(filters.maxHeight)}'{" "}
  {Math.round((filters.maxHeight % 1) * 10)}"
</span>

            <span className="cf-arrow">
              {openSection === "height" ? "⌃" : "⌄"}
            </span>

          </button>

          {openSection === "height" && heightPanel}

        </div>


        {/* COUNTRY */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() => toggleSection("country")}
          >

            <span className="cf-icon country-icon">
              ◉
            </span>

            <span className="cf-section-title">
              Country
            </span>

            <span className="cf-section-value">
              {filters.country || "Open to All"}
            </span>

            <span className="cf-arrow">
              {openSection === "country" ? "⌃" : "⌄"}
            </span>

          </button>

          {openSection === "country" && countryPanel}

        </div>


        {/* RELIGION */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() => toggleSection("religion")}
          >

            <span className="cf-icon religion-icon">
              ▣
            </span>

            <span className="cf-section-title">
              Religion
            </span>

            <span className="cf-section-value">
              {filters.religion}
            </span>

            <span className="cf-arrow">
              {openSection === "religion" ? "⌃" : "⌄"}
            </span>

          </button>

          {openSection === "religion" &&
            selectionPanel(
              "Religion",
              [
                "Hindu",
                "Muslim",
                "Christian",
                "Sikh",
                "Jain",
                "Buddhist",
                "Other"
              ],
              "religion"
            )
          }

        </div>


        {/* COMMUNITY */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() => toggleSection("community")}
          >

            <span className="cf-icon community-icon">
              👥
            </span>

            <span className="cf-section-title">
              Community
            </span>

            <span className="cf-section-value">
              {filters.community}
            </span>

            <span className="cf-arrow">
              {openSection === "community" ? "⌃" : "⌄"}
            </span>

          </button>

          {openSection === "community" &&
            selectionPanel(
              "Community",
              [
                "Goswami",
                "Brahmin-Goswami",
                "Brahmin"
              ],
              "community"
            )
          }

        </div>


        {/* MOTHER TONGUE */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() =>
              toggleSection("motherTongue")
            }
          >

            <span className="cf-icon tongue-icon">
              ◎
            </span>

            <span className="cf-section-title">
              Mother tongue
            </span>

            <span className="cf-section-value">
              {filters.motherTongue}
            </span>

            <span className="cf-arrow">
              {openSection === "motherTongue"
                ? "⌃"
                : "⌄"}
            </span>

          </button>

          {openSection === "motherTongue" &&
            selectionPanel(
              "Mother tongue",
              [
                "Open to All",
                "Hindi",
                "English",
                "Gujarati",
                "Marathi",
                "Bengali",
                "Punjabi",
                "Rajasthani"
              ],
              "motherTongue"
            )
          }

        </div>


        {/* MARITAL STATUS */}

        <div className="cf-section">

          <button
            className="cf-section-header"
            onClick={() =>
              toggleSection("maritalStatus")
            }
          >

            <span className="cf-icon marital-icon">
              👥
            </span>

            <span className="cf-section-title">
              Marital status
            </span>

            <span className="cf-section-value">
              {filters.maritalStatus}
            </span>

            <span className="cf-arrow">
              {openSection === "maritalStatus"
                ? "⌃"
                : "⌄"}
            </span>

          </button>

          {openSection === "maritalStatus" &&
            selectionPanel(
              "Marital status",
              [
                "Never Married",
                "Married",
                "Divorced",
                "Widowed"
              ],
              "maritalStatus"
            )
          }

        </div>


        {/* BOTTOM INFORMATION */}

        <div className="cf-bottom-note">

          Connection requests from all other Members
          will appear in the <b>Filtered out</b> folder
          of your Inbox. These members can Chat with you,
          but will not be able to see your contact details
          until you accept their request.

        </div>


      </div>

    </div>

  );
}

export default ContactFiltersPage;
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Help() {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const topics = [
    { 
      id: "profile", 
      title: "Profile & Photos",
      icon: "📸",
      content: [
        "How to add photos to your profile",
        "Profile completeness tips",
        "How to edit your biodata"
      ]
    },
    { 
      id: "membership", 
      title: "Membership & Payments",
      icon: "💳",
      content: [
        "Membership plans and pricing",
        "How to upgrade your account",
        "Payment methods accepted",
        "Refund policy"
      ]
    },
    { 
      id: "contacting", 
      title: "Contacting Members",
      icon: "💬",
      content: [
        "How to send interest",
        "Chat with matches",
        "Privacy while messaging",
        "Block/unblock users"
      ]
    },
    { 
      id: "search", 
      title: "Search & Matches",
      icon: "🔍",
      content: [
        "How to search for profiles",
        "Filter and preferences",
        "Daily match recommendations",
        "Shortlist and favorites"
      ]
    },
    { 
      id: "registration", 
      title: "Registration & Login",
      icon: "📝",
      content: [
        "How to create an account",
        "Forgot password help",
        "Verify your email",
        "Login troubleshooting"
      ]
    },
    { 
      id: "bug", 
      title: "Report Bug/Profile",
      icon: "🐛",
      content: [
        "How to report a bug",
        "Report fake profile",
        "Technical issues",
        "Feature request"
      ]
    }
  ];

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="help-page">
      <div className="help-hero">
        <div className="help-hero-content">
          <h1>Hi, how can we help you?</h1>
          <p>Enter a keyword. Eg: edit profile, phone number etc.</p>
          <div className="help-search">
            <input
              type="text"
              placeholder="Search for help topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="help-search-btn">🔍</button>
          </div>
        </div>
      </div>

      <div className="help-container">
        <h2 className="help-section-title">Popular Topics</h2>

        <div className="help-topics-grid">
          {filteredTopics.map(topic => (
            <div 
              key={topic.id} 
              className={`help-topic-card ${selectedTopic === topic.id ? 'active' : ''}`}
              onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
            >
              <div className="help-topic-header">
                <span className="help-topic-icon">{topic.icon}</span>
                <span className="help-topic-title">{topic.title}</span>
                <span className="help-topic-arrow">{selectedTopic === topic.id ? '▼' : '▶'}</span>
              </div>
              {selectedTopic === topic.id && (
                <div className="help-topic-content">
                  <ul>
                    {topic.content.map((item, index) => (
                      <li key={index}>
                        <a href="#">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="help-footer-section">
          <div className="help-footer-card">
            <h3>📋 My Requests</h3>
            <p>View status of my previous requests</p>
            <button className="help-btn-outline">View Requests</button>
          </div>

          <div className="help-footer-card">
            <h3>📧 Contact Us</h3>
            <p>Write to Customer Care</p>
            <button className="help-btn-primary">Submit a Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;
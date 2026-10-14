import React, { useState, useEffect } from 'react';

export default function ManageMembers() {
  // Setter functions
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [currentLeadId, setCurrentLeadId] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');

  // Status setter functions
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load projects and users list on startup
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Await to fetch both current projects and current users
        const [currProjects, currUsers] = await Promise.all([
          fetch('http://localhost:9000/api/projects'),
          fetch('http://localhost:9000/api/users'),
        ]);

        // Verify they were receieved
        if (currProjects.ok && currUsers.ok) {
          // Unpack the json data
          const projectsData = await currProjects.json();
          const usersData = await currUsers.json();

          // Update the class variables
          setProjects(projectsData);
          setAllUsers(usersData);
        }
      } catch (error) {
        // Update status message
        console.error('Error fetching initial data:', error);
        setStatusMessage('Error initializing component data.');
      }
    };

    fetchInitialData();
  }, []); // [] makes it so this only runs when the component mounts the dom

  // Fetch project members whenever selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([]);
      setCurrentLeadId('');
      return;
    }

    fetchProjectMembers(selectedProjectId);
  }, [selectedProjectId]);  // Runs when selectedProjectId changes

  // Fetch project members
  const fetchProjectMembers = async (projectId) => {
    // Update state variables
    setLoading(true);
    setStatusMessage('');

    try {
      // Await response and unpack response data
      const response = await fetch(`http://localhost:9000/api/projects/${projectId}/members`);
      const data = await response.json();

      // Validate response status
      if (response.ok) {
        // Update class variables upon success
        setMembers(data.members);
        setCurrentLeadId(data.leadId);
      } else {
        // Update status
        setStatusMessage(data.message || 'Failed to load project members.');
      }
    } catch (error) {
      // Update status
      console.error('Error fetching members:', error);
      setStatusMessage('Network error loading members.');
    } finally {
      // Update loading
      setLoading(false);
    }
  };

  // Function to handle the addition of a member
  const handleAddMember = async (e) => {
    // Prevent page refresh
    e.preventDefault();
    
    // If no project or user is selected, return
    if (!selectedProjectId || !selectedUserIdToAdd) return;

    // Update status message
    setStatusMessage('');
    try {
      // Await response for adding a member to project
      const response = await fetch(`http://localhost:9000/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserIdToAdd }),
      });

      // Unpack response data
      const data = await response.json();

      // Validate response status
      if (response.ok) {
        // Update class variables
        setStatusMessage('Member added successfully.');
        setSelectedUserIdToAdd('');
        fetchProjectMembers(selectedProjectId);
      } else {
        // Update status message
        setStatusMessage(data.message || 'Failed to add member.');
      }
    } catch (error) {
      // Update status message
      console.error('Error adding member:', error);
      setStatusMessage('Network error adding member.');
    }
  };

  // Function to handle removing a member from a project
  const handleRemoveMember = async (userId) => {
    // Return if no project is selected
    if (!selectedProjectId) return;

    // Clear status message
    setStatusMessage('');

    try {
      // Send a delete request and await response
      const response = await fetch(
        `http://localhost:9000/api/projects/${selectedProjectId}/members/${userId}`,
        { method: 'DELETE' }
      );

      // Unpack response data
      const data = await response.json();

      // Validate response status
      if (response.ok) {
        // Update class variables
        setStatusMessage('Member removed successfully.');
        fetchProjectMembers(selectedProjectId);
      } else {
        // Update status message
        setStatusMessage(data.message || 'Failed to remove member.');
      }
    } catch (error) {
      // Update status message
      console.error('Error removing member:', error);
      setStatusMessage('Network error removing member.');
    }
  };

  // Filter out users who are already members from the Add User dropdown
  const availableUsersToAdd = allUsers.filter(
    (user) => !members.some((member) => member._id === user._id)
  );

  return (
    <div className="manage-members-container">
      <h2>Project Membership Manager</h2>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      {/* Select Project Dropdown */}
      <div className="form-group">
        <label htmlFor="projectSelect">Select Project:</label>
        <select
          id="projectSelect"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">-- Choose a Project --</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name} ({project.status})
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && (
        <>
          {/* Add Member Section */}
          <form onSubmit={handleAddMember} className="add-member-form">
            <h3>Add Member</h3>
            <div className="form-group">
              <select
                value={selectedUserIdToAdd}
                onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                required
              >
                <option value="">-- Select Registered User --</option>
                {availableUsersToAdd.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName} (${user.username})`
                      : user.username}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={!selectedUserIdToAdd}>
                Add to Project
              </button>
            </div>
          </form>

          {/* Current Members List */}
          <h3>Current Members</h3>
          {loading ? (
            <p>Loading members...</p>
          ) : members.length === 0 ? (
            <p>No members in this project.</p>
          ) : (
            <ul className="members-list">
              {members.map((member) => {
                const isLead = member._id === currentLeadId;
                return (
                  <li key={member._id} className="member-item">
                    <span>
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.username}{' '}
                      ({member.username}){isLead && <strong> — Project Lead</strong>}
                    </span>

                    {!isLead && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member._id)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
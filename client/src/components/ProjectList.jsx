import React, { useState, useEffect } from 'react';

export default function ProjectList() {
    // Setter functions
    const [projects, setProjects] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Runs on initialization
    useEffect(() => {
        const fetchProjectsAndUsers = async () => {
            try {
                // Fetch projects and users
                // Can fetch both by using Promise.all
                const [currProjects, currUsers] = await Promise.all([
                    fetch('http://localhost:9000/api/projects'),
                    fetch('http://localhost:9000/api/users'),
                ]);

                // Throw an error if either failed to fetch
                if (!currProjects.ok || !currUsers.ok) {
                    throw new Error('Failed to retrieve data from server.');
                }

                // Await a response for both pieces of json data
                const projectsData = await currProjects.json();
                const usersData = await currUsers.json();

                // Convert users array into a lookup map keyed by user _id
                const userDictionary = usersData.reduce((acc, user) => {
                    acc[user._id] = user;
                    return acc;
                }, {});

                // Update the setter variables
                setProjects(projectsData);
                setUsersMap(userDictionary);
            } catch (err) {
                // Update error message
                console.error('Error loading projects:', err);
                setError('Could not load projects. Please ensure the server is running.');
            } finally {
                // Update loading status
                setLoading(false);
            }
        };

        fetchProjectsAndUsers();
    }, []); // [] makes it so this only runs when the component mounts the dom

    // Helper function to get lead name from user lookup map
    const getLeadName = (leadId) => {
        // Check if lead exists
        const lead = usersMap[leadId];
        if (!lead) return 'Unknown Lead';

        // Check if both first and last name exist, then return a string
        // formatted as "Kristian Tokos (ktokos)"
        return lead.firstName && lead.lastName
            ? `${lead.firstName} ${lead.lastName} (${lead.username})`
            : lead.username;
    };

    // State displays
    if (loading) return <p className="loading">Loading projects...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="project-list-container">
            <h2>Projects Directory</h2>

            {projects.length === 0 ? (
                <p>No projects created yet.</p>
            ) : (
                <div className="project-grid">
                    {projects.map((project) => (
                        <div className="project-card" key={project._id}>
                            <div className="project-header">
                                <h3>{project.name}</h3>
                                <span className={`status-badge ${project.status.toLowerCase()}`}>
                                    {project.status}
                                </span>
                            </div>

                            <p className="project-description">{project.description}</p>

                            <div className="project-footer">
                                <strong>Project Lead:</strong> {getLeadName(project.project_lead_id)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
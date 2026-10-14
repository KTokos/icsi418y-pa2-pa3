import React, { useState, useEffect } from 'react';

export default function CreateProject() {
    // Form state with project fields
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Planning', // Default
        projectLead: '',
    });

    // Local state variables
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch registered users on component initialization
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Send request and await response and response data
                const response = await fetch('http://localhost:9000/api/users');
                const data = await response.json();

                // Validate response
                if (response.ok) {
                    setUsers(data);
                }
                else {
                    setStatusMessage('Failed to load registered users.')
                }
            }
            catch (error) {
                // Update status message upon an error
                console.error('Error fetching users:', error);
                setStatusMessage('Network error occurred while fetching users.');
            }
            finally {
                // Update loading status
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, []); // [] makes it so this runs only when the component mounts the dom

    // Change handler for inputs
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Submit project to the backend server
    const handleSubmit = async (e) => {
        // Prevent default and update statuses
        e.preventDefault();
        setSubmitting(true);
        setStatusMessage('');

        try {
            // Send form data and await response from backend
            const response = await fetch('http://localhost:9000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            // Wait to receive response data
            const data = await response.json();

            // Validate response status
            if (response.ok) {
                setStatusMessage('Project successfully created.');

                // Reset form fields
                setFormData({
                    name: '',
                    description: '',
                    status: 'Planning',
                    projectLead: '',
                });
            }
            else {
                // Update status message
                setStatusMessage(data.error || data.message ||'Project creation unsuccessful.');
            }
        }
        catch (error) {
            // Update status message
            setStatusMessage('Network error occurred while submitting project.');
        }
        finally {
            // Update submitting state
            setSubmitting(false);
        }
    };

    // Return component template
    return (
        <div className="create-project-card">
            <h2>Create New Project</h2>

            {statusMessage && <p className="status-message">{statusMessage}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Project Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="projectLead">Project Lead</label>
                    {loadingUsers ? (
                        <p>Loading registered users...</p>
                    ) : (
                        <select
                            id="projectLead"
                            name="projectLead"
                            value={formData.projectLead}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>
                                Select a Project Lead
                            </option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.firstName && user.lastName
                                        ? `${user.firstName} ${user.lastName} (${user.username})`
                                        : user.username}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <button type="submit" disabled={submitting || loadingUsers}>
                    {submitting ? 'Creating Project...' : 'Create Project'}
                </button>
            </form>
        </div>
    );
}
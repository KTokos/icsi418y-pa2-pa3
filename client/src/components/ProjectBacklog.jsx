import React, { useState, useEffect } from 'react';
import ProjectSelector from './ProjectSelector';
import StoryList from './StoryList';
import StoryForm from './StoryForm';

export default function ProjectBacklog() {
    // Main container state
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [stories, setStories] = useState([]);
    const [members, setMembers] = useState([]);
    
    // UI states
    const [loadingStories, setLoadingStories] = useState(false);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingStory, setEditingStory] = useState(null);

    // ngOnInit: Fetch all projects for the dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            const response = await fetch('http://localhost:9000/api/projects');
            if (response.ok) setProjects(await response.json());
        };
        fetchProjects();
    }, []);

    // ngOnChanges: Fetch stories & members when selected project changes
    useEffect(() => {
        if (!selectedProjectId) {
            setStories([]);
            setMembers([]);
            return;
        }

        // Clear any open forms when changing projects
        setShowForm(false);
        setEditingStory(null);
        setMessage('');

        fetchProjectData(selectedProjectId);
    }, [selectedProjectId]);

    // Extracted fetch function so we can reuse it to refresh the list after an edit/create
    const fetchProjectData = async (projectId) => {
        setLoadingStories(true);
        try {
            const [storiesRes, membersRes] = await Promise.all([
                fetch(`http://localhost:9000/api/projects/${projectId}/stories`),
                fetch(`http://localhost:9000/api/projects/${projectId}/members`)
            ]);

            if (storiesRes.ok) {
                const sData = await storiesRes.json();
                setStories(sData.stories || []);
            }
            if (membersRes.ok) {
                const mData = await membersRes.json();
                setMembers(mData.members || []);
            }
        } catch (error) {
            setMessage('Error loading project data.');
        } finally {
            setLoadingStories(false);
        }
    };

    // Event Handler: Passed down to StoryList to handle deletion
    const handleDeleteStory = async (storyId) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;

        try {
            const response = await fetch(`http://localhost:9000/api/projects/${selectedProjectId}/stories/${storyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Update local state to remove the story without needing another GET request
                setStories(stories.filter(s => s._id !== storyId));
                setMessage('Story deleted successfully.');
            }
        } catch (error) {
            setMessage('Network error deleting story.');
        }
    };

    return (
        <div className="project-backlog-container">
            <h2>Project Backlog</h2>

            {message && <p className="status-message">{message}</p>}

            {/* Child Component 1: Project Dropdown */}
            <ProjectSelector 
                projects={projects}
                selectedProjectId={selectedProjectId}
                onProjectChange={(id) => setSelectedProjectId(id)}
            />

            {selectedProjectId && (
                <>
                    {!showForm && (
                        <button 
                            className="btn-primary"
                            onClick={() => {
                                setEditingStory(null);
                                setShowForm(true);
                            }}
                        >
                            Create New User Story
                        </button>
                    )}

                    {/* Child Component 2: The Form (Only visible if showForm is true) */}
                    {showForm && (
                        <StoryForm 
                            projectId={selectedProjectId}
                            members={members}
                            initialStory={editingStory}
                            onSuccess={() => {
                                setShowForm(false);
                                setMessage('Story saved successfully!');
                                fetchProjectData(selectedProjectId); // Refresh list
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    )}

                    {/* Child Component 3: The Grid */}
                    <div className="stories-section">
                        <h3>Stories</h3>
                        <StoryList 
                            stories={stories}
                            members={members}
                            loading={loadingStories && !showForm}
                            onEdit={(story) => {
                                setEditingStory(story);
                                setShowForm(true);
                            }}
                            onDelete={handleDeleteStory}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
import React from 'react';

export default function StoryList({ stories, members, loading, onEdit, onDelete }) {
    // @Input() stories, members, loading
    // @Output() onEdit, onDelete (Functions passed from parent)

    // Helper to resolve assigned user's name for display
    const getAssignedName = (userId) => {
        if (!userId) return 'Unassigned';
        const user = members.find(m => m._id === userId);
        if (!user) return 'Unknown / Removed Member';
        
        return user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName} (${user.username})` 
            : user.username;
    };

    if (loading) return <p>Loading stories...</p>;

    if (stories.length === 0) {
        return <p>This project has no stories yet. Create one to get started!</p>;
    }

    return (
        <div className="story-grid">
            {stories.map(story => (
                <div key={story._id} className="story-card">
                    <div className="story-header">
                        <h4>{story.title}</h4>
                        <span className="badge priority">{story.priority}</span>
                        <span className="badge status">{story.status}</span>
                    </div>
                    
                    <p className="story-desc">{story.description}</p>
                    
                    <p className="story-assignee">
                        <strong>Assigned To:</strong> {getAssignedName(story.assigned_user_id)}
                    </p>
                    
                    <div className="story-actions">
                        {/* Emits the selected story back up to the parent component */}
                        <button onClick={() => onEdit(story)}>Edit</button>
                        <button onClick={() => onDelete(story._id)} className="btn-danger">
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
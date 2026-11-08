import React, { useState, useEffect } from 'react';

export default function StoryForm({ projectId, members, initialStory, onSuccess, onCancel }) {
    // @Input() projectId, members, initialStory (null if creating new)
    // @Output() onSuccess (Tells parent to refresh), onCancel (Closes form)

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Form state (similar to this.formData in Angular)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assigned_user_id: ''
    });

    // ngOnChanges equivalent: 
    // If the parent passes in an 'initialStory', update the form data to edit it.
    useEffect(() => {
        if (initialStory) {
            setFormData({
                title: initialStory.title,
                description: initialStory.description,
                priority: initialStory.priority,
                status: initialStory.status,
                assigned_user_id: initialStory.assigned_user_id || '' 
            });
        }
    }, [initialStory]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Convert empty string to null for 'Unassigned'
        const payload = {
            ...formData,
            assigned_user_id: formData.assigned_user_id === '' ? null : formData.assigned_user_id
        };

        try {
            const isEditing = !!initialStory;
            const url = isEditing 
                ? `http://localhost:9000/api/projects/${projectId}/stories/${initialStory._id}`
                : `http://localhost:9000/api/projects/${projectId}/stories`;
            
            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Emit success event to parent so it closes the form and refreshes the list
                onSuccess();
            } else {
                setMessage(data.message || 'Failed to save story.');
            }
        } catch (error) {
            setMessage('Network error while saving story.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="story-form-card">
            <h3>{initialStory ? 'Edit Story' : 'New User Story'}</h3>
            
            {message && <p className="error-message">{message}</p>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleChange}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                {/* Only allow status changes if editing an existing story */}
                {initialStory && (
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange}>
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Assigned Member</label>
                    <select name="assigned_user_id" value={formData.assigned_user_id} onChange={handleChange}>
                        <option value="">Unassigned</option>
                        {members.map(member => (
                            <option key={member._id} value={member._id}>
                                {member.firstName && member.lastName 
                                    ? `${member.firstName} ${member.lastName} (${member.username})` 
                                    : member.username}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Story'}
                    </button>
                    <button type="button" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
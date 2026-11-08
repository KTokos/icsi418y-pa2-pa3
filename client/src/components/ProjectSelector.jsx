import React from 'react';

export default function ProjectSelector({ projects, selectedProjectId, onProjectChange }) {
    // @Input() projects (Array of project objects)
    // @Input() selectedProjectId (Currently selected ID)
    // @Output() onProjectChange (Function to call when dropdown changes)

    return (
        <div className="form-group">
            <label htmlFor="projectSelect">Select Project:</label>
            <select 
                id="projectSelect"
                value={selectedProjectId} 
                onChange={(e) => onProjectChange(e.target.value)}
            >
                <option value="">-- Choose a Project --</option>
                {/* *ngFor equivalent */}
                {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>
                        {proj.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
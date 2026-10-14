require("dotenv").config();

// ---------- Setup Code ----------

// Import MongoClient and create a MongoDB client
const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");

const app = express();

// Allows Express to read JSON sent by the React application
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.listen(9000, () => {
    console.log("Server running on port 9000");
});

// Function to test MongoDB connection
async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}

// Connect to the database
connectDatabase();

// Select a database and a collection
const db = client.db("pa2");
const users = db.collection("users");
const projects = db.collection("projects");
const project_memberships = db.collection("project_memberships");

// ---------- App Logic ----------

// Function to receive POST requests at signup endpoint
app.post("/api/signup", async (req, res) => {
    const formData = req.body;

    // Log data for testing
    // console.log(formData);

    // Verify that all information was recieved
    if (formData.firstName === '') {
        res.status(400).json({
            message: "First name is required."
        });

        return;
    } else if (formData.lastName === '') {
        res.status(400).json({
            message: "Last name is required."
        });

        return;
    } else if (formData.username === '') {
        res.status(400).json({
            message: "Username is required."
        });

        return;
    } else if (formData.password === '') {
        res.status(400).json({
            message: "Password is required."
        });

        return;
    }

    // No field is empty, continue

    // Check if username already exists within database
    const user = await users.findOne({
        username: formData.username
    });
    
    if (user != null) {
        res.status(409).json({
            message: "Username already exists."
        });

        return;
    }
    // Username is unique, continue

    // Create user
    const newUser = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        password: formData.password
    }

    // Insert user into database
    await users.insertOne(newUser);

    // Find user to verify creation
    const confirmUser = await users.findOne({
        username: formData.username
    });

    // Check if user was created
    if (confirmUser != null) {
        // User was created, send success message
        res.status(201).json({
            message: "User was successfully created."
        });

        return;
    } else {
        // User was not created, send error message
        res.status(400).json({
            message: "Failed to create user, please try again."
        });

        return;
    }
});

// Function to receive POST requests at login endpoint
app.post("/api/login", async (req, res) => {
    const formData = req.body;

    // Log data for testing
    // console.log(formData);

    // Verify that all information was received
    if (formData.username === '') {
        res.status(400).json({
            message: "Username is required."
        });

        return;
    } else if (formData.password === '') {
        res.status(400).json({
            message: "Password is required."
        });

        return;
    }
    // No field is empty, continue
    
    // Check database for matching username and password
    const confirmUser = await users.findOne({
        username: formData.username,
        password: formData.password
    });

    // Verify valid credentials
    if (confirmUser != null) {
        // Correct credntials, return success
        res.status(201).json({
            message: "Successful login."
        });

        return;
    } else {
        // Invalid credentials
        res.status(400).json({
            message: "Invalid credentials, try again."
        });

        return;
    }
});

// Function to receive fetch requests at user endpoint
app.get('/api/users', async (req, res) => {
    try {
        // Get users, but exclude the password
        const _users = await users.find({}).project({ password: 0 }).toArray();
        res.status(200).json(_users);
    }
    catch (error) {
        // Return an error message if something happens
        console.error('Error fetching users:', error);
        res.status(400).json({ error: 'Serer error retrieving users' });
    }
});

// Function to receive POST requests at project endpoint
app.post("/api/projects", async (req, res) => {
    try {
        // Unpack variables from body
        const { name, description, status, projectLead } = req.body;

        // Verify all required information was provided
        if (!name || !description || !status || !projectLead) {
            return res.status(400).json({
                message: "All fields (name, description, status, project lead) are required."
            });
        }

        // Validate the format of the projectLead id
        if (!ObjectId.isValid(projectLead)) {
            return res.status(400).json({
                message: "Invalid project lead ID format."
            });
        }

        // Verify the selected project lead exists
        const existingLead = await users.findOne({ _id: new ObjectId(projectLead) });
        if (!existingLead) {
            return res.status(400).json({
                message: "Selected project lead does not exist in database."
            });
        }

        // Store the project in MongoDB
        const newProject = {
            name: name,
            description: description,
            status: status,
            project_lead_id: new ObjectId(projectLead)
        };

        // Await result of inserting the project
        const result = await projects.insertOne(newProject);

        // Return the id of the created project
        return res.status(200).json({
            message: "Project created successfully.",
            projectId: result.insertedId
        });

    } catch (error) {
        // Return an error if something happens along the way
        console.error("Error creating project:", error);
        return res.status(400).json({
            message: "Server error creating project."
        });
    }
});

// Function to receive GET requests for all projects
app.get("/api/projects", async (req, res) => {
    try {
        // Get projects and convert them to an array
        const projectList = await projects.find({}).toArray();
        res.status(200).json(projectList);
    } catch (error) {
        // Return an error if something happens
        console.error("Error fetching projects:", error);
        res.status(400).json({ error: "Server error retrieving projects." });
    }
});

// Function to retrieve current members of a project
app.get("/api/projects/:projectId/members", async (req, res) => {
    try {
        // Unpack projectId from passed parameters
        const { projectId } = req.params;

        // Validate projectId
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project ID format." });
        }

        // Create an ObjectId for projectId
        const pId = new ObjectId(projectId);

        // Find the associated project
        const project = await projects.findOne({ _id: pId });

        // Return an error if no project is found
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Find the memberships associated with the project and the userIds of the members
        const memberships = await project_memberships.find({ project_id: pId }).toArray();
        const memberUserIds = memberships.map((m) => m.user_id);

        // Ensure Project Lead is included in member list if missing from collection
        if (project.project_lead_id && !memberUserIds.some((id) => id.equals(project.project_lead_id))) {
            memberUserIds.push(project.project_lead_id);
        }

        // Find the members of the project using their ids returned from the memberships but exclude their passwords
        const membersList = await users
            .find({ _id: { $in: memberUserIds } })
            .project({ password: 0 })
            .toArray();

        // Return the leadId and project members
        res.status(200).json({
            leadId: project.project_lead_id.toString(),
            members: membersList
        });
    } catch (error) {
        // Return an error if something happens
        console.error("Error fetching project members:", error);
        res.status(500).json({ message: "Server error retrieving project members." });
    }
});

// Function to add a member to the project
app.post("/api/projects/:projectId/members", async (req, res) => {
    try {
        // Extract the projectId and userId from the parameters
        const { projectId } = req.params;
        const { userId } = req.body;

        // Validate both of them as ObjectIds
        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid project or user ID format." });
        }

        // Create the ObjectId variants
        const pId = new ObjectId(projectId);
        const uId = new ObjectId(userId);

        // Find the project associated with the pId
        const project = await projects.findOne({ _id: pId });

        // Return an error if no project is found
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Find the user associated with the uId
        const userExists = await users.findOne({ _id: uId });
        
        // Return an error if no user is found
        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

        // Determine if this user is the project lead and if there is an existing membership with this user and project already
        const isLead = project.project_lead_id.equals(uId);
        const existingMembership = await project_memberships.findOne({ project_id: pId, user_id: uId });

        // Return an error if either is true
        if (isLead || existingMembership) {
            return res.status(400).json({ message: "User is already a member of this project." });
        }

        // Else, insert the membership between the user and the project
        await project_memberships.insertOne({
            project_id: pId,
            user_id: uId
        });

        res.status(200).json({ message: "User added to project successfully." });
    } catch (error) {
        // Return an error if something happens
        console.error("Error adding member:", error);
        res.status(400).json({ message: "Server error adding member." });
    }
});

// Function to remove a non-lead member from a project
app.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    try {
        // Extract the projectId and userId from the parameters
        const { projectId, userId } = req.params;

        // Validate them both as ObjectIds
        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid project or user ID format." });
        }
    
        // Convert them both into ObjectIds
        const pId = new ObjectId(projectId);
        const uId = new ObjectId(userId);

        // Find the project associated with the pId
        const project = await projects.findOne({ _id: pId });

        // Return an error if no project is found
        if (!project) {
            return res.status(400).json({ message: "Project not found." });
        }

        // Prevent removing the Project Lead
        if (project.project_lead_id.equals(uId)) {
            return res.status(400).json({ message: "The Project Lead cannot be removed from project membership." });
        }

        // Await deleting the membership between the project and the user
        await project_memberships.deleteOne({ project_id: pId, user_id: uId });

        res.status(200).json({ message: "Member removed from project successfully." });
    } catch (error) {
        // Return an error if something happens
        console.error("Error removing member:", error);
        res.status(500).json({ message: "Server error removing member." });
    }
});
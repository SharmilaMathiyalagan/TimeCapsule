const express = require("express");
const path = require("path");
const fs = require("fs"); // Import the Node.js File System module

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "db.json"); // Define the path to our database file

// --- Middleware ---
// Use express.json() for parsing JSON request bodies
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// --- Helper Functions ---
/**
 * Reads capsules from the database file.
 * @returns {Array} An array of capsule objects.
 */
const readCapsulesFromFile = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      // If the file is empty, JSON.parse will throw an error, so handle it.
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error("Error reading from database file:", error);
  }
  return []; // Return an empty array if file doesn't exist or is invalid
};

/**
 * Writes capsules to the database file.
 * @param {Array} capsules - An array of capsule objects to write.
 */
const writeCapsulesToFile = (capsules) => {
  try {
    // The 'null, 2' argument makes the JSON file nicely formatted and readable
    fs.writeFileSync(DB_FILE, JSON.stringify(capsules, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to database file:", error);
  }
};


// --- API Endpoints ---

// Endpoint to CREATE a new capsule
app.post("/api/capsules", (req, res) => {
  const { title, message, openDate } = req.body;

  if (!title || !message || !openDate) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const capsules = readCapsulesFromFile();

  const newCapsule = {
    id: Date.now(), // Simple unique ID
    title,
    message,
    openDate, // openDate from frontend should be in 'YYYY-MM-DD' format
    createdAt: new Date().toISOString()
  };
  capsules.push(newCapsule);

  writeCapsulesToFile(capsules);

  console.log("Created new capsule:", newCapsule);
  res.status(201).json(newCapsule);
});

// Endpoint to READ all capsules
app.get("/api/capsules", (req, res) => {
  const capsules = readCapsulesFromFile();
  res.json(capsules);
});

// Endpoint to DELETE a specific capsule by its ID
app.delete("/api/capsules/:id", (req, res) => {
  const { id } = req.params; // Get the ID from the URL parameter

  let capsules = readCapsulesFromFile();
  const initialLength = capsules.length;

  // Filter out the capsule with the matching ID
  // Note: capsule.id is a number, while id from req.params is a string.
  // Using '!=' performs type coercion, or you can use `parseInt(id, 10)`.
  capsules = capsules.filter(capsule => capsule.id.toString() !== id);

  if (capsules.length === initialLength) {
    return res.status(404).json({ message: "Capsule not found." });
  }

  writeCapsulesToFile(capsules);

  console.log(`Deleted capsule with ID: ${id}`);
  res.status(200).json({ message: "Capsule deleted successfully." });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
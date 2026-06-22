const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // File Upload Manager

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const SECRET_TOKEN = "sushma-admin-token-123";

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// 1. Expose the uploads folder so the website can load the images and PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. IMPORTANT FIX: Tell Node to serve your HTML files directly
// This stops you from having to double-click index.html and avoids browser security blocks
app.use(express.static(__dirname)); 

// --- FILE UPLOAD SETUP (MULTER) ---
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Gives the uploaded file a unique name using the current timestamp
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// --- API ENDPOINTS ---

// 1. Get Data (Loads your text and arrays)
app.get('/api/data', (req, res) => {
    const rawData = fs.readFileSync(DATA_FILE);
    res.json(JSON.parse(rawData));
});

// 2. Login (Checks credentials and gives the secret key)
app.post('/api/login', (req, res) => {
    const { username, email, password } = req.body;
    
    if (username === "Sushma" && email === "sushu161@gmail.com" && password === "Sushma12.") {
        res.json({ success: true, token: SECRET_TOKEN });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// 3. Save Text & Array Data (Updates your text, projects, etc.)
app.post('/api/update', (req, res) => {
    // Check security token
    if (req.body.token !== SECRET_TOKEN) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    
    // Save to data.json
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body.newData, null, 2));
    res.json({ success: true });
});

// 4. File Upload Endpoint (Handles both Profile Photo and Resume)
app.post('/api/upload/:type', upload.single('file'), (req, res) => {
    // Check security token
    if (req.body.token !== SECRET_TOKEN) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    
    // Save the file path to the database depending on what was uploaded
    if (req.params.type === 'photo') {
        data.profileImage = fileUrl;
    }
    if (req.params.type === 'resume') {
        data.resumeFile = fileUrl;
    }
    
    // Update data.json
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, fileUrl });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Backend server running perfectly!`);
    console.log(`👉 Open your browser and go to: http://localhost:${PORT}`);
});
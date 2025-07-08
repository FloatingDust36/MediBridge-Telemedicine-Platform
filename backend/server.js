const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto'); // <-- MOVED THIS REQUIRE TO THE TOP
require('dotenv').config(); // Load environment variables
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000; // Use PORT from .env or default to 5000

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key not found in .env file. Please check your .env configuration.");
    // It's good to provide context of the current directory if .env is missing
    console.error(`Current working directory: ${process.cwd()}`);
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- JaaS Configuration ---
const JAAS_APP_ID = process.env.JAAS_APP_ID;
const YOUR_JAAS_API_KEY_ID = process.env.JAAS_API_KEY_ID;
const YOUR_JAAS_PRIVATE_KEY_PATH = path.resolve(__dirname, process.env.JAAS_PRIVATE_KEY_FILENAME || 'MediBridgeConsultKey.pk');

// Check if JaaS env variables are set
if (!JAAS_APP_ID || !YOUR_JAAS_API_KEY_ID) {
    console.error("JaaS APP ID or API Key ID not found in .env file. Please check your .env configuration.");
    process.exit(1);
}

console.log('----------------------------------------------------');
console.log('Verifying Backend Environment & Key Path:');
console.log('JAAS_APP_ID (from .env):', process.env.JAAS_APP_ID);
console.log('JAAS_API_KEY_ID (from .env):', process.env.JAAS_API_KEY_ID);
console.log('JAAS_PRIVATE_KEY_FILENAME (from .env):', process.env.JAAS_PRIVATE_KEY_FILENAME);

const privateKeyPath = path.join(__dirname, process.env.JAAS_PRIVATE_KEY_FILENAME);
console.log('Calculated private key file path:', privateKeyPath);

try {
    const fileExists = fs.existsSync(privateKeyPath);
    console.log(`Private key file exists at path: ${fileExists}`);
    if (!fileExists) {
        console.error("CRITICAL ERROR: Private key file NOT FOUND at the specified path!");
    } else {
        const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
        console.log('Private key content start (first 50 chars):', privateKeyContent.substring(0, 50));
        console.log('Private key content end (last 50 chars):', privateKeyContent.slice(-50));
    }
} catch (err) {
    console.error("Error reading private key file:", err.message);
}
console.log('----------------------------------------------------');

let privateKeyContent;
try {
    privateKeyContent = fs.readFileSync(YOUR_JAAS_PRIVATE_KEY_PATH, 'utf8');
    console.log("Private key loaded successfully.");
} catch (error) {
    console.error(`Error loading private key from ${YOUR_JAAS_PRIVATE_KEY_PATH}:`, error);
    console.error("Please ensure the path is correct and the file exists in the backend folder.");
    process.exit(1);
}

// --- API Endpoint to Generate Jitsi JWT ---
app.post('/api/generate-jitsi-jwt', async (req, res) => {
    const { roomName, user_id, user_name, user_email } = req.body;

    if (!roomName || !user_id || !user_name) {
        return res.status(400).json({ error: 'Missing required parameters: roomName, user_id, user_name.' });
    }

    try {
        // --- Fetch user role from Supabase ---
        const { data: userData, error: supabaseError } = await supabase
            .from('users')
            .select('role')
            .eq('user_id', user_id)
            .single();

        if (supabaseError || !userData) {
            console.error("Supabase user fetch error:", supabaseError ? supabaseError.message : 'No data found for user ID');
            return res.status(404).json({ error: 'User not found or role could not be determined.' });
        }

        const isModerator = userData.role === 'doctor';

        const payload = {
            aud: 'jitsi',
            iss: 'chat',
            sub: JAAS_APP_ID,
            room: roomName,
            context: {
                user: {
                    id: user_id,
                    name: user_name,
                    email: user_email,
                    avatar: `https://www.gravatar.com/avatar/${user_email ? crypto.createHash('md5').update(user_email).digest('hex') : 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1'}?s=200&d=mp&r=pg`, // Uses crypto from top
                    moderator: isModerator,
                },
                features: {
                    recording: isModerator,
                    livestreaming: isModerator,
                },
            },
            exp: Math.floor(Date.now() / 1000) + (60 * 60),
            nbf: Math.floor(Date.now() / 1000) - 10,
        };

        const options = {
            algorithm: 'RS256',
            header: {
                kid: YOUR_JAAS_API_KEY_ID,
            },
        };
console.log('JWT Payload:', JSON.stringify(payload, null, 2));
console.log('JWT Options Header KID:', options.header.kid);

        const token = jwt.sign(payload, privateKeyContent, options);
        console.log("Generated JWT Token:", token);
        res.json({ jwt: token });

    } catch (error) {
        console.error("Error generating JWT:", error);
        res.status(500).json({ error: `Failed to generate JWT: ${error.message || 'Unknown error'}` });
    }
});

// --- Health Check Endpoint (Optional but Recommended) ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Backend API is healthy', timestamp: new Date().toISOString() });
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Backend API running at http://localhost:${port}`);
    console.log("Remember to start your React development server too!");
});
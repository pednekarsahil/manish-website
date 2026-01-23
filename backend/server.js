// server.js - Artify Pro Complete Platform - UPDATED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const QRCode = require('qrcode');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'pednekarsahil7@gmail.com',
        pass: process.env.EMAIL_PASS || 'fjnt rhac ccgm tktq'
    }
});

// Test email configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Fix CORS configuration
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5000', 
    'http://127.0.0.1:5500', 
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8080',
    'http://localhost:8000',
    'http://localhost:5501',
    'http://localhost:5502',
    'http://127.0.0.1:5502'
];

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Logging
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests
app.options('*', cors({
    origin: allowedOrigins,
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ==================== PATHS CONFIGURATION ====================
const projectRoot = path.join(__dirname, '..');
const frontendPath = path.join(projectRoot, 'frontend');
const backendPath = __dirname;

console.log('\n🔧 Project structure configuration:');
console.log('📁 Project Root:', projectRoot);
console.log('📁 Frontend Path:', frontendPath);
console.log('📁 Backend Path:', backendPath);

// Create frontend directory if it doesn't exist
if (!fs.existsSync(frontendPath)) {
    console.log('⚠️ Frontend directory not found, creating...');
    fs.mkdirSync(frontendPath, { recursive: true });
    
    // Create basic HTML files
    const basicHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Artify Pro</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); height: 100vh; display: flex; justify-content: center; align-items: center; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; max-width: 500px; width: 90%; }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; margin-bottom: 30px; line-height: 1.6; }
            .btn { display: inline-block; padding: 12px 30px; background: #6a11cb; color: white; text-decoration: none; border-radius: 5px; margin: 10px; transition: background 0.3s; }
            .btn:hover { background: #2575fc; }
            .status { background: #4CAF50; color: white; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Artify Pro Platform</h1>
            <div class="status">✅ Backend server is running!</div>
            <p>Welcome to Artify Pro - Complete Artist and Event Management Platform with Volunteer Support</p>
            <p>Default accounts have been created. Please check the server console for login credentials.</p>
            <div style="margin-top: 30px;">
                <a href="/choice.html" class="btn">Go to Login Selection</a>
                <a href="/artist-login.html" class="btn">Artist Login</a>
                <a href="/admin-login.html" class="btn">Admin Login</a>
                <a href="/volunteer-login.html" class="btn">Volunteer Login</a>
                <a href="/artistsignuploginchoice.html" class="btn">Artist Portal</a>
            </div>
        </div>
    </body>
    </html>`;
    
    fs.writeFileSync(path.join(frontendPath, 'index.html'), basicHTML);
}

// Serve static files
app.use(express.static(frontendPath, {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.html') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (path.extname(filePath) === '.css' || path.extname(filePath) === '.js') {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

app.use('/backend', express.static(backendPath));

// ==================== DATABASE MODELS ====================

// Email Verification Schema
const emailVerificationSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true,
        index: true
    },
    verificationCode: { 
        type: String, 
        required: true 
    },
    verificationCodeExpires: { 
        type: Date, 
        required: true 
    },
    verified: { 
        type: Boolean, 
        default: false 
    },
    attempts: { 
        type: Number, 
        default: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true 
    }
});

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

// Admin Message Schema
const adminMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    removed: { type: Boolean, default: false }
});

const AdminMessage = mongoose.model('AdminMessage', adminMessageSchema);

// Instrument QR Schema - Lifetime validity
const instrumentQRSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    instrumentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    instrumentName: { type: String, required: true },
    qrCode: { type: String, required: true },
    qrCodeData: { type: Object, required: true },
    generatedAt: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true }
});

const InstrumentQR = mongoose.model('InstrumentQR', instrumentQRSchema);

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['artist', 'admin', 'volunteer'], default: 'artist' },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String },
    profileImage: { type: String, default: '' },
    instruments: [{
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        type: { type: String },
        name: { type: String },
        yearsOfExperience: { type: Number },
        addedAt: { type: Date, default: Date.now }
    }],
    emailVerified: { type: Boolean, default: false },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected', 'active', 'inactive'] },
    artistRollId: { type: String, unique: true, sparse: true },
    volunteerId: { type: String, unique: true, sparse: true },
    qrCodes: {
        entry: { type: String, default: '' },
        generatedAt: { type: Date, default: null },
        validUntil: { type: Date, default: null }
    },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    department: { type: String },
    availability: { type: Boolean, default: true },
    hoursVolunteered: { type: Number, default: 0 },
    assignedTasks: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const User = mongoose.model('User', userSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: true },
    status: { type: String, default: 'upcoming' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artists: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        artistRollId: { type: String, required: true },
        performanceDates: [{
            date: { type: Date, required: true },
            time: { type: String, required: true },
            stage: { type: String, required: true }
        }],
        qrCode: { type: String, default: '' },
        qrValidDates: [{ type: Date }],
        status: { type: String, default: 'scheduled' },
        role: { type: String, default: 'performer' },
        performanceTime: { type: Date },
        duration: { type: Number },
        stage: { type: String }
    }],
    volunteers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String },
        assignedDate: { type: Date },
        status: { type: String, default: 'assigned' }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Admin Update Schema
const adminUpdateSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipients: { 
        type: String, 
        enum: ['all', 'selected'],
        default: 'all'
    },
    artistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const AdminUpdate = mongoose.model('AdminUpdate', adminUpdateSchema);

// Volunteer Entry Log Schema
const volunteerEntryLogSchema = new mongoose.Schema({
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteerName: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistName: { type: String, required: true },
    artistRollId: { type: String, required: true },
    entryType: { 
        type: String, 
        enum: ['entry', 'exit', 'rejected'],
        default: 'entry'
    },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    status: { 
        type: String, 
        enum: ['granted', 'rejected', 'exited'],
        default: 'granted'
    },
    reason: { type: String },
    notes: { type: String },
    performanceDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const VolunteerEntryLog = mongoose.model('VolunteerEntryLog', volunteerEntryLogSchema);

// Volunteer Instrument Check Schema
const volunteerInstrumentCheckSchema = new mongoose.Schema({
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteerName: { type: String, required: true },
    instrumentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    instrumentName: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistName: { type: String, required: true },
    artistRollId: { type: String, required: true },
    checkType: { 
        type: String, 
        enum: ['scan', 'verification', 'lost_report', 'found_report'],
        default: 'scan'
    },
    checkTime: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['checked', 'reported_lost', 'marked_found'],
        default: 'checked'
    },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const VolunteerInstrumentCheck = mongoose.model('VolunteerInstrumentCheck', volunteerInstrumentCheckSchema);

// ==================== HELPER FUNCTIONS ====================

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateArtistRollId = async () => {
    const prefix = 'ART';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const rollId = `${prefix}${timestamp}${random}`;
    
    const existing = await User.findOne({ artistRollId: rollId });
    if (existing) {
        return generateArtistRollId();
    }
    
    return rollId;
};

const generateVolunteerId = async () => {
    const prefix = 'VOL';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const volunteerId = `${prefix}${timestamp}${random}`;
    
    const existing = await User.findOne({ volunteerId });
    if (existing) {
        return generateVolunteerId();
    }
    
    return volunteerId;
};

const generateQRCode = async (data) => {
    try {
        return await QRCode.toDataURL(JSON.stringify(data));
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
};

// Generate event QR code for specific artist
const generateEventQRCode = async (artistData, eventData, validDates) => {
    try {
        const qrData = {
            type: 'event_performance',
            artistId: artistData._id,
            artistName: artistData.fullName,
            artistRollId: artistData.artistRollId,
            eventId: eventData._id,
            eventTitle: eventData.title,
            eventLocation: eventData.location,
            validDates: validDates,
            generatedAt: new Date(),
            validUntil: validDates[validDates.length - 1]
        };
        
        return await QRCode.toDataURL(JSON.stringify(qrData));
    } catch (error) {
        console.error('Event QR Code generation error:', error);
        return null;
    }
};

// Email sending function
const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const mailOptions = {
            from: `"Artify Pro" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification - Artify Pro',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(45deg, #6a11cb, #2575fc); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9ff; padding: 30px; border-radius: 0 0 10px 10px; }
                        .code { font-size: 32px; font-weight: bold; color: #6a11cb; text-align: center; margin: 30px 0; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                        .note { background: #fff5f5; border-left: 4px solid #ff6b6b; padding: 10px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎨 Artify Pro</h1>
                            <p>Complete Artist and Event Management Platform</p>
                        </div>
                        <div class="content">
                            <h2>Email Verification</h2>
                            <p>Hello,</p>
                            <p>Thank you for registering with Artify Pro. Please use the following verification code to complete your registration:</p>
                            
                            <div class="code">${verificationCode}</div>
                            
                            <p>Enter this code in the verification field on the registration page.</p>
                            
                            <div class="note">
                                <p><strong>Note:</strong> This code will expire in 10 minutes.</p>
                            </div>
                            
                            <p>If you didn't request this verification, please ignore this email.</p>
                            <p>Best regards,<br>The Artify Pro Team</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Artify Pro. All rights reserved.</p>
                            <p>This is an automated email, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}:`, info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        return false;
    }
};

// ==================== AUTHENTICATION MIDDLEWARE ====================

// Fixed authenticateToken to properly allow public routes
const authenticateToken = (req, res, next) => {
    const publicRoutes = [
        '/', 
        '/index.html', 
        '/choice.html', 
        '/artist-login.html', 
        '/artist-signup.html',
        '/admin-login.html', 
        '/volunteer-login.html',
        '/artistsignuplogin.html',
        '/artistsignuploginchoice.html',
        '/check-status.html'
    ];
    
    const apiPublicRoutes = [
        '/api/auth/login',
        '/api/auth/register/artist',
        '/api/auth/send-verification',
        '/api/auth/send-verification-code',
        '/api/auth/verify-code',
        '/api/auth/test-verification',
        '/api/debug',
        '/api/health',
        '/api/test-db'
    ];
    
    // Check if it's a public HTML route
    if (publicRoutes.includes(req.path) || 
        req.path.includes('.html') && 
        (req.path.includes('login') || 
         req.path.includes('signup') || 
         req.path.includes('choice'))) {
        console.log(`Public route access (no token needed): ${req.path}`);
        return next();
    }
    
    // Check if it's a public API route
    if (apiPublicRoutes.some(route => req.path.startsWith(route))) {
        console.log(`Public API route access: ${req.path}`);
        return next();
    }
    
    // For protected routes, check for token
    let token = null;
    
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        console.log('No token found for protected route:', req.path);
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                error: 'Access token required',
                path: req.path
            });
        }
        return res.redirect('/choice.html');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'artify-pro-secret-key-2024', (err, user) => {
        if (err) {
            console.error('Token verification error:', err.message);
            res.clearCookie('token');
            
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({ 
                    error: 'Invalid or expired token',
                    details: err.message
                });
            }
            return res.redirect('/choice.html');
        }
        req.user = user;
        console.log(`Authenticated user: ${user.username} (${user.role})`);
        next();
    });
};

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            console.log(`Access denied: User role ${req.user.role} not in required roles: ${roles.join(', ')}`);
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({ 
                    error: `Insufficient permissions. Required roles: ${roles.join(', ')}`,
                    userRole: req.user.role,
                    userId: req.user.userId
                });
            }
            return res.status(403).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Access Denied</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #ff416c; }
                        .buttons { margin-top: 30px; }
                        .btn { padding: 10px 20px; background: #6a11cb; color: white; text-decoration: none; border-radius: 5px; margin: 10px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <h1>Access Denied</h1>
                    <p>${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} privileges required.</p>
                    <div class="buttons">
                        <a href="/${req.user.role}-dashboard.html" class="btn">Go to your dashboard</a>
                        <a href="/choice.html" class="btn">Back to Login</a>
                    </div>
                </body>
                </html>
            `);
        }
        next();
    };
};

// ==================== SOCKET.IO CONFIGURATION ====================

io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    socket.on('register', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} registered for socket updates`);
    });

    socket.on('artist-performance-updated', (data) => {
        console.log('Artist performance updated:', data);
        io.to(`user-${data.artistId}`).emit('artist-performance-updated', data);
    });

    socket.on('artist-approved', (data) => {
        console.log('Artist approved:', data);
        io.to(`user-${data.artistId}`).emit('artist-approved', data);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// ==================== API ROUTES ====================

// Root route - PUBLIC
app.get('/', (req, res) => {
    console.log('Root route accessed');
    const indexPath = path.join(frontendPath, 'index.html');
    const choicePath = path.join(frontendPath, 'choice.html');
    
    if (fs.existsSync(choicePath)) {
        res.sendFile(choicePath);
    } else if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Artify Pro</title></head>
            <body>
                <h1>🎨 Artify Pro Server is Running!</h1>
                <p>Backend API is available at <code>/api/</code></p>
                <p>Default accounts have been created. Check server console for credentials.</p>
                <div style="margin: 20px;">
                    <a href="/choice.html" style="padding: 10px 20px; background: #6a11cb; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">Go to Login</a>
                    <a href="/api/debug" style="padding: 10px 20px; background: #2575fc; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">Debug Info</a>
                </div>
            </body>
            </html>
        `);
    }
});

// Helper function to serve HTML files
const serveHtml = (filename) => (req, res) => {
    const filePath = path.join(frontendPath, filename);
    if (fs.existsSync(filePath)) {
        console.log(`Serving HTML: ${filename}`);
        res.sendFile(filePath);
    } else {
        console.log(`HTML file not found: ${filename}`);
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>404 - Not Found</title></head>
            <body>
                <h1>File Not Found</h1>
                <p>The requested file ${filename} was not found on the server.</p>
                <p><a href="/">Go back to home</a></p>
            </body>
            </html>
        `);
    }
};

// Public pages - NO authentication required
app.get('/choice.html', serveHtml('choice.html'));
app.get('/artist-signup.html', serveHtml('artist-signup.html'));
app.get('/artist-login.html', serveHtml('artist-login.html'));
app.get('/volunteer-login.html', serveHtml('volunteer-login.html'));
app.get('/admin-login.html', serveHtml('admin-login.html'));
app.get('/index.html', serveHtml('index.html'));
app.get('/artistsignuplogin.html', serveHtml('artistsignuplogin.html'));
app.get('/artistsignuploginchoice.html', serveHtml('artistsignuploginchoice.html'));
app.get('/check-status.html', serveHtml('check-status.html'));

// Dashboard routes - PROTECTED
app.get('/artist-dashboard.html', authenticateToken, (req, res) => {
    console.log('Accessing artist dashboard, user role:', req.user?.role);
    if (req.user && req.user.role === 'artist') {
        serveHtml('artist-dashboard.html')(req, res);
    } else {
        res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Access Denied</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #ff416c;">Access Denied</h1>
                <p>You are not logged in as an artist.</p>
                <p>Please login as an artist to access this dashboard.</p>
                <div style="margin-top: 30px;">
                    <a href="/artist-login.html" style="padding: 10px 20px; background: #6a11cb; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Artist Login</a>
                    <a href="/choice.html" style="padding: 10px 20px; background: #2575fc; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Back to Login Selection</a>
                </div>
            </body>
            </html>
        `);
    }
});

app.get('/admin-dashboard.html', authenticateToken, (req, res) => {
    console.log('Accessing admin dashboard, user role:', req.user?.role);
    if (req.user && req.user.role === 'admin') {
        serveHtml('admin-dashboard.html')(req, res);
    } else {
        res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Access Denied</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #ff416c;">Access Denied</h1>
                <p>You are not logged in as an admin.</p>
                <p>Please login as an admin to access this dashboard.</p>
                <div style="margin-top: 30px;">
                    <a href="/admin-login.html" style="padding: 10px 20px; background: #6a11cb; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Admin Login</a>
                    <a href="/choice.html" style="padding: 10px 20px; background: #2575fc; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Back to Login Selection</a>
                </div>
            </body>
            </html>
        `);
    }
});

app.get('/volunteer-dashboard.html', authenticateToken, (req, res) => {
    console.log('Accessing volunteer dashboard, user role:', req.user?.role);
    if (req.user && req.user.role === 'volunteer') {
        serveHtml('volunteer-dashboard.html')(req, res);
    } else {
        res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Access Denied</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #ff416c;">Access Denied</h1>
                <p>You are not logged in as a volunteer.</p>
                <p>Please login as a volunteer to access this dashboard.</p>
                <div style="margin-top: 30px;">
                    <a href="/volunteer-login.html" style="padding: 10px 20px; background: #6a11cb; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Volunteer Login</a>
                    <a href="/choice.html" style="padding: 10px 20px; background: #2575fc; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">Back to Login Selection</a>
                </div>
            </body>
            </html>
        `);
    }
});

// ==================== AUTHENTICATION ROUTES ====================

// Debug endpoint - PUBLIC
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        serverTime: Date.now(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        emailConfigured: !!process.env.EMAIL_USER,
        note: 'This is a public endpoint - no authentication required'
    });
});

// Test verification endpoint - PUBLIC
app.get('/api/auth/test-verification', (req, res) => {
    res.json({
        success: true,
        message: 'Verification endpoint is working',
        endpoints: {
            sendCode: 'POST /api/auth/send-verification',
            verifyCode: 'POST /api/auth/verify-code',
            register: 'POST /api/auth/register/artist'
        },
        timestamp: new Date().toISOString()
    });
});

// Test database connection - PUBLIC
app.get('/api/test-db', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.json({
            dbStatus: 'Connected',
            userCount: userCount,
            mongooseState: mongoose.connection.readyState
        });
    } catch (error) {
        res.status(500).json({
            dbStatus: 'Error',
            error: error.message
        });
    }
});

// Send verification code - PUBLIC
app.post('/api/auth/send-verification', async (req, res) => {
    console.log('📧 Sending verification code request received at /send-verification');
    
    try {
        const { email } = req.body;

        if (!email) {
            console.log('❌ No email provided');
            return res.status(400).json({ 
                success: false,
                error: 'Email is required' 
            });
        }

        console.log(`🔍 Checking if email ${email} is already registered...`);
        
        // Check if email already exists in User collection
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`❌ Email ${email} is already registered`);
            return res.status(400).json({ 
                success: false,
                error: 'Email already registered. Please use a different email or login.' 
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(`📱 Generated verification code for ${email}: ${verificationCode}`);

        // Create new verification record
        const verification = new EmailVerification({
            email,
            verificationCode,
            verificationCodeExpires,
            verified: false,
            attempts: 0
        });

        await verification.save();
        console.log(`✅ Verification code saved to database for ${email}`);

        // Send email with verification code
        console.log(`📧 Attempting to send verification email to ${email}...`);
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (!emailSent) {
            console.log('⚠️ Could not send email, but code is generated for development');
            // Don't fail the request in development, allow manual entry of code
        }

        res.json({
            success: true,
            message: 'Verification code sent successfully',
            email: email,
            code: process.env.NODE_ENV === 'development' ? verificationCode : undefined // Only show in development
        });
        
    } catch (error) {
        console.error('❌ Error in send-verification:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to send verification code',
            details: error.message
        });
    }
});

// Also keep the existing endpoint for backward compatibility
app.post('/api/auth/send-verification-code', async (req, res) => {
    console.log('📧 Sending verification code request received at /send-verification-code');
    // Call the same function
    return await app._router.stack.find(layer => layer.route && layer.route.path === '/api/auth/send-verification').route.stack[0].handle(req, res);
});

// Verify email code - PUBLIC
app.post('/api/auth/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }

        const verification = await EmailVerification.findOne({ 
            email, 
            verificationCode: code 
        }).sort({ createdAt: -1 }); // Get the most recent verification code
        
        if (!verification) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (verification.verificationCodeExpires < new Date()) {
            return res.status(400).json({ error: 'Verification code has expired' });
        }

        if (verification.verificationCode !== code) {
            // Increment attempts
            verification.attempts += 1;
            await verification.save();
            
            if (verification.attempts >= 5) {
                await EmailVerification.deleteMany({ email });
                return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
            }
            
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Mark as verified
        verification.verified = true;
        await verification.save();

        res.json({
            success: true,
            message: 'Email verified successfully',
            email: email
        });
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint - PUBLIC (FIXED VERSION)
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt for email:', req.body.email);
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required'
            });
        }

        console.log('Looking for user with email:', email);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log(`User found: ${user.username} (${user.role})`);

        console.log('Comparing passwords...');
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log('Password valid, checking account status:', user.status);

        if (user.status === 'pending') {
            return res.status(403).json({ 
                success: false,
                error: 'Account pending approval. Please wait for admin approval.',
                status: 'pending'
            });
        }
        
        if (user.status === 'rejected') {
            return res.status(403).json({ 
                success: false,
                error: 'Account has been rejected. Please contact admin.',
                status: 'rejected'
            });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ 
                success: false,
                error: 'Account is inactive. Please contact admin.',
                status: 'inactive'
            });
        }

        console.log('Generating JWT token...');
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                role: user.role, 
                email: user.email,
                username: user.username,
                fullName: user.fullName
            },
            process.env.JWT_SECRET || 'artify-pro-secret-key-2024',
            { expiresIn: '7d' }
        );

        console.log('Token generated, setting cookie...');
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/'
        });

        console.log(`✅ Login successful for ${user.email}`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                profileImage: user.profileImage,
                status: user.status,
                artistRollId: user.artistRollId,
                volunteerId: user.volunteerId,
                department: user.department,
                instruments: user.instruments
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get current user info - PROTECTED
app.get('/api/auth/current-user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                profileImage: user.profileImage,
                status: user.status,
                artistRollId: user.artistRollId,
                volunteerId: user.volunteerId,
                department: user.department,
                instruments: user.instruments,
                bio: user.bio,
                skills: user.skills,
                availability: user.availability,
                hoursVolunteered: user.hoursVolunteered
            }
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register artist with email verification - PUBLIC
app.post('/api/auth/register/artist', async (req, res) => {
    try {
        console.log('Artist registration attempt:', req.body.email);
        const { 
            fullName, 
            email, 
            password, 
            dateOfBirth, 
            phone, 
            instruments,
            username,
            verificationCode
        } = req.body;
        
        // Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Verify email verification code
        if (verificationCode) {
            const verification = await EmailVerification.findOne({ 
                email, 
                verificationCode: verificationCode 
            }).sort({ createdAt: -1 });
            
            if (!verification) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }
            
            if (verification.verificationCodeExpires < new Date()) {
                return res.status(400).json({ error: 'Verification code has expired' });
            }
            
            if (!verification.verified) {
                return res.status(400).json({ error: 'Email not verified. Please verify your email first.' });
            }
            
            // Mark verification as used
            await EmailVerification.deleteMany({ email, verificationCode: verificationCode });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Add instrument IDs
        const formattedInstruments = instruments ? instruments.map(instrument => ({
            ...instrument,
            _id: new mongoose.Types.ObjectId()
        })) : [];
        
        const user = new User({
            username: username || email.split('@')[0],
            email,
            password: hashedPassword,
            role: 'artist',
            fullName,
            dateOfBirth: new Date(dateOfBirth),
            phone,
            instruments: formattedInstruments,
            emailVerified: verificationCode ? true : false,
            status: 'pending'
        });
        
        await user.save();
        
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role, 
                email: user.email,
                username: user.username,
                fullName: user.fullName
            },
            process.env.JWT_SECRET || 'artify-pro-secret-key-2024',
            { expiresIn: '7d' }
        );
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/'
        });
        
        console.log(`✅ Artist registered: ${email}`);
        
        res.status(201).json({
            success: true,
            message: 'Artist registered successfully. Waiting for admin approval.',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                status: user.status,
                instruments: user.instruments
            }
        });
        
    } catch (error) {
        console.error('Artist registration error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Logout route - PUBLIC
app.post('/api/auth/logout', (req, res) => {
    console.log('Logout requested');
    res.clearCookie('token', { path: '/' });
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Validate token - PROTECTED
app.get('/api/auth/validate', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// ==================== USER PROFILE ROUTES ====================

app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, phone, bio, skills, instruments } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;
        if (skills) updateData.skills = skills;
        if (instruments) updateData.instruments = instruments;
        
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search artist by Roll ID - PROTECTED (for volunteers)
app.get('/api/users/search-artist/:rollId', authenticateToken, async (req, res) => {
    try {
        const { rollId } = req.params;
        
        const artist = await User.findOne({ 
            artistRollId: rollId,
            role: 'artist'
        }).select('-password');
        
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        res.json(artist);
    } catch (error) {
        console.error('Error searching artist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== VOLUNTEER ROUTES ====================

// Get volunteer stats - PROTECTED
app.get('/api/volunteer/stats', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        
        const totalScans = await VolunteerEntryLog.countDocuments({ volunteerId });
        const entriesGranted = await VolunteerEntryLog.countDocuments({ 
            volunteerId, 
            status: 'granted' 
        });
        const artistsVerified = await VolunteerEntryLog.distinct('artistId', { volunteerId });
        const instrumentsChecked = await VolunteerInstrumentCheck.countDocuments({ volunteerId });
        
        res.json({
            success: true,
            totalScans,
            entriesGranted,
            artistsVerified: artistsVerified.length,
            instrumentsChecked
        });
    } catch (error) {
        console.error('Error getting volunteer stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search artist by Roll ID with performance check - PROTECTED
app.get('/api/volunteer/search-artist-by-roll/:rollId', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { rollId } = req.params;
        
        // Find artist by roll ID
        const artist = await User.findOne({ 
            artistRollId: rollId,
            role: 'artist'
        }).select('-password');
        
        if (!artist) {
            return res.status(404).json({ 
                success: false,
                error: 'Artist not found' 
            });
        }
        
        // Check if artist has performance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const events = await Event.find({
            'artists.userId': artist._id,
            'artists.performanceDates.date': {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('artists.userId', 'fullName artistRollId');
        
        let hasPerformanceToday = false;
        let performanceDates = [];
        
        if (events.length > 0) {
            hasPerformanceToday = true;
            events.forEach(event => {
                event.artists.forEach(artistInfo => {
                    if (artistInfo.userId._id.toString() === artist._id.toString()) {
                        artistInfo.performanceDates.forEach(pd => {
                            const perfDate = new Date(pd.date);
                            if (perfDate >= today && perfDate < tomorrow) {
                                performanceDates.push({
                                    date: pd.date,
                                    time: pd.time,
                                    stage: pd.stage
                                });
                            }
                        });
                    }
                });
            });
        }
        
        res.json({
            success: true,
            artist: {
                _id: artist._id,
                fullName: artist.fullName,
                email: artist.email,
                phone: artist.phone,
                artistRollId: artist.artistRollId,
                status: artist.status,
                instruments: artist.instruments
            },
            hasPerformanceToday,
            performanceDates
        });
    } catch (error) {
        console.error('Error searching artist by roll ID:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// Grant entry to artist - PROTECTED
app.post('/api/volunteer/grant-entry', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { artistId, artistName, artistRollId } = req.body;
        const volunteerId = req.user.userId;
        const volunteerName = req.user.fullName;
        
        // Check if artist exists
        const artist = await User.findById(artistId);
        if (!artist) {
            return res.status(404).json({ 
                success: false,
                error: 'Artist not found' 
            });
        }
        
        // Check if artist has performance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const events = await Event.find({
            'artists.userId': artistId,
            'artists.performanceDates.date': {
                $gte: today,
                $lt: tomorrow
            }
        });
        
        if (events.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Artist does not have performance scheduled for today' 
            });
        }
        
        // Create entry log
        const entryLog = new VolunteerEntryLog({
            volunteerId,
            volunteerName,
            artistId,
            artistName,
            artistRollId,
            entryType: 'entry',
            status: 'granted',
            entryTime: new Date(),
            performanceDate: today
        });
        
        await entryLog.save();
        
        // Update volunteer stats
        await User.findByIdAndUpdate(volunteerId, {
            $inc: { hoursVolunteered: 0.5 } // 0.5 hours per entry
        });
        
        res.json({
            success: true,
            message: `Entry granted to ${artistName}`,
            entryLog: {
                entryTime: entryLog.entryTime,
                artistName: entryLog.artistName,
                artistRollId: entryLog.artistRollId
            }
        });
    } catch (error) {
        console.error('Error granting entry:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// Record entry (for rejections) - PROTECTED
app.post('/api/volunteer/record-entry', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { artistId, artistName, artistRollId, status, reason } = req.body;
        const volunteerId = req.user.userId;
        const volunteerName = req.user.fullName;
        
        const entryLog = new VolunteerEntryLog({
            volunteerId,
            volunteerName,
            artistId,
            artistName,
            artistRollId,
            entryType: status === 'rejected' ? 'rejected' : 'entry',
            status: status || 'granted',
            reason,
            entryTime: new Date()
        });
        
        await entryLog.save();
        
        res.json({
            success: true,
            message: `Entry ${status === 'rejected' ? 'rejected' : 'recorded'} for ${artistName}`
        });
    } catch (error) {
        console.error('Error recording entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get instrument details - PROTECTED
app.get('/api/volunteer/instrument/:instrumentId', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { instrumentId } = req.params;
        
        // Find the instrument by ID
        const instrumentQR = await InstrumentQR.findOne({ 
            instrumentId: instrumentId 
        });
        
        if (!instrumentQR) {
            return res.status(404).json({ 
                success: false,
                error: 'Instrument not found' 
            });
        }
        
        // Get artist details
        const artist = await User.findById(instrumentQR.userId).select('fullName artistRollId');
        
        if (!artist) {
            return res.status(404).json({ 
                success: false,
                error: 'Instrument owner not found' 
            });
        }
        
        // Get instrument details from artist
        const artistWithInstruments = await User.findById(instrumentQR.userId);
        const instrument = artistWithInstruments.instruments.find(
            inst => inst._id.toString() === instrumentId
        );
        
        if (!instrument) {
            return res.status(404).json({ 
                success: false,
                error: 'Instrument details not found' 
            });
        }
        
        res.json({
            success: true,
            instrument: {
                _id: instrument._id,
                name: instrument.name,
                type: instrument.type,
                yearsOfExperience: instrument.yearsOfExperience,
                addedAt: instrument.addedAt,
                artistId: artist._id,
                artistName: artist.fullName,
                artistRollId: artist.artistRollId
            }
        });
    } catch (error) {
        console.error('Error getting instrument details:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// Report lost instrument - PROTECTED
app.post('/api/volunteer/report-lost-instrument', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { instrumentId, instrumentName, artistId, artistName } = req.body;
        const volunteerId = req.user.userId;
        const volunteerName = req.user.fullName;
        
        // Record instrument check
        const instrumentCheck = new VolunteerInstrumentCheck({
            volunteerId,
            volunteerName,
            instrumentId,
            instrumentName,
            artistId,
            artistName,
            artistRollId: req.body.artistRollId,
            checkType: 'lost_report',
            status: 'reported_lost',
            checkTime: new Date()
        });
        
        await instrumentCheck.save();
        
        res.json({
            success: true,
            message: `Instrument ${instrumentName} reported as lost`
        });
    } catch (error) {
        console.error('Error reporting lost instrument:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark instrument as found - PROTECTED
app.post('/api/volunteer/mark-found-instrument', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { instrumentId } = req.body;
        const volunteerId = req.user.userId;
        const volunteerName = req.user.fullName;
        
        // Find the instrument QR
        const instrumentQR = await InstrumentQR.findOne({ instrumentId });
        
        if (!instrumentQR) {
            return res.status(404).json({ error: 'Instrument not found' });
        }
        
        // Get artist details
        const artist = await User.findById(instrumentQR.userId).select('fullName artistRollId');
        
        // Record instrument check
        const instrumentCheck = new VolunteerInstrumentCheck({
            volunteerId,
            volunteerName,
            instrumentId,
            instrumentName: instrumentQR.instrumentName,
            artistId: instrumentQR.userId,
            artistName: artist.fullName,
            artistRollId: artist.artistRollId,
            checkType: 'found_report',
            status: 'marked_found',
            checkTime: new Date()
        });
        
        await instrumentCheck.save();
        
        res.json({
            success: true,
            message: `Instrument ${instrumentQR.instrumentName} marked as found`
        });
    } catch (error) {
        console.error('Error marking instrument as found:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get volunteer entry logs - PROTECTED
app.get('/api/volunteer/entry-logs', authenticateToken, authorizeRole('volunteer', 'admin'), async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        
        const entryLogs = await VolunteerEntryLog.find({ volunteerId })
            .sort({ entryTime: -1 })
            .limit(50);
        
        res.json({
            success: true,
            entryLogs
        });
    } catch (error) {
        console.error('Error getting entry logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get volunteers - PROTECTED (admin only)
app.get('/api/volunteers', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const volunteers = await User.find({ role: 'volunteer' })
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json(volunteers);
    } catch (error) {
        console.error('Error getting volunteers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/pending-requests', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const pendingArtists = await User.find({ 
            role: 'artist', 
            status: 'pending' 
        }).select('-password').sort({ createdAt: -1 });
        
        res.json(pendingArtists);
    } catch (error) {
        console.error('Error getting pending requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/all-artists', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const artists = await User.find({ 
            role: 'artist' 
        }).select('-password').sort({ createdAt: -1 });
        
        res.json(artists);
    } catch (error) {
        console.error('Error getting all artists:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/approve-request/:artistId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { artistId } = req.params;
        
        const artist = await User.findById(artistId);
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        // Generate Roll ID when approving
        const artistRollId = await generateArtistRollId();
        
        artist.status = 'approved';
        artist.artistRollId = artistRollId;
        artist.updatedAt = new Date();
        
        const entryQRData = {
            type: 'entry',
            artistId: artist._id,
            name: artist.fullName,
            rollId: artistRollId,
            timestamp: Date.now()
        };
        
        const entryQRCode = await generateQRCode(entryQRData);
        
        artist.qrCodes = {
            entry: entryQRCode,
            generatedAt: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        };
        
        // Generate QR codes for existing instruments with lifetime validity
        if (artist.instruments && artist.instruments.length > 0) {
            for (const instrument of artist.instruments) {
                const instrumentQRData = {
                    type: 'instrument',
                    artistId: artist._id,
                    artistName: artist.fullName,
                    instrumentId: instrument._id,
                    instrumentName: instrument.name,
                    instrumentType: instrument.type,
                    rollId: artistRollId,
                    timestamp: Date.now()
                };
                
                const qrCode = await generateQRCode(instrumentQRData);
                
                // Set lifetime validity (far future date)
                const farFutureDate = new Date('2100-01-01');
                
                const instrumentQR = new InstrumentQR({
                    userId: artist._id,
                    instrumentId: instrument._id,
                    instrumentName: instrument.name,
                    qrCode: qrCode,
                    qrCodeData: instrumentQRData,
                    validUntil: farFutureDate  // Lifetime validity
                });
                
                await instrumentQR.save();
            }
        }
        
        await artist.save();
        
        // Create notification for artist
        const notification = new Notification({
            userId: artist._id,
            title: 'Account Approved!',
            message: `Your artist account has been approved. Your Artist Roll ID is: ${artistRollId}`,
            type: 'success'
        });
        await notification.save();
        
        io.emit('artist-approved', { artistId: artist._id });
        
        // Emit socket event for artist dashboard update
        io.to(`user-${artist._id}`).emit('artist-performance-visible', {
            artistName: artist.fullName,
            artistRollId: artistRollId,
            status: 'approved'
        });
        
        res.json({ 
            success: true, 
            message: 'Artist approved successfully',
            artist: {
                id: artist._id,
                fullName: artist.fullName,
                email: artist.email,
                status: artist.status,
                artistRollId: artist.artistRollId
            }
        });
        
    } catch (error) {
        console.error('Error approving artist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/reject-request/:artistId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { artistId } = req.params;
        const { reason } = req.body;
        
        const artist = await User.findById(artistId);
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        artist.status = 'rejected';
        artist.updatedAt = new Date();
        await artist.save();
        
        // Create notification for artist
        const notification = new Notification({
            userId: artist._id,
            title: 'Account Rejected',
            message: `Your artist account has been rejected. ${reason ? 'Reason: ' + reason : ''}`,
            type: 'error'
        });
        await notification.save();
        
        res.json({ 
            success: true, 
            message: 'Artist rejected successfully' 
        });
        
    } catch (error) {
        console.error('Error rejecting artist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/dashboard-stats', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const totalArtists = await User.countDocuments({ role: 'artist' });
        const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalEvents = await Event.countDocuments();
        const pendingArtists = await User.countDocuments({ role: 'artist', status: 'pending' });
        const activeArtists = await User.countDocuments({ role: 'artist', status: { $in: ['approved', 'active'] } });
        
        res.json({
            totalArtists,
            totalVolunteers,
            totalAdmins,
            totalEvents,
            pendingArtists,
            activeArtists
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== EVENT MANAGEMENT ROUTES ====================

// Get all events with artist details - PROTECTED
app.get('/api/events', authenticateToken, async (req, res) => {
    try {
        const events = await Event.find()
            .populate('artists.userId', 'fullName profileImage artistRollId')
            .populate('volunteers.userId', 'fullName volunteerId')
            .populate('organizer', 'fullName')
            .sort({ startDate: 1 });
        
        res.json(events);
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create event with performance dates - PROTECTED
app.post('/api/events', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { 
            title, 
            description, 
            location, 
            artistId, 
            artistRollId, 
            performanceDates, 
            eventDates 
        } = req.body;
        
        if (!title || !description || !location || !artistId || !artistRollId || !performanceDates || !eventDates) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }
        
        // Check if artist exists and has roll ID
        const artist = await User.findById(artistId);
        if (!artist || artist.role !== 'artist') {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        if (!artist.artistRollId) {
            return res.status(400).json({ error: 'Artist does not have a Roll ID. Please approve the artist account first.' });
        }
        
        // Convert date strings to Date objects
        const validDates = performanceDates.map(date => new Date(date));
        const startDate = new Date(Math.min(...validDates));
        const endDate = new Date(Math.max(...validDates));
        
        // Create event
        const event = new Event({
            title,
            description,
            location,
            startDate,
            endDate,
            organizer: req.user.userId,
            artists: [{
                userId: artistId,
                artistRollId: artistRollId,
                performanceDates: eventDates.map(eventDate => ({
                    date: new Date(eventDate.date),
                    time: eventDate.time,
                    stage: eventDate.stage
                })),
                qrValidDates: validDates,
                status: 'scheduled'
            }],
            status: 'upcoming'
        });
        
        await event.save();
        
        // Generate QR code for the artist for this event
        const qrCode = await generateEventQRCode(artist, event, validDates);
        
        // Update event with QR code
        event.artists[0].qrCode = qrCode;
        await event.save();
        
        // Create notification for artist
        const notification = new Notification({
            userId: artistId,
            title: 'New Performance Scheduled!',
            message: `You have been scheduled for a performance on ${validDates.map(d => new Date(d).toLocaleDateString()).join(', ')}`,
            type: 'info'
        });
        await notification.save();
        
        // Emit socket event for artist dashboard update
        io.emit('artist-performance-updated', {
            artistId: artistId,
            artistName: artist.fullName,
            rollId: artist.artistRollId,
            performanceDates: eventDates,
            hasPerformance: true
        });
        
        res.status(201).json({
            success: true,
            message: 'Event scheduled successfully',
            event: {
                id: event._id,
                title: event.title,
                dates: validDates
            }
        });
        
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Delete event - PROTECTED
app.delete('/api/events/:eventId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        await Event.findByIdAndDelete(eventId);
        
        res.json({ 
            success: true, 
            message: 'Event deleted successfully' 
        });
        
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== ARTIST DASHBOARD ROUTES ====================

// Get artist performances with roll ID - PROTECTED
app.get('/api/artist/performances', authenticateToken, authorizeRole('artist'), async (req, res) => {
    try {
        const artistId = req.user.userId;
        
        const artist = await User.findById(artistId).select('fullName artistRollId status');
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        // Only show performances if account is approved and has roll ID
        if (artist.status !== 'approved' && artist.status !== 'active') {
            return res.json({
                success: true,
                performances: [],
                message: 'Performances will appear after your account is approved and scheduled for events.'
            });
        }
        
        const events = await Event.find({ 
            'artists.userId': artistId 
        })
        .populate('artists.userId', 'fullName artistRollId')
        .populate('organizer', 'fullName')
        .sort({ startDate: 1 });
        
        const performances = events.map(event => {
            const artistInfo = event.artists.find(a => a.userId.toString() === artistId);
            
            return {
                eventId: event._id,
                title: event.title,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                location: event.location,
                status: event.status,
                performanceDates: artistInfo?.performanceDates || [],
                artistName: artist.fullName,
                artistRollId: artist.artistRollId || 'N/A',
                organizer: event.organizer ? event.organizer.fullName : 'Unknown',
                stage: artistInfo?.stage || 'TBA',
                performanceTime: artistInfo?.performanceDates && artistInfo.performanceDates.length > 0 
                    ? `${artistInfo.performanceDates[0].date} ${artistInfo.performanceDates[0].time}`
                    : 'TBA'
            };
        });
        
        res.json({
            success: true,
            performances
        });
    } catch (error) {
        console.error('Error getting artist performances:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get artist's instruments - PROTECTED
app.get('/api/artist/instruments', authenticateToken, authorizeRole('artist'), async (req, res) => {
    try {
        const artist = await User.findById(req.user.userId).select('instruments');
        
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        const instruments = artist.instruments.map(instrument => ({
            name: instrument.name,
            type: instrument.type
        }));
        
        res.json({
            success: true,
            instruments
        });
    } catch (error) {
        console.error('Error getting artist instruments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add instrument for artist with lifetime QR code - PROTECTED
app.post('/api/artist/instruments', authenticateToken, authorizeRole('artist'), async (req, res) => {
    try {
        const { type, name, yearsOfExperience } = req.body;
        
        if (!type || !name) {
            return res.status(400).json({ error: 'Instrument type and name are required' });
        }
        
        const artist = await User.findById(req.user.userId);
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        
        if (artist.status !== 'approved' && artist.status !== 'active') {
            return res.status(403).json({ 
                error: 'Only approved artists can add instruments',
                status: artist.status 
            });
        }
        
        const newInstrument = {
            _id: new mongoose.Types.ObjectId(),
            type,
            name,
            yearsOfExperience: yearsOfExperience || 0,
            addedAt: new Date()
        };
        
        artist.instruments.push(newInstrument);
        await artist.save();
        
        // Generate QR code for the new instrument with lifetime validity
        const instrumentQRData = {
            type: 'instrument',
            artistId: artist._id,
            artistName: artist.fullName,
            instrumentId: newInstrument._id,
            instrumentName: newInstrument.name,
            instrumentType: newInstrument.type,
            rollId: artist.artistRollId,
            timestamp: Date.now()
        };
        
        const qrCode = await generateQRCode(instrumentQRData);
        
        // Set lifetime validity (far future date)
        const farFutureDate = new Date('2100-01-01');
        
        const instrumentQR = new InstrumentQR({
            userId: artist._id,
            instrumentId: newInstrument._id,
            instrumentName: newInstrument.name,
            qrCode: qrCode,
            qrCodeData: instrumentQRData,
            validUntil: farFutureDate  // Lifetime validity
        });
        
        await instrumentQR.save();
        
        res.json({
            success: true,
            message: 'Instrument added successfully',
            instrument: {
                name: newInstrument.name,
                type: newInstrument.type
            }
        });
    } catch (error) {
        console.error('Error adding instrument:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get artist's instrument QR codes with lifetime validity - PROTECTED
app.get('/api/artist/instrument-qrcodes', authenticateToken, authorizeRole('artist'), async (req, res) => {
    try {
        const artistId = req.user.userId;
        
        const instrumentQRs = await InstrumentQR.find({ 
            userId: artistId 
        }).sort({ generatedAt: -1 });
        
        // Modify response to show lifetime validity
        const instrumentQRsWithLifetime = instrumentQRs.map(qr => ({
            instrumentId: qr.instrumentId,
            instrumentName: qr.instrumentName,
            qrCode: qr.qrCode,
            validUntil: 'Lifetime',
            isLifetime: true
        }));
        
        res.json({
            success: true,
            instrumentQRs: instrumentQRsWithLifetime
        });
    } catch (error) {
        console.error('Error getting instrument QR codes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get artist dashboard info - PROTECTED
app.get('/api/artist/dashboard-info', authenticateToken, authorizeRole('artist'), async (req, res) => {
    try {
        const artist = await User.findById(req.user.userId).select('-password');
        const events = await Event.find({ 'artists.userId': req.user.userId })
            .populate('artists.userId', 'fullName')
            .sort({ startDate: 1 });
        
        const notifications = await Notification.find({ 
            userId: req.user.userId,
            read: false 
        }).sort({ createdAt: -1 }).limit(5);
        
        // Get instrument QR codes
        const instrumentQRs = await InstrumentQR.find({ 
            userId: req.user.userId 
        }).sort({ generatedAt: -1 });
        
        // Get admin messages
        const adminMessages = await AdminMessage.find({ 
            userId: req.user.userId,
            removed: false 
        }).sort({ date: -1 }).limit(10);
        
        // Get admin updates
        const adminUpdates = await AdminUpdate.find({
            $or: [
                { recipients: 'all' },
                { recipients: 'selected', artistIds: req.user.userId }
            ]
        })
        .populate('adminId', 'fullName')
        .sort({ createdAt: -1 })
        .limit(5);
        
        res.json({
            artist,
            upcomingEvents: events.filter(event => event.startDate > new Date()),
            pastEvents: events.filter(event => event.startDate <= new Date()),
            notifications,
            instrumentQRs,
            adminMessages,
            adminUpdates,
            stats: {
                totalEvents: events.length,
                upcomingEvents: events.filter(event => event.startDate > new Date()).length,
                notificationsCount: notifications.length,
                instrumentCount: artist.instruments ? artist.instruments.length : 0,
                adminUpdatesCount: adminUpdates.length
            }
        });
    } catch (error) {
        console.error('Error getting artist dashboard info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== NOTIFICATION ROUTES ====================

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            userId: req.user.userId 
        }).sort({ createdAt: -1 }).limit(20);
        
        res.json(notifications);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== DASHBOARD STATS ====================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        let stats = {};

        if (user.role === 'artist') {
            const events = await Event.countDocuments({ 'artists.userId': user.userId });
            const upcomingEvents = await Event.countDocuments({
                'artists.userId': user.userId,
                startDate: { $gt: new Date() }
            });
            const notifications = await Notification.countDocuments({ 
                userId: user.userId, 
                read: false 
            });

            stats = {
                totalPerformances: events,
                upcomingPerformances: upcomingEvents,
                unreadNotifications: notifications
            };
        } else if (user.role === 'admin') {
            stats = {
                totalArtists: await User.countDocuments({ role: 'artist' }),
                pendingRequests: await User.countDocuments({ role: 'artist', status: 'pending' }),
                approvedArtists: await User.countDocuments({ role: 'artist', status: { $in: ['approved', 'active'] } }),
                totalVolunteers: await User.countDocuments({ role: 'volunteer' }),
                totalEvents: await Event.countDocuments(),
                upcomingEvents: await Event.countDocuments({ startDate: { $gt: new Date() } })
            };
        } else if (user.role === 'volunteer') {
            const assignedEvents = await Event.countDocuments({ 'volunteers.userId': user.userId });
            const upcomingAssignedEvents = await Event.countDocuments({ 
                'volunteers.userId': user.userId,
                startDate: { $gt: new Date() }
            });
            const notifications = await Notification.countDocuments({ 
                userId: user.userId, 
                read: false 
            });

            const volunteer = await User.findById(user.userId).select('hoursVolunteered');
            
            stats = {
                assignedEvents: assignedEvents,
                upcomingEvents: upcomingAssignedEvents,
                unreadNotifications: notifications,
                hoursVolunteered: volunteer?.hoursVolunteered || 0
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        version: '3.0.0',
        emailConfigured: !!process.env.EMAIL_USER
    });
});

// ==================== 404 HANDLER ====================

app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'API endpoint not found',
            path: req.originalUrl,
            method: req.method
        });
    }
    
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>404 - Not Found</title></head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p>The requested URL ${req.originalUrl} was not found on this server.</p>
                <p><a href="/">Go back to home</a></p>
            </body>
            </html>
        `);
    }
});

// ==================== CREATE DEFAULT USERS ====================

const createDefaultUsers = async () => {
    try {
        console.log('\n👤 Creating default users...');
        
        // Create default admin accounts
        const adminAccounts = [
            {
                email: 'admin@artify.com',
                password: 'Admin@123',
                fullName: 'System Administrator',
                username: 'admin'
            },
            {
                email: 'handeharshu@gmail.com',
                password: 'User12678@',
                fullName: 'Harshu Hande',
                username: 'hhande'
            },
            {
                email: 'manishshewale143@gmail.com',
                password: 'User12678@',
                fullName: 'Manish Shewale',
                username: 'mshewale'
            },
            {
                email: 'shewalesuresh15@gmail.com',
                password: 'User12678@',
                fullName: 'Suresh Shewale',
                username: 'sshewale'
            }
        ];
        
        for (const account of adminAccounts) {
            const adminExists = await User.findOne({ email: account.email });
            if (!adminExists) {
                const hashedPassword = await bcrypt.hash(account.password, 12);
                const admin = new User({
                    username: account.username,
                    email: account.email,
                    password: hashedPassword,
                    role: 'admin',
                    fullName: account.fullName,
                    dateOfBirth: new Date('1990-01-01'),
                    emailVerified: true,
                    status: 'active'
                });
                await admin.save();
                console.log(`✅ Admin user created: ${account.email} / ${account.password}`);
            } else {
                console.log(`ℹ️  Admin user already exists: ${account.email}`);
            }
        }
        
        // Create volunteer accounts
        const volunteerAccounts = [
            {
                email: 'pritamgadhave999@gmail.com',
                password: 'User1213@',
                fullName: 'Pritam Gadhave',
                username: 'pgadhave'
            },
            {
                email: 'akritthigale2605@gmail.com',
                password: 'User1213@',
                fullName: 'Akrit Thigale',
                username: 'athigale'
            },
            {
                email: 'sudarshanc688@gmail.com',
                password: 'User1213@',
                fullName: 'Sudarshan Chavan',
                username: 'schavan'
            },
            {
                email: 'shindesahil932@gmail.com',
                password: 'User1213@',
                fullName: 'Sahil Shinde',
                username: 'sshinde'
            }
        ];
        
        for (const account of volunteerAccounts) {
            const volunteerExists = await User.findOne({ email: account.email });
            if (!volunteerExists) {
                const hashedPassword = await bcrypt.hash(account.password, 12);
                const volunteerId = await generateVolunteerId();
                
                const volunteer = new User({
                    username: account.username,
                    email: account.email,
                    password: hashedPassword,
                    role: 'volunteer',
                    fullName: account.fullName,
                    dateOfBirth: new Date('1995-05-15'),
                    emailVerified: true,
                    status: 'active',
                    volunteerId: volunteerId
                });
                await volunteer.save();
                console.log(`✅ Volunteer user created: ${account.email} / ${account.password} (ID: ${volunteerId})`);
            } else {
                console.log(`ℹ️  Volunteer user already exists: ${account.email}`);
            }
        }
        
        // Create test artist account
        const artistExists = await User.findOne({ email: 'artist@artify.com' });
        if (!artistExists) {
            const hashedPassword = await bcrypt.hash('Artist@123', 12);
            const artist = new User({
                username: 'testartist',
                email: 'artist@artify.com',
                password: hashedPassword,
                role: 'artist',
                fullName: 'Test Artist',
                dateOfBirth: new Date('1995-05-15'),
                emailVerified: true,
                status: 'approved',
                instruments: [
                    { 
                        _id: new mongoose.Types.ObjectId(),
                        type: 'String', 
                        name: 'Acoustic Guitar', 
                        yearsOfExperience: 10,
                        addedAt: new Date()
                    },
                    { 
                        _id: new mongoose.Types.ObjectId(),
                        type: 'Vocal', 
                        name: 'Lead Vocals', 
                        yearsOfExperience: 8,
                        addedAt: new Date()
                    }
                ]
            });
            
            const artistRollId = await generateArtistRollId();
            artist.artistRollId = artistRollId;
            
            const entryQRData = {
                type: 'entry',
                artistId: artist._id,
                name: artist.fullName,
                rollId: artistRollId,
                timestamp: Date.now()
            };
            
            const entryQRCode = await generateQRCode(entryQRData);
            
            artist.qrCodes = {
                entry: entryQRCode,
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            };
            
            await artist.save();
            
            // Generate QR codes for instruments with lifetime validity
            for (const instrument of artist.instruments) {
                const instrumentQRData = {
                    type: 'instrument',
                    artistId: artist._id,
                    artistName: artist.fullName,
                    instrumentId: instrument._id,
                    instrumentName: instrument.name,
                    instrumentType: instrument.type,
                    rollId: artistRollId,
                    timestamp: Date.now()
                };
                
                const qrCode = await generateQRCode(instrumentQRData);
                
                // Set lifetime validity (far future date)
                const farFutureDate = new Date('2100-01-01');
                
                const instrumentQR = new InstrumentQR({
                    userId: artist._id,
                    instrumentId: instrument._id,
                    instrumentName: instrument.name,
                    qrCode: qrCode,
                    qrCodeData: instrumentQRData,
                    validUntil: farFutureDate  // Lifetime validity
                });
                
                await instrumentQR.save();
            }
            
            console.log('✅ Test artist user created');
            console.log('   👉 Email: artist@artify.com');
            console.log('   👉 Password: Artist@123');
            console.log('   👉 Roll ID:', artistRollId);
        } else {
            console.log('ℹ️  Test artist user already exists');
        }
        
        console.log('✅ All default users created/verified successfully');
        
    } catch (error) {
        console.error('❌ Error creating default users:', error);
    }
};

// ==================== DATABASE CONNECTION ====================

const connectDB = async () => {
    try {
        console.log('\n🔗 Connecting to MongoDB...');
        
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/artify-pro';
        console.log(`MongoDB URI: ${mongoURI}`);
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB connected successfully');
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.warn('⚠️ Starting server without database connection (development mode)');
        }
    }
};

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await createDefaultUsers();
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`
            
            🚀 ARTIFY PRO SERVER STARTED SUCCESSFULLY!
            ============================================
            
            📍 Server Port: ${PORT}
            🌐 Local URL: http://localhost:${PORT}
            🔗 Artist Portal: http://localhost:${PORT}/artistsignuploginchoice.html
            🔗 Artist Login: http://localhost:${PORT}/artist-login.html
            
            📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️ Not Connected'}
            📧 Email Service: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️ Not Configured'}
            
            🔐 AUTHENTICATION READY
            📧 EMAIL VERIFICATION READY
            
            👥 DEFAULT ACCOUNTS AVAILABLE:
            
               ADMIN ACCOUNTS:
               - admin@artify.com / Admin@123
               - handeharshu@gmail.com / User12678@
               - manishshewale143@gmail.com / User12678@
               - shewalesuresh15@gmail.com / User12678@
               
               VOLUNTEER ACCOUNTS:
               - pritamgadhave999@gmail.com / User1213@
               - akritthigale2605@gmail.com / User1213@
               - sudarshanc688@gmail.com / User1213@
               - shindesahil932@gmail.com / User1213@
               
               ARTIST ACCOUNT:
               - artist@artify.com / Artist@123
            
            🔧 DEBUG ENDPOINTS:
               - http://localhost:${PORT}/api/debug
               - http://localhost:${PORT}/api/health
               - http://localhost:${PORT}/api/test-db
               - http://localhost:${PORT}/api/auth/test-verification
            
            ⚡ UPDATED FEATURES:
               
               ✅ UPDATED: Volunteer dashboard with Roll ID verification
               ✅ ADDED: Roll ID validation for scheduled dates only
               ✅ ADDED: Multiple entry grants for same artist on same day
               ✅ ADDED: Instrument scanning with owner verification
               ✅ ADDED: Volunteer stats tracking (scans, entries, verifications)
               ✅ ADDED: Predefined admin and volunteer accounts
               ✅ FIXED: All volunteer dashboard functionality
               ✅ FIXED: Email verification system now sends actual emails
            
            ============================================
            
            Press Ctrl+C to stop the server
            ============================================
            
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// ========================================
// LOGGING MIDDLEWARE - VERSION 3
// ========================================
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('id-ID');
  const start = Date.now();
  
  // Log request
  console.log('\n' + '='.repeat(70));
  console.log(`📥 [${timestamp}] ${req.method} ${req.url}`);
  
  if (req.headers.authorization) {
    console.log('   🔐 Auth: Token present');
  }
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('   📦 Body:', JSON.stringify(req.body));
  }
  
  // Intercept response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Emoji based on status code
    let statusEmoji = '✅';
    if (res.statusCode >= 400 && res.statusCode < 500) statusEmoji = '⚠️';
    if (res.statusCode >= 500) statusEmoji = '❌';
    
    console.log(`📤 Response: ${statusEmoji} ${res.statusCode} (${duration}ms)`);
    
    // Show response for non-204 status
    if (res.statusCode !== 204 && data) {
      try {
        const parsed = JSON.parse(data);
        console.log('   📄 Data:', JSON.stringify(parsed).substring(0, 100) + '...');
      } catch (e) {
        // Not JSON, skip
      }
    }
    
    console.log('='.repeat(70));
    
    originalSend.call(this, data);
  };
  
  next();
});

// In-memory database
let users = [];
let tasks = [];
let taskIdCounter = 1;
let userIdCounter = 1;

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation Middleware
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters' });
  }
  
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  next();
};

const validateTask = (req, res, next) => {
  const { title } = req.body;
  
  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters' });
  }
  
  next();
};

// ============================================
// AUTH ROUTES
// ============================================

// POST /api/auth/register
app.post('/api/auth/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: userIdCounter++,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============================================
// TASK ROUTES (Protected)
// ============================================

// GET /api/tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const userTasks = tasks.filter(t => t.userId === req.user.id);
    
    res.status(200).json({
      message: 'Tasks retrieved successfully',
      data: userTasks,
      count: userTasks.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId && t.userId === req.user.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
      message: 'Task retrieved successfully',
      data: task
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/tasks
app.post('/api/tasks', authenticateToken, validateTask, (req, res) => {
  try {
    const { title, description, priority } = req.body;

    const newTask = {
      id: taskIdCounter++,
      userId: req.user.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);

    res.status(201).json({
      message: 'Task created successfully',
      data: newTask
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', authenticateToken, validateTask, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId && t.userId === req.user.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, priority, completed } = req.body;

    tasks[taskIndex] = {
      id: taskId,
      userId: req.user.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      completed: completed || false,
      createdAt: tasks[taskIndex].createdAt,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      message: 'Task updated successfully',
      data: tasks[taskIndex]
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id
app.patch('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId && t.userId === req.user.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, priority, completed } = req.body;

    if (title !== undefined) {
      if (title.trim().length < 3) {
        return res.status(400).json({ message: 'Title must be at least 3 characters' });
      }
      tasks[taskIndex].title = title.trim();
    }
    if (description !== undefined) tasks[taskIndex].description = description.trim();
    if (priority !== undefined) tasks[taskIndex].priority = priority;
    if (completed !== undefined) tasks[taskIndex].completed = completed;
    
    tasks[taskIndex].updatedAt = new Date().toISOString();

    res.status(200).json({
      message: 'Task updated successfully',
      data: tasks[taskIndex]
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId && t.userId === req.user.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Task Management API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '🚀'.repeat(35));
  console.log('✅ Server Started!');
  console.log('='.repeat(70));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📚 Health: http://localhost:${PORT}/api/health`);
  console.log(`⏰ Time: ${new Date().toLocaleString('id-ID')}`);
  console.log('='.repeat(70));
  console.log('📝 Waiting for requests...\n');
});
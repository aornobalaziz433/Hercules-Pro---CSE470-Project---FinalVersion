// main.js
// Placeholder for future interactivity (e.g., nav toggles, sliders) 
document.addEventListener('DOMContentLoaded', function() {
  const accountArea = document.getElementById('account-area');
  if (!accountArea) return;
  const userData = localStorage.getItem('herculesUser');
  if (userData) {
    const user = JSON.parse(userData);
    let icon = '';
    let label = '';
    switch (user.userType) {
      case 'client':
        icon = '<span style="font-size:1.5rem;vertical-align:middle;">👤</span>';
        label = 'Client';
        break;
      case 'professional':
        icon = '<span style="font-size:1.5rem;vertical-align:middle;">🧑‍💼</span>';
        label = 'Professional';
        break;
      case 'admin':
        icon = '<span style="font-size:1.5rem;vertical-align:middle;">🛡️</span>';
        label = 'Admin';
        break;
      default:
        icon = '<span style="font-size:1.5rem;vertical-align:middle;">👤</span>';
        label = 'User';
    }
    accountArea.innerHTML = `<div class="account-info" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1.2rem;background:#f5e9da;border-radius:2rem;font-weight:700;">${icon}<span>${label}</span></div>`;
  } else {
    accountArea.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <a href="login.html" class="btn btn-login">Login</a>
        <a href="register.html" class="btn btn-primary">Register</a>
      </div>
    `;
  }
  
  // Initialize workout tracker and community stats
  initializeWorkoutTracker();
  loadCommunityStats();
  
  // Initialize health chatbot
  initializeHealthChatbot();
  
  // Load and display events
  loadAndDisplayEvents();
});

// Event functions for homepage
function toggleEventLike(eventId) {
  if (userLikes.has(eventId)) {
    userLikes.delete(eventId);
  } else {
    userLikes.add(eventId);
  }
  
  // Save user likes
  localStorage.setItem('userLikes', JSON.stringify([...userLikes]));
  
  // Refresh events display
  displayEventsOnHomePage();
}

function viewEvent(eventId) {
  // Redirect to events page with the specific event
  window.location.href = `events.html#event-${eventId}`;
}

// Make functions globally available
window.toggleEventLike = toggleEventLike;
window.viewEvent = viewEvent;

// Enhanced Workout Tracker Variables
let workouts = [];
let workoutStats = {
  totalWorkouts: 0,
  totalDuration: 0,
  totalCalories: 0,
  completedWorkouts: 0
};

// Initialize Enhanced Workout Tracker
function initializeWorkoutTracker() {
  // Load saved workouts from localStorage
  const savedWorkouts = localStorage.getItem('workouts');
  if (savedWorkouts) {
    workouts = JSON.parse(savedWorkouts);
  }
  
  // Load saved stats from localStorage
  const savedStats = localStorage.getItem('workoutStats');
  if (savedStats) {
    workoutStats = JSON.parse(savedStats);
  }
  
  // Update display
  updateWorkoutList();
  updateWorkoutStats();
}

// Add New Workout
function addWorkout() {
  const workoutName = document.getElementById('workoutName');
  const workoutAmount = document.getElementById('workoutAmount');
  const workoutType = document.getElementById('workoutType');
  const intensityLevel = document.getElementById('intensityLevel');
  
  if (!workoutName || !workoutAmount || !workoutType || !intensityLevel) return;
  
  const name = workoutName.value.trim();
  const amount = parseInt(workoutAmount.value);
  
  if (!name || !amount || amount < 5) {
    showNotification('Please enter a valid workout name and duration (minimum 5 minutes)', 'error');
    return;
  }
  
  const newWorkout = {
    id: Date.now(),
    name: name,
    amount: amount,
    type: workoutType.value,
    intensity: intensityLevel.value,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  workouts.push(newWorkout);
  saveWorkouts();
  updateWorkoutList();
  updateWorkoutStats();
  
  // Clear form
  workoutName.value = '';
  workoutAmount.value = '';
  
  showNotification(`"${name}" added to your workout list!`, 'success');
}

// Complete Workout
function completeWorkout(workoutId) {
  const workout = workouts.find(w => w.id === workoutId);
  if (!workout) return;
  
  workout.completed = true;
  workout.completedAt = new Date().toISOString();
  
  saveWorkouts();
  updateWorkoutList();
  updateWorkoutStats();
  
  showNotification(`"${workout.name}" completed! Great job!`, 'success');
}

// Delete Workout
function deleteWorkout(workoutId) {
  const workoutIndex = workouts.findIndex(w => w.id === workoutId);
  if (workoutIndex === -1) return;
  
  const workout = workouts[workoutIndex];
  workouts.splice(workoutIndex, 1);
  
  saveWorkouts();
  updateWorkoutList();
  updateWorkoutStats();
  
  showNotification(`"${workout.name}" removed from your list`, 'info');
}

// Clear All Workouts
function clearAllWorkouts() {
  if (workouts.length === 0) {
    showNotification('No workouts to clear', 'info');
    return;
  }
  
  if (confirm('Are you sure you want to clear all workouts? This action cannot be undone.')) {
    workouts = [];
    saveWorkouts();
    updateWorkoutList();
    updateWorkoutStats();
    showNotification('All workouts cleared', 'info');
  }
}

// Export Workout Data
function exportWorkoutData() {
  if (workouts.length === 0) {
    showNotification('No workout data to export', 'info');
    return;
  }
  
  const data = {
    date: new Date().toISOString(),
    workouts: workouts,
    stats: workoutStats
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showNotification('Workout data exported successfully!', 'success');
}

// Calculate Calories Burned
function calculateCaloriesBurned(durationMinutes, type, intensity) {
  const intensityMultipliers = {
    'low': 3,
    'moderate': 5,
    'high': 8
  };
  
  const typeMultipliers = {
    'cardio': 1.2,
    'strength': 1.0,
    'flexibility': 0.7,
    'mixed': 1.1
  };
  
  const baseCaloriesPerMinute = intensityMultipliers[intensity] || 5;
  const typeMultiplier = typeMultipliers[type] || 1.0;
  
  return Math.round(durationMinutes * baseCaloriesPerMinute * typeMultiplier);
}

// Update Workout List
function updateWorkoutList() {
  const workoutList = document.getElementById('workoutList');
  const noWorkouts = document.getElementById('noWorkouts');
  
  if (!workoutList) return;
  
  if (workouts.length === 0) {
    noWorkouts.style.display = 'block';
    workoutList.innerHTML = '<div class="no-workouts" id="noWorkouts"><p>No workouts added yet. Add your first workout above!</p></div>';
    return;
  }
  
  noWorkouts.style.display = 'none';
  
  workoutList.innerHTML = workouts.map(workout => `
    <div class="workout-item ${workout.completed ? 'completed' : ''}" id="workout-${workout.id}">
      <div class="workout-info">
        <div class="workout-name">${workout.name}</div>
        <div class="workout-details">
          <div class="workout-detail">
            <span>⏱️</span>
            <span>${workout.amount} min</span>
          </div>
          <div class="workout-detail">
            <span>🏃</span>
            <span>${workout.type}</span>
          </div>
          <div class="workout-detail">
            <span>💪</span>
            <span>${workout.intensity}</span>
          </div>
        </div>
      </div>
      <div class="workout-actions">
        <div class="workout-status">
          <span class="status-icon">${workout.completed ? '✅' : '⏳'}</span>
          <span class="${workout.completed ? 'status-completed' : 'status-pending'}">
            ${workout.completed ? 'Completed' : 'Pending'}
          </span>
        </div>
        ${!workout.completed ? `
          <button class="workout-complete-btn" onclick="completeWorkout(${workout.id})">
            Completed
          </button>
        ` : ''}
        <button class="workout-delete-btn" onclick="deleteWorkout(${workout.id})" title="Delete workout">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

// Update Workout Stats
function updateWorkoutStats() {
  // Calculate stats
  workoutStats.totalWorkouts = workouts.length;
  workoutStats.totalDuration = workouts.reduce((sum, workout) => sum + workout.amount, 0);
  workoutStats.totalCalories = workouts.reduce((sum, workout) => {
    return sum + calculateCaloriesBurned(workout.amount, workout.type, workout.intensity);
  }, 0);
  workoutStats.completedWorkouts = workouts.filter(workout => workout.completed).length;
  
  // Update display
  const totalWorkoutsEl = document.getElementById('totalWorkouts');
  const totalDurationEl = document.getElementById('totalDuration');
  const totalCaloriesEl = document.getElementById('totalCalories');
  const completedWorkoutsEl = document.getElementById('completedWorkouts');
  const totalWorkoutsCountEl = document.getElementById('totalWorkoutsCount');
  
  if (totalWorkoutsEl) totalWorkoutsEl.textContent = workoutStats.totalWorkouts;
  if (totalDurationEl) totalDurationEl.textContent = workoutStats.totalDuration;
  if (totalCaloriesEl) totalCaloriesEl.textContent = workoutStats.totalCalories;
  if (completedWorkoutsEl) completedWorkoutsEl.textContent = workoutStats.completedWorkouts;
  if (totalWorkoutsCountEl) totalWorkoutsCountEl.textContent = workoutStats.totalWorkouts;
  
  // Save stats
  saveWorkoutStats();
}

// Save Workouts
function saveWorkouts() {
  localStorage.setItem('workouts', JSON.stringify(workouts));
}

// Save Workout Stats
function saveWorkoutStats() {
  localStorage.setItem('workoutStats', JSON.stringify(workoutStats));
}

// Load Community Stats
function loadCommunityStats() {
  const totalPostsEl = document.getElementById('totalPosts');
  const totalLikesEl = document.getElementById('totalLikes');
  const totalViewsEl = document.getElementById('totalViews');
  
  if (!totalPostsEl || !totalLikesEl || !totalViewsEl) return;
  
  // Show 0 initially - no fake data
  totalPostsEl.textContent = '0';
  totalLikesEl.textContent = '0';
  totalViewsEl.textContent = '0';
}

// Show Notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 300px;
    animation: slideIn 0.3s ease;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Health Chatbot Variables
let chatbotOpen = false;
let chatHistory = [];

// Health knowledge base
const healthKnowledge = {
  fitness: {
    keywords: ['workout', 'exercise', 'fitness', 'training', 'gym', 'cardio', 'strength', 'muscle', 'weight'],
    responses: [
      "For effective workouts, aim for at least 150 minutes of moderate-intensity exercise per week. Mix cardio and strength training for best results!",
      "Progressive overload is key - gradually increase weight, reps, or duration to keep challenging your muscles.",
      "Don't forget to warm up before exercising and cool down afterward to prevent injuries.",
      "Rest days are crucial for muscle recovery and growth. Aim for 1-2 rest days per week.",
      "Proper form is more important than heavy weights. Focus on technique first!"
    ]
  },
  nutrition: {
    keywords: ['diet', 'nutrition', 'food', 'calories', 'protein', 'carbs', 'vitamins', 'meal', 'eating'],
    responses: [
      "A balanced diet includes lean proteins, complex carbohydrates, healthy fats, and plenty of fruits and vegetables.",
      "Stay hydrated! Aim for 8-10 glasses of water daily, more if you're exercising.",
      "Protein is essential for muscle repair. Aim for 0.8-1g per kg of body weight daily.",
      "Eat smaller, frequent meals throughout the day to maintain stable blood sugar levels.",
      "Don't skip breakfast - it kickstarts your metabolism and provides energy for the day."
    ]
  },
  health: {
    keywords: ['health', 'wellness', 'sleep', 'stress', 'mental', 'recovery', 'injury', 'pain'],
    responses: [
      "Quality sleep (7-9 hours) is essential for recovery, muscle growth, and overall health.",
      "Manage stress through meditation, deep breathing, or activities you enjoy.",
      "Listen to your body - if you feel pain (not just muscle soreness), rest and consult a healthcare provider.",
      "Consistency is key - small, regular actions lead to big results over time.",
      "Mental health is just as important as physical health. Take care of both!"
    ]
  },
  general: {
    keywords: ['help', 'advice', 'tips', 'beginner', 'start', 'motivation'],
    responses: [
      "Start small and build gradually. Even 10 minutes of exercise is better than none!",
      "Set realistic, achievable goals and celebrate small victories along the way.",
      "Find activities you enjoy - you're more likely to stick with them long-term.",
      "Track your progress to stay motivated and see how far you've come.",
      "Remember, everyone's fitness journey is unique. Focus on your own progress!"
    ]
  }
};

// Initialize Health Chatbot
function initializeHealthChatbot() {
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');
  
  if (!chatbotToggle || !chatbotWindow || !chatbotInput || !chatbotSend) return;
  
  // Toggle chatbot window
  chatbotToggle.addEventListener('click', function() {
    chatbotOpen = !chatbotOpen;
    chatbotWindow.style.display = chatbotOpen ? 'flex' : 'none';
    
    if (chatbotOpen) {
      chatbotInput.focus();
      // Update toggle text
      const toggleText = chatbotToggle.querySelector('.chatbot-text');
      if (toggleText) {
        toggleText.textContent = 'Close Chat';
      }
    } else {
      // Update toggle text
      const toggleText = chatbotToggle.querySelector('.chatbot-text');
      if (toggleText) {
        toggleText.textContent = 'Chat with Health Assistant';
      }
    }
  });
  
  // Send message on button click
  chatbotSend.addEventListener('click', function() {
    sendMessage();
  });
  
  // Send message on Enter key
  chatbotInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Close chatbot when clicking outside
  document.addEventListener('click', function(e) {
    if (chatbotOpen && !e.target.closest('.chatbot-container')) {
      chatbotOpen = false;
      chatbotWindow.style.display = 'none';
      const toggleText = chatbotToggle.querySelector('.chatbot-text');
      if (toggleText) {
        toggleText.textContent = 'Chat with Health Assistant';
      }
    }
  });
}

// Send Message Function
function sendMessage() {
  const chatbotInput = document.getElementById('chatbotInput');
  const message = chatbotInput.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addMessage(message, 'user');
  
  // Clear input
  chatbotInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Generate and show bot response
  setTimeout(() => {
    hideTypingIndicator();
    const response = generateResponse(message);
    addMessage(response, 'bot');
  }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
}

// Add Message to Chat
function addMessage(content, sender) {
  const chatbotMessages = document.getElementById('chatbotMessages');
  if (!chatbotMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  // Format content with line breaks
  const formattedContent = content.replace(/\n/g, '<br>');
  messageContent.innerHTML = formattedContent;
  
  messageDiv.appendChild(messageContent);
  chatbotMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  
  // Store in chat history
  chatHistory.push({ content, sender, timestamp: new Date() });
}

// Show Typing Indicator
function showTypingIndicator() {
  const chatbotMessages = document.getElementById('chatbotMessages');
  if (!chatbotMessages) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing-message';
  typingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span>Health Assistant is typing</span>
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  
  chatbotMessages.appendChild(typingDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Hide Typing Indicator
function hideTypingIndicator() {
  const typingMessage = document.querySelector('.typing-message');
  if (typingMessage) {
    typingMessage.remove();
  }
}

// Generate Bot Response
function generateResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Check for specific categories
  for (const [category, data] of Object.entries(healthKnowledge)) {
    const hasKeyword = data.keywords.some(keyword => message.includes(keyword));
    if (hasKeyword) {
      const randomResponse = data.responses[Math.floor(Math.random() * data.responses.length)];
      return randomResponse;
    }
  }
  
  // Default responses for unrecognized queries
  const defaultResponses = [
    "I'd be happy to help with your health and fitness questions! Could you be more specific about what you'd like to know?",
    "That's a great question! I can help with fitness, nutrition, and general health topics. What would you like to learn about?",
    "I'm here to help with your health journey! Try asking about workouts, nutrition, or wellness tips.",
    "Feel free to ask me about exercise routines, healthy eating, or any health-related concerns you might have!"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Quick Question Suggestions
const quickQuestions = [
  "What's the best workout for beginners?",
  "How much protein do I need daily?",
  "How many hours should I sleep?",
  "What are some healthy snack options?",
  "How often should I exercise?",
  "What's the importance of warming up?",
  "How can I stay motivated?",
  "What should I eat before a workout?"
];

// Events Management
let events = [];
let userLikes = new Set();

// Load and display events on home page
async function loadAndDisplayEvents() {
  try {
    // Try to load from API first
    const response = await fetch('http://localhost:4000/api/events');
    if (response.ok) {
      const data = await response.json();
      events = data.events || [];
    } else {
      // Fallback to localStorage
      const savedEvents = localStorage.getItem('fitnessEvents');
      if (savedEvents) {
        events = JSON.parse(savedEvents);
      }
    }
  } catch (error) {
    console.log('API not available, using localStorage');
    // Fallback to localStorage
    const savedEvents = localStorage.getItem('fitnessEvents');
    if (savedEvents) {
      events = JSON.parse(savedEvents);
    }
  }
  
  // Load user likes
  const savedLikes = localStorage.getItem('userLikes');
  if (savedLikes) {
    userLikes = new Set(JSON.parse(savedLikes));
  }
  
  displayEventsOnHomePage();
}

// Display events on home page
function displayEventsOnHomePage() {
  const eventsGrid = document.getElementById('eventsGrid');
  const noEvents = document.getElementById('noEvents');
  
  if (!eventsGrid) return;
  
  if (events.length === 0) {
    if (noEvents) noEvents.style.display = 'block';
    return;
  }
  
  if (noEvents) noEvents.style.display = 'none';
  
  // Sort events by date (upcoming first)
  const sortedEvents = [...events].sort((a, b) => new Date(a.event_date || a.eventDate) - new Date(b.event_date || b.eventDate));
  
  // Show only upcoming events (max 6)
  const upcomingEvents = sortedEvents.filter(event => new Date(event.event_date || event.eventDate) > new Date()).slice(0, 6);
  
  if (upcomingEvents.length === 0) {
    if (noEvents) noEvents.style.display = 'block';
    return;
  }
  
  eventsGrid.innerHTML = upcomingEvents.map(event => {
    const eventId = event.id;
    const eventTitle = event.title;
    const eventType = event.event_type || event.type;
    const eventDate = event.event_date || event.eventDate;
    const eventDescription = event.description;
    const eventLocation = event.location;
    const trainerName = event.trainer_name || event.trainerName;
    const imageUrl = event.image_url || event.imageUrl;
    const likesCount = event.likes_count || event.likes || 0;
    const participantCount = event.participant_count || 0;
    const registrationFee = event.registration_fee || 0;
    const maxParticipants = event.max_participants;
    
    return `
      <div class="event-card" data-event-id="${eventId}">
        <img src="${imageUrl}" alt="${eventTitle}" class="event-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV2ZW50IEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
        <div class="event-content">
          <div class="event-header">
            <h3 class="event-title">${eventTitle}</h3>
            <span class="event-type">${eventType}</span>
          </div>
          <p class="event-description">${eventDescription}</p>
          <div class="event-details">
            <div class="event-detail">
              <span class="event-detail-icon">📅</span>
              <span>${formatEventDate(eventDate)}</span>
            </div>
            <div class="event-detail">
              <span class="event-detail-icon">📍</span>
              <span>${eventLocation}</span>
            </div>
            <div class="event-detail">
              <span class="event-detail-icon">👤</span>
              <span>By ${trainerName}</span>
            </div>
            ${registrationFee > 0 ? `
            <div class="event-detail">
              <span class="event-detail-icon">💰</span>
              <span>৳${registrationFee}</span>
            </div>
            ` : ''}
            ${maxParticipants ? `
            <div class="event-detail">
              <span class="event-detail-icon">👥</span>
              <span>${participantCount}/${maxParticipants} participants</span>
            </div>
            ` : ''}
          </div>
          <div class="event-actions">
            <div class="event-likes">
              <button class="like-button ${userLikes.has(eventId) ? 'liked' : ''}" onclick="toggleEventLike('${eventId}')">
                ${userLikes.has(eventId) ? '❤️' : '🤍'}
              </button>
              <span>${likesCount} likes</span>
            </div>
            <button class="event-view-btn" onclick="viewEvent('${eventId}')">View Event</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Format event date for display
function formatEventDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Past Event';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}

// Toggle like for an event
function toggleEventLike(eventId) {
  if (userLikes.has(eventId)) {
    userLikes.delete(eventId);
    // Decrease like count
    const event = events.find(e => e.id === eventId);
    if (event) {
      event.likes = Math.max(0, (event.likes || 0) - 1);
    }
  } else {
    userLikes.add(eventId);
    // Increase like count
    const event = events.find(e => e.id === eventId);
    if (event) {
      event.likes = (event.likes || 0) + 1;
    }
  }
  
  // Save events and likes
  localStorage.setItem('fitnessEvents', JSON.stringify(events));
  localStorage.setItem('userLikes', JSON.stringify([...userLikes]));
  
  // Refresh display
  displayEventsOnHomePage();
}

// View event details
function viewEvent(eventId) {
  const event = events.find(e => e.id === eventId);
  if (!event) return;
  
  // Increment view count
  event.views = (event.views || 0) + 1;
  localStorage.setItem('fitnessEvents', JSON.stringify(events));
  
  // Show event details
  alert(`Event: ${event.title}\n\nDescription: ${event.description}\n\nDate: ${formatEventDate(event.eventDate)}\n\nLocation: ${event.location}\n\nType: ${event.type}\n\nBy: ${event.trainerName}\n\nViews: ${event.views || 0}`);
}

// Make functions globally available
window.toggleEventLike = toggleEventLike;
window.viewEvent = viewEvent; 
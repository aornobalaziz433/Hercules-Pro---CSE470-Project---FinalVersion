// Professional Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }

    // Load user data
    loadUserData();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup event upload form
    setupEventUploadForm();
});

// Check if user is authenticated
function checkAuth() {
    const userData = localStorage.getItem('herculesUser');
    if (!userData) return false;
    
    const user = JSON.parse(userData);
    if (user.userType !== 'professional') {
        return false;
    }
    
    // Check if session is still valid (24 hours)
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
        localStorage.removeItem('herculesUser');
        return false;
    }
    
    return true;
}

// Load user data and update UI
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('herculesUser'));
    
    // Update user name displays
    const userNameElements = document.querySelectorAll('#userName, #userNameHeader');
    const displayName = userData.firstName || userData.email.split('@')[0];
    
    userNameElements.forEach(element => {
        element.textContent = displayName;
    });
    
    // Store user data globally for other functions
    window.currentUser = userData;
}

// Initialize dashboard components
function initializeDashboard() {
    // Initialize analytics charts
    initializeAnalyticsCharts();
    
    // Load mock data for stats
    updateStats();
    
    // Setup navigation
    setupNavigation();
    
    // Initialize client status updates
    initializeClientStatus();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.closest('.nav-item').classList.add('active');
            
            // Handle navigation (in a real app, this would load different content)
            const section = this.getAttribute('href').substring(1);
            console.log('Navigating to:', section);
        });
    });
    
    // Chart controls
    const chartControls = document.querySelectorAll('.chart-controls .btn');
    chartControls.forEach(btn => {
        btn.addEventListener('click', function() {
            chartControls.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update analytics based on selected period
            const period = this.textContent.toLowerCase();
            updateAnalytics(period);
        });
    });
    
    // Quick action buttons
    const actionButtons = document.querySelectorAll('.action-card .btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.closest('.action-card').querySelector('h4').textContent;
            handleQuickAction(action);
        });
    });
    
    // Client cards
    const clientCards = document.querySelectorAll('.client-card');
    clientCards.forEach(card => {
        card.addEventListener('click', function() {
            const clientName = this.querySelector('h4').textContent;
            viewClientDetails(clientName);
        });
    });
    
    // Schedule items
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        item.addEventListener('click', function() {
            const sessionInfo = this.querySelector('h4').textContent;
            viewSessionDetails(sessionInfo);
        });
    });
}

// Initialize analytics charts
function initializeAnalyticsCharts() {
    const charts = ['retentionChart', 'progressChart', 'completionChart'];
    
    charts.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            drawSimpleChart(canvas, chartId);
        }
    });
}

// Draw simple charts for analytics
function drawSimpleChart(canvas, chartType) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw different chart types
    switch(chartType) {
        case 'retentionChart':
            drawBarChart(ctx, [85, 88, 92, 89, 94, 91, 93], width, height);
            break;
        case 'progressChart':
            drawLineChart(ctx, [5, 7, 6, 8, 9, 7, 8.5], width, height);
            break;
        case 'completionChart':
            drawPieChart(ctx, [87, 13], width, height);
            break;
    }
}

// Draw bar chart
function drawBarChart(ctx, data, width, height) {
    const barWidth = width / data.length * 0.6;
    const spacing = width / data.length * 0.4;
    const maxValue = Math.max(...data);
    
    ctx.fillStyle = '#f5e9da';
    
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * height * 0.8;
        const x = index * (barWidth + spacing) + spacing / 2;
        const y = height - barHeight - 10;
        
        ctx.fillRect(x, y, barWidth, barHeight);
    });
}

// Draw line chart
function drawLineChart(ctx, data, width, height) {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue;
    
    ctx.strokeStyle = '#f5e9da';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height * 0.8 - 10;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

// Draw pie chart
function drawPieChart(ctx, data, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const total = data.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;
    
    data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        ctx.fillStyle = index === 0 ? '#f5e9da' : '#e1e5e9';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
}

// Update analytics based on period
function updateAnalytics(period) {
    const charts = ['retentionChart', 'progressChart', 'completionChart'];
    
    charts.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            // In a real app, this would fetch new data based on the period
            drawSimpleChart(canvas, chartId);
        }
    });
}

// Update stats with mock data
function updateStats() {
    // In a real app, this would fetch data from an API
    const stats = {
        activeClients: 24,
        workoutsCreated: 156,
        clientRating: '4.8/5',
        monthlyRevenue: 3240
    };
    
    // Update stat values
    const statElements = document.querySelectorAll('.stat-value');
    statElements.forEach(element => {
        const statType = element.closest('.stat-card').querySelector('h3').textContent.toLowerCase();
        
        if (statType.includes('active clients')) {
            element.textContent = stats.activeClients;
        } else if (statType.includes('workouts created')) {
            element.textContent = stats.workoutsCreated;
        } else if (statType.includes('client rating')) {
            element.textContent = stats.clientRating;
        } else if (statType.includes('monthly revenue')) {
            element.textContent = '$' + stats.monthlyRevenue.toLocaleString();
        }
    });
}

// Initialize client status updates
function initializeClientStatus() {
    // Simulate real-time client status updates
    setInterval(() => {
        const clientCards = document.querySelectorAll('.client-card');
        clientCards.forEach(card => {
            const statusElement = card.querySelector('.client-status');
            if (statusElement && Math.random() > 0.8) {
                // Randomly toggle status
                if (statusElement.classList.contains('online')) {
                    statusElement.classList.remove('online');
                    statusElement.classList.add('offline');
                    statusElement.textContent = 'Offline';
                } else {
                    statusElement.classList.remove('offline');
                    statusElement.classList.add('online');
                    statusElement.textContent = 'Online';
                }
            }
        });
    }, 10000); // Update every 10 seconds
}

// Setup navigation
function setupNavigation() {
    // Add mobile menu toggle if needed
    const header = document.querySelector('.dashboard-header');
    if (window.innerWidth <= 768) {
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '☰';
        mobileToggle.addEventListener('click', toggleMobileMenu);
        header.insertBefore(mobileToggle, header.firstChild);
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Handle quick actions
function handleQuickAction(action) {
    switch(action) {
        case 'Add New Client':
            addNewClient();
            break;
        case 'Create Workout':
            createWorkout();
            break;
        case 'Nutrition Plan':
            createNutritionPlan();
            break;
        case 'Schedule Session':
            scheduleSession();
            break;
        default:
            console.log('Action:', action);
    }
}

// Add new client
function addNewClient() {
    alert('Opening client registration form... In a real app, this would open a form to add a new client.');
}

// Create workout
function createWorkout() {
    alert('Opening workout creator... In a real app, this would open the workout creation interface.');
}

// Create nutrition plan
function createNutritionPlan() {
    alert('Opening nutrition plan creator... In a real app, this would open the nutrition planning interface.');
}

// Schedule session
function scheduleSession() {
    alert('Opening scheduling interface... In a real app, this would open the calendar/scheduling system.');
}

// View client details
function viewClientDetails(clientName) {
    alert(`Viewing details for ${clientName}... In a real app, this would show the client's profile, progress, and workout history.`);
}

// View session details
function viewSessionDetails(sessionInfo) {
    alert(`Viewing session: ${sessionInfo}... In a real app, this would show detailed session information and allow for notes.`);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('herculesUser');
        window.location.href = 'login.html';
    }
}

// Make logout function globally available
window.logout = logout;

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('open');
    }
});

// Add interactive features
document.addEventListener('click', function(e) {
    // Make stat cards clickable
    if (e.target.closest('.stat-card')) {
        const statCard = e.target.closest('.stat-card');
        const statType = statCard.querySelector('h3').textContent;
        console.log('Clicked on:', statType);
        // In a real app, this would show detailed analytics
    }
    
    // Make analytics cards clickable
    if (e.target.closest('.analytics-card')) {
        const analyticsCard = e.target.closest('.analytics-card');
        const analyticsTitle = analyticsCard.querySelector('h4').textContent;
        console.log('Analytics:', analyticsTitle);
        // In a real app, this would show detailed analytics
    }
});

// Add smooth animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards for animation
document.querySelectorAll('.stat-card, .client-card, .action-card, .analytics-card, .schedule-item').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add hover effects for interactive elements
document.querySelectorAll('.client-card, .action-card, .schedule-item').forEach(element => {
    element.style.cursor = 'pointer';
    element.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
    });
    
    element.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
    });
});

// Event Upload Functionality
function setupEventUploadForm() {
    const eventForm = document.getElementById('eventUploadForm');
    if (!eventForm) return;
    
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        uploadEvent();
    });
}

// Upload new event
async function uploadEvent() {
  const formData = new FormData(document.getElementById('eventUploadForm'));
  
  // Get form values
  const eventTitle = document.getElementById('eventTitle').value.trim();
  const eventDate = document.getElementById('eventDate').value;
  const eventDescription = document.getElementById('eventDescription').value.trim();
  const eventLocation = document.getElementById('eventLocation').value.trim();
  const eventType = document.getElementById('eventType').value;
  const maxParticipants = document.getElementById('maxParticipants').value;
  const registrationFee = document.getElementById('registrationFee').value || 0;
  const eventImage = document.getElementById('eventImage').files[0];
  
  // Validate form
  if (!eventTitle || !eventDate || !eventDescription || !eventLocation || !eventType || !eventImage) {
    alert('Please fill in all fields and select an image.');
    return;
  }
  
  // Validate date (must be in the future)
  const eventDateTime = new Date(eventDate);
  const now = new Date();
  if (eventDateTime <= now) {
    alert('Event date must be in the future.');
    return;
  }
  
  // Validate image size (max 5MB)
  if (eventImage.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB.');
    return;
  }
  
  // Convert image to base64 for storage
  const reader = new FileReader();
  reader.onload = async function(e) {
    const eventData = {
      title: eventTitle,
      event_date: eventDate,
      description: eventDescription,
      location: eventLocation,
      event_type: eventType,
      image_url: e.target.result,
      trainer_name: window.currentUser.firstName || window.currentUser.email.split('@')[0],
      trainer_id: window.currentUser.id || window.currentUser.email,
      max_participants: maxParticipants || null,
      registration_fee: parseFloat(registrationFee) || 0,
      likes_count: 0,
      views_count: 0
    };
    
    try {
      // Try to save to API first
      const response = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        alert('Event created successfully! It will now appear on the home page and events page.');
        clearEventForm();
        await loadMyEvents(); // Refresh my events
        
        // Also refresh homepage events if the function exists
        if (typeof displayEventsOnHomePage === 'function') {
          displayEventsOnHomePage();
        }
      } else {
        const error = await response.json();
        alert('Error creating event: ' + error.error);
      }
    } catch (error) {
      console.log('API not available, saving to localStorage');
      // Fallback to localStorage
      const localEventData = {
        id: Date.now().toString(),
        title: eventTitle,
        eventDate: eventDate,
        description: eventDescription,
        location: eventLocation,
        type: eventType,
        imageUrl: e.target.result,
        trainerName: window.currentUser.firstName || window.currentUser.email.split('@')[0],
        trainerId: window.currentUser.id || window.currentUser.email,
        likes: 0,
        views: 0,
        createdAt: new Date().toISOString()
      };
      
      saveEvent(localEventData);
      clearEventForm();
      alert('Event created successfully! It will now appear on the home page and events page.');
      
      // Also refresh homepage events if the function exists
      if (typeof displayEventsOnHomePage === 'function') {
        displayEventsOnHomePage();
      }
    }
  };
  
  reader.readAsDataURL(eventImage);
}

// Save event to localStorage
function saveEvent(eventData) {
    let events = JSON.parse(localStorage.getItem('fitnessEvents') || '[]');
    events.unshift(eventData); // Add to beginning of array
    localStorage.setItem('fitnessEvents', JSON.stringify(events));
}

// Clear event form
function clearEventForm() {
    document.getElementById('eventUploadForm').reset();
}

// Make clearEventForm globally available
window.clearEventForm = clearEventForm;

// ===== MY EVENTS MANAGEMENT =====

// Load my events
async function loadMyEvents() {
  try {
    // Try to load from API first
    const trainerId = window.currentUser?.id || window.currentUser?.email;
    const response = await fetch(`http://localhost:4000/api/events/professional/${trainerId}`);
    
    if (response.ok) {
      const data = await response.json();
      displayMyEvents(data.events || []);
    } else {
      // Fallback to localStorage
      const allEvents = JSON.parse(localStorage.getItem('fitnessEvents') || '[]');
      const myEvents = allEvents.filter(event => 
        event.trainerId === trainerId || event.trainer_id === trainerId
      );
      displayMyEvents(myEvents);
    }
  } catch (error) {
    console.log('API not available, using localStorage');
    // Fallback to localStorage
    const allEvents = JSON.parse(localStorage.getItem('fitnessEvents') || '[]');
    const trainerId = window.currentUser?.id || window.currentUser?.email;
    const myEvents = allEvents.filter(event => 
      event.trainerId === trainerId || event.trainer_id === trainerId
    );
    displayMyEvents(myEvents);
  }
}

// Display my events
function displayMyEvents(events) {
  const eventsGrid = document.getElementById('myEventsGrid');
  const noEvents = document.getElementById('noMyEvents');
  
  if (!eventsGrid) return;
  
  if (events.length === 0) {
    if (noEvents) noEvents.style.display = 'block';
    eventsGrid.innerHTML = noEvents ? noEvents.outerHTML : '<div class="no-events"><p>No events created</p></div>';
    return;
  }
  
  if (noEvents) noEvents.style.display = 'none';
  
  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.event_date || b.eventDate) - new Date(a.event_date || a.eventDate));
  
  eventsGrid.innerHTML = sortedEvents.map(event => {
    const eventId = event.id;
    const eventTitle = event.title;
    const eventType = event.event_type || event.type;
    const eventDate = event.event_date || event.eventDate;
    const eventDescription = event.description;
    const eventLocation = event.location;
    const imageUrl = event.image_url || event.imageUrl;
    const likesCount = event.likes_count || event.likes || 0;
    const participantCount = event.participant_count || 0;
    const registrationFee = event.registration_fee || 0;
    const maxParticipants = event.max_participants;
    
    return `
      <div class="event-management-card" data-event-id="${eventId}">
        <img src="${imageUrl}" alt="${eventTitle}" class="event-management-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV2ZW50IEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
        <div class="event-management-content">
          <div class="event-management-header">
            <h3 class="event-management-title">${eventTitle}</h3>
            <span class="event-management-type">${eventType}</span>
          </div>
          <p class="event-management-description">${eventDescription}</p>
          <div class="event-management-details">
            <div class="event-management-detail">
              <span class="event-management-detail-icon">📅</span>
              <span>${formatEventDate(eventDate)}</span>
            </div>
            <div class="event-management-detail">
              <span class="event-management-detail-icon">📍</span>
              <span>${eventLocation}</span>
            </div>
            ${registrationFee > 0 ? `
            <div class="event-management-detail">
              <span class="event-management-detail-icon">💰</span>
              <span>৳${registrationFee}</span>
            </div>
            ` : ''}
            ${maxParticipants ? `
            <div class="event-management-detail">
              <span class="event-management-detail-icon">👥</span>
              <span>${participantCount}/${maxParticipants} participants</span>
            </div>
            ` : ''}
            <div class="event-management-detail">
              <span class="event-management-detail-icon">❤️</span>
              <span>${likesCount} likes</span>
            </div>
          </div>
          <div class="event-management-actions">
            <button class="btn btn-primary" onclick="viewEvent('${eventId}')">View</button>
            <button class="btn btn-secondary" onclick="editEvent('${eventId}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteEvent('${eventId}')">Delete</button>
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

// Refresh my events
async function refreshMyEvents() {
  await loadMyEvents();
}

// Initialize my events on page load
document.addEventListener('DOMContentLoaded', function() {
  // Load my events after a short delay to ensure user data is loaded
  setTimeout(() => {
    if (window.currentUser) {
      loadMyEvents();
    }
  }, 1000);
});

// Make functions globally available
window.refreshMyEvents = refreshMyEvents;
window.loadMyEvents = loadMyEvents; 
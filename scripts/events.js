// Events Management System
let events = [];
let userLikes = new Set();
let spinsRemaining = 3;
let lastSpinReset = Date.now();
let isSpinning = false;
let currentUser = null;
let editingEventId = null;

// API Base URL
const API_BASE_URL = 'http://localhost:4000/api';

// Prize items for spinning wheel
const prizes = [
  'Protein Bar',
  'Protein Shake',
  'Banana Pizza',
  'Spinach',
  'Hugging Chicken',
  'Discounts on Steroids',
  'Superman Costume'
];

// Initialize events page
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
  loadEvents();
  initializeSpinningWheel();
  updateSpinsRemaining();
  checkSpinReset();
});

// Load user data
function loadUserData() {
  const userData = localStorage.getItem('herculesUser');
  if (userData) {
    currentUser = JSON.parse(userData);
  }
}

// Load events from API and localStorage
async function loadEvents() {
  try {
    // Try to load from API first
    const response = await fetch(`${API_BASE_URL}/events`);
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
  
  const savedLikes = localStorage.getItem('userLikes');
  if (savedLikes) {
    userLikes = new Set(JSON.parse(savedLikes));
  }
  
  displayEvents();
}

// Refresh events from API
async function refreshEvents() {
  await loadEvents();
}

// Save events to localStorage
function saveEvents() {
  localStorage.setItem('fitnessEvents', JSON.stringify(events));
}

// Save user likes to localStorage
function saveUserLikes() {
  localStorage.setItem('userLikes', JSON.stringify([...userLikes]));
}

// Display events on the page
function displayEvents() {
  const eventsGrid = document.getElementById('eventsGrid') || document.getElementById('eventsList');
  const noEvents = document.getElementById('noEvents') || document.getElementById('noEventsList');
  
  if (!eventsGrid) return;
  
  if (events.length === 0) {
    if (noEvents) noEvents.style.display = 'block';
    eventsGrid.innerHTML = noEvents ? noEvents.outerHTML : '<div class="no-events"><p>No events available</p></div>';
    return;
  }
  
  if (noEvents) noEvents.style.display = 'none';
  
  // Sort events by date (upcoming first)
  const sortedEvents = [...events].sort((a, b) => new Date(a.event_date || a.eventDate) - new Date(b.event_date || b.eventDate));
  
  eventsGrid.innerHTML = sortedEvents.map(event => {
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
    
    // Check if current user is the creator of this event
    const isEventCreator = currentUser && currentUser.userType === 'professional' && 
                          (currentUser.id == event.trainer_id || currentUser.email === event.trainer_id);
    
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
              <button class="like-button ${userLikes.has(eventId) ? 'liked' : ''}" onclick="toggleLike('${eventId}')">
                ${userLikes.has(eventId) ? '❤️' : '🤍'}
              </button>
              <span>${likesCount} likes</span>
            </div>
            <div class="event-buttons">
              <button class="event-view-btn" onclick="viewEvent('${eventId}')">View Event</button>
              ${isEventCreator ? `
                <button class="event-edit-btn" onclick="editEvent('${eventId}')">Edit</button>
                <button class="event-delete-btn" onclick="deleteEvent('${eventId}')">Delete</button>
              ` : ''}
            </div>
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
function toggleLike(eventId) {
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
  
  saveEvents();
  saveUserLikes();
  displayEvents();
}

// View event details
function viewEvent(eventId) {
  const event = events.find(e => e.id == eventId);
  if (!event) return;
  
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
  
  // Show event modal
  document.getElementById('modalEventTitle').textContent = eventTitle;
  document.getElementById('modalEventBody').innerHTML = `
    <div class="event-modal-content">
      <img src="${imageUrl}" alt="${eventTitle}" class="modal-event-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV2ZW50IEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
      <div class="modal-event-info">
        <div class="modal-event-details">
          <div class="modal-detail">
            <span class="modal-detail-icon">📅</span>
            <span>${formatEventDate(eventDate)}</span>
          </div>
          <div class="modal-detail">
            <span class="modal-detail-icon">📍</span>
            <span>${eventLocation}</span>
          </div>
          <div class="modal-detail">
            <span class="modal-detail-icon">👤</span>
            <span>By ${trainerName}</span>
          </div>
          <div class="modal-detail">
            <span class="modal-detail-icon">🏷️</span>
            <span>${eventType}</span>
          </div>
          ${registrationFee > 0 ? `
          <div class="modal-detail">
            <span class="modal-detail-icon">💰</span>
            <span>Registration Fee: ৳${registrationFee}</span>
          </div>
          ` : ''}
          ${maxParticipants ? `
          <div class="modal-detail">
            <span class="modal-detail-icon">👥</span>
            <span>Participants: ${participantCount}/${maxParticipants}</span>
          </div>
          ` : ''}
        </div>
        <div class="modal-event-description">
          <h4>Description</h4>
          <p>${eventDescription}</p>
        </div>
        <div class="modal-event-actions">
          <button class="modal-btn primary" onclick="registerForEvent('${eventId}')">Register for Event</button>
          <button class="modal-btn secondary" onclick="closeEventModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('eventModal').style.display = 'block';
}

// Filter events by type
function filterEvents() {
  const filter = document.getElementById('eventTypeFilter');
  if (!filter) return;
  
  const selectedType = filter.value;
  const eventCards = document.querySelectorAll('.event-card');
  
  eventCards.forEach(card => {
    const eventType = card.querySelector('.event-type').textContent.toLowerCase();
    if (!selectedType || eventType === selectedType) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Initialize spinning wheel
function initializeSpinningWheel() {
  const wheelSegments = document.getElementById('wheelSegments');
  if (!wheelSegments) return;
  
  const segmentAngle = 360 / prizes.length;
  
  wheelSegments.innerHTML = prizes.map((prize, index) => {
    const angle = index * segmentAngle;
    return `
      <div class="wheel-segment" style="transform: rotate(${angle}deg);">
        <div style="transform: rotate(${-angle}deg);">${prize}</div>
      </div>
    `;
  }).join('');
}

// Spin the wheel
function spinWheel() {
  if (isSpinning || spinsRemaining <= 0) return;
  
  isSpinning = true;
  spinsRemaining--;
  
  const wheel = document.getElementById('spinningWheel');
  const spinButton = document.getElementById('spinButton');
  const prizeDisplay = document.getElementById('prizeDisplay');
  
  if (!wheel || !spinButton) return;
  
  // Disable button during spin
  spinButton.disabled = true;
  spinButton.textContent = 'Spinning...';
  
  // Random rotation (multiple full rotations + random angle)
  const randomAngle = Math.random() * 360;
  const totalRotation = 1800 + randomAngle; // 5 full rotations + random
  
  wheel.style.transform = `rotate(${totalRotation}deg)`;
  
  // Calculate which prize was won
  const normalizedAngle = (360 - (randomAngle % 360)) % 360;
  const segmentAngle = 360 / prizes.length;
  const prizeIndex = Math.floor(normalizedAngle / segmentAngle);
  const wonPrize = prizes[prizeIndex];
  
  // Show result after animation
  setTimeout(() => {
    isSpinning = false;
    spinButton.disabled = false;
    spinButton.textContent = spinsRemaining > 0 ? 'Spin Again!' : 'No Spins Left';
    
    // Show prize
    if (prizeDisplay) {
      document.getElementById('prizeName').textContent = wonPrize;
      prizeDisplay.style.display = 'block';
    }
    
    // Save spins remaining
    localStorage.setItem('spinsRemaining', spinsRemaining.toString());
    localStorage.setItem('lastSpinReset', lastSpinReset.toString());
    
    updateSpinsRemaining();
  }, 3000);
}

// Close prize display
function closePrizeDisplay() {
  const prizeDisplay = document.getElementById('prizeDisplay');
  if (prizeDisplay) {
    prizeDisplay.style.display = 'none';
  }
}

// Update spins remaining display
function updateSpinsRemaining() {
  const spinsRemainingEl = document.getElementById('spinsRemaining');
  const nextResetEl = document.getElementById('nextReset');
  
  if (spinsRemainingEl) {
    spinsRemainingEl.textContent = spinsRemaining;
  }
  
  if (nextResetEl) {
    const nextReset = new Date(lastSpinReset + 24 * 60 * 60 * 1000);
    nextResetEl.textContent = nextReset.toLocaleDateString();
  }
}

// Check if spins should reset
function checkSpinReset() {
  const now = Date.now();
  const timeSinceLastReset = now - lastSpinReset;
  const resetInterval = 24 * 60 * 60 * 1000; // 24 hours
  
  if (timeSinceLastReset >= resetInterval) {
    spinsRemaining = 3;
    lastSpinReset = now;
    localStorage.setItem('spinsRemaining', '3');
    localStorage.setItem('lastSpinReset', now.toString());
    updateSpinsRemaining();
  }
}

// Load spins data from localStorage
function loadSpinsData() {
  const savedSpins = localStorage.getItem('spinsRemaining');
  const savedReset = localStorage.getItem('lastSpinReset');
  
  if (savedSpins) {
    spinsRemaining = parseInt(savedSpins);
  }
  
  if (savedReset) {
    lastSpinReset = parseInt(savedReset);
  }
}

// Initialize spins data
loadSpinsData();

// ===== EVENT MANAGEMENT FUNCTIONS =====

// Edit event
function editEvent(eventId) {
  const event = events.find(e => e.id == eventId);
  if (!event) return;
  
  editingEventId = eventId;
  
  // Populate edit form
  document.getElementById('editEventTitle').value = event.title;
  document.getElementById('editEventType').value = event.event_type || event.type;
  document.getElementById('editEventDate').value = formatDateForInput(event.event_date || event.eventDate);
  document.getElementById('editEventLocation').value = event.location;
  document.getElementById('editMaxParticipants').value = event.max_participants || '';
  document.getElementById('editRegistrationFee').value = event.registration_fee || 0;
  document.getElementById('editEventDescription').value = event.description;
  document.getElementById('editEventImage').value = event.image_url || event.imageUrl || '';
  
  // Show edit modal
  document.getElementById('editEventModal').style.display = 'block';
}

// Update event
async function updateEvent(event) {
  event.preventDefault();
  
  if (!editingEventId) return;
  
  const formData = new FormData(event.target);
  const eventData = {
    title: formData.get('title'),
    event_type: formData.get('event_type'),
    event_date: formData.get('event_date'),
    location: formData.get('location'),
    max_participants: formData.get('max_participants') || null,
    registration_fee: formData.get('registration_fee') || 0,
    description: formData.get('description'),
    image_url: formData.get('image_url') || null,
    trainer_id: currentUser?.id || currentUser?.email
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${editingEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      alert('Event updated successfully!');
      closeEditEventModal();
      await loadEvents(); // Refresh events
    } else {
      const error = await response.json();
      alert('Error updating event: ' + error.error);
    }
  } catch (error) {
    console.error('Error updating event:', error);
    alert('Error updating event. Please try again.');
  }
}

// Delete event
async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainer_id: currentUser?.id || currentUser?.email
      })
    });
    
    if (response.ok) {
      alert('Event deleted successfully!');
      await loadEvents(); // Refresh events
      
      // Also refresh homepage events if we're on the homepage
      if (typeof displayEventsOnHomePage === 'function') {
        displayEventsOnHomePage();
      }
    } else {
      const error = await response.json();
      alert('Error deleting event: ' + error.error);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    
    // Fallback to localStorage deletion
    try {
      let events = JSON.parse(localStorage.getItem('fitnessEvents') || '[]');
      events = events.filter(event => event.id != eventId);
      localStorage.setItem('fitnessEvents', JSON.stringify(events));
      
      alert('Event deleted successfully!');
      await loadEvents(); // Refresh events
      
      // Also refresh homepage events if we're on the homepage
      if (typeof displayEventsOnHomePage === 'function') {
        displayEventsOnHomePage();
      }
    } catch (localError) {
      console.error('Error with localStorage fallback:', localError);
      alert('Error deleting event. Please try again.');
    }
  }
}

// Register for event
async function registerForEvent(eventId) {
  if (!currentUser) {
    alert('Please login to register for events.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id || currentUser.email
      })
    });
    
    if (response.ok) {
      alert('Successfully registered for the event!');
      closeEventModal();
      await loadEvents(); // Refresh events
    } else {
      const error = await response.json();
      alert('Error registering for event: ' + error.error);
    }
  } catch (error) {
    console.error('Error registering for event:', error);
    alert('Error registering for event. Please try again.');
  }
}

// Like/Unlike event
async function toggleLike(eventId) {
  if (!currentUser) {
    alert('Please login to like events.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id || currentUser.email
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      // Update local likes
      if (result.liked) {
        userLikes.add(eventId);
      } else {
        userLikes.delete(eventId);
      }
      saveUserLikes();
      await loadEvents(); // Refresh events
    } else {
      const error = await response.json();
      alert('Error liking event: ' + error.error);
    }
  } catch (error) {
    console.error('Error liking event:', error);
    // Fallback to local storage
    if (userLikes.has(eventId)) {
      userLikes.delete(eventId);
    } else {
      userLikes.add(eventId);
    }
    saveUserLikes();
    displayEvents();
  }
}

// Modal management functions
function closeEventModal() {
  document.getElementById('eventModal').style.display = 'none';
}

function closeEditEventModal() {
  document.getElementById('editEventModal').style.display = 'none';
  editingEventId = null;
}

// Format date for input field
function formatDateForInput(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Close modals when clicking outside
window.onclick = function(event) {
  const eventModal = document.getElementById('eventModal');
  const editEventModal = document.getElementById('editEventModal');
  
  if (event.target === eventModal) {
    closeEventModal();
  }
  if (event.target === editEventModal) {
    closeEditEventModal();
  }
}

// Make functions globally available
window.refreshEvents = refreshEvents;
window.viewEvent = viewEvent;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.registerForEvent = registerForEvent;
window.toggleLike = toggleLike;
window.closeEventModal = closeEventModal;
window.closeEditEventModal = closeEditEventModal;
window.updateEvent = updateEvent;


// Initialize YouTube API
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Global variables for YouTube players
let player1, player2;
let currentTrack = 1; // Track which player we're setting up (1 or 2)

// Initialize YouTube players when API is ready
function onYouTubeIframeAPIReady() {
    // Create empty players initially
    player1 = createPlayer('player1');
    player2 = createPlayer('player2');
}

// Create a YouTube player
function createPlayer(elementId) {
    return new YT.Player(elementId, {
        height: '180',
        width: '320',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'enablejsapi': 1,
            'origin': window.location.origin,
            'widget_referrer': window.location.href,
            'autoplay': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('Player ready:', event.target.getVideoData());
}

// Handle player state changes
function onPlayerStateChange(event) {
    const states = {
        '-1': 'unstarted',
        '0': 'ended',
        '1': 'playing',
        '2': 'paused',
        '3': 'buffering',
        '5': 'video cued'
    };
    console.log('Player state:', states[event.data]);
}

function onPlayerError(event) {
    const errors = {
        2: 'Invalid parameter',
        5: 'HTML5 player error',
        100: 'Video not found or removed',
        101: 'Embedding not allowed by video owner',
        150: 'Embedding not allowed by video owner'
    };

    console.error('Player error:', errors[event.data] || 'Unknown error');

    // Provide user feedback
    const playerElement = event.target.getIframe().parentNode;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.color = 'red';
    errorMessage.style.marginTop = '10px';
    errorMessage.textContent = `Error: ${errors[event.data] || 'Video unavailable'}. Please try another video.`;

    // Remove any existing error messages
    const existingError = playerElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    playerElement.appendChild(errorMessage);
}

// Search YouTube for videos
async function searchYouTube(query) {
    const API_KEY = 'AIzaSyDn4JZCa_xXn6jc6mwj6Ge1Kw9YvJ9T6OU'; // Replace with your API key
    try {
        // Add videoEmbeddable=true to only get videos that can be embedded
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoEmbeddable=true&videoCategoryId=10&key=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch search results');
        }

        const data = await response.json();

        // Get additional video details to verify availability
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        const videoDetailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=status,player&id=${videoIds}&key=${API_KEY}`
        );

        if (!videoDetailsResponse.ok) {
            throw new Error('Failed to fetch video details');
        }

        const videoDetails = await videoDetailsResponse.json();

        // Filter out any videos that aren't embeddable or are age-restricted
        const availableVideos = data.items.filter(item => {
            const videoDetail = videoDetails.items.find(detail => detail.id === item.id.videoId);
            return videoDetail && videoDetail.status.embeddable;
        });

        return availableVideos;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const volume1Slider = document.getElementById('volume1');
    const volume2Slider = document.getElementById('volume2');
    const volume1Value = document.getElementById('volume1Value');
    const volume2Value = document.getElementById('volume2Value');
    const playBothButton = document.getElementById('playBoth');
    const pauseBothButton = document.getElementById('pauseBoth');
    const resetBothButton = document.getElementById('resetBoth');

    // Search functionality
    searchButton.addEventListener('click', async () => {
        const query = searchInput.value;
        if (query.trim()) {
            try {
                const results = await searchYouTube(query);
                displaySearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                searchResults.innerHTML = 'Error searching for videos.';
            }
        }
    });

    // Volume control
    volume1Slider.addEventListener('input', (e) => {
        const volume = e.target.value;
        if (player1) {
            player1.setVolume(volume);
            volume1Value.textContent = volume;
        }
    });

    volume2Slider.addEventListener('input', (e) => {
        const volume = e.target.value;
        if (player2) {
            player2.setVolume(volume);
            volume2Value.textContent = volume;
        }
    });

    // Playback controls
    playBothButton.addEventListener('click', () => {
        if (player1) player1.playVideo();
        if (player2) player2.playVideo();
    });

    pauseBothButton.addEventListener('click', () => {
        if (player1) player1.pauseVideo();
        if (player2) player2.pauseVideo();
    });

    resetBothButton.addEventListener('click', () => {
        if (player1) {
            player1.seekTo(0);
            player1.pauseVideo();
        }
        if (player2) {
            player2.seekTo(0);
            player2.pauseVideo();
        }
    });
});

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No playable videos found. Please try another search.</div>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
    <strong>${result.snippet.title}</strong><br>
    <small>${result.snippet.channelTitle}</small>
`;

        resultItem.addEventListener('click', () => {
            // Clear any existing error messages
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(msg => msg.remove());

            // Load video into current player
            if (currentTrack === 1) {
                player1.loadVideoById({
                    videoId: result.id.videoId,
                    suggestedQuality: 'default'
                });
                currentTrack = 2;
            } else {
                player2.loadVideoById({
                    videoId: result.id.videoId,
                    suggestedQuality: 'default'
                });
                currentTrack = 1;
            }
            searchResults.innerHTML = '';
        });

        searchResults.appendChild(resultItem);
    });
}

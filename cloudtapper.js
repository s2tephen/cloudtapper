'use strict';

let SOUNDCLOUD_CLIENT_ID,
    SPOTIFY_CLIENT_ID,
    // SPOTIFY_CLIENT_SECRET,
    SPOTIFY_USER_ID,
    SPOTIFY_PLAYLIST_ID;

// get all API keys and account information
fetch(chrome.extension.getURL('app_keys.json'), {
  method: 'GET'
}).then(function(response) {
  return response.json();
}).then(function(json) {
  SOUNDCLOUD_CLIENT_ID = json.soundcloud_client_id;
  SPOTIFY_CLIENT_ID = json.spotify_client_id;
  // SPOTIFY_CLIENT_SECRET = json.spotify_client_secret;
  SPOTIFY_USER_ID = json.spotify_user_id;
  SPOTIFY_PLAYLIST_ID = json.spotify_playlist_id;

  if (!localStorage['spotify_access_token'] || !localStorage['spotify_token_expiry'] || Date.now < parseInt(localStorage['spotify_token_expiry'])) {
    requestSpotifyAuth();
  } else {
    bindEventHandler();
  }
}).catch(function(err) {
  console.log('ERROR: Unable to get API keys.')
});

// request Spotify authorization, implicit grant flow
// https://developer.spotify.com/web-api/authorization-guide/#implicit_grant_flow
let requestSpotifyAuth = function() {
  fetch(`https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=https://soundcloud.com/stream&scope=playlist-modify-public`, {
    method: 'GET'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    localStorage.setItem('spotify_access_token', json.access_token);
    localStorage.setItem('spotify_token_expiry', (Date.now() + json.expires_in * 1000));
  }).catch(function(err) {
    console.log('ERROR: Unable to obtain Spotify authorization code.')
  });
};

// request Spotify authorization, authorization code flow
// https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
// let requestSpotifyAuth = function() {
//   fetch(`https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=https://soundcloud.com/stream&scope=playlist-modify-public`, {
//     method: 'GET'
//   }).then(function(response) {
//     return response.json();
//   }).then(function(json)) {
//     requestAccessToken(json.code);
//   }).catch(function(err) {
//     console.log('ERROR: Unable to obtain Spotify authorization code.')
//   });
// };
//
// request Spotify access token
// let requestAccessToken = function(code) {
//   if (localStorage['spotify_refresh_token']) {
//     // using refresh token
//     fetch(`https://accounts.spotify.com/api/token&grant_type=refresh_token&refresh_token=${localStorage['spotify_refresh_token']}`, {
//       method: 'POST',
//       headers: new Headers({
//         'Authorization': `Basic ${window.btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)}`
//       })
//     }).then(function(response) {
//       return response.json();
//     }).then(function(json) {
//       localStorage.setItem('spotify_access_token', json.access_token);
//       if ('refresh_token' in json) {
//         localStorage.setItem('spotify_refresh_token', json.refresh_token);
//       }
//       localStorage.setItem('spotify_token_expiry', Date.now() + json.expires_in * 1000);
//     }).catch(function(err) {
//       console.log('ERROR: Unable to obtain Spotify access token.')
//     });
//   } else {
//     // using authorization code
//     fetch(`https://accounts.spotify.com/api/token&grant_type=authorization_code&code=${code}&redirect_uri=https://soundcloud.com/stream`, {
//       method: 'POST',
//       headers: new Headers({
//         'Authorization': `Basic ${window.btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)}`
//       })
//     }).then(function(response) {
//       return response.json();
//     }).then(function(json) {
//       localStorage.setItem('spotify_access_token', json.access_token);
//       localStorage.setItem('spotify_refresh_token', json.refresh_token);
//       localStorage.setItem('spotify_token_expiry', Date.now() + json.expires_in * 1000);
//     }).catch(function(err) {
//       console.log('ERROR: Unable to obtain Spotify access token.')
//     });
//   }
// };

// bind event handler to like button
let bindEventHandler = function() {
  document.getElementById('content').addEventListener('click', function(event) {
    if (event.target.hasClass('sc-button-like') && event.target.hasClass('sc-button-selected')) {
      let url = event.target.findAncestor('soundList__item').querySelector('a.soundTitle__title').getAttribute('href');
      lookupSoundCloud(url);
    }
  });
};

// lookup url via SoundCloud API
// SoundCloud API throws 403s on many tracks, see:
// http://stackoverflow.com/questions/36360202
let lookupSoundCloud = function(url) {
  fetch(`https://api.soundcloud.com/resolve?url=https://soundcloud.com${url}&client_id=${SOUNDCLOUD_CLIENT_ID}`, {
    method: 'GET'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    if (json.isrc) {
      searchSpotify(`${json.user.username} ${json.title.strip(/\(|\)/).strip(/(feat|ft)\.? /)}`, json.isrc);
    } else {
      searchSpotify(`${json.user.username} ${json.title.strip(/\(|\)/).strip(/(feat|ft)\.? /)}`);
    }
  }).catch(function(err) {
    // guess search query from URL
    // remove trailing digits for reuploads (1-3 to minimize false positives)
    // remove parentheses and feat/ft (since Spotify just treats them as artists)
    searchSpotify(url.split('/').join('%20').strip(/-[1-3]$/).strip(/\(|\)/).strip(/(feat|ft)\.? /));
  });
};

// search Spotify for track manually
let searchSpotify = function(query, isrc = null) {
  fetch(`https://api.spotify.com/v1/search?q=${query}${isrc ? '%20isrc:' + isrc : ''}&type=track`, {
    method: 'GET'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    console.log(json);
    // (for now) select first match
    addToPlaylist(json.tracks.items[0].uri);
  }).catch(function(err) {
    console.log('ERROR: No matching Spotify track found.');
  });
};

// add Spotify track to playlist
let addToPlaylist = function(uri) {
  fetch(`https://api.spotify.com/v1/users/${SPOTIFY_USER_ID}/playlists/${SPOTIFY_PLAYLIST_ID}/tracks?uris=${uri}`, {
    method: 'POST',
    headers: new Headers({
      'Authorization': `Bearer ${localStorage['spotify_access_token']}`,
      'Content-Type': 'application/json'
    })
  }).then(function(response) {
    console.log('SUCCESS: Track added!');
  }).catch(function(err) {
    console.log('ERROR: Failed to add track to playlist.')
  });
};

// returns true if element has class, false otherwise
Element.prototype.hasClass = function(className) {
  return this.classList.contains(className);
}

// returns first ancestor element with specified class
Element.prototype.findAncestor = function(className) {
  let curEl = this;
  while (curEl.parentElement) {
    curEl = curEl.parentElement;
    if (curEl.hasClass(className)) {
      return curEl;
    }
  }
  return null;
}

// remove all instances of a pattern from a string
String.prototype.strip = function(pattern) {
  return this.replace(new RegExp(pattern, 'g'), '');
}
# Cloudtapper

*Cloudtapper* is a Google Chrome extension that automatically adds liked tracks on SoundCloud to a specified playlist on Spotify. I have a [monthly-curated Spotify playlist](https://open.spotify.com/user/s2tephen/playlist/5CNtiSSfE5XVnhUkcbMaJw), most of which is music I find on SoundCloud. I got tired of manually searching for every single track, so I whipped this together as a general timesaver.

This was created for my own personal use — not for production — but you're certainly free to set it up on your own browser if this use case speaks to you. Currently, this extension only works from the SoundCloud Stream page (really my only use case) and for now it only works with individual tracks, not sets/playlists (to be implemented later).

## Setup

Create a file called `app_keys.json` in the extension directory with the following variables:

```
{
  "soundcloud_client_id": YOUR_SOUNDCLOUD_CLIENT_ID,
  "spotify_client_id": YOUR_SPOTIFY_CLIENT_ID,
  "spotify_user_id": YOUR_SPOTIFY_USER_ID,
  "spotify_playlist_id": YOUR_SPOTIFY_PLAYLIST_ID
}
```

Then either package up the extension and install it, or just run Chrome in developer mode and point it to this directory.

Go to the [SoundCloud Stream page](https://soundcloud.com/stream) and like a track to go through the initial authorization process, though there's no real UI to guide you through the process right now. After that, you should be able to like a track and if Spotify's search can find a match, it'll automatically be added to your playlist.

## Future updates

If I ever do decide to update this for actual publishing, I'll add an options page for all the Spotify authorization stuff and allow you to change what playlist you add to from that menu. The extension should support likes on artist pages or individual track pages, and should also do some more sophisticated matching (or at least prompt the user to choose) when the search results aren't clear-cut.
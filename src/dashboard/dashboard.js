import { fetchRequest } from "../api";
import { ENDPOINT, LOADED_TRACKS, SECTIONTYPE, getItemFromLocalStorage, logout, setItemInLocalStorage } from "../common";

const audio = new Audio();


const onProfileClick = (event) =>{
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle("hidden");
    if(!profileMenu.classList.contains("hidden")){
        profileMenu.querySelector("li#logout").addEventListener("click", logout)
    }
}

const loadUserProfile = async() => {
    const defaultImage = document.querySelector("#default-image")
    const profileButton = document.querySelector("#user-profile-btn");
    const displayNameElement = document.querySelector("#display-name");

    const {display_name: displayName, images} = await fetchRequest(ENDPOINT.userInfo);
    
    if(images?.length){
        defaultImage.classList.add("hidden");
    }else{
        defaultImage.classList.remove("hidden");
    }

    profileButton.addEventListener("click", onProfileClick)

    displayNameElement.textContent = displayName;
}

const onPlaylistItemClicked = (event,id) =>{
    console.log(event.target);
    const section = {type: SECTIONTYPE.PLAYLIST, playlist: id}
    history.pushState(section,"", `playlist/${id}`);
    loadSection(section);
}

const loadPlaylist = async (endpoint, elementId) => {
    const {playlists: {items}} = await fetchRequest(endpoint);
    const playlistItemsSection = document.querySelector(`#${elementId}`);
    
    for(let {name, description, images, id} of items){
        const playlistItems = document.createElement("section");
        playlistItems.className = "bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
        playlistItems.id = id;
        playlistItems.setAttribute("data-type", "playlist");
        playlistItems.addEventListener("click",(event) => onPlaylistItemClicked(event,id));
        const [{url: imageUrl}] = images;
        playlistItems.innerHTML =`<img src="${imageUrl}" alt="${name}" class="rounded nb-2 object-contain shadow" />
            <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
            <h3 class="text-sm text-zinc-400 line-clamp-2">${description}</h3>`

            playlistItemsSection.appendChild(playlistItems);
    } 
}

const loadPlaylists = () =>{
    loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
    loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
}

const fillContentForDashboard = () => {
    const coverContent =document.querySelector("#cover-content");
    coverContent.innerHTML =`<h1 class="text-6xl">Hello, </h1>`
    const pageContent = document.querySelector("#page-content");
    const playlistMap = new Map([["featured","featured-playlist-items"],["top playlists","top-playlist-items"]]);
    let innerHTML = "";
    for(let [type, id] of playlistMap){
        innerHTML += `<article class="p-4">
        <h1 class="text-2xl font-bold capitalize mb-4">${type}</h1>
        <section id="${id}" class="featured-song grid grid-cols-auto-fill-cards gap-4">
           
        </section>
    </article>`
    }
    pageContent.innerHTML = innerHTML;
}

const formatTime = (duration) => {
    const min = Math.floor(duration/60_000);
    const sec = ((duration % 6_000)/1000).toFixed(0);
    const formattedTime = sec == 60 ?
    min + 1 + ":00" : min + ":" + (sec < 10 ? "0"  :"")+ sec;
    return formattedTime;
}

const onTrackSelection = (id, event) => {
    document.querySelectorAll("#tracks .track").forEach(trackItem => {
        if(trackItem.id === id){
            trackItem.classList.add("bg-gray", "selected");
        }else{
            trackItem.classList.remove("bg-gray", "selected");
        }
    })
}

// const timeline = document.querySelector("#")

const updateIconsForPlayMode = (id) =>{
    const playButton = document.querySelector("#play");
    playButton.querySelector("span").textContent = "pause_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if(playButtonFromTracks){
        playButtonFromTracks.textContent = "pause";
    }
}

const updateIconsForPauseMode = (id) =>{
    const playButton = document.querySelector("#play");
    playButton.querySelector("span").textContent = "play_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if(playButtonFromTracks){
    playButtonFromTracks.textContent = "play_arrow";
}
}

const onAudioMetadateLoaded = (id) =>{
    const totalSongDuration = document.querySelector("#total-song-duration");
    totalSongDuration.textContent = `0: ${audio.duration.toFixed(0)}`;
}

const togglePlay = () => {
    if(audio.src){
        if(audio.paused){
            audio.play();
        }else{
            audio.pause();
        }
    }
}

const findCurrentTracks = ()=>{
    const audioControl = document.querySelector("#audio-control");
    const trackId = audioControl.getAttribute("data-track-id");
    if(trackId){
        const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
        const currentTracksIndex = loadedTracks?.findIndex(trk => trk.id === trackId);
        return{currentTracksIndex, tracks: loadedTracks};
    }
    return null;
}

const playNextTrack  = () =>{
    const { currentTracksIndex = -1, tracks = null} = findCurrentTracks()?? {};
    if(currentTracksIndex > -1 && currentTracksIndex < tracks?.length -1){
        playTrack(null, tracks[currentTracksIndex + 1]);
    }

}

const playPrevTrack = () =>{
    const { currentTracksIndex = -1, tracks = null} = findCurrentTracks()?? {};
    if(currentTracksIndex > 0){
        playTrack(null, tracks[currentTracksIndex - 1]);
    }

}

const playTrack = (event, {image, artistNames, name, duration, preview_url, id }) =>{
    if(event?.stopPropagation){
        event.stopPropagation();
    }
    if(audio.src === preview_url){
        togglePlay();
    }else{
        
     console.log(image, artistNames, name, duration, preview_url, id);

    const nowPlayingSongImage = document.querySelector("#now-playing-image");
    const songTitle = document.querySelector("#now-playing-song");
    const artists = document.querySelector("#now-playing-artists");
    const audioControl = document.querySelector("#audio-control");
    const songInfo = document.querySelector("#song-info");

    audioControl.setAttribute("data-track-id",id);
    nowPlayingSongImage.src = image.url;
    songTitle.textContent = name;
    artists.textContent = artistNames;
    audio.src = preview_url;
    audio.play();
    songInfo.classList.remove("invisible");

} 
}



const loadPlaylistTracks = ({tracks}) => {
    const trackSection = document.querySelector("#tracks");
    let trackNo=1;
    const loadedTracks = [];
    for(let trackItem of tracks.items.filter(item=> item.track.preview_url)){
        let {id, artists, name, album, duration_ms: duration, preview_url:preview_url} = trackItem.track;
        let track = document.createElement("section");
        track.id = id;
        track.className = "track p-1 grid grid-cols-[50px_1fr_1fr_50px] items-center justify-items-start gap-4 rounded-md hover:bg-light-black";
        let image = album.images.find(img => img.height === 64);
        let artistNames = Array.from(artists, artist=> artist.name).join(", ");
        
        track.innerHTML = `
        <p class=" relative w-full flex items-center justify-center justify-self-center"><span class="track-no">${trackNo++}</span></p>
            <section class="grid grid-cols-[auto_1fr] place-items-center gap-3">
                <img class="h-10 w-10" src="${image.url}" alt="${name}"/>
                <article class="flex flex-col gap-2 justify-center">
                    <h2 class="song-title text-primary line-clamp-1 text-base">${name}</h2>
                    <p class="text-xs line-clamp-1">${artistNames}</p>
                </article>
            </section>
        <p class="text-sm">${album.name}</p>
        <p class="text-sm">${formatTime(duration)}</p>`;

        track.addEventListener("click", (event) => onTrackSelection(id, event));
        const playButton = document.createElement("button");
        playButton.id = `play-track-${id}`;
        playButton.className=`play w-full absolute left-0 text-lg invisible material-symbols-outlined`;
        playButton.textContent = "play_arrow"; 
        playButton.addEventListener("click", (event)=> playTrack(event, {image, artistNames, name, duration, preview_url, id }))
        track.querySelector("p").appendChild(playButton);
        trackSection.appendChild(track);
        loadedTracks.push({id, artistNames, name, album, duration, preview_url, image});
    }

    setItemInLocalStorage(LOADED_TRACKS, loadedTracks);
}

const fillContentForPlaylist = async(playlistId) => {
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`)
    console.log(playlist);
    const {name, description,images,tracks} = playlist;
    const coverElement =document.querySelector("#cover-content");
    coverElement.innerHTML = ` 
    <img class="object-content h-36 w-36" src="${images[0].url}" alt="" srcset="">
    <section>
        <h2 id="platlist-name" class="text-4xl">${name}</h2>
        <p id="playlist-details">${tracks.items.length} songs</p>
    </section>
    `
    const pageContent = document.querySelector("#page-content");
    pageContent.innerHTML = ` 
    <header id="playlist-header" class="mx-8 border-secondary border-b-[0.5px] z-10">
        <nav class="py-2">
            <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-zinc-400">
                <li class="justify-self-center">No.</li>
                <li>Title</li>
                <li>Album</li>
                <li>Duration</li>
            </ul>
        </nav>
   </header>
   <section class="px-8 mt-4 text-zinc-400" id="tracks">
   </section>`

   console.log(playlist);
   loadPlaylistTracks(playlist);
    
}

const onContentScroll =  (event) =>{

    const {scrollTop} = event.target;
    const header = document.querySelector(".header");
    const coverElement = document.querySelector("#cover-content");
    const totalHeight = coverElement.offsetHeight;
    const coverOpacity = 100 - (scrollTop >= totalHeight ? 100: ((scrollTop/totalHeight)* 100));
    const herderOpacity = scrollTop >= header.offsetHeight? 100:((scrollTop/header.offsetHeight)*100);
    coverElement.style.opacity = `${coverOpacity}%`;
    header.style.background = `rgba(0 0 0 / ${herderOpacity}%)`;

    if(history.state.type === SECTIONTYPE.PLAYLIST){
        const playlistHeader = document.querySelector("#playlist-header");
        if(coverOpacity <= 35){
            playlistHeader.classList.add("sticky","bg-black-secondary","px-8");
            playlistHeader.classList.remove("mx-8");
            playlistHeader.style.top = `${header.offsetHeight}px`;
        }else{
            playlistHeader.classList.remove("sticky","bg-black-secondary","px-8");
            playlistHeader.classList.add("mx-8");
            playlistHeader.style.top = `revert`;
        }

    }
}

const loadSection = (section) => {
    if(section.type === SECTIONTYPE.DASHBOARD){
         fillContentForDashboard();
         loadPlaylists();
    }else if (section.type === SECTIONTYPE.PLAYLIST ){
        fillContentForPlaylist(section.playlist);
    }

    
    document.querySelector(".content").removeEventListener("scroll", onContentScroll);
    document.querySelector(".content").addEventListener("scroll", onContentScroll);

}

const onUserPlaylistClick = (id)=>{
    const section = {type:SECTIONTYPE.PLAYLIST, playlist: id};
    history.pushState(section,"", `/dashboard/playlist/${id}`);
    loadSection(section);
}

const loadUserPlaylists = async()=>{
    const playlists = await fetchRequest(ENDPOINT.userPlaylist);
    console.log(playlists);
    const userPlaylistSection = document.querySelector("#user-playlists > ul");
    userPlaylistSection.innerHTML = "";
    for(let {name, id} of playlists.items){
        const li = document.createElement("li");
        li.textContent = name;
        li.className = "cursor-pointer hover:text-primary";
        li.addEventListener("click", ()=> onUserPlaylistClick(id));
        userPlaylistSection.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", () =>{
    const volume = document.querySelector("#volume");
const playButton = document.querySelector("#play");
const songDurationCompleted = document.querySelector("#song-duration-completed");
const  songProgress = document.querySelector("#progress");
const timeline = document.querySelector("#timeline");
const audioControl = document.querySelector("#audio-control");
const next = document.querySelector("#next");
const prev = document.querySelector("#prev");
let progressInterval;
    loadUserProfile();
    loadUserPlaylists();
     const section = {type: SECTIONTYPE.DASHBOARD};
    // playlist / 37i9dQZF1DX0XUfTFmNBRM
    //const section = {type: SECTIONTYPE.PLAYLIST, playlist:"37i9dQZF1DX0XUfTFmNBRM"}
    history.pushState(section,"","");
    //history.pushState(section,"",`/dashboard/playlist/${section.playlist}`);
    loadSection(section);
    document.addEventListener("click", ()=>{
        const profileMenu = document.querySelector("#profile-menu");
        if(!profileMenu.classList.contains("hidden")){
            profileMenu.classList.add("hidden")
        }
    })

    audio.addEventListener("play", () => {

        const selectedTrackedId = audioControl.getAttribute("data-track-id");
        const tracks = document.querySelector("#tracks");
        const playingTrack = tracks?.querySelector("section.playing");
        const selectedTrack = tracks?.querySelector(`[id="${selectedTrackedId}"]`);
        if(playingTrack?.id !== selectedTrack?.id){
            playingTrack?.classList.remove("playing");
        }
        selectedTrack?.classList.add("playing");
        progressInterval = setInterval(() =>{
        if(audio.paused){
            return
        }
        songDurationCompleted.textContent = `${audio.currentTime.toFixed(0) < 10 ? "0:0" + audio.currentTime.toFixed(0) : "0:" + audio.currentTime.toFixed(0) }`;
        songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;

    }, 100);
    updateIconsForPlayMode(selectedTrackedId);
    });

    audio.addEventListener("pause", () => {
        if(progressInterval){
            clearInterval(progressInterval);
        }
        const selectedTrackedId = audioControl.getAttribute("data-track-id");
        updateIconsForPauseMode(selectedTrackedId);
    })

    audio.addEventListener("loadedmetadata", onAudioMetadateLoaded);
    playButton.addEventListener("click", togglePlay);

    volume.addEventListener("change", () => {
        audio.volume = volume.value /100 ;
    })

    timeline.addEventListener("click", (e) => {
        const timelineWidth = window.getComputedStyle(timeline).width;
        const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
        audio.currentTime = timeToSeek;
        songProgress.style.width = `${(audio.currentTime / audio.duration)* 100}%`;
    },false);

    next.addEventListener("click", playNextTrack);
    prev.addEventListener("click", playPrevTrack);

    window.addEventListener("popstate", (event) =>{
        loadSection(event.state);
    })
})
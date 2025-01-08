const { open } = window.__TAURI__.dialog;
const { load } = window.__TAURI__.store;
const { invoke } = window.__TAURI__.core;

// Datas
let page = 0
var covers = {}
var database = []
var playlist = {}
var audio = new Audio()
var atualMusic = {}

let paused = false

const icons = {
    playIcon: ` <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-play-fill"
            viewBox="0 0 16 16">
            <path
              d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
          </svg>`,
    pauseIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
  <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5"/>
</svg>`
}

function playOrPause(value = false) {
    if (!atualMusic.title) return
    if (audio.paused || value) {
        audio.play()
        document.getElementById("play-or-pause-global").innerHTML = icons["pauseIcon"]
        document.getElementById(`play-${atualMusic.title}-music`).innerHTML = icons['pauseIcon']
        document.getElementById(atualMusic.artist.replaceAll(" ", "-").toLowerCase() + "-play").innerHTML = icons["pauseIcon"]
    }
    else {
        audio.pause()
        document.getElementById("play-or-pause-global").innerHTML = icons["playIcon"]
        document.getElementById(`play-${atualMusic.title}-music`).innerHTML = icons['playIcon']
        document.getElementById(atualMusic.artist.replaceAll(" ", "-").toLowerCase() + "-play").innerHTML = icons["playIcon"]
    }
}


function activeStatus(title, artist) {
    document.getElementById("atual-music-name").innerHTML = title
    document.getElementById("atual-music-artist").innerHTML = artist
    for (const tab of document.getElementsByName("track-list-names")) {
        tab.style.color = "white";
    }
    document.getElementById(`${title}-track-name`).style.color = "#53b0ff"
    for (const tab of document.getElementsByName("track-list-controls")) {
        tab.innerHTML = icons["playIcon"]
    }
    document.getElementById(`play-${title}-music`).innerHTML = icons["pauseIcon"]

    for (const tab of document.getElementsByName("artist-play-display")) {
        tab.innerHTML = icons["playIcon"]
    }
    document.getElementById(`${artist.toLowerCase().replaceAll(" ", "-")}-play`).innerHTML = icons["pauseIcon"]

    document.getElementById("atual-music-icon").src = covers[artist]
}

function newArtist(artist) {
    let id = artist.toLowerCase().replaceAll(" ", "-")
    const artistsElement = document.getElementById("artists")
    const newArtistDiv = document.createElement("div")
    newArtistDiv.innerHTML = `
    <div class="grid duration-200 hover:bg-[#191718] rounded-md justify-center">
    <div id="${id}" class="relative w-[250px] rounded-md p-3">
    <img class="rounded-lg w-[220px]" src="${covers[artist]}" />
    <p>${artist}</p>
    <div name="artist-play-display" class="absolute bottom-10 right-6 text-black bg-[#18d0ff] rounded-full justify-center items-center"
    id="${id}-play">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="p-1"
    viewBox="0 0 16 16">
    <path
    d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
    </svg>
    </div>
    </div>
</div>`

    artistsElement.appendChild(newArtistDiv)
    document.getElementById(id + "-play").onclick = () => {
        playlist = database.filter(v => v.artist === artist)
        setMusicAtual(playlist[0])
    }
}


function setAudio(base64Audio) {
    function base64ToBlob(base64, mimeType) {
        const byteString = atob(base64);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        return new Blob([uint8Array], { type: mimeType });
    }

    const audioBlob = base64ToBlob(base64Audio, "audio/mp3");
    const audioUrl = URL.createObjectURL(audioBlob);

    audio.src = audioUrl
    //audio.loop = true
}


function setPage(value = 0) {
    for (const tab of document.getElementsByName("page")) {
        tab.style.display = "none"
    }
    document.getElementById(`page-${value}`).style = "grid"

    for (const tab of document.getElementsByName("page-buttons")) {
        tab.style.borderTop = ""
    }
    document.getElementById(`${value}-page`).style.borderTop = "2px solid #35d1ff"
}

setPage(0)
document.getElementById("home-page").onclick = () => setPage()
document.getElementById("0-page").onclick = () => setPage()
document.getElementById("1-page").onclick = () => setPage(1)
const items = document.getElementById("items")

var base = 10

function addProgess() {
    document.getElementById("progress-bar").style.width = `${base + 10}px`
    base += 10
}

window.__TAURI__.event.listen('download-started', (event) => {
    console.log(event)
    addProgess()
});
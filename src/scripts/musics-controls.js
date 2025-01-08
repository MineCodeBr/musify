
async function setMusicAtual({ path, title, artist, index }) {
    if (!title) return
    if (atualMusic.title != title) {
        const store = await load('store.json', { autoSave: false });
        if (playlist) playlist = null
        atualMusic = { path, title, artist, index }
        const base64Audio = await invoke("read_file", { path, normal: false })
        activeStatus(title, artist)
        setAudio(base64Audio);
        playOrPause(true)

        await store.set('atualMusic', atualMusic);
        await store.save()
    } else playOrPause()
}

async function newTrack({ title, artist, path, duration, index }) {
    if (database.find(v => v.title === title)) return
    database.push({ title, artist, path, duration, index })

    const newElement = document.createElement("div")
    newElement.innerHTML = `
<div class="relative w-[95%] duration-200 hover:bg-[#191718] rounded-md">
    <div class="w-[95%] flex items-center">
        <div class="flex items-center">
            <div class="ml-2">
                <p name="track-list-names" id="${title}-track-name">${title}</p>
                <p class="text-[#757575]">${artist}</p>
            </div>
        </div>
        <div class="absolute left-[50%]">
            <p>${String(parseFloat(duration?.secs / 60)).replace(".", ":").slice(0, 4)}</p>
        </div>
        <div name="track-list-controls" id="play-${title}-music" class="absolute left-[90%]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-play-fill"
                viewBox="0 0 16 16">
                <path
                    d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
            </svg>
        </div>
    </div>
</div>`
    document.getElementById("musics").appendChild(newElement)

    document.getElementById(`play-${title}-music`).onclick = function () {
        activeStatus(title, artist)
        setMusicAtual({ path, title, artist, index })
    }
}

document.getElementById("time-music").oninput = function () {
    audio.currentTime = this.value;
}

document.getElementById("volume-change").oninput = async function () {
    audio.volume = this.value;
    const store = await load('store.json', { autoSave: false });
    await store.set('volume', { value: this.value });
    await store.save();
}

setInterval(() => {
    document.getElementById("time-music").max = audio.duration
    if (!audio.paused) document.getElementById("time-music").value = audio?.currentTime
}, 1)

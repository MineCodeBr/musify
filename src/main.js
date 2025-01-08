let indexGlobal = 0
const artists = []


async function main() {

  const store = await load('store.json', { autoSave: false });
  const val = await store.get('database');
  for (const file of val
    ?.sort(function (a, b) {
      return Number(a.title.split("-")[0]) - Number(b.title.split("-")[0]);
    })
    ?.sort(function (a, b) {
      return a.artist === b.artist
    })
  ) {
    if (!artists.includes(file.artist)) {
      const imgCover = await invoke("read_cover_music", { path: file.path })
      covers[file.artist] = `data:image/jpeg;base64,${imgCover}`;
      newArtist(file.artist)
      artists.push(file.artist)
    }
    newTrack({ ...file, index: indexGlobal })
    indexGlobal++
  }
  const volume = await store.get('volume');
  document.getElementById("volume-change").value = volume?.value ? volume.value : 0.5
  console.log(volume.value)
  audio.volume = volume?.value ? volume.value : 0.5
  const endTrack = await store.get('atualMusic');
  //if (endTrack) setMusicAtual(endTrack)
} main()


document.getElementById("import-music-button").onclick = async function () {
  const folder = await open({
    multiple: false,
    directory: true,
  });
  if (!folder) return
  const store = await load('store.json', { autoSave: false });
  const files = await invoke("read_dir", { path: folder })
  for (const file of files.sort(function (a, b) {
    return Number(a.title.split("-")[0]) - Number(b.title.split("-")[0]);
  })) {
    if (!artists.includes(file.artist)) {
      const imgCover = await invoke("read_cover_music", { path: file.path })
      covers[file.artist] = `data:image/jpeg;base64,${imgCover}`;
      newArtist(file.artist)
      artists.push(file.artist)
    }
    newTrack({ ...file, index: indexGlobal })
    indexGlobal++
  }

  await store.set('database', [...database]);
  await store.save();
}


document.getElementById("play-or-pause-global").onclick = () => playOrPause()


audio.addEventListener("ended", () => setMusicAtual(playlist ? playlist.at(atualMusic.index + 1) : database.at(atualMusic.index + 1)))

document.getElementById("next-track-global").onclick = () => setMusicAtual(playlist ? playlist.at(atualMusic.index + 1) : database.at(atualMusic.index + 1))
document.getElementById("prev-track-global").onclick = () => setMusicAtual(playlist ? playlist.at(atualMusic.index - 1) : database.at(atualMusic.index - 1))



document.getElementById("button-link-youtube-seach").onclick = async () => {
    const value = document.getElementById("link-youtube-seach").value
    if (!value || !value.includes("https://www.youtube.com/")) {
        document.getElementById("youtube-input-url").style.outline = "1px solid #7a0000"
        document.getElementById("msg-err").style.display = "block"
        document.getElementById("msg-err").style.color = "#7a0000"
        document.getElementById("msg-err").style.fontSize = "15px"
        document.getElementById("msg-err").innerText = "No valid link"
        return
        // document.getElementById("youtube-input-url").style.borderColor="red"
    }

    console.log("oi")
    const t = await invoke("get_playlist_download")
    console.log(t)
}
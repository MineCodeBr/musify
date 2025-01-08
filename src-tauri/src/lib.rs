// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use audiotags::Tag;
use base64::{ engine::general_purpose, Engine as _ };
use std::fs;

use tauri::Emitter;
use youtube_dl::YoutubeDl;
use std::path::Path;

const GENRE_PLAYLIST: &str = "Pagode";
const YOUTUBE_PLAY: &str =
    "https://www.youtube.com/playlist?list=PLvgcQr40gK93sAFdogZ7y_sTCd2UXy3P4";
const OUTPUT_PATH: &str = "/home/matt/Área de Trabalho/SLA/Raca Negras";

async fn set_metadata(path: &str, file: &str, artist: &str, i: u16, genre: &str) {
    //Url of thubnail
    let mut file_url = String::new();
    file_url.push_str(path);
    file_url.push_str("/");
    file_url.push_str(&file.replace("/", "⧸"));
    file_url.push_str(".mp3");
    println!("Dir {}", file_url);

    if !fs::exists(file_url.clone()).is_err() {
        let audiotags = Tag::new().read_from_path(file_url.clone().to_string());

        match audiotags {
            Ok(mut tag) => {
                //Set metadatas
                tag.set_title(file);
                tag.set_artist(artist);
                tag.set_album_title(artist);
                tag.set_disc_number(i);
                tag.set_genre(genre);
                //Set picture
                tag.write_to_path(&file_url.clone()).expect("Fail to save");
            }
            Err(er) => println!("Setmetadata {:?}", er),
        }
    }
}

async fn download_track(
    app: tauri::AppHandle,
    video: youtube_dl::model::SingleVideo,
    path: &str,
    i: u16,
    genre: &str,
    max_items: u32
) {
    let mut title = "";
    /*
    Metadata use
    */
    let mut artist = "";

    match video.url {
        Some(ref url) => {
            match &video.title {
                Some(ti) => {
                    title = ti;
                    println!("Titulo {:#?} {}", ti, i);
                }
                None => println!("Sem titulo"),
            }

            match &video.uploader {
                Some(art) => {
                    artist = art;
                }
                None => println!("Sem Artista"),
            }

            let mut file_url = String::new();
            file_url.push_str(path);
            file_url.push_str("/");
            file_url.push_str(&title.replace("/", "⧸"));
            file_url.push_str(".mp3");
            if !fs::exists(&file_url).unwrap() {
                let result = YoutubeDl::new(url.clone())
                    .extract_audio(true)
                    .extra_arg("--audio-format")
                    .extra_arg("mp3")
                    .output_template("%(title)s")
                    .download_to(Path::new(path));
                match result {
                    Ok(()) => {
                        app.emit(
                            "download-started",
                            format!("{} / {} /{}/ {} / {}", url, title, artist, i, max_items)
                        ).unwrap();

                        println!("Baixada com sucesso {}", i);
                        set_metadata(path, title, artist, i, genre).await;
                    }
                    Err(e) => println!("Erro ao baixa {:?}", e),
                }
            }
        }
        None => println!("Sem url"),
    }
}

fn get_playlist_info(url: &str) -> Result<youtube_dl::YoutubeDlOutput, youtube_dl::Error> {
    let mut output = YoutubeDl::new(url);
    output.flat_playlist(true);
    output.extract_audio(true);
    output.extra_arg("--audio-format");
    output.extra_arg("mp3");

    return output.run();
}

#[tauri::command]
async fn get_playlist_download(app: tauri::AppHandle) -> Result<(), String> {
    let mut index = 1;

    let playlist = get_playlist_info(YOUTUBE_PLAY).expect("REASON").into_playlist();
    if let Some(videos) = playlist {
        match videos.entries {
            Some(items) => {
                let max_items = items.len();
                for video in items {
                    download_track(
                        app.clone(),
                        video.clone(),
                        OUTPUT_PATH,
                        index,
                        GENRE_PLAYLIST,
                        max_items.try_into().unwrap()
                    ).await;
                    index = index + 1;
                }
            }
            None => println!("Sem items"),
        }
    } else {
        println!("Nenhum vídeo encontrado.");
    }

    Ok(())
}

#[derive(Debug, serde::Serialize)]
struct Music {
    title: String,
    artist: String,
    path: String,
    duration: std::time::Duration,
}

#[tauri::command]
fn read_cover_music(path: &str) -> String {
    let tag = Tag::new().read_from_path(path).unwrap();
    let base64_string = general_purpose::STANDARD.encode(tag.album_cover().unwrap().data);
    format!("{}", base64_string)
}

#[tauri::command]
fn read_file(path: &str, normal: bool) -> String {
    if normal == true {
        let contents = fs::read_to_string(path);
        match contents {
            Ok(cont) => {
                return format!("{}", cont);
            }
            _err => {
                println!("erro ao ler file.");
                return format!("Error.");
            }
        }
    } else {
        let bytes = fs::read(path);
        let bytes = match bytes {
            Ok(data) => data,
            Err(err) => {
                println!("Erro ao ler o arquivo image: {:?}", err);
                return format!("Error");
            }
        };

        // Codificar em Base64
        let base64_string = general_purpose::STANDARD.encode(&bytes);
        format!("{}", base64_string)
    }
}

#[tauri::command]
fn read_dir(path: &str) -> Vec<Music> {
    let dir = std::fs::read_dir(path).expect("sla");
    let mut result: Vec<Music> = vec![];
    let _ = dir
        .filter_map(|e| e.ok())
        .map(|e| {
            let tag = Tag::new().read_from_path(e.path()).unwrap();
            let t = Music {
                title: String::from(tag.title().unwrap()),
                artist: String::from(tag.artist().unwrap()),
                path: e.path().into_os_string().into_string().expect("str"),
                duration: mp3_duration::from_file(&fs::File::open(e.path()).unwrap()).unwrap(),
            };
            result.push(t)
        })
        .collect::<Vec<_>>();

    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(
            tauri::generate_handler![read_file, read_dir, read_cover_music, get_playlist_download]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

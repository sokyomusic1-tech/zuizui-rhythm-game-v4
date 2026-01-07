export interface SongData {
  id: string;
  title: string;
  bpm: number;
  duration: number; // 秒単位
  durationDisplay: string; // 表示用（例: "3:27"）
  coverImage: string | any; // URLまたはrequire()
  audioFile: any;
  backgroundImage?: string | any; // ゲームプレイ中の背景画像（オプショナル）
  backgroundVideo?: any; // ゲームプレイ中の背景動画（オプショナル）
}

export const songs: SongData[] = [
  {
    id: "cruel_angel_thesis",
    title: "【エヴァ】残酷な天使のテーゼ Cyber Angel Thesis cover×Metal×EDM アレンジ",
    bpm: 129.3,
    duration: 284, // 4分44秒
    durationDisplay: "4:44",
    coverImage: require("@/assets/images/cruel_angel_thesis_cover.jpg"),
    audioFile: require("@/assets/audio/cruel_angel_thesis.mp4"),
    backgroundVideo: require("@/assets/audio/cruel_angel_thesis.mp4"),
  },
  {
    id: "solid_state_scouter",
    title: "ソリッドステート スカウター（Solid State Scouter) EDM×METAL",
    bpm: 94.2,
    duration: 250, // 4分10秒
    durationDisplay: "4:10",
    coverImage: require("@/assets/images/solid_state_scouter_cover.jpg"),
    audioFile: require("@/assets/audio/solid_state_scouter.mp4"),
    backgroundVideo: require("@/assets/audio/solid_state_scouter.mp4"),
  },
  {
    id: "moechakka_fire",
    title: "モエチャッカファイア (Cover) Metal x EDM",
    bpm: 81.6,
    duration: 233, // 3分53秒
    durationDisplay: "3:53",
    coverImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663153379247/KGYPiUjtNkQhjWmP.jpg",
    audioFile: require("@/assets/audio/moechakka_fire.mp3"),
    backgroundImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663153379247/KGYPiUjtNkQhjWmP.jpg", // 同じ画像を使用
  },
  {
    id: "zuizui_anime",
    title: "ズイズイソング2025 アニメソング風",
    bpm: 76,
    duration: 130, // 2分10秒（実際の再生時間）
    durationDisplay: "2:10",
    coverImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663153379247/JgoFIxUcZwkRVBdo.jpg",
    audioFile: require("@/assets/audio/zuizui_anime.mp3"),
    backgroundImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663153379247/JgoFIxUcZwkRVBdo.jpg", // 同じ画像を使用
  },
  {
    id: "zuizui_rock",
    title: "ズイズイソング 和風ロック",
    bpm: 82,
    duration: 207, // 3分27秒
    durationDisplay: "3:27",
    coverImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663153379247/TxPbLVQBPuXQYZMH.jpg",
    audioFile: require("@/assets/audio/zuizui_song.mp3"),
    backgroundImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663153379247/TxPbLVQBPuXQYZMH.jpg", // 同じ画像を使用
  },
];

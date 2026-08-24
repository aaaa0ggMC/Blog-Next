---
title: AIDJ
date: 2026-07-16
category: essays
tags: [AI, 创作]
desc: 用Gemini CLI打造专属AI音乐DJ，摆脱单调的推歌推荐
---

# AIDJ

<np>
大概七个月前,那个时候claude code很火。我以前的工作流本来是我自己写项目，然后边写便发给AI探讨接下来该怎么走，但是claude code让CS社区掀起了“程序员可以用claude code上天”的浪潮。
</np>

<np>
然而我并没有claude的paid tier，我只有在淘宝阴暗角落淘到的一个Google Gemini Pro账号，因此我用了当时还活着的gemini cli<span class='ps'>(现在你到官网会看到"Unpaid tier and Google One users: Gemini CLI will be replaced by Antigravity CLI on June 18th. To learn more, see our blog post.")</span>，准备开启我个人的vibe旅程。
</np>

<np>
当时我就很讨厌网易云的推歌机制，我都是给你送了一百年钱财的送财童子了，结果有的时候你推送歌曲和shit一样。以前我还没意识到这点，直到有次我刷了很多次推送的歌都是猎奇歌曲时，我突然觉得自己需要个懂我的DJ来给我推送定制化的歌曲，我突然意识到了因为我对自己隐私的在意，网易云并不能知道我当时在吃饭还是啥的然后结合我当时情感给我推送最合适的歌曲。
</np>

<np>
这便是AIDJ这个项目诞生的原因。我思考了下后准备使用小学二年级学生都会的Python做这个项目，但是......
</np>

<np>
我并不会Python。我是个根深蒂固的C++er，只会这种令外行震撼，内行震撼的代码：
</np>

```py
while True:
    print("Your computer is fucking hacked by me, hahahahaha!!!!!")
    print("You gonna DIEEEEE!")
```

<np>显然，大棒就交给你了gemini😱!!!!</np>

<np>我先写了第一个版本(甚至第一个版本也是我写一半，AI一半)，大致长这样：</np>

:::details 如果你是Nerd，可以展开看代码

```py
import re
import os
import json
import time
from tqdm import tqdm
import openai 
import subprocess
import requests

CONFIG_PATH = "./config.json"
METADATA_PATH = "./music_metadata.json"
MUSIC_EXTS = ('.mp3','.flac','.wav','.m4a')

DS_BASE_URL = "https://api.deepseek.com"
NCM_BASE_URL = "http://localhost:3000"

CFG_KEY_MF = "music_folders"

SECRET_DS = ""
SECRET_TV = ""

ds_client = None
tv_client = None

def load_config():
    if not os.path.exists(CONFIG_PATH):
       print(f"ERROR cannot open file {CONFIG_PATH} for config!Exiting...")
       exit(-1)
       return None
    with open(CONFIG_PATH,"r",encoding="utf-8") as f:
       return json.load(f)

def scan_music_files(folders):
    music_files = {}
    for folder in folders:
        if not os.path.exists(folder):
            print(f"WARN  folder {folder} does not exist!Skipping...")
            continue
        for root,_,files in os.walk(folder):
            for file in files:
                if file.lower().endswith(MUSIC_EXTS):
                    file_key = os.path.splitext(file)[0]
                    music_files[file_key] = os.path.join(root,file)
    return music_files

def load_cached_metadata():
    if not os.path.exists(METADATA_PATH):
       print(f"LOG   Empty cached metadata.")
       return {}
    with open(METADATA_PATH,"r",encoding="utf-8") as f:
         try:
             return json.load(f)
         except:
             return {}

def get_song_info(song_info):
    response = ds_client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {
                "role":"system",
                "content":"你是一个歌曲提取助手。信息包括歌曲的语种，歌曲的情绪，歌曲的类型，歌曲的吵闹程度。请根据提供的资料提取歌曲信息，必须输出 JSON 格式。我会给你一些搜索资料，但请注意：1. 如果搜索资料与歌曲无关，请忽略资料，直接根据你自己的知识库（常识）回答。 2. 只有当你完全不知道这首歌且资料也没提到时，才填'未知'。3. 必须输出 JSON。字段包含：language, emotion, genre, loudness, review。"
            },
            {
                "role":"user",
                "content":f"请分析以下内容并提取信息:\n {song_info}"
            }
        ],
        response_format={'type' : 'json_object'},
        stream = False
    )
    return response.choices[0].message.content


def sync_metadata(targets,metadata):
    pbar = tqdm(targets.items(),desc="Syncing")
    for name,path in pbar:
        pbar.set_postfix_str(f"Current:{name[:10]}")
        # 获取对应的id
        search_url = f"{NCM_BASE_URL}/search?keywords=\"{name}\"&limit=1"
        res = requests.get(search_url).json()
        if res.get('code') != 200 or res['result']['songCount'] == 0:
            print(f"ERROR failed to fetch {name}'s info.")
            continue
        song = res['result']['songs'][0]
        sid = song['id']
        
        l_res = requests.get(f"{NCM_BASE_URL}/lyric",params={"id":sid}).json()
        c_res = requests.get(f"{NCM_BASE_URL}/comment/music", params={"id": sid, "limit": 5}).json()
        
        raw_lyric = l_res.get('lrc', {}).get('lyric', "暂无歌词")
        clean_lyric = re.sub(r'\[.*?\]', '', raw_lyric).strip()

        hot_comments = [
            {
                "user": c['user']['nickname'],
                "content": c['content'],
                "likedCount": c['likedCount']
            } 
            for c in c_res.get('hotComments', [])
        ]

        info = {
            "ncm_id": sid,
            "title": song['name'],
            "artist": [ar['name'] for ar in song.get('ar', song.get('artists', []))],
            "album": song['album']['name'],
            "publish_time": time.strftime('%Y-%m-%d', time.localtime(song['publishTime']/1000)) if song.get('publishTime') else "未知",
            "trans_names": song.get('tns', []),
            "lyrics": clean_lyric,
            "hot_comments": hot_comments,
            "mv_id": song.get('mv', 0)
        }

        # print(f"LOG got context {info}")

        response = get_song_info(info)
        # print(f"LOG   got response {name}:{response}")

        if response:
            try:
                song_data = json.loads(response)
                metadata[name] = song_data

                # print(f"LOG   Successfully processed {name}")
            except Exception as e:
                print(f"ERROR: failed to parse AI response for {name}: {e}")
                continue 

        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=4)

    print("\nSync finished!")
    return metadata

class DJSession:
    def __init__(self, client, metadata, music_paths, refresh_interval=5):
        self.client = client
        self.metadata = metadata
        self.music_paths = music_paths
        self.refresh_interval = refresh_interval
        self.chat_history = []
        self.turn_count = 0
        self.played_songs = set()

    def refresh(self, clear_history=False, new_metadata=None, new_music_paths=None):
        self.played_songs.clear()

        if new_metadata:
            self.metadata = new_metadata
        if new_music_paths:
            self.music_paths = new_music_paths

        if clear_history:
            self.chat_history = []
            self.turn_count = 0
            print("--- 🧹 Chat history has been cleared. ---")
        self.turn_count = 0
        print(f"--- 🔄 Refreshed,unique songs：{len(self.music_paths)} ---")
    def _format_library(self):
        """只把存在于本地磁盘且有元数据的歌曲推给 AI"""
        lines = []
        available_songs = set(self.metadata.keys()) & set(self.music_paths.keys())
        
        for name in available_songs:
            info = self.metadata[name]
            if isinstance(info, dict) and "genre" in info:
                lines.append(f"- {name}: {info.get('genre')}, {info.get('emotion')}, {info.get('review')}")
        return "\n".join(lines)

    def next_step(self, user_request):
        self.turn_count += 1
        
        # 1. 核心系统提示词 (强制要求格式)
        base_prompt = """你是一位顶尖电台 DJ。请从库中选曲。
        【规则】：
        - 歌曲名（JSON 的 Key），一行一首。用户未指定默认50行。
        - 不建议重复推荐：已播放列表见下文。
        - 每一行只能包含歌曲名，不要带序号或备注。"""

        # 2. 刷新记忆与同步禁区
        if self.turn_count == 1 or self.turn_count % self.refresh_interval == 0:
            library_data = self._format_library()
            content = f"{base_prompt}\n\n当前曲库：\n{library_data}"
            self.chat_history.append({"role": "system", "content": content})

        forbidden = "，".join(list(self.played_songs))
        full_request = f"{user_request}\n(上次已经推荐（不太建议再次推送）：{forbidden})" if forbidden else user_request
        self.chat_history.append({"role": "user", "content": full_request})

        response = self.client.chat.completions.create(
            model='deepseek-chat',
            messages=self.chat_history
        )

        raw_answer = response.choices[0].message.content
       
        # print(f"LOG   AI responded with\n {raw_answer}\n\n")

        playlist_names = [line.strip() for line in raw_answer.split('\n') if line.strip()]
        playlist_with_paths = []

        for name in playlist_names:
            if name in self.music_paths:
                self.played_songs.add(name)
                playlist_with_paths.append({
                    "name": name,
                    "path": self.music_paths[name]
                })

        self.chat_history.append({"role": "assistant", "content": raw_answer})
        return playlist_with_paths

if __name__ == "__main__":
    # 先读取config.json获取所有的歌曲，然后按照名字进行搜索获取具体信息
    config = load_config()

    # 获取密钥
    secrets = config.get("secrets",{})
    SECRET_DS = secrets["deepseek"]
    if not SECRET_DS:
        print(f"ERROR cannot load deepseek API keys!")
        exit(1)

    # 加载客户端
    ds_client = openai.OpenAI(
        api_key = SECRET_DS,
        base_url = DS_BASE_URL
    )
    

    #  之后扫描音乐数据
    musics = scan_music_files(config.get(CFG_KEY_MF,[]))
    print(f"LOG   Found {len(musics)} unique songs.")
    
    # 加载缓存的源数据
    metadata = load_cached_metadata()
    
    # 更新需要更新的歌曲
    need_to_sync = { k : v for k,v in musics.items() if k not in metadata }
    print(f"LOG   There are {len(need_to_sync)} songs need syncing.")
    metadata = sync_metadata(need_to_sync,metadata)

    # 加载完成之后按照提示词进行歌单生成
    aidj =  DJSession(ds_client,metadata,musics)

    BANNER = """
    ============================================================
           🎧  AI DJ SYSTEM v1.0 - DEEPSEEK REASONER  🎧
    ============================================================
    Commands:
      /refresh : Clear played history (keep chat memory)
      /reset   : Clear everything (factory reset memory)
      /status  : Show library and session statistics
      /exit    : Terminate the session
    ============================================================
    """
    print(BANNER)

    play_list = []
    while(True):
        try:
            prompt = input("What U Wana Listen: ").strip()
            if not prompt: continue

            # Command Logic
            if prompt.startswith("/"):
                action = prompt.lower()
                if action == "/exit": break
                elif action == "/refresh":
                    aidj.refresh(clear_history=False)
                    continue
                elif action == "/reset":
                    aidj.refresh(clear_history=True)
                    continue
                elif action == "/mpv":
                    if not play_list or len(play_list) == 0:
                        print("ERROR: No playlist cached. Generate one first!")
                        continue
                    path_cache = [item['path'] for item in play_list]
                    subprocess.Popen(['mpv','--force-window', '--geometry=600x600'] +  path_cache)
                    continue
                elif action == "/vlc":
                    if not play_list or len(play_list) == 0:
                        print("ERROR: No playlist cached. Generate one first!")
                        continue
                    path_cache = [item['path'] for item in play_list]
                    subprocess.Popen(['vlc','--one-instance', '--playlist-enqueue'] +  path_cache)
                    continue
                else:
                    print(f"ERROR: Unknown command {action}")
                    continue

            # Selection Logic
            print("LOG  DJ is reasoning...")
            play_list = aidj.next_step(prompt)

            if not play_list:
                print("WARN: No matches found. Try broadening your request.")
                continue

            # Table Output
            print(f"\n🎧 [PLAYLIST GENERATED - {len(play_list)} TRACKS]")
            print("-" * 60)
            for i, item in enumerate(play_list, 1):
                print(f"{i:03d} | {item['name']}")
            print("-" * 60)
        except KeyboardInterrupt:
            print("\nLOG  Session ended by user.")
            break
        except Exception as e:
            print(f"ERROR {type(e).__name__}: {str(e)}")
```

:::

<np>
有了这个大致的想法，我直接开始奴役Gemini，直接放飞，什么改善GUI改善匹配......前前后后折腾了5天左右，也是做出了一个比较满意的AIDJ。
</np>

<np>
那时候我真的很兴奋好吧，一是这是我使用类似claude code的东西迅速搭建出的第一个比较好玩的项目，第二就是这个AI DJ真的让我心潮澎湃，他知道我想听什么。
</np>

<np>
一个案例便是我问AI“给我推送近现代日本那种有点梦幻的歌曲”，除了找到了"Stay With Me",还找到了"Merry Christmas Mr. Lawrence"。第二首歌曲我完全没预料到，甚至对于stay with me我也没抱有很大期待。 但是DeepseekV3.2就是找出来了，从800多首歌曲中提取了出来然后顺着整个workflow展现在了我的vlc中。那一刻我其实有一种很奇怪的感觉，那是一种苦尽甘来的兴奋，又是一种寻得“知己”的感激，尽管这个知己是AI。
</np>

<np>
我也是直接豪气冲天，发了个朋友圈炫耀了一波这个美好的DJ项目：
</np>

<div style="text-align: center;">
    <Img content="/dSTsaBf4ufhB0MefXp_fIzXAb_qebksHVrMVI7T6Ccy18Ko.png" width="600" height="400" fit="cover" />
</div>



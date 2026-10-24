#!/usr/bin/env python3
"""ARTANIS media conversion CLI. Requires ffmpeg and ffprobe installed on host.
All outputs stay local; never uploads files.
"""
import argparse, json, subprocess
from pathlib import Path

def run(args):
    subprocess.run(args, check=True)

def main():
    p=argparse.ArgumentParser(description="ARTANIS: GIF, audio, video and frames")
    p.add_argument("action",choices=["gif-to-mp4","video-to-gif","video-to-frames","extract-audio","audio-to-wav","video-info"])
    p.add_argument("input",type=Path)
    p.add_argument("--output",type=Path)
    p.add_argument("--fps",type=int,default=8)
    p.add_argument("--width",type=int,default=640)
    a=p.parse_args()
    if not a.input.is_file():p.error("Input file missing")
    if not 1<=a.fps<=30 or not 128<=a.width<=1920:p.error("Invalid fps or width")
    dest=a.output or a.input.with_name(a.input.stem+"-converted")
    if a.action=="gif-to-mp4":
        dest=dest.with_suffix(".mp4")
        run(["ffmpeg","-y","-i",str(a.input),"-movflags","+faststart","-pix_fmt","yuv420p","-vf","scale=trunc(iw/2)*2:trunc(ih/2)*2",str(dest)])
    elif a.action=="video-to-gif":
        dest=dest.with_suffix(".gif")
        filt=f"fps={a.fps},scale={a.width}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse"
        run(["ffmpeg","-y","-i",str(a.input),"-filter_complex",filt,str(dest)])
    elif a.action=="video-to-frames":
        dest.mkdir(parents=True,exist_ok=True)
        run(["ffmpeg","-y","-i",str(a.input),"-vf",f"fps={a.fps}","-vsync","vfr",str(dest/"frame-%05d.png")])
    elif a.action=="extract-audio":
        dest=dest.with_suffix(".wav")
        run(["ffmpeg","-y","-i",str(a.input),"-vn","-ac","1","-ar","16000",str(dest)])
    elif a.action=="audio-to-wav":
        dest=dest.with_suffix(".wav")
        run(["ffmpeg","-y","-i",str(a.input),"-ac","1","-ar","16000",str(dest)])
    else:
        result=subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format","-show_streams",str(a.input)],capture_output=True,text=True,check=True)
        print(json.dumps(json.loads(result.stdout),ensure_ascii=False,indent=2));return
    print("Created:",dest)

if __name__=="__main__":main()

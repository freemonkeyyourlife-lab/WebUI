#!/usr/bin/env python3
"""ARTANIS Studio local bridge: Ollama chat + ComfyUI workflow execution. Stdlib only."""
import json, os, mimetypes, urllib.request, urllib.error, urllib.parse, uuid
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

ROOT=Path(__file__).resolve().parent
HOST="127.0.0.1"
PORT=int(os.getenv("ARTANIS_PORT","8767"))
OLLAMA=os.getenv("OLLAMA_URL","http://127.0.0.1:11434").rstrip("/")
COMFY=os.getenv("COMFYUI_URL","http://127.0.0.1:8188").rstrip("/")
MODEL=os.getenv("ARTANIS_MODEL","qwen2.5:3b")
MAX_BODY=4*1024*1024

def request(base,path,data=None,timeout=15):
    req=urllib.request.Request(base+path, data=json.dumps(data).encode() if data is not None else None, headers={"Content-Type":"application/json"} if data is not None else {})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return json.load(r)

class Handler(BaseHTTPRequestHandler):
    def reply(self,code,obj):
        raw=json.dumps(obj,ensure_ascii=False).encode()
        self.send_response(code);self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(raw)));self.send_header("Cache-Control","no-store")
        self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        path=urllib.parse.urlsplit(self.path).path
        if path=="/api/status":
            out={"studio":"online","ollama":False,"comfyui":False,"model":MODEL}
            for key,base,route in (("ollama",OLLAMA,"/api/tags"),("comfyui",COMFY,"/system_stats")):
                try:
                    obj=request(base,route,timeout=3);out[key]=True
                    if key=="ollama":out["models"]=[x.get("name") for x in obj.get("models",[])]
                except Exception as exc:out[key+"_error"]=str(exc)
            return self.reply(200,out)
        if path.startswith("/api/job/"):
            pid=path.rsplit("/",1)[-1]
            try:uuid.UUID(pid)
            except ValueError:return self.reply(400,{"error":"Invalid job ID"})
            try:return self.reply(200,request(COMFY,"/history/"+pid))
            except Exception as exc:return self.reply(502,{"error":str(exc)})
        if path=="/api/queue":
            try:return self.reply(200,request(COMFY,"/queue"))
            except Exception as exc:return self.reply(502,{"error":str(exc)})
        if path=="/api/result":
            q=urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            name=q.get("filename",[""])[0];sub=q.get("subfolder",[""])[0];kind=q.get("type",["output"])[0]
            if not name or "/" in name or "\\" in name or kind not in ("output","temp") or ".." in sub or sub.startswith("/"):
                return self.reply(400,{"error":"Invalid output path"})
            query=urllib.parse.urlencode({"filename":name,"subfolder":sub,"type":kind})
            try:
                with urllib.request.urlopen(COMFY+"/view?"+query,timeout=30) as r:
                    raw=r.read(100*1024*1024+1)
                    if len(raw)>100*1024*1024:return self.reply(413,{"error":"Output too large"})
                    self.send_response(200);self.send_header("Content-Type",r.headers.get("Content-Type","application/octet-stream"))
                    self.send_header("Content-Length",str(len(raw)));self.end_headers();self.wfile.write(raw)
            except Exception as exc:self.reply(502,{"error":str(exc)})
            return
        if path in ("/","/index.html","/studio.html"):
            p=ROOT/("studio.html" if path=="/studio.html" else "index.html")
            raw=p.read_bytes();self.send_response(200);self.send_header("Content-Type","text/html; charset=utf-8");self.send_header("Content-Length",str(len(raw)));self.end_headers();self.wfile.write(raw)
            return
        self.reply(404,{"error":"Not found"})
    def do_POST(self):
        length=int(self.headers.get("Content-Length","0"))
        if length<=0 or length>MAX_BODY:return self.reply(413,{"error":"Invalid request size"})
        try:data=json.loads(self.rfile.read(length))
        except Exception:return self.reply(400,{"error":"Invalid JSON"})
        if self.path=="/api/chat":
            msg=str(data.get("message","")).strip()[:8000]
            if not msg:return self.reply(400,{"error":"Message required"})
            model=str(data.get("model") or MODEL)[:100]
            try:
                obj=request(OLLAMA,"/api/chat",{"model":model,"stream":False,"messages":[{"role":"system","content":"Du bist TANIA, deutschsprachige Regie- und Kreativassistentin fuer FREE MONKEYS. Hilf mit Szenen, Storyboards, Prompts und Produktion. Behaupte niemals, Bilder oder Videos erzeugt zu haben, wenn kein Werkzeug ausgefuehrt wurde."},{"role":"user","content":msg}]},timeout=180)
                return self.reply(200,{"answer":obj.get("message",{}).get("content","")})
            except Exception as exc:return self.reply(502,{"error":str(exc)})
        if self.path=="/api/generate":
            workflow=data.get("workflow")
            if not isinstance(workflow,dict) or not workflow:return self.reply(400,{"error":"ComfyUI workflow API JSON required"})
            try:
                result=request(COMFY,"/prompt",{"prompt":workflow,"client_id":str(uuid.uuid4())},timeout=30)
                return self.reply(200,result)
            except urllib.error.HTTPError as exc:
                return self.reply(502,{"error":"ComfyUI rejected workflow","details":exc.read(8192).decode(errors="replace")})
            except Exception as exc:return self.reply(502,{"error":str(exc)})
        self.reply(404,{"error":"Not found"})

if __name__=="__main__":
    print(f"ARTANIS Studio: http://{HOST}:{PORT}/studio.html")
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()

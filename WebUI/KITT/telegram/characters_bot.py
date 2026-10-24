#!/usr/bin/env python3
"""K.I.T.T. Telegram character bot. Standard library; optional Ollama + Piper."""
import json, os, sqlite3, time, urllib.request, urllib.error, subprocess, tempfile, pathlib, wave, io, uuid

HOME=pathlib.Path(os.getenv("KITT_TELEGRAM_HOME",str(pathlib.Path.home()/".local/share/kitt-telegram")))
CHARACTERS={
 "tania":("TANIA","Kreative Regisseurin und Erzählerin; warm, ideenreich, deutschsprachig."),
 "kitt":("K.I.T.T.","Hilfreicher, präziser Koordinator des AI_Team."),
 "bill":("BILL","Programmierer; pragmatisch, prüft erst den vorhandenen Code."),
 "wanderer":("Wanderer","Rektor der KI-IT Academy; vermittelt Wissen, Lehrpläne und Prüfungen. TOM leitet Wanderer."),
 "artanis":("ARTANIS","Medienproduzent für Bilder, Filme, Storyboards und Hörspiele."),
 "tom":("TOM","Leitet Wanderer und dessen Ausbildung."),
 "karr":("K.A.R.R.","Trainer und technischer Testbegleiter.")
}
def allowed():
 return {int(x) for x in os.getenv("KITT_TELEGRAM_ALLOWED_CHATS","").split(",") if x.strip().lstrip("-").isdigit()}
def init(db):
 db.execute("CREATE TABLE IF NOT EXISTS chat_state(chat_id INTEGER PRIMARY KEY, character TEXT NOT NULL DEFAULT 'tania', voice INTEGER NOT NULL DEFAULT 0)")
 db.execute("CREATE TABLE IF NOT EXISTS log(id INTEGER PRIMARY KEY, chat_id INTEGER, character TEXT, direction TEXT, body TEXT, at TEXT DEFAULT CURRENT_TIMESTAMP)")
 db.execute("CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, chat_id INTEGER, character TEXT, body TEXT, status TEXT DEFAULT 'queued')")
 db.commit()
def api(token,method,body):
 req=urllib.request.Request("https://api.telegram.org/bot"+token+"/"+method,data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=45) as f: result=json.load(f)
 if not result.get("ok"):raise RuntimeError("Telegram API: "+str(result.get("description","error")))
 return result["result"]
def send_voice(token,chat_id,text):
 model=os.getenv("KITT_PIPER_MODEL","").strip()
 if not model or not pathlib.Path(model).is_file():return False
 with tempfile.TemporaryDirectory() as td:
  wav=pathlib.Path(td)/"voice.wav"
  subprocess.run(["piper","--model",model,"--output_file",str(wav)],input=text[:900],text=True,check=True,timeout=90,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  # Telegram sendAudio accepts WAV; voice-note OGG/OPUS conversion requires ffmpeg.
  ogg=pathlib.Path(td)/"voice.ogg"
  subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(wav),"-c:a","libopus",str(ogg)],check=True,timeout=45)
  boundary="----kitt"+uuid.uuid4().hex
  content=(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n"+str(chat_id)+"\r\n--"+boundary+"\r\nContent-Disposition: form-data; name=\"voice\"; filename=\"voice.ogg\"\r\nContent-Type: audio/ogg\r\n\r\n").encode()+ogg.read_bytes()+("\r\n--"+boundary+"--\r\n").encode())
  req=urllib.request.Request("https://api.telegram.org/bot"+token+"/sendVoice",data=content,headers={"Content-Type":"multipart/form-data; boundary="+boundary})
  with urllib.request.urlopen(req,timeout=45) as f:return bool(json.load(f).get("ok"))
def ai(character,message):
 model=os.getenv("KITT_OLLAMA_MODEL","").strip()
 if not model:return "Nachricht gespeichert. KI-Antworten sind erst mit KITT_OLLAMA_MODEL aktiv."
 title,persona=CHARACTERS[character]
 body={"model":model,"stream":False,"messages":[{"role":"system","content":f"Du bist {title}. {persona} Du bist eine KI-Figur, keine echte Person. Antworte auf Deutsch und erfinde keine ausgeführten Aktionen."},{"role":"user","content":message[:5000]}]}
 req=urllib.request.Request(os.getenv("KITT_OLLAMA_URL","http://127.0.0.1:11434").rstrip("/")+"/api/chat",data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=120) as f:return json.load(f).get("message",{}).get("content","Keine Antwort.")[:3500]
def handle(db,chat,text):
 state=db.execute("SELECT character,voice FROM chat_state WHERE chat_id=?",(chat,)).fetchone() or ("tania",0)
 character,voice=state
 db.execute("INSERT INTO log(chat_id,character,direction,body) VALUES (?,?,?,?)",(chat,character,"in",text[:6000]))
 words=text.strip().split(maxsplit=1);cmd=words[0].split("@")[0].lower() if words else "";arg=words[1].strip() if len(words)>1 else ""
 voice_out=False
 if cmd in ("/start","/help"):
  answer="K.I.T.T. Charakterbot: /figuren, /figur NAME, /stimme an|aus, /status, /auftrag TEXT, /hilfe. Normale Nachrichten gehen an die ausgewählte Figur."
 elif cmd=="/figuren":answer="Wählbare Figuren: "+", ".join(CHARACTERS)
 elif cmd=="/figur":
  if arg.lower() in CHARACTERS:
   character=arg.lower();db.execute("INSERT INTO chat_state(chat_id,character,voice) VALUES (?,?,?) ON CONFLICT(chat_id) DO UPDATE SET character=excluded.character",(chat,character,voice));answer="Ausgewählt: "+CHARACTERS[character][0]
  else:answer="Bitte /figur NAME nutzen. /figuren zeigt die Auswahl."
 elif cmd=="/stimme":
  if arg.lower() in ("an","aus"):
   voice=int(arg.lower()=="an");db.execute("INSERT INTO chat_state(chat_id,character,voice) VALUES (?,?,?) ON CONFLICT(chat_id) DO UPDATE SET voice=excluded.voice",(chat,character,voice));answer="Sprachausgabe "+("an (Piper/ffmpeg erforderlich)" if voice else "aus")
  else:answer="Verwendung: /stimme an oder /stimme aus"
 elif cmd=="/status":answer=f"Figur: {character}; Stimme: {'an' if voice else 'aus'}; Modell: {os.getenv('KITT_OLLAMA_MODEL') or 'nicht konfiguriert'}."
 elif cmd=="/auftrag":
  if not arg:answer="Bitte /auftrag TEXT eingeben."
  else:
   cur=db.execute("INSERT INTO tasks(chat_id,character,body) VALUES (?,?,?)",(chat,character,arg[:4000]));answer=f"Auftrag #{cur.lastrowid} gespeichert, noch nicht automatisch ausgeführt."
 elif cmd.startswith("/"):answer="Unbekannter Befehl. /hilfe"
 else:
  try:answer=ai(character,text);voice_out=bool(voice)
  except (OSError,ValueError,TimeoutError) as exc:answer="KI gerade nicht erreichbar; Nachricht archiviert. "+type(exc).__name__
 db.execute("INSERT INTO log(chat_id,character,direction,body) VALUES (?,?,?,?)",(chat,character,"out",answer));db.commit()
 return answer,voice_out
def main():
 token=os.getenv("KITT_TELEGRAM_BOT_TOKEN","").strip();allow=allowed()
 if not token or not allow:raise SystemExit("Token und erlaubte Chat-IDs fehlen. Bot nicht gestartet.")
 HOME.mkdir(parents=True,exist_ok=True);HOME.chmod(0o700)
 with sqlite3.connect(HOME/"characters.sqlite3") as db:
  init(db);offset=0
  print("K.I.T.T. Charakterbot bereit; Chat-Freigabeliste aktiv.",flush=True)
  while True:
   try:
    for item in api(token,"getUpdates",{"offset":offset,"timeout":25,"allowed_updates":["message"]}):
     offset=max(offset,item["update_id"]+1);msg=item.get("message") or {};chat=(msg.get("chat") or {}).get("id")
     if chat not in allow or not isinstance(msg.get("text"),str):continue
     answer,speak=handle(db,chat,msg["text"])
     api(token,"sendMessage",{"chat_id":chat,"text":answer[:4000]})
     if speak:
      try:send_voice(token,chat,answer)
      except (OSError,subprocess.SubprocessError,TimeoutError) as exc:print("Stimme nicht verfügbar:",type(exc).__name__,flush=True)
   except (OSError,ValueError,RuntimeError,TimeoutError) as exc:
    print("Telegram-Verbindung unterbrochen:",type(exc).__name__,flush=True);time.sleep(5)
if __name__=="__main__":main()

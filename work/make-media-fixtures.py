"""Small generated media for browser verification; no user or third-party media."""
from pathlib import Path
import math, struct, zlib, wave
out = Path('tmp/fixtures'); out.mkdir(parents=True, exist_ok=True)
def chunk(kind, data):
    return struct.pack('>I', len(data))+kind+data+struct.pack('>I', zlib.crc32(kind+data)&0xffffffff)
w, h = 320, 240
pixels = b''.join(b'\0'+bytes(v for x in range(w) for v in (60+x//3, 95+y//3, 130+x//5)) for y in range(h))
(out/'reference.png').write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(pixels))+chunk(b'IEND',b''))
with wave.open(str(out/'tone.wav'),'wb') as f:
    f.setparams((1,2,44100,0,'NONE','not compressed'))
    f.writeframes(b''.join(struct.pack('<h',int(2000*math.sin(2*math.pi*440*i/44100))) for i in range(44100*6)))
(out/'broken.vsketch').write_text('not a valid project archive')
print({p.name:p.stat().st_size for p in out.iterdir() if p.is_file()})

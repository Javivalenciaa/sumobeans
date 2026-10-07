import numpy as np, wave
from scipy.signal import butter, lfilter
SR=44100; DUR=30.0; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(7)
def env(n,a,d,s=0.0,r=0.0):
    e=np.ones(n); a_=int(a*SR); d_=int(d*SR)
    if a_>0: e[:a_]=np.linspace(0,1,a_)
    if d_>0:
        dd=min(d_,n-a_); e[a_:a_+dd]=np.linspace(1,s,dd); e[a_+dd:]=s
    return e
def lp(x,fc):
    b,a=butter(2,fc/(SR/2),'low'); return lfilter(b,a,x)
def hp(x,fc):
    b,a=butter(2,fc/(SR/2),'high'); return lfilter(b,a,x)
def mid(m): return 440.0*2**((m-69)/12)
mix=np.zeros(N)
def add(x,start,gain=1.0):
    i=int(start*SR); j=min(N,i+len(x))
    if i<N and j>i: mix[i:j]+=x[:j-i]*gain
def saw(f,n,det=0.0):
    tt=np.arange(n)/SR; x=np.zeros(n)
    for d in (-det,0,det):
        ph=(tt*f*(1+d))%1.0; x+=2*ph-1
    return x/3
# chords (A minor key): Am F C G Am F E Am  (each 4 s) -> MIDI notes
chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62],[57,60,64],[53,57,60],[52,56,59],[57,60,64]]
roots=[45,41,36,43,45,41,40,45]
for k,(ch,rt) in enumerate(zip(chords,roots)):
    st=k*4.0; n=int(4.2*SR)
    pad=np.zeros(n)
    for m in ch: pad+=saw(mid(m),n,0.004)+0.5*saw(mid(m+12),n,0.006)
    pad=lp(pad,1400+k*250)*env(n,0.5,0.4,0.85)*0.07*(0.55 if k<1 else 1.0)
    add(pad,st)
    # sub bass sustained
    sub=np.sin(2*np.pi*mid(rt)*np.arange(n)/SR)*env(n,0.02,0.2,0.9)*0.22
    add(sub,st)
# driving bass 8ths from 4.5 s
for b in range(int(4.5*2),int(29*2)):
    tm=b*0.5; k=min(7,int(tm//4)); f=mid(roots[k]+12)
    n=int(0.22*SR); x=lp(saw(f,n,0.002),700)*env(n,0.005,0.2,0.0)*0.16; add(x,tm)
# arpeggio (plucks) from 2.0 s, 16ths feel eighths
for b in range(int(2.0*4),int(28*4)):
    tm=b*0.25; k=min(7,int(tm//4)); ch=chords[k]; m=ch[(b%3)]+12*(1+(b%2))
    n=int(0.2*SR); x=np.sin(2*np.pi*mid(m)*np.arange(n)/SR)*env(n,0.003,0.18,0.0)*0.05; add(x,tm)
# drums
def kick(n=int(0.35*SR)):
    tt=np.arange(n)/SR; f=45+110*np.exp(-tt*28); ph=np.cumsum(2*np.pi*f/SR); return np.sin(ph)*np.exp(-tt*9)*0.9
def snare(n=int(0.25*SR)):
    tt=np.arange(n)/SR; x=hp(rng.standard_normal(n),1500)*np.exp(-tt*22)*0.5; x+=np.sin(2*np.pi*190*tt)*np.exp(-tt*28)*0.25; return x
def hat(n=int(0.06*SR)):
    tt=np.arange(n)/SR; return hp(rng.standard_normal(n),7000)*np.exp(-tt*60)*0.18
def crash(dur=1.6):
    n=int(dur*SR); tt=np.arange(n)/SR; return hp(rng.standard_normal(n),3500)*np.exp(-tt*2.6)*0.35
K=kick(); S=snare(); Hh=hat()
for b in range(int(2.0/0.5),int(28/0.5)):
    tm=b*0.5
    if tm<29: add(K,tm,0.8 if tm>=4.5 else 0.6)
    if tm>=4.5 and (b%2==1): add(S,tm)
for b in range(int(8*2),int(26.5*2)): add(Hh,b*0.5+0.25); add(Hh,b*0.5)
for b in range(int(2.0*4),int(4.5*4)): pass
# shot-cut crashes and hits (cuts at 2,4.5,8,12,16,20.5,23.5,26.5)
for c in (2.0,4.5,8.0,12.0,16.0,20.5,23.5,26.5):
    add(crash(1.2 if c<26 else 2.4),c-0.02,0.9); add(kick(int(0.6*SR))*1.3,c,0.9)
# riser before the end card (23.5 -> 26.5) and capture hit at 20.5
n=int(3.0*SR); tt=np.arange(n)/SR; rise=hp(rng.standard_normal(n),1200)*(tt/3)**2*0.4; add(rise,23.5)
n=int(2.4*SR); tt=np.arange(n)/SR; boom=np.sin(2*np.pi*(38+30*np.exp(-tt*4))*tt)*np.exp(-tt*1.8)*0.8; add(boom,20.5); add(boom,26.5)
# final hit chord on the end card
n=int(3.4*SR)
fin=np.zeros(n)
for m in (57,64,69,72,76): fin+=saw(mid(m),n,0.003)
fin=lp(fin,3500)*env(n,0.01,2.8,0.0)*0.12; add(fin,26.5)
# master: fade in/out, limit
mix*=np.minimum(1,t/0.4)*np.minimum(1,(DUR-t)/1.5)
mix=np.tanh(mix*1.35)*0.92
stereo=np.stack([mix, np.roll(mix,int(0.0007*SR))],axis=1)
pcm=(stereo*32767).astype(np.int16)
with wave.open('media/trailer_music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music ok',N/SR,'s')

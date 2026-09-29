import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import VideoClip, AudioArrayClip, concatenate_videoclips, VideoFileClip

# Paths
REC_PATH = r"C:\Users\itsad\Downloads\Recording 2026-09-29 232007.mp4"
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'brag.mp4')

W, H = 1920, 1080
FPS = 30

BG_COLOR = (22, 21, 18)
TEXT_COLOR = (231, 226, 216)
ACCENT_AMBER = (201, 138, 61)
ACCENT_STEEL = (91, 124, 153)

try:
    font_large = ImageFont.truetype("consola.ttf", 90)
    font_medium = ImageFont.truetype("consola.ttf", 60)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()

def draw_centered_text(draw, text, y, font, color):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text(((W-w)/2, y), text, font=font, fill=color)

def make_intro(t):
    img = Image.new('RGB', (W, H), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    if t < 2:
        draw_centered_text(draw, "THE DARK WEB IS CHAOS.", H/2 - 45, font_large, TEXT_COLOR)
    else:
        draw_centered_text(draw, "UNVEIL AI BRINGS THE MATH.", H/2 - 45, font_large, ACCENT_AMBER)
    return np.array(img)

def make_outro(t):
    img = Image.new('RGB', (W, H), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    if t < 2:
        draw_centered_text(draw, "BUILT WITH", 300, font_large, ACCENT_STEEL)
        draw_centered_text(draw, "React • FastAPI • Cytoscape • NetworkX", 450, font_medium, TEXT_COLOR)
    else:
        draw_centered_text(draw, "UNVEIL AI", H/2 - 50, font_large, ACCENT_AMBER)
        draw_centered_text(draw, "De-anonymize the dark web.", H/2 + 50, font_medium, TEXT_COLOR)
    return np.array(img)

print("Building Video components...")
intro_clip = VideoClip(make_intro, duration=4).without_audio()
outro_clip = VideoClip(make_outro, duration=5).without_audio()

rec_clip = VideoFileClip(REC_PATH)
if rec_clip.w != W or rec_clip.h != H:
    rec_clip = rec_clip.resized((W, H))

def process_frame(get_frame, t):
    frame = get_frame(t)
    img = Image.fromarray(frame)
    
    # We can draw a neat bottom bar
    overlay = Image.new('RGBA', (W, H), (0,0,0,0))
    odraw = ImageDraw.Draw(overlay)
    
    odraw.rectangle([0, H-120, W, H], fill=(22, 21, 18, 230))
    
    # 40-second recording logic
    if t < 10:
        odraw.text((50, H-90), "Phase 1: Investigation Workspace", font=font_medium, fill=ACCENT_AMBER)
    elif t < 25:
        odraw.text((50, H-90), "Phase 2: Graph-First Attribution (Noisy-OR Fusion)", font=font_medium, fill=ACCENT_AMBER)
    else:
        odraw.text((50, H-90), "Phase 3: Temporal Analysis & Migration Tracking", font=font_medium, fill=ACCENT_AMBER)
        
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    return np.array(img)

rec_clip = rec_clip.transform(process_frame).without_audio()

final_clip = concatenate_videoclips([intro_clip, rec_clip, outro_clip])
DURATION = final_clip.duration
print(f"Total duration: {DURATION}s")

# EXCITING AUDIO
def make_audio():
    sr = 44100
    t = np.linspace(0, DURATION, int(sr * DURATION), False)
    
    # 128 BPM -> 2.133 beats per second. 
    # 16th notes -> 8.53 notes per second.
    note_duration = 1.0 / 8.533
    
    # Create an arpeggiator pattern (Indices of a minor pentatonic scale)
    pattern = [0, 3, 7, 10, 7, 3, 12, 7] 
    base_freq = 65.41 # C2
    
    audio = np.zeros_like(t)
    
    # Synth wave generator
    num_notes = int(DURATION / note_duration)
    for i in range(num_notes):
        start_idx = int(i * note_duration * sr)
        end_idx = int((i+1) * note_duration * sr)
        if end_idx >= len(t):
            break
            
        note_idx = pattern[i % len(pattern)]
        freq = base_freq * (2 ** (note_idx / 12.0))
        
        # Time array for this note
        tt = np.linspace(0, note_duration, end_idx - start_idx, False)
        
        # Sawtooth wave approximation
        wave = 0.0
        for harm in range(1, 5):
            wave += (1.0/harm) * np.sin(2 * np.pi * freq * harm * tt)
            
        # Envelope (Pluck)
        env = np.exp(-tt * 15)
        
        audio[start_idx:end_idx] = wave * env
        
    # Add a driving 4-on-the-floor kick drum
    kick_duration = 60.0 / 128.0
    num_kicks = int(DURATION / kick_duration)
    for i in range(num_kicks):
        start_idx = int(i * kick_duration * sr)
        end_idx = min(start_idx + int(0.2 * sr), len(t))
        tt = np.linspace(0, 0.2, end_idx - start_idx, False)
        
        # Kick drum synthesis (pitch envelope)
        kick_env = np.exp(-tt * 20)
        kick_freq = 150 * np.exp(-tt * 30) + 40
        kick = np.sin(2 * np.pi * kick_freq * tt) * kick_env * 1.5
        
        audio[start_idx:end_idx] += kick
        
    # High-hat on the off-beats
    num_hats = int(DURATION / (kick_duration/2))
    for i in range(num_hats):
        if i % 2 == 1:
            start_idx = int(i * (kick_duration/2) * sr)
            end_idx = min(start_idx + int(0.05 * sr), len(t))
            tt = np.linspace(0, 0.05, end_idx - start_idx, False)
            noise = np.random.normal(0, 1, len(tt))
            hat_env = np.exp(-tt * 50)
            
            # Filter noise manually (rough high-pass) by differencing
            noise = np.diff(noise, prepend=0)
            
            audio[start_idx:end_idx] += noise * hat_env * 0.3
        
    # Fade out
    fade_out = np.minimum((DURATION - t) / 3.0, 1.0)
    audio *= fade_out
    
    # Normalise
    audio = audio / np.max(np.abs(audio)) * 0.9
    return np.column_stack((audio, audio))

print("Generating exciting audio...")
audio_array = make_audio()
audioclip = AudioArrayClip(audio_array, fps=44100)

final_clip = final_clip.with_audio(audioclip)

print("Writing to file...")
final_clip.write_videofile(OUT_PATH, fps=FPS, codec='libx264', audio_codec='aac', logger=None)

# Extract poster frame from the Outro
poster_path = os.path.join(os.path.dirname(__file__), '..', 'brag.jpg')
poster = Image.fromarray(make_outro(3.0))
poster.save(poster_path)

print("Done!")

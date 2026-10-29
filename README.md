# QuietCut — Tutorial Audio Editor

A local Windows video editor for reducing steady background noise and manually marked breaths. Media is processed on this computer using FFmpeg. No account or API key is needed.

## Start

Double-click **start-editor.cmd**. Keep its console window open while editing. The interface opens at http://127.0.0.1:8765. Close the console or press Ctrl+C there to stop it.

Requires Python 3.12 or newer and FFmpeg/FFprobe on PATH. The launcher creates its own `.venv` and installs NumPy on first use; this dependency download needs internet access. It never uses the unrelated `.venv` in the parent folder.

Manual setup:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe server.py --open
```

If port 8765 is already in use, open the existing editor, or run `server.py --port 8766 --open`.

## Edit a tutorial

Use the **Language / Langue / 语言** selector in the sidebar to switch between English, French, and Simplified Chinese. The interface updates immediately, including dialogs and processing messages. Your choice is saved in this browser and restored next time; your browser language is used on the first visit. Changing the interface language preserves the current project and edits. Video filenames and raw FFmpeg diagnostics are kept as supplied.

1. Select **Import a video**, paste the full local path to your video, and click **Import video**. In Windows Explorer, right-click the file and choose **Copy as path**; surrounding quotation marks are accepted. This works in embedded browsers that do not open file-selection dialogs. **Use browser file picker** provides the standard upload alternative for Chrome or Edge. If there are several audio tracks, choose one and prepare it. Preparation copies the source into a dedicated project folder and creates preview files; allow disk space for the source plus uncompressed audio and video previews. Local drive paths only; network shares are not supported.
2. Pick a noise reduction strength, starting with Gentle. Optionally drag across a moment containing only background noise and choose **Use selection as noise sample**. This version estimates the noise floor from that interval's RMS level; it does not learn a full spectral noise profile. Excessive reduction can make speech sound metallic.
3. Drag across a breath in the waveform, or enter precise start/end times in seconds. Choose attenuation (default −12 dB) and **Add breath region**. Click an existing region to update its interval or reduction; × deletes it. The slider only takes effect when you add or update a region.
4. Generate the cleaned preview. Use **Original / Cleaned** during playback to compare. Edits invalidate the preview until you generate it again.
5. Select **Export video**, review the track/conversion information, and export. Download the completed MP4 using the displayed link.

Breath regions reduce volume with short fades. They do not remove time, so the tutorial remains synchronized. Breath detection is manual in this version. Quiet breaths overlapping speech may require careful selection and a smaller reduction.

## Export behavior

Compatible H.264/yuv420p video is preserved through a video-only remux. Other video codecs/pixel formats are converted to H.264 for browser compatibility and export. Processed audio is AAC; the selected audio track is the only output audio track. Additional tracks, subtitles, and source metadata are not carried over. Audio is aligned to the video timeline, including delayed audio starts; content beyond the video duration is excluded.

The app preserves the selected sample rate when supported (44.1, 48, or 96 kHz), otherwise converts to 48 kHz. More than two input audio channels are converted to stereo; the active processing format is shown below the editor. The cleaned preview and export use the same rendered waveform, with AAC encoding during export.

## Saved projects and cleanup

Project settings are saved locally after each edit. Reopen a saved project in the left sidebar. All imported copies, settings, waveform data, and generated media live in **data/** beside the app. The app never writes to your original video.

**Delete project** removes its imported copy and generated files, keeping your original. Old preview revisions are retained until project deletion. After an interrupted preparation, import again or prepare the selected track again. Interrupted render/export files are not published as completed outputs.

Do not expose this development server outside your computer. It binds only to 127.0.0.1 and checks local origins and session tokens. The console contains actionable FFmpeg errors if processing fails.

## Verification

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Tests generate synthetic video/audio using FFmpeg and check attenuation, duration, offsets, Unicode filenames, state persistence, cancellation, stale revisions, and HTTP access/range behavior. Synthetic tests do not establish speech cleanup quality; always compare your own recording before exporting.

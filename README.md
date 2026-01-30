# Collectibles

A document viewer inspired by the collectibles UI from the game Control.

## What is this?

Ever played Control and loved how you could browse through all those FBC case files and research documents? This is basically that - a clean, minimal file browser with a two-panel layout that makes reading through folders of documents actually enjoyable.

## How it works

- **Left panel** shows your folders as tiles (styled like case files/binders)
- Click a folder to see its contents as a list
- **Right panel** shows a preview of whatever file you select
- Supports PDFs, images, text files, and markdown

### Keyboard navigation

- **Arrow keys** (←→↑↓) to navigate between folders/files
- **Enter** to open the selected folder or file
- **Escape** to go back to the folder view

## Running it

Start the Python server:

```bash
python server.py
```

Then open `http://localhost:8000` in your browser.

Drop your documents in the `Documents/` folder and they'll show up automatically.

## Stack

- Vanilla JS (no frameworks, no build step)
- Python for the backend (simple file server)
- CSS with that brutalist/industrial look

That's it. Nothing fancy, just works.

#!/usr/bin/env python3
"""
Document Control Server
Serves files from the Documents folder with a Control-inspired UI
"""

import os
import json
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, quote
from pathlib import Path

# Configuration
DOCUMENTS_ROOT = Path(__file__).parent / "Documents"
PORT = 8080

class DocumentControlHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = unquote(self.path)
        
        # API endpoints
        if path == '/api/folders':
            self.send_folder_structure()
        elif path.startswith('/api/folder/'):
            folder_path = path[12:]  # Remove '/api/folder/'
            self.send_folder_contents(folder_path)
        elif path.startswith('/api/file/'):
            file_path = path[10:]  # Remove '/api/file/'
            self.send_file_content(file_path)
        elif path.startswith('/documents/'):
            # Serve actual files from Documents folder
            file_path = path[11:]  # Remove '/documents/'
            self.serve_document_file(file_path)
        else:
            # Serve static files (HTML, CSS, JS)
            super().do_GET()
    
    def send_json_response(self, data):
        response = json.dumps(data, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(response.encode('utf-8')))
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def send_folder_structure(self):
        """Get the complete folder structure"""
        def scan_directory(path, relative_path=""):
            items = []
            try:
                for entry in sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name.lower())):
                    rel_path = os.path.join(relative_path, entry.name) if relative_path else entry.name
                    item = {
                        'name': entry.name,
                        'path': rel_path,
                        'is_folder': entry.is_dir()
                    }
                    if entry.is_dir():
                        item['children'] = scan_directory(entry.path, rel_path)
                        item['count'] = count_files(entry.path)
                    else:
                        item['size'] = entry.stat().st_size
                        item['extension'] = Path(entry.name).suffix.lower()
                    items.append(item)
            except PermissionError:
                pass
            return items
        
        def count_files(path):
            count = 0
            try:
                for entry in os.scandir(path):
                    if entry.is_file():
                        count += 1
                    elif entry.is_dir():
                        count += count_files(entry.path)
            except PermissionError:
                pass
            return count
        
        structure = scan_directory(DOCUMENTS_ROOT)
        self.send_json_response({
            'root': 'Documents',
            'items': structure
        })
    
    def send_folder_contents(self, folder_path):
        """Get contents of a specific folder"""
        full_path = DOCUMENTS_ROOT / folder_path if folder_path else DOCUMENTS_ROOT
        
        if not full_path.exists() or not full_path.is_dir():
            self.send_error(404, "Folder not found")
            return
        
        items = []
        try:
            for entry in sorted(os.scandir(full_path), key=lambda e: (not e.is_dir(), e.name.lower())):
                rel_path = os.path.join(folder_path, entry.name) if folder_path else entry.name
                item = {
                    'name': entry.name,
                    'path': rel_path,
                    'is_folder': entry.is_dir()
                }
                if entry.is_dir():
                    item['count'] = sum(1 for _ in os.scandir(entry.path))
                else:
                    stat = entry.stat()
                    item['size'] = stat.st_size
                    item['extension'] = Path(entry.name).suffix.lower()
                    item['modified'] = stat.st_mtime
                items.append(item)
        except PermissionError:
            pass
        
        self.send_json_response({
            'path': folder_path,
            'items': items
        })
    
    def send_file_content(self, file_path):
        """Get file metadata and content preview"""
        full_path = DOCUMENTS_ROOT / file_path
        
        if not full_path.exists() or not full_path.is_file():
            self.send_error(404, "File not found")
            return
        
        stat = full_path.stat()
        extension = full_path.suffix.lower()
        mime_type, _ = mimetypes.guess_type(str(full_path))
        
        file_info = {
            'name': full_path.name,
            'path': file_path,
            'size': stat.st_size,
            'modified': stat.st_mtime,
            'extension': extension,
            'mime_type': mime_type or 'application/octet-stream',
            'content': None,
            'is_text': False,
            'is_image': False,
            'is_pdf': False
        }
        
        # Determine file type and read content if applicable
        text_extensions = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.py', '.log', '.csv']
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
        
        if extension in text_extensions:
            file_info['is_text'] = True
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    file_info['content'] = f.read()
            except:
                try:
                    with open(full_path, 'r', encoding='latin-1') as f:
                        file_info['content'] = f.read()
                except:
                    file_info['content'] = "[Unable to read file content]"
        elif extension in image_extensions:
            file_info['is_image'] = True
            file_info['image_url'] = f'/documents/{quote(file_path)}'
        elif extension == '.pdf':
            file_info['is_pdf'] = True
            file_info['pdf_url'] = f'/documents/{quote(file_path)}'
        
        self.send_json_response(file_info)
    
    def serve_document_file(self, file_path):
        """Serve actual files from the Documents folder"""
        full_path = DOCUMENTS_ROOT / unquote(file_path)
        
        if not full_path.exists() or not full_path.is_file():
            self.send_error(404, "File not found")
            return
        
        # Security check - make sure we're still within Documents
        try:
            full_path.resolve().relative_to(DOCUMENTS_ROOT.resolve())
        except ValueError:
            self.send_error(403, "Access denied")
            return
        
        mime_type, _ = mimetypes.guess_type(str(full_path))
        if mime_type is None:
            mime_type = 'application/octet-stream'
        
        try:
            with open(full_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, str(e))


def run_server():
    print(f"📁 Document Control Server")
    print(f"   Documents root: {DOCUMENTS_ROOT.absolute()}")
    print(f"   Server running at: http://localhost:{PORT}")
    print(f"   Press Ctrl+C to stop\n")
    
    server = HTTPServer(('', PORT), DocumentControlHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
        server.shutdown()


if __name__ == '__main__':
    run_server()

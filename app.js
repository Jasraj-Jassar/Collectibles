// Document Control - Two-Stage File Viewer
// Inspired by Control game's collectibles UI

class DocumentViewer {
    constructor() {
        // Views
        this.mainView = document.getElementById('mainView');
        this.folderView = document.getElementById('folderView');
        
        // Main view elements
        this.tilesContainer = document.getElementById('tilesContainer');
        
        // Folder view elements
        this.backBtn = document.getElementById('backBtn');
        this.folderTitle = document.getElementById('folderTitle');
        this.folderStats = document.getElementById('folderStats');
        this.fileList = document.getElementById('fileList');
        this.documentPreview = document.getElementById('documentPreview');
        this.previewPlaceholder = document.getElementById('previewPlaceholder');
        this.documentDisplay = document.getElementById('documentDisplay');
        this.documentTitle = document.getElementById('documentTitle');
        this.documentMeta = document.getElementById('documentMeta');
        this.documentContent = document.getElementById('documentContent');
        
        // State
        this.folders = [];
        this.currentFolder = null;
        this.currentFiles = [];
        this.activeFile = null;
        this.viewedFiles = new Set();
        
        this.init();
    }

    async init() {
        await this.loadFolders();
        this.renderMainTiles();
        this.setupEventListeners();
    }

    async loadFolders() {
        try {
            const response = await fetch('/api/folders');
            const data = await response.json();
            this.folders = data.items.filter(item => item.is_folder);
        } catch (error) {
            console.error('Failed to load folders:', error);
            this.folders = [];
        }
    }

    renderMainTiles() {
        this.tilesContainer.innerHTML = '';
        
        this.folders.forEach((folder, index) => {
            const tile = this.createFolderTile(folder, index);
            this.tilesContainer.appendChild(tile);
        });
        
        // Select first tile by default
        const firstTile = this.tilesContainer.querySelector('.folder-tile');
        if (firstTile) {
            firstTile.classList.add('active');
        }
    }

    createFolderTile(folder, index) {
        const tile = document.createElement('div');
        tile.className = 'folder-tile';
        tile.dataset.path = folder.path;
        tile.style.animationDelay = `${0.1 + index * 0.05}s`;
        
        // Create folder icon SVG (simplified binder/folder look)
        const iconSvg = this.getFolderIcon(index);
        
        tile.innerHTML = `
            <div class="folder-tile-header">
                <h3 class="folder-tile-title">${folder.name}</h3>
            </div>
            <div class="folder-tile-content">
                ${iconSvg}
            </div>
            <div class="folder-tile-footer">
                <span class="folder-tile-count">${folder.count || 0}</span>
            </div>
        `;
        
        // Click to open folder
        tile.addEventListener('click', () => {
            this.openFolder(folder);
        });
        
        // Hover effects
        tile.addEventListener('mouseenter', () => {
            this.tilesContainer.querySelectorAll('.folder-tile').forEach(t => t.classList.remove('active'));
            tile.classList.add('active');
        });
        
        return tile;
    }

    getFolderIcon(index) {
        // Different icon styles based on index for variety
        const icons = [
            // Binder/Research style
            `<svg class="folder-tile-icon" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="15" y="5" width="70" height="70" rx="3" fill="#333" stroke="#555"/>
                <circle cx="22" cy="20" r="3" stroke="#666"/>
                <circle cx="22" cy="40" r="3" stroke="#666"/>
                <circle cx="22" cy="60" r="3" stroke="#666"/>
                <line x1="30" y1="20" x2="75" y2="20" stroke="#555"/>
                <line x1="30" y1="35" x2="65" y2="35" stroke="#444"/>
                <line x1="30" y1="50" x2="70" y2="50" stroke="#444"/>
                <circle cx="50" cy="40" r="15" stroke="#666" fill="none"/>
            </svg>`,
            // Case file style
            `<svg class="folder-tile-icon" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="10" y="10" width="80" height="60" rx="3" fill="#2a2a2a" stroke="#444"/>
                <rect x="20" y="20" width="35" height="25" rx="2" fill="#333" stroke="#555"/>
                <circle cx="37" cy="32" r="8" stroke="#666"/>
                <line x1="60" y1="25" x2="80" y2="25" stroke="#555"/>
                <line x1="60" y1="35" x2="75" y2="35" stroke="#444"/>
                <rect x="20" y="50" width="60" height="8" fill="#333" stroke="#555"/>
            </svg>`,
            // Correspondence/Envelope style
            `<svg class="folder-tile-icon" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="10" y="15" width="80" height="50" rx="3" fill="#2a2a2a" stroke="#444"/>
                <path d="M15 20 L50 45 L85 20" stroke="#555" fill="none"/>
                <circle cx="50" cy="40" r="12" fill="#333" stroke="#666"/>
                <text x="50" y="45" text-anchor="middle" font-size="10" fill="#888">FBC</text>
            </svg>`,
            // Multimedia/Reel style
            `<svg class="folder-tile-icon" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="50" cy="40" r="30" fill="#2a2a2a" stroke="#555"/>
                <circle cx="50" cy="40" r="20" fill="#333" stroke="#666"/>
                <circle cx="50" cy="40" r="8" fill="#444" stroke="#777"/>
                <circle cx="50" cy="40" r="3" fill="#555"/>
                <line x1="50" y1="10" x2="50" y2="20" stroke="#444"/>
                <line x1="50" y1="60" x2="50" y2="70" stroke="#444"/>
                <line x1="20" y1="40" x2="30" y2="40" stroke="#444"/>
                <line x1="70" y1="40" x2="80" y2="40" stroke="#444"/>
            </svg>`,
            // Phone/Hotline style
            `<svg class="folder-tile-icon" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="15" y="25" width="70" height="35" rx="5" fill="#2a2a2a" stroke="#444"/>
                <ellipse cx="35" cy="42" rx="12" ry="10" fill="#333" stroke="#555"/>
                <rect x="55" y="32" width="20" height="20" rx="3" fill="#333" stroke="#555"/>
                <path d="M20 25 Q20 15 35 15 L45 15 Q50 15 50 20 L50 25" fill="#333" stroke="#555"/>
            </svg>`
        ];
        
        return icons[index % icons.length];
    }

    async openFolder(folder) {
        this.currentFolder = folder;
        
        // Switch views
        this.mainView.classList.remove('active');
        this.folderView.classList.add('active');
        
        // Update header
        this.folderTitle.textContent = folder.name;
        
        // Load folder contents
        await this.loadFolderContents(folder.path);
    }

    async loadFolderContents(path) {
        try {
            const response = await fetch(`/api/folder/${encodeURIComponent(path)}`);
            const data = await response.json();
            this.currentFiles = data.items.filter(item => !item.is_folder);
            this.renderFileList();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load folder contents:', error);
            this.currentFiles = [];
            this.renderFileList();
        }
    }

    renderFileList() {
        this.fileList.innerHTML = '';
        
        if (this.currentFiles.length === 0) {
            this.fileList.innerHTML = `
                <div class="empty-folder">
                    <div class="empty-folder-icon">📂</div>
                    <p>This folder is empty</p>
                </div>
            `;
            return;
        }
        
        this.currentFiles.forEach((file, index) => {
            const item = this.createFileItem(file, index);
            this.fileList.appendChild(item);
        });
        
        // Reset preview
        this.hidePreview();
    }

    createFileItem(file, index) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.path = file.path;
        item.style.animationDelay = `${0.05 + index * 0.05}s`;
        
        if (this.viewedFiles.has(file.path)) {
            item.classList.add('viewed');
        }
        
        const icon = this.getFileIcon(file.extension);
        
        item.innerHTML = `
            <span class="file-item-icon">${icon}</span>
            <div class="file-item-info">
                <div class="file-item-name">${file.name}</div>
                <div class="file-item-meta">${this.formatFileSize(file.size)}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            this.selectFile(item, file);
        });
        
        return item;
    }

    async selectFile(element, file) {
        // Update active state
        this.fileList.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        
        // Mark as viewed
        this.viewedFiles.add(file.path);
        element.classList.add('viewed');
        this.updateStats();
        
        // Load file preview
        await this.loadFilePreview(file.path);
    }

    async loadFilePreview(path) {
        try {
            const response = await fetch(`/api/file/${encodeURIComponent(path)}`);
            const file = await response.json();
            this.renderPreview(file);
        } catch (error) {
            console.error('Failed to load file:', error);
        }
    }

    renderPreview(file) {
        // Hide placeholder, show content
        this.previewPlaceholder.style.display = 'none';
        this.documentDisplay.classList.add('active');
        
        // Set title
        this.documentTitle.textContent = file.name;
        
        // Set metadata
        this.documentMeta.innerHTML = `
            <div class="document-meta-item">
                <span class="meta-label">Type</span>
                <span class="meta-value">${file.extension || 'Unknown'}</span>
            </div>
            <div class="document-meta-item">
                <span class="meta-label">Size</span>
                <span class="meta-value">${this.formatFileSize(file.size)}</span>
            </div>
            <div class="document-meta-item">
                <span class="meta-label">Modified</span>
                <span class="meta-value">${this.formatDate(file.modified)}</span>
            </div>
        `;
        
        // Render content based on type
        let contentHtml = '';
        
        if (file.is_image) {
            contentHtml = `
                <div class="doc-image-container">
                    <img src="${file.image_url}" class="doc-image" alt="${file.name}">
                </div>
            `;
        } else if (file.is_pdf) {
            contentHtml = `
                <div class="doc-pdf-container">
                    <iframe src="${file.pdf_url}" class="doc-pdf"></iframe>
                </div>
            `;
        } else if (file.is_text && file.content) {
            // Check if it's markdown
            if (file.extension === '.md') {
                contentHtml = `<div class="doc-text-container doc-markdown">${this.renderMarkdown(file.content)}</div>`;
            } else {
                contentHtml = `<div class="doc-text-container">${this.escapeHtml(file.content)}</div>`;
            }
        } else {
            contentHtml = `
                <div class="preview-placeholder" style="position: relative; height: 300px;">
                    <div class="placeholder-icon">${this.getFileIcon(file.extension)}</div>
                    <p>Preview not available for this file type</p>
                </div>
            `;
        }
        
        this.documentContent.innerHTML = contentHtml;
    }

    hidePreview() {
        this.previewPlaceholder.style.display = 'flex';
        this.documentDisplay.classList.remove('active');
    }

    goBack() {
        // Switch views
        this.folderView.classList.remove('active');
        this.mainView.classList.add('active');
        
        // Reset state
        this.currentFolder = null;
        this.currentFiles = [];
        this.activeFile = null;
        
        // Clear the preview so it doesn't persist when opening another folder
        this.hidePreview();
        this.documentContent.innerHTML = '';
    }

    updateStats() {
        const total = this.currentFiles.length;
        const viewed = this.currentFiles.filter(f => this.viewedFiles.has(f.path)).length;
        this.folderStats.textContent = `${viewed}/${total}`;
    }

    setupEventListeners() {
        // Back button
        this.backBtn.addEventListener('click', () => {
            this.goBack();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.folderView.classList.contains('active')) {
                this.goBack();
            }
            
            // Arrow key navigation
            if (this.mainView.classList.contains('active')) {
                this.handleMainViewKeys(e);
            } else if (this.folderView.classList.contains('active')) {
                this.handleFolderViewKeys(e);
            }
        });
    }

    handleMainViewKeys(e) {
        const tiles = Array.from(this.tilesContainer.querySelectorAll('.folder-tile'));
        if (tiles.length === 0) return;
        
        const activeTile = this.tilesContainer.querySelector('.folder-tile.active');
        let activeIndex = activeTile ? tiles.indexOf(activeTile) : -1;
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = activeIndex < tiles.length - 1 ? activeIndex + 1 : 0;
            this.setActiveTile(tiles, activeIndex);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = activeIndex > 0 ? activeIndex - 1 : tiles.length - 1;
            this.setActiveTile(tiles, activeIndex);
        } else if (e.key === 'Enter' && activeTile) {
            e.preventDefault();
            const folder = this.folders.find(f => f.path === activeTile.dataset.path);
            if (folder) this.openFolder(folder);
        }
    }

    setActiveTile(tiles, index) {
        tiles.forEach(t => t.classList.remove('active'));
        tiles[index].classList.add('active');
        tiles[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    handleFolderViewKeys(e) {
        const items = Array.from(this.fileList.querySelectorAll('.file-item'));
        if (items.length === 0) return;
        
        const activeItem = this.fileList.querySelector('.file-item.active');
        let activeIndex = activeItem ? items.indexOf(activeItem) : -1;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
            this.setActiveFileItem(items, activeIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
            this.setActiveFileItem(items, activeIndex);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            const file = this.currentFiles[activeIndex];
            if (file) this.selectFile(items[activeIndex], file);
        }
    }

    setActiveFileItem(items, index) {
        items.forEach(item => item.classList.remove('active'));
        items[index].classList.add('active');
        items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Also load the preview for the focused file
        const file = this.currentFiles[index];
        if (file) {
            this.selectFile(items[index], file);
        }
    }

    // Utility functions
    getFileIcon(ext) {
        const extension = (ext || '').toLowerCase();
        const iconMap = {
            '.txt': '📄',
            '.md': '📝',
            '.pdf': '📕',
            '.doc': '📘',
            '.docx': '📘',
            '.xls': '📗',
            '.xlsx': '📗',
            '.ppt': '📙',
            '.pptx': '📙',
            '.jpg': '🖼️',
            '.jpeg': '🖼️',
            '.png': '🖼️',
            '.gif': '🖼️',
            '.svg': '🖼️',
            '.webp': '🖼️',
            '.mp3': '🎵',
            '.wav': '🎵',
            '.mp4': '🎬',
            '.avi': '🎬',
            '.mkv': '🎬',
            '.zip': '📦',
            '.rar': '📦',
            '.7z': '📦',
            '.js': '💻',
            '.py': '🐍',
            '.html': '🌐',
            '.css': '🎨',
            '.json': '📋',
        };
        return iconMap[extension] || '📄';
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderMarkdown(text) {
        // Simple markdown rendering
        let html = this.escapeHtml(text);
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Code
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.documentViewer = new DocumentViewer();
});

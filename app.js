// Global planner instance
let planner;

class HintInteriorPlanner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.furnitureItems = [];
        this.selectedItem = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.roomWidth = 1000;
        this.roomHeight = 600;
        this.gridSize = 25;
        this.catalogData = this.getCatalogData();
        this.history = [];
        this.isLoaded = false;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('roomCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.populateCatalog();
        this.bindEvents();
        this.hideLoadingScreen();
        this.render();
        this.isLoaded = true;
        console.log('Hint Interior Planner loaded successfully!');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressFill = document.querySelector('.progress-fill');
        
        // Animate progress
        progressFill.style.width = '100%';
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1500);
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = window.innerWidth - 360 - 280;
        this.canvas.height = window.innerHeight - 80;
        this.roomWidth = this.canvas.width * 0.85;
        this.roomHeight = this.canvas.height * 0.9;
        this.roomX = (this.canvas.width - this.roomWidth) / 2;
        this.roomY = (this.canvas.height - this.roomHeight) / 2;
    }

    getCatalogData() {
        return [
            {
                category: 'KAT. TIDUR',
                items: [
                    { id: 'wardrobe', name: 'Lemari 3 Pintu', type: 'wardrobe', width: 140, height: 220, color: '#ff6b6b', icon: 'fas fa-couch', price: 'Rp 8.5jt' },
                    { id: 'bed', name: 'Queen Bed', type: 'bed', width: 280, height: 180, color: '#fd79a8', icon: 'fas fa-bed', price: 'Rp 12jt' }
                ]
            },
            {
                category: 'RUANG TAMU',
                items: [
                    { id: 'sofa', name: 'Sofa L', type: 'sofa', width: 220, height: 130, color: '#6c5ce7', icon: 'fas fa-couch', price: 'Rp 15.5jt' },
                    { id: 'shelf', name: 'Rak TV', type: 'shelf', width: 200, height: 90, color: '#4ecdc4', icon: 'fas fa-boxes', price: 'Rp 4.2jt' }
                ]
            },
            {
                category: 'KANTOR',
                items: [
                    { id: 'table', name: 'Meja L', type: 'table', width: 160, height: 110, color: '#45b7d1', icon: 'fas fa-table', price: 'Rp 6.8jt' },
                    { id: 'chair', name: 'Kursi Office', type: 'chair', width: 70, height: 80, color: '#f9ca24', icon: 'fas fa-chair', price: 'Rp 3.2jt' }
                ]
            },
            {
                category: 'PENYIMPANAN',
                items: [
                    { id: 'cabinet', name: 'Kabinet', type: 'cabinet', width: 110, height: 160, color: '#00b894', icon: 'fas fa-archive', price: 'Rp 5.1jt' }
                ]
            }
        ];
    }

    populateCatalog() {
        const container = document.getElementById('catalogContainer');
        container.innerHTML = '';

        this.catalogData.forEach(category => {
            const catDiv = document.createElement('div');
            catDiv.className = 'catalog-category';
            catDiv.innerHTML = `<div class="category-title">${category.category}</div>`;

            category.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `catalog-item ${item.type}`;
                itemDiv.draggable = true;
                itemDiv.dataset.itemData = JSON.stringify(item);
                itemDiv.innerHTML = `
                    <div class="item-preview"><i class="${item.icon}"></i></div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.price}</p>
                    </div>
                `;
                
                itemDiv.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', itemDiv.dataset.itemData);
                });
                
                itemDiv.addEventListener('click', () => this.quickAddFurniture(item));
                
                catDiv.appendChild(itemDiv);
            });
            
            container.appendChild(catDiv);
        });
    }

    quickAddFurniture(itemData) {
        const newItem = {
            ...itemData,
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: this.roomX + 50 + Math.random() * 200,
            y: this.roomY + 50 + Math.random() * 150
        };
        
        this.furnitureItems.push(newItem);
        this.selectedItem = newItem;
        this.updateUI();
        this.render();
    }

    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Drag & Drop
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.onDrop(e));

        // UI Events
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterCatalog(e.target.value));
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Button events
        document.getElementById('resetBtn').addEventListener('click', () => this.resetRoom());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedItem) {
                this.deleteItem(this.selectedItem);
            }
        });
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);
        this.selectedItem = this.getItemAtPos(pos.x, pos.y);
        
        if (this.selectedItem) {
            this.isDragging = true;
            this.dragOffset = {
                x: pos.x - this.selectedItem.x,
                y: pos.y - this.selectedItem.y
            };
        }
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.selectedItem) return;
        
        const pos = this.getMousePos(e);
        this.selectedItem.x = Math.round((pos.x - this.dragOffset.x) / this.gridSize) * this.gridSize;
        this.selectedItem.y = Math.round((pos.y - this.dragOffset.y) / this.gridSize) * this.gridSize;
        
        this.clampItem(this.selectedItem);
        this.render();
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        if (this.selectedItem) {
            this.selectedItem.rotation += e.deltaY > 0 ? 15 : -15;
            this.render();
        }
    }

    onDrop(e) {
        e.preventDefault();
        try {
            const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.quickAddFurniture(itemData);
        } catch (err) {
            console.log('Drop failed:', err);
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getItemAtPos(x, y) {
        for (let i = this.furnitureItems.length - 1; i >= 0; i--) {
            const item = this.furnitureItems[i];
            if (x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height) {
                return item;
            }
        }
        return null;
    }

    clampItem(item) {
        item.x = Math.max(this.roomX + 10, Math.min(this.roomX + this.roomWidth - item.width - 10, item.x));
        item.y = Math.max(this.roomY + 10, Math.min(this.roomY + this.roomHeight - item.height - 10, item.y));
    }

    filterCatalog(query) {
        const items = document.querySelectorAll('.catalog-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw room
        this.drawRoom();
        this.drawGrid();

        // Draw items
        this.furnitureItems.forEach(item => this.drawItem(item));

        // Draw selection
        if (this.selectedItem) {
            this.drawSelection(this.selectedItem);
        }

        this.updateUI();
    }

    drawRoom() {
        // Room gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f0f4f8');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Room frame
        this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
        this.ctx.shadowBlur = 25;
        this.ctx.shadowOffsetY = 15;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.roomX - 10, this.roomY - 10, this.roomWidth + 20, this.roomHeight + 20);

        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#e1e8ed';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.roomX, this.roomY, this.roomWidth, this.roomHeight);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(200,210,220,0.5)';
        this.ctx.lineWidth = 1;
        
        for (let x = this.roomX; x < this.roomX + this.roomWidth; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.roomY);
            this.ctx.lineTo(x, this.roomY + this.roomHeight);
            this.ctx.stroke();
        }
        
        for (let y = this.roomY; y < this.roomY + this.roomHeight; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.roomX, y);
            this.ctx.lineTo(this.roomX + this.roomWidth, y);
            this.ctx.stroke();
        }
    }

    drawItem(item) {
        this.ctx.save();
        this.ctx.translate(item.x + item.width/2, item.y + item.height/2);
        this.ctx.rotate((item.rotation || 0) * Math.PI / 180);

        // Shadow
        this.ctx.shadowColor = 'rgba(0,0,0,0.15)';
        this.ctx.shadowBlur = 12;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 6;

        // Gradient
        const gradient = this.ctx.createLinearGradient(0, -item.height/2, 0, item.height/2);
        gradient.addColorStop(0, item.color);
        gradient.addColorStop(0.7, this.lightenColor(item.color, 20));
        gradient.addColorStop(1, item.color);

        this.ctx.fillStyle = gradient;
        this.ctx.roundRect(-item.width/2, -item.height/2, item.width, item.height, 12);
        this.ctx.fill();

        // Highlight
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.fillRect(-item.width/2 + 6, -item.height/2 + 6, item.width - 12, 12);

        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 13px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(item.name.split(' ')[0], 0, item.height/2 - 25);

        this.ctx.restore();
    }

    drawSelection(item) {
        this.ctx.save();
        this.ctx.translate(item.x + item.width/2, item.y + item.height/2);
        this.ctx.rotate((item.rotation || 0) * Math.PI / 180);

        // Selection border
        this.ctx.shadowColor = '#4facfe';
        this.ctx.shadowBlur = 15;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#4facfe';
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(-item.width/2 - 6, -item.height/2 - 6, item.width + 12, item.height + 12);

        // Handles
        const handleSize = 10;
        this.ctx.fillStyle = '#4facfe';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#4facfe';
        
        // 4 corner handles
        const handles = [
            [-item.width/2, -item.height/2],
            [item.width/2, -item.height/2],
            [item.width/2, item.height/2],
            [-item.width/2, item.height/2]
        ];
        
        handles.forEach(([hx, hy]) => {
            this.ctx.beginPath();
            this.ctx.arc(hx, hy, handleSize/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    updateUI() {
        document.getElementById('projectTitle').textContent = `Ruang Tamu - ${this.furnitureItems.length} Items`;
        document.getElementById('itemCount').textContent = `${this.furnitureItems.length} items`;
    }

    resetRoom() {
        if (confirm('Reset semua furnitur?')) {
            this.furnitureItems = [];
            this.selectedItem = null;
            this.render();
        }
    }

    deleteItem(item) {
        this.furnitureItems = this.furnitureItems.filter(i => i !== item);
        this.selectedItem = null;
        document.getElementById('propertiesPanel').classList.remove('active');
        this.render();
    }

    saveProject() {
        const data = {
            furniture: this.furnitureItems,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hint-interior-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Animation loop
    animate() {
        if (!this.isLoaded) return;
        requestAnimationFrame(() => this.animate());
        this.render();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    planner = new HintInteriorPlanner();
    planner.animate();
});

// Global functions for buttons
function resetRoom() { planner.resetRoom(); }
function saveProject() { planner.saveProject(); }

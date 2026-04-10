class HintInteriorPlanner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.furnitureItems = [];
        this.selectedItem = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.roomWidth = 1200;
        this.roomHeight = 700;
        this.gridSize = 20;
        this.catalogData = this.getCatalogData();
        this.history = [];
        this.historyIndex = -1;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('roomCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.populateCatalog();
        this.bindEvents();
        this.startApp();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth - 360 - 280;
        this.canvas.height = window.innerHeight - 80;
        this.roomWidth = this.canvas.width * 0.8;
        this.roomHeight = this.canvas.height * 0.85;
        this.roomX = (this.canvas.width - this.roomWidth) / 2;
        this.roomY = (this.canvas.height - this.roomHeight) / 2;
    }

    getCatalogData() {
        return [
            {
                category: 'KAT. TIDUR',
                items: [
                    {
                        id: 'wardrobe-1',
                        name: 'Lemari Pakaian 3 Pintu',
                        type: 'wardrobe',
                        width: 140,
                        height: 220,
                        color: '#ff6b6b',
                        icon: 'fas fa-couch',
                        price: 'Rp 8.500.000',
                        materials: ['Kayu Jati', 'HPL Premium', 'Multiplek']
                    },
                    {
                        id: 'bed-1',
                        name: 'Tempat Tidur Queen',
                        type: 'bed',
                        width: 280,
                        height: 180,
                        color: '#fd79a8',
                        icon: 'fas fa-bed',
                        price: 'Rp 12.000.000',
                        materials: ['Kayu Mahoni', 'Busa Premium']
                    }
                ]
            },
            {
                category: 'RUANG TAMU',
                items: [
                    {
                        id: 'sofa-1',
                        name: 'Sofa L Modular',
                        type: 'sofa',
                        width: 220,
                        height: 130,
                        color: '#6c5ce7',
                        icon: 'fas fa-couch',
                        price: 'Rp 15.500.000',
                        materials: ['Kain Katun', 'Kulit Sintetis']
                    },
                    {
                        id: 'shelf-1',
                        name: 'Rak TV Minimalis',
                        type: 'shelf',
                        width: 200,
                        height: 90,
                        color: '#4ecdc4',
                        icon: 'fas fa-boxes',
                        price: 'Rp 4.200.000',
                        materials: ['Multiplek', 'Kaca Tempered']
                    }
                ]
            },
            {
                category: 'KANTOR',
                items: [
                    {
                        id: 'table-1',
                        name: 'Meja L-Shape',
                        type: 'table',
                        width: 160,
                        height: 110,
                        color: '#45b7d1',
                        icon: 'fas fa-table',
                        price: 'Rp 6.800.000',
                        materials: ['Kayu Solid', 'Metal Frame']
                    },
                    {
                        id: 'chair-1',
                        name: 'Kursi Ergonomic',
                        type: 'chair',
                        width: 70,
                        height: 80,
                        color: '#f9ca24',
                        icon: 'fas fa-chair',
                        price: 'Rp 3.200.000',
                        materials: ['Mesh Breathable', 'Busa High Density']
                    }
                ]
            },
            {
                category: 'PENYIMPANAN',
                items: [
                    {
                        id: 'cabinet-1',
                        name: 'Kabinet Multifungsi',
                        type: 'cabinet',
                        width: 110,
                        height: 160,
                        color: '#00b894',
                        icon: 'fas fa-archive',
                        price: 'Rp 5.100.000',
                        materials: ['Particle Board', 'HPL Anti Gores']
                    }
                ]
            }
        ];
    }

    populateCatalog() {
        const container = document.getElementById('catalogContainer');
        container.innerHTML = '';

        this.catalogData.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'catalog-category';

            categoryDiv.innerHTML = `<div class="category-title">${category.category}</div>`;

            category.items.forEach(item => {
                const catalogItem = document.createElement('div');
                catalogItem.className = `catalog-item ${item.type}`;
                catalogItem.draggable = true;
                catalogItem.dataset.itemId = item.id;
                catalogItem.innerHTML = `
                    <div class="item-preview">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.price}</p>
                    </div>
                `;
                catalogItem.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
                catalogItem.addEventListener('click', () => this.addFurniture(item));
                categoryDiv.appendChild(catalogItem);
            });

            container.appendChild(categoryDiv);
        });
    }

    bindEvents() {
        // Window resize
        window.addEventListener('resize', () => this.setupCanvas());

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterCatalog(e.target.value);
        });

        // UI Buttons
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        document.getElementById('resetBtn').addEventListener('click', () => this.resetRoom());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportProject());
        document.getElementById('panelClose').addEventListener('click', () => {
            document.getElementById('propertiesPanel').classList.remove('active');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedItem) {
                this.deleteSelectedItem();
            }
            if (e.key === 'z' && e.ctrlKey) {
                this.undo();
            }
        });
    }

    handleDragStart(e, itemData) {
        e.dataTransfer.setData('application/json', JSON.stringify(itemData));
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on furniture
        this.selectedItem = this.getItemAt(x, y);
        if (this.selectedItem) {
            this.isDragging = true;
            this.dragOffset.x = x - this.selectedItem.x;
            this.dragOffset.y = y - this.selectedItem.y;
            this.updatePropertiesPanel(this.selectedItem);
            document.getElementById('propertiesPanel').classList.add('active');
            this.saveHistory();
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedItem) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Snap to grid
        this.selectedItem.x = Math.round((x - this.dragOffset.x) / this.gridSize) * this.gridSize;
        this.selectedItem.y = Math.round((y - this.dragOffset.y) / this.gridSize) * this.gridSize;

        this.selectedItem.x = Math.max(10, Math.min(this.roomWidth - this.selectedItem.width - 10, this.selectedItem.x));
        this.selectedItem.y = Math.max(10, Math.min(this.roomHeight - this.selectedItem.height - 10, this.selectedItem.y));
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    getItemAt(x, y) {
        for (let i = this.furnitureItems.length - 1; i >= 0; i--) {
            const item = this.furnitureItems[i];
            if (x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height) {
                return item;
            }
        }
        return null;
    }

    addFurniture(itemData) {
        const newItem = {
            id: `item_${Date.now()}`,
            ...itemData,
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 150,
            rotation: 0,
            layer: 0
        };

        // Snap to grid
        newItem.x = Math.round(newItem.x / this.gridSize) * this.gridSize;
        newItem.y = Math.round(newItem.y / this.gridSize) * this.gridSize;

        this.furnitureItems.push(newItem);
        this.selectedItem = newItem;
        this.updatePropertiesPanel(newItem);
        document.getElementById('propertiesPanel').classList.add('active');
        this.updateUI();
        this.saveHistory();
        this.render();
    }

    updatePropertiesPanel(item) {
        const container = document.getElementById('propSections');
        container.innerHTML = `
            <div class="prop-group">
                <label class="prop-label">
                    <i class="fas fa-ruler-horizontal"></i> Lebar
                </label>
                <div class="range-group">
                    <input type="range" class="prop-control range-slider" min="50" max="400" value="${item.width}">
                    <span class="range-value">${item.width}px</span>
                </div>
            </div>
            <div class="prop-group">
                <label class="prop-label">
                    <i class="fas fa-ruler-vertical"></i> Tinggi
                </label>
                <div class="range-group">
                    <input type="range" class="prop-control range-slider" min="50" max="500" value="${item.height}">
                    <span class="range-value">${item.height}px</span>
                </div>
            </div>
            <div class="prop-group">
                <label class="prop-label">
                    <i class="fas fa-palette"></i> Warna
                </label>
                <div class="color-group">
                    <input type="color" class="prop-control color-picker" value="${item.color}">
                    <div class="color-presets">
                        <div class="color-preset" style="background: #ff6b6b" data-color="#ff6b6b"></div>
                        <div class="color-preset" style="background: #4ecdc4" data-color="#4ecdc4"></div>
                        <div class="color-preset" style="background: #45b7d1" data-color="#45b7d1"></div>
                        <div class="color-preset" style="background: #f9ca24" data-color="#f9ca24"></div>
                        <div class="color-preset" style="background: #6c5ce7" data-color="#6c5ce7"></div>
                    </div>
                </div>
            </div>
            <div class="prop-group">
                <label class="prop-label">
                    <i class="fas fa-layer-group"></i> Material
                </label>
                <select class="prop-control">
                    ${item.materials.map(material => `<option>${material}</option>`).join('')}
                </select>
            </div>
        `;

        // Bind property controls
        container.querySelectorAll('.range-slider').forEach((slider, index) => {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (index === 0) {
                    item.width = value;
                } else {
                    item.height = value;
                }
                container.querySelectorAll('.range-value')[index].textContent = value + 'px';
                this.render();
            });
        });

        container.querySelector('.color-picker').addEventListener('change', (e) => {
            item.color = e.target.value;
            this.render();
        });

        container.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                item.color = e.currentTarget.dataset.color;
                container.querySelector('.color-picker').value = item.color;
                document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.render();
            });
        });
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw room background
        this.drawRoom();

        // Draw grid
        this.drawGrid();

        // Draw furniture items
        this.furnitureItems.forEach(item => {
            this.drawFurnitureItem(item);
        });

        // Draw selection highlight
        if (this.selectedItem) {
            this.drawSelectionHighlight(this.selectedItem);
        }

        this.updateUI();
    }

    drawRoom() {
        const gradient = this.ctx.createLinearGradient(this.roomX, this.roomY, this.roomX + this.roomWidth, this.roomY + this.roomHeight);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8fafc');

        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        this.ctx.fillRect(this.roomX, this.roomY, this.roomWidth, this.roomHeight);

        // Room border
        this.ctx.shadowBlur = 0;
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.strokeRect(this.roomX, this.roomY, this.roomWidth, this.roomHeight);

        // Room shadow
        this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
        this.ctx.fillRect(this.roomX + 5, this.roomY + 5, this.roomWidth, this.roomHeight);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0,0,0,0.03)';
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

    drawFurnitureItem(item) {
        this.ctx.save();
        this.ctx.translate(item.x + item.width/2, item.y + item.height/2);
        this.ctx.rotate(item.rotation * Math.PI / 180);

        // Item gradient
        const gradient = this.ctx.createLinearGradient(-item.width/2, -item.height/2, item.width/2, item.height/2);
        gradient.addColorStop(0, item.color);
        gradient.addColorStop(1, this.adjustBrightness(item.color, -20));

        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = item.color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // Main shape with rounded corners
        this.ctx.roundRect(-item.width/2, -item.height/2, item.width, item.height, 12);
        this.ctx.fill();

        // Highlight
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fillRect(-item.width/2 + 4, -item.height/2 + 4, item.width - 8, 8);

        // Item label
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(item.name.split(' ')[0], 0, -item.height/2 + 25);

        this.ctx.restore();
    }

    drawSelectionHighlight(item) {
        this.ctx.save();
        this.ctx.translate(item.x + item.width/2, item.y + item.height/2);
        this.ctx.rotate(item.rotation * Math.PI / 180);

        this.ctx.shadowColor = '#667eea';
        this.ctx.shadowBlur = 10;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#667eea';
        this.ctx.setLineDash([8, 8]);
        this.ctx.strokeRect(-item.width/2 - 4, -item.height/2 - 4, item.width + 8, item.height + 8);

        // Resize handles
        const handleSize = 8;
        const handles = [
            {x: -item.width/2, y: -item.height/2}, // top-left
            {x: item.width/2, y: -item.height/2},   // top-right
            {x: item.width/2, y: item.height/2},     // bottom-right
            {x: -item.width/2, y: item.height/2}     // bottom-left
        ];

        handles.forEach(handle => {
            this.ctx.fillStyle = '#667eea';
            this.ctx.shadowBlur = 8;
           

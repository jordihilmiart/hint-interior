// Data Furniture Lengkap
const FURNITURE_CATALOG = {
    'Kamar Tidur': [
        {id: 'lemari3p', name: 'Lemari 3 Pintu', price: 8500000, width: 140, height: 220, color: '#ff6b6b', icon: 'fas fa-couch'},
        {id: 'queenbed', name: 'Queen Bed', price: 12000000, width: 280, height: 180, color: '#fd79a8', icon: 'fas fa-bed'},
        {id: 'nakas', name: 'Nakas', price: 1500000, width: 50, height: 50, color: '#6c5ce7', icon: 'fas fa-table'}
    ],
    'Ruang Tamu': [
        {id: 'sofaL', name: 'Sofa L', price: 15500000, width: 220, height: 130, color: '#6c5ce7', icon: 'fas fa-couch'},
        {id: 'rakTV', name: 'Rak TV', price: 4200000, width: 200, height: 90, color: '#4ecdc4', icon: 'fas fa-boxes'},
        {id: 'mejaKopi', name: 'Meja Kopi', price: 1800000, width: 100, height: 50, color: '#45b7d1', icon: 'fas fa-coffee'}
    ],
    'Ruang Kerja': [
        {id: 'mejaL', name: 'Meja L-Shape', price: 6800000, width: 160, height: 110, color: '#45b7d1', icon: 'fas fa-table'},
        {id: 'kursiOffice', name: 'Kursi Office', price: 3200000, width: 70, height: 80, color: '#f9ca24', icon: 'fas fa-chair'},
        {id: 'rakBuku', name: 'Rak Buku', price: 2800000, width: 80, height: 180, color: '#00b894', icon: 'fas fa-book'}
    ],
    'Dapur': [
        {id: 'kabinetDapur', name: 'Kabinet Dapur', price: 5100000, width: 110, height: 160, color: '#00b894', icon: 'fas fa-archive'},
        {id: 'mejaMakan', name: 'Meja Makan 6 Kursi', price: 9500000, width: 180, height: 100, color: '#fdcb6e', icon: 'fas fa-utensils'}
    ]
};

// State aplikasi
let canvas, ctx, furnitureList = [], selectedFurniture = null, totalPrice = 0, dragOffset = {};

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    initCanvas();
    generateCatalog();
    bindEvents();
    render();
});

function initCanvas() {
    canvas = document.getElementById('roomCanvas');
    ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function generateCatalog() {
    const catalog = document.getElementById('catalog');
    let html = '';
    
    Object.entries(FURNITURE_CATALOG).forEach(([category, items]) => {
        html += `<div class="category-title">${category}</div>`;
        items.forEach(item => {
            html += `
                <div class="furniture-item" draggable="true" data-item='${JSON.stringify(item)}'>
                    <div class="item-icon" style="background: ${item.color}">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p class="item-price">Rp ${formatRupiah(item.price)}</p>
                    </div>
                </div>
            `;
        });
    });
    
    catalog.innerHTML = html;
}

function bindEvents() {
    // Drag & Drop
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('click', handleQuickAdd);
    });
    
    canvas.addEventListener('dragover', e => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    
    // Canvas interactions
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    
    // Search
    document.getElementById('searchFurniture').addEventListener('input', handleSearch);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.item);
}

function handleQuickAdd(e) {
    const itemData = JSON.parse(e.currentTarget.dataset.item);
    addFurnitureToRoom(itemData);
}

function handleDrop(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
    addFurnitureToRoom({...itemData, x: x - itemData.width/2, y: y - itemData.height/2});
}

function addFurnitureToRoom(itemData) {
    const furniture = {
        ...itemData,
        uniqueId: Date.now() + Math.random(),
        x: itemData.x || Math.random() * 400 + 100,
        y: itemData.y || Math.random() * 300 + 100,
        rotation: 0
    };
    
    furnitureList.push(furniture);
    totalPrice += furniture.price;
    updateUI();
    updateCart();
    render();
    selectFurniture(furniture);
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectedFurniture = getFurnitureAt(x, y);
    if (selectedFurniture) {
        dragOffset = { x: x - selectedFurniture.x, y: y - selectedFurniture.y };
        canvas.style.cursor = 'grabbing';
        showProperties(selectedFurniture);
    }
}

function handleMouseMove(e) {
    if (!selectedFurniture || !dragOffset) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.client

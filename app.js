const { useState } = React;

function App() {
  const [items, setItems] = useState([]);

  function addItem(type) {
    setItems([...items, {
      id: Date.now(),
      x: 50,
      y: 50,
      type
    }]);
  }

  function moveItem(id, x, y) {
    setItems(items.map(item =>
      item.id === id ? { ...item, x, y } : item
    ));
  }

  return (
    <>
      <div className="header">Hint Interior Planner</div>

      <div className="container">
        <div className="sidebar">
          <div className="item" onClick={() => addItem('Wardrobe')}>Wardrobe</div>
          <div className="item" onClick={() => addItem('Table')}>Table</div>
          <div className="item" onClick={() => addItem('Sofa')}>Sofa</div>
        </div>

        <div className="canvas">
          {items.map(item => (
            <Furniture key={item.id} item={item} moveItem={moveItem} />
          ))}
        </div>
      </div>
    </>
  );
}

function Furniture({ item, moveItem }) {
  function onMouseDown(e) {
    const startX = e.clientX;
    const startY = e.clientY;

    function onMove(eMove) {
      moveItem(
        item.id,
        item.x + (eMove.clientX - startX),
        item.y + (eMove.clientY - startY)
      );
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div
      className="furniture"
      onMouseDown={onMouseDown}
      style={{ top: item.y, left: item.x }}
    >
      {item.type}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

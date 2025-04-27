import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link, Routes, useParams, useNavigate } from 'react-router-dom';
import Listing from './Listing';
import EditCreate from './EditCreate';
import SentryChatbot from './chatbot';

function EditItem({ items, onSave }) {
  const params = useParams();
  const item = items.find(item => item.id === parseInt(paramsd.id));
  return <EditCreate item={item} onSave={onSave} />;
}

function AppContent() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const handleSave = (item) => {
    if (item.id) {
      setItems(items.map(i => i.id === item.id ? item : i));
    } else {
      setItems([...items, { ...item, id: Date.now() }]);
    }
    navigate('/');
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/new">Create New</Link> | <Link to="/chatbot">Chatbot</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Listing items={items} onEdit={(item) => navigate(`/edit/${item.id}`)} onDelete={handleDelete} />} />
        <Route path="/new" element={<EditCreate item={null} onSave={handleSave} />} />
        <Route path="/edit/:id" element={<EditItem items={items} onSave={handleSave} />} />
        <Route path="/chatbot" element={<SentryChatbot />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;